# ADR 0001 — Stack e versões fixadas

- Estado: aceite
- Data: 2026-10-30

## Contexto

O PLANO_MVP §12 recomenda Next.js (App Router), TypeScript estrito, Tailwind, componentes acessíveis, Zod, React Hook Form, Vitest, Testing Library e Playwright, e pede versões confirmadas e fixadas no lockfile.

## Decisão

Versões confirmadas no registo npm a 2026-10-30 e fixadas com `save-exact`:

| Pacote                                  | Versão                | Nota                                                                                                                                                            |
| --------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| next                                    | 16.4.3                | App Router, Turbopack por defeito                                                                                                                               |
| react, react-dom                        | 19.3.1                |                                                                                                                                                                 |
| typescript                              | **6.0.3**             | A `latest` é a 7.0.2, mas o typescript-eslint 8.72.1 só suporta `<6.1.0`                                                                                        |
| tailwindcss, @tailwindcss/postcss       | 4.3.3                 | Configuração em CSS (`@theme`)                                                                                                                                  |
| eslint                                  | **9.39.5**            | O plano previa a 10.13.0. Os plugins do eslint-config-next 16.4.3 (import, jsx-a11y, react) ainda só declaram suporte até à 9, por isso desci para a última 9.x |
| eslint-config-next                      | 16.4.3                | Flat config; o Next 16 já não tem `next lint`                                                                                                                   |
| zod                                     | 4.6.7                 |                                                                                                                                                                 |
| react-hook-form / @hookform/resolvers   | 7.91.0 / 6.0.2        |                                                                                                                                                                 |
| decimal.js                              | 10.6.0                | Ver ADR 0005                                                                                                                                                    |
| radix-ui                                | 1.8.1                 | Primitivas acessíveis                                                                                                                                           |
| sonner, lucide-react, react-markdown    | 2.0.8, 1.65.0, 10.1.0 |                                                                                                                                                                 |
| vitest / vite / @vitejs/plugin-react    | 5.0.5 / 8.3.5 / 6.1.2 |                                                                                                                                                                 |
| @playwright/test / @axe-core/playwright | 1.64.1 / 4.14.0       |                                                                                                                                                                 |

Outras decisões:

- **npm** com `package-lock.json` e `engine-strict`. O pnpm não está instalado e o corepack deixou de vir com o Node.
- **Componentes:**
  - escritos diretamente sobre `radix-ui`, à maneira do shadcn (código no repositório), mas sem usar o CLI;
  - assim não fica nenhum tema por defeito para desfazer (ADR 0004).
- **Mutações:** só Server Actions (`lib/actions`), com validação Zod no servidor.
- **Cache Components (`cacheComponents`) desligado neste marco:**
  - a app é toda dinâmica e por utilizador (cookies de sessão);
  - reavaliar ao ligar o Supabase.
- **`typedRoutes`** ligado, e `next typegen && tsc --noEmit` corre no typecheck.

## Consequências

- Atualizar para TypeScript 7 e ESLint 10 quando o typescript-eslint e os plugins do eslint-config-next os suportarem. Isto fica registado no CHECKLIST.
- Toda a atualização de dependências passa pelo lockfile e pelo CI.
