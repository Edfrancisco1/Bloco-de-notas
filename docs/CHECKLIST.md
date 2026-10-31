# Checklist técnica — Marco 1 (visual com dados mock, em Kwanza)

Legenda: [x] feito e verificado · [ ] por fazer · [~] parcial (ver nota)

## Etapa 0 — Fundação reproduzível

- [x] Repositório git, `.gitignore`, `.editorconfig`, `.nvmrc` (24), `.npmrc` (`save-exact`, `engine-strict`), lockfile.
- [x] Scaffold manual: TypeScript estrito (`noUncheckedIndexedAccess`), Tailwind v4, ESLint (flat), Prettier, Vitest e Playwright.
- [x] `typedRoutes` e cabeçalhos de segurança básicos.
- [x] Scripts `lint`, `typecheck`, `test`, `test:e2e`, `screens` e `check`.
- [x] CI: `.github/workflows/ci.yml` (corre quando houver remoto no GitHub).
- [x] ADRs 0001–0005.
- [~] `.env.example`: não foi criado (as permissões do ambiente bloqueiam ficheiros `.env*`). As variáveis estão em `docs/ligacao-supabase.md`.

## Etapa 1 — Sistema visual

- [x] Tokens "Editorial claro"; contrastes de texto e de campos verificados.
- [x] Paleta dos tipos validada (dataviz), em claro e escuro.
- [x] Primitivas:
  - Button, Field, Input/Textarea/Select/DateInput, MoneyInput (pt-AO);
  - Checkbox, Segmented, RadioCards;
  - Dialog (folha no telemóvel), ConfirmDialog, Menu, Popover, Badge, Toast, Skeleton.
- [x] Componentes de domínio:
  - Amount, DisplayAmount, Delta, LedgerMetric/ResultFigure;
  - TypeMonogram, estados (avaliação, prazo, investimento), MetricDefinition;
  - Section, PageHeader, EmptyState, Wordmark.

## Etapa 2 — Domínio, cálculos e mock

- [x] Tipos e enums (espelham o §10) e etiquetas em português.
- [x] Cálculos do §7 com `decimal.js`:
  - métricas e custo médio;
  - estimativa de depósito;
  - desatualização, prazos 30/7/1, agregação por moeda;
  - pré-visualizações (avaliação, movimento, encerramento).
- [x] Formatadores pt-AO, parser de valores e CSV.
- [x] Schemas Zod partilhados entre cliente e servidor.
- [x] `UserRepository` + mock com auditoria; testes de contrato (`tests/contract`).
- [x] Services: painel, lista, ficha, prazos, carteiras/instituições e exportação.

## Etapa 3 — Shell e painel

- [x] Shell (barra lateral, barra inferior com "+", folha "Mais", aviso de demonstração, skip link).
- [x] Painel pela ordem do §9, mais o estado vazio, o loading e o erro.
- [x] Revisão visual aprovada pelo dono do produto («adorei o design»).

## Etapa 4 — Investimentos

- [x] Lista tipo balanço: grupos por tipo, subtotais, pesquisa sem acentos e por palavras, filtros e ordenação no URL, atualizar valor na linha.
- [x] Novo investimento em 4 passos:
  - os 6 tipos, com instituição nova no mesmo passo;
  - estimativa transparente do depósito;
  - lembrete antes do vencimento.
- [x] Ficha:
  - métricas com fórmula, custo médio, estimativa;
  - gráfico de evolução (SVG, teclado e tooltip);
  - histórico, detalhes, notas (Markdown limitado) e lembretes.
- [x] Editar, registar e editar movimento (pré-visualização), atualizar valor, encerrar (atómico), reabrir, arquivar e desarquivar, eliminar com confirmação.

## Etapa 5 — Acompanhamento e gestão

- [x] Prazos:
  - em atraso, agrupados por mês, marcas 30/7/1;
  - concluir, adiar, cancelar e reabrir;
  - lembrete geral ou ligado a um investimento.
- [x] Carteiras e Instituições: criar, renomear/editar, arquivar (com regras no servidor).
- [x] Exportar: JSON completo (versionado) e CSV por entidade (UTF-8 com BOM).
- [x] Definições: perfil (nome, fuso), moeda e limite (informativos), dados demo, eliminar conta com confirmação escrita.

## Etapa 6 — Entrada

- [x] Landing editorial com pré-visualização, chamadas para a ação e aviso legal.
- [x] Autenticação em modo demo:
  - entrar, criar conta, recuperar (sem revelar e-mails), nova palavra-passe;
  - palavras-passe com hash scrypt;
  - limite de tentativas.
- [x] Privacidade e termos provisórios (referem a Lei n.º 22/11).
- [x] Onboarding em `/boas-vindas`: nome, Kwanza, fuso, carteira → escolha do primeiro investimento.

## Etapa 7 — Qualidade e fecho

- [x] Vitest: 67 testes (cálculos, formatadores, parser, CSV, autenticação mock, limite de tentativas, contrato do repositório).
- [x] Playwright: 98 testes em Chromium desktop e a 360 px.
  - Fluxos do plano: conta → onboarding → 1.º investimento → painel; depósito com lembrete; cripto com venda parcial e avaliação; pesquisa e filtros; exportação; eliminações.
  - axe em 20 rotas sem violações sérias ou críticas.
  - Sem scroll horizontal a 360 px em 18 rotas.
  - Navegação por teclado.
- [x] `npm run check` e `npm run test:e2e` verdes.
- [x] Relatório: `docs/marcos/marco-01.md`.

## Pendentes registados (próximos marcos)

- [ ] Ligação ao Supabase (`docs/ligacao-supabase.md`):
  - migrations, grants, RLS e pgTAP entre dois utilizadores;
  - autenticação real com SMTP próprio.
- [ ] Multi-moeda (USD/EUR) com taxas manuais — decisão do dono do produto.
- [ ] Subir para TypeScript 7 e ESLint 10 quando o typescript-eslint e os plugins do eslint-config-next os suportarem.
- [ ] Tema escuro (tokens já validados), CSP com nonces, observabilidade e backups.
- [ ] Texto legal definitivo (revisão jurídica, Lei n.º 22/11) e região de alojamento.
