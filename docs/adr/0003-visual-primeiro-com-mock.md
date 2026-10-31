# ADR 0003 — Visual primeiro, com dados mock

- Estado: aceite
- Data: 2026-10-30
- Desvio de:
  - PLANO_MVP §18 (Fases 0–1 com autenticação e base de dados primeiro);
  - PLANO_MVP §22.3 (fatia vertical autenticação → carteira → investimento → painel);
  - CLAUDE.md, regra 2.

## Contexto

O dono do produto pediu para tratar primeiro do visual com dados mock, e disse que trata da ligação ao Supabase mais tarde. Esta máquina não tem Docker, que o Supabase local exige.

## Decisão

- **Uma única porta para os dados:**
  - ecrãs e Server Actions só acedem a dados através de `UserRepository` (`lib/data/repository.ts`), que espelha os contratos do PLANO_MVP §13;
  - a implementação atual é `lib/data/mock` (memória do servidor, em `globalThis`, com dados de exemplo gerados em relação a hoje);
  - a do Supabase será outra implementação, ativada por `DATA_SOURCE=supabase`.
- **Garantias testadas como contrato:**
  - as garantias que a base de dados real vai dar (isolamento entre utilizadores, referências da mesma conta, atomicidade, histórico e auditoria só com nomes de campos) estão em `tests/contract`;
  - esses testes correm hoje contra o mock e vão correr contra o Supabase.
- **Sessão do modo demonstração:**
  - um cookie httpOnly com o id da conta mock, em `lib/auth/session.ts`;
  - não é autenticação real e passa a `getClaims()` do Supabase.
- **Cálculos, formatação e validação são definitivos:** não dependem da fonte de dados.
- **Sem migrations SQL neste marco:**
  - não há base de dados para as correr nem para testar RLS;
  - escrevê-las sem as poder verificar contraria as regras 5, 6 e 8 do CLAUDE.md;
  - o modelo TypeScript (`lib/domain/types.ts`) segue o §10 para facilitar a tradução.

## Consequências

- **Dados em memória:** as alterações em modo demonstração perdem-se ao reiniciar o servidor e não são fiáveis num deploy serverless. É esperado.
- **Autenticação, RLS e migrations:** passam para a fase de ligação ao Supabase (`docs/ligacao-supabase.md`). Essa fase tem de cumprir as regras do CLAUDE.md:
  - grants mínimos, RLS e testes entre dois utilizadores em cada tabela;
  - migrations reproduzíveis.
- **Diferenças de modelo:**
  - as datas de movimentos, avaliações e lembretes são datas de calendário (IsoDate); na base serão `timestamptz` ao meio-dia de Luanda, ou `date`, a decidir;
  - os ajustes guardam a direção (`adjustment_direction`), um campo que não está no §10.
