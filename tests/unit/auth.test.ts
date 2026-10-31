import { beforeEach, describe, expect, it } from 'vitest';
import { signInWithPassword, signUpWithPassword, updatePassword } from '@/lib/auth/mock-auth';
import { consume } from '@/lib/auth/rate-limit';
import { __resetMockDbForTests, findMockAccount } from '@/lib/data/mock/store';

describe('autenticação do modo demonstração', () => {
  beforeEach(() => __resetMockDbForTests());

  it('cria a conta sem guardar a palavra-passe em claro e permite entrar', () => {
    const userId = signUpWithPassword('Ana@Exemplo.example', 'uma-frase-longa');
    expect(findMockAccount('ana@exemplo.example')?.passwordHash).not.toContain('uma-frase-longa');
    expect(signInWithPassword('ana@exemplo.example', 'uma-frase-longa')).toBe(userId);
    expect(signInWithPassword('ana@exemplo.example', 'errada')).toBeNull();
    expect(signInWithPassword('nao-existe@exemplo.example', 'qualquer')).toBeNull();
  });

  it('não cria duas contas com o mesmo e-mail', () => {
    signUpWithPassword('ana@exemplo.example', 'uma-frase-longa');
    expect(() => signUpWithPassword('ANA@exemplo.example', 'outra-frase')).toThrow(/Já existe/);
  });

  it('atualiza a palavra-passe', () => {
    const userId = signUpWithPassword('ana@exemplo.example', 'uma-frase-longa');
    updatePassword(userId, 'nova-frase-longa');
    expect(signInWithPassword('ana@exemplo.example', 'uma-frase-longa')).toBeNull();
    expect(signInWithPassword('ana@exemplo.example', 'nova-frase-longa')).toBe(userId);
  });
});

describe('limite de tentativas', () => {
  it('bloqueia depois do limite e liberta quando a janela termina', () => {
    const key = `teste-${Math.random()}`;
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(consume(key, 5, 60_000, t0).allowed).toBe(true);
    const blocked = consume(key, 5, 60_000, t0 + 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(59);
    expect(consume(key, 5, 60_000, t0 + 60_001).allowed).toBe(true);
  });
});
