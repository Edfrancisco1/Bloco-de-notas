# InvestNote

Registo privado de investimentos: depósitos a prazo, obrigações, ações e fundos, cripto, P2P/imobiliário e outros. Mostra quanto investiu, quanto vale, o que rendeu e os próximos prazos, em kwanzas.

> Nome provisório. O produto está descrito em [`PLANO_MVP.md`](./PLANO_MVP.md) e as decisões em [`docs/adr`](./docs/adr).

## Estado atual

**Marco 1 concluído** ([relatório](./docs/marcos/marco-01.md)). Todos os ecrãs do MVP funcionam em **modo demonstração**: os dados são fictícios e ficam só na memória do servidor. Pode também criar uma conta de teste. A ligação ao Supabase é o próximo passo ([guia](./docs/ligacao-supabase.md)).

## Arrancar

Requisitos: Node 24 e npm 11.

```bash
npm ci
npm run dev
```

Abra http://localhost:3000 e escolha **Entrar em modo demonstração**.

## Comandos

| Comando            | O que faz                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento                                                                       |
| `npm run check`    | Lint, tipos, testes unitários/contrato e build (antes de cada marco)                              |
| `npm test`         | Vitest: cálculos, formatadores, schemas e contrato do repositório                                 |
| `npm run test:e2e` | Playwright em desktop e 360 px, com axe (faz o build primeiro; `E2E_DEV=1` usa o servidor de dev) |
| `npm run screens`  | Capturas de revisão visual em `docs/marcos/capturas`                                              |

## Estrutura

```
app/              rotas (público, autenticação, /app)
components/       ui · common · shell · dashboard · investments
lib/domain        tipos, etiquetas e mercado (Angola, AOA)
lib/calculations  regras financeiras puras (decimal.js), com testes
lib/formatters    formatação pt-AO e leitura de valores
lib/validations   schemas Zod partilhados cliente/servidor
lib/data          UserRepository + implementação mock
lib/services      view models dos ecrãs (dados + cálculos)
lib/actions       Server Actions
tests/            unit · contract · e2e · screens
docs/             adr · CHECKLIST · marcos · ligacao-supabase
```

Aviso: o InvestNote organiza a informação que o utilizador regista. Não presta aconselhamento financeiro, fiscal ou jurídico.
