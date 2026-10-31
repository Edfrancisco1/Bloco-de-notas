# Guia — ligar o InvestNote ao Supabase

Este guia é para quem fizer a ligação, seja o dono do produto ou o Claude a seu pedido. Junta o que já está preparado no código e o que mudou no Supabase até 2026-10-30. **Confirme sempre a documentação atual antes de implementar**: o Supabase muda com frequência.

## 1. O que já está pronto

- **Interface de dados** — `lib/data/repository.ts` define `UserRepository`, os contratos do PLANO_MVP §13.
  - Ecrãs e Server Actions só usam esta interface, através de `getRepository()` / `getOnboardedRepository()` em `lib/data/index.ts`.
- **Sessão** — `lib/auth/session.ts` expõe `getSession()` / `requireSession()`. Hoje lê o cookie do modo demonstração.
- **Testes de contrato** — `tests/contract/repository-contract.ts` (`defineRepositoryContract`).
  - Correm contra o mock e devem correr também contra o Supabase, com dois utilizadores reais.
- **Partes definitivas** — cálculos (`lib/calculations`), formatação (`lib/formatters`) e validação (`lib/validations`) não mudam com a ligação.

## 2. O que implementar

1. `lib/data/supabase/repository.ts`, que implementa `UserRepository` com o cliente de servidor.
2. Em `lib/data/index.ts`, o ramo `DATA_SOURCE=supabase`.
3. `lib/auth/session.ts` passa a usar `supabase.auth.getClaims()`.
4. Migrations em `supabase/migrations`, criadas com `npx supabase migration new <nome>`.
5. Testes pgTAP em `supabase/tests`, com dois utilizadores, e o contrato a correr contra o Supabase.

### Peças do modo demonstração e o que as substitui

| Hoje (mock)                                                            | Com o Supabase                                                                                                                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/actions/session.ts` → `enterDemoAction`                           | Manter só se houver uma conta de demonstração pública; senão, remover os botões "modo demonstração"                                                              |
| `lib/actions/auth.ts` → `signInAction`                                 | `supabase.auth.signInWithPassword` (mensagem genérica mantém-se)                                                                                                 |
| `signUpAction`                                                         | `supabase.auth.signUp` com `emailRedirectTo` → `/auth/confirm` (`token_hash` + `verifyOtp`); depois, `/boas-vindas`                                              |
| `requestPasswordResetAction`                                           | `supabase.auth.resetPasswordForEmail(email, { redirectTo: …/auth/confirm?type=recovery&next=/recuperar-password/nova })`                                         |
| `setNewPasswordAction`                                                 | `supabase.auth.updateUser({ password })` (sessão criada pela ligação de recuperação)                                                                             |
| `lib/actions/profile.ts` → `deleteAccountAction` (confirmação escrita) | Reautenticação; depois, uma Edge Function ou rota de servidor com a chave secreta que termina as sessões e apaga o utilizador (cascata a partir de `auth.users`) |
| `lib/auth/mock-auth.ts`, `lib/data/mock/*`                             | Removidos (ou mantidos só para testes)                                                                                                                           |
| `lib/auth/rate-limit.ts` (memória)                                     | Os limites do Supabase Auth para autenticação; para exportação, um limitador partilhado (ex.: base de dados ou Redis)                                            |
| `completeOnboarding` (mock)                                            | RPC `security invoker` que atualiza o perfil e cria a carteira por defeito numa transação                                                                        |
| `createInvestment` / `closeInvestment` (mock, atómicos)                | RPCs `security invoker` (investimento + movimento + avaliação + instituição nova + lembrete; movimento final + estado)                                           |

## 3. Variáveis de ambiente

| Variável                               | Onde                     | Nota                                                              |
| -------------------------------------- | ------------------------ | ----------------------------------------------------------------- |
| `DATA_SOURCE`                          | servidor                 | `mock` (por defeito) ou `supabase`                                |
| `NEXT_PUBLIC_SUPABASE_URL`             | browser + servidor       | URL do projeto                                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + servidor       | Chave **publishable** (`sb_publishable_…`)                        |
| `SUPABASE_SECRET_KEY`                  | **só** servidor e testes | `sb_secret_…`. Nunca com `NEXT_PUBLIC_` e nunca em fluxos normais |

As chaves legadas `anon` e `service_role` estão a ser descontinuadas até ao fim de 2026. Use as novas.

## 4. Pontos de atenção

- **Next.js 16**
  - A renovação da sessão é feita em **`proxy.ts`** (já não em `middleware.ts`), com `getClaims()`. O proxy tem de devolver a resposta construída por `setAll`.
  - As páginas e os dados protegem-se com `getClaims()`, nunca com `getSession()` no servidor.
  - Renovar o token em dois sítios pode terminar a sessão (deteção de reutilização do refresh token).
- **Tabelas novas não ficam expostas automaticamente** — desde 2026-10-30 isto aplica-se a todos os projetos. Cada migration leva:
  - `alter table … enable row level security;`
  - `grant select, insert, update, delete on table … to authenticated;` (sem `anon`);
  - políticas separadas para SELECT, INSERT, UPDATE e DELETE, todas `to authenticated` com `(select auth.uid()) = user_id`. No UPDATE, `using` + `with check`.
- **Propriedade entre tabelas** — FKs compostas `(…_id, user_id)` contra `unique (id, user_id)`, como no §10.
  - Investimentos → carteiras e instituições ficam com `no action` (a eliminação da conta corre em cascata a partir de `auth.users`).
  - Movimentos, avaliações e lembretes → investimentos ficam com `on delete cascade`.
- **E-mail**
  - A confirmação e a recuperação usam `/auth/confirm` com `token_hash` + `verifyOtp` (PKCE no SSR).
  - No plano Free com o SMTP por defeito não se podem personalizar os templates (desde 2026-06-03) e só saem cerca de 2 e-mails por hora. É preciso **SMTP próprio** antes de produção.
- **Numéricos** — leia as colunas `numeric` como texto (`amount::text`), para não passar por float (ADR 0005), e envie strings nas escritas.
- **Atomicidade** — criar um investimento com o movimento inicial e a avaliação, e concluir o onboarding, deve ser uma RPC `security invoker` (o RLS aplica-se), com `execute` só para `authenticated`.
- **Auditoria** — triggers com `security definer` num schema não exposto e `search_path` fixo. Guardam só nomes de campos.
- **Diferenças de modelo** (ADR 0003)
  - As datas de movimentos, avaliações e lembretes são datas de calendário: guardar como `date`, ou `timestamptz` ao meio-dia de Luanda.
  - Os ajustes têm `adjustment_direction`.
- **Desenvolvimento local** — `npx supabase start` e `npx supabase test db` precisam de Docker Desktop (ou Rancher Desktop / Podman), com cerca de 7 GB de RAM livres.
  - Alternativa: projeto na cloud, com os testes de contrato em Vitest a criar utilizadores pela API de administração (chave secreta só em testes).

## 5. Referências

- [Changelog do Supabase](https://supabase.com/changelog.md)
- [Tabelas novas não expostas automaticamente](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- [SSR com Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [CLI — getting started](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Testes (pgTAP)](https://supabase.com/docs/guides/local-development/testing/overview)
