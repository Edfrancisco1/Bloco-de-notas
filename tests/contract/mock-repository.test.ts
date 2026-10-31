import { describe, expect, it } from 'vitest';
import { createMockRepository } from '@/lib/data/mock/repository';
import { DEMO_USER_ID } from '@/lib/data/mock/fixtures';
import { __resetMockDbForTests, createMockAccount } from '@/lib/data/mock/store';
import { defineRepositoryContract } from './repository-contract';

defineRepositoryContract('mock em memória', async () => {
  __resetMockDbForTests();
  const a = createMockAccount('a@teste.example', 'palavra-passe-a');
  const b = createMockAccount('b@teste.example', 'palavra-passe-b');
  return { a: createMockRepository(a.userId), b: createMockRepository(b.userId) };
});

describe('dados de demonstração', () => {
  it('cobrem os seis tipos e os estados críticos', async () => {
    __resetMockDbForTests();
    const repo = createMockRepository(DEMO_USER_ID);
    const investments = await repo.listInvestments();
    expect(new Set(investments.map((i) => i.type)).size).toBe(6);
    expect(investments.some((i) => i.status === 'closed')).toBe(true);
    const valuations = await repo.listValuations();
    const unvalued = investments.filter(
      (i) => i.status === 'active' && !valuations.some((v) => v.investmentId === i.id),
    );
    expect(unvalued.map((i) => i.id)).toEqual(['crowdfunding-horta']);
  });
});
