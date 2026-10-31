# Relatório do Marco 1 — InvestNote visual com dados mock, em Kwanza

- Data: 2026-10-30
- Âmbito: Etapas 0–7 do plano do marco (UI-first, por decisão do dono do produto — ADR 0003)

## 1. O que funciona

Todos os ecrãs P0 do PLANO_MVP §9 estão navegáveis, em português de Angola, com valores em Kz. Correm em **modo demonstração**: dados fictícios em memória e uma sessão demo por cookie.

| Área          | Rotas                                                                                                        | Destaques                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada       | `/`, `/entrar`, `/criar-conta`, `/recuperar-password`, `/recuperar-password/nova`, `/privacidade`, `/termos` | Landing editorial; modo demonstração num clique; recuperação que não revela e-mails; palavras-passe com hash; limite de tentativas                                                                                                          |
| Onboarding    | `/boas-vindas`                                                                                               | Nome, Kwanza, fuso (Africa/Luanda) e carteira, seguidos da escolha do primeiro investimento                                                                                                                                                 |
| Painel        | `/app`                                                                                                       | Valor atual conhecido com cobertura; capital, resultado e rendimentos com fórmula; "Precisa de atenção"; distribuição por tipo e por instituição; prazos; atividade                                                                         |
| Investimentos | `/app/investimentos`, `/novo`, `/[id]`, `/[id]/editar`                                                       | Lista tipo balanço com pesquisa/filtros/ordenação; criação em 4 passos (6 tipos); ficha com métricas, estimativa de depósito, gráfico, histórico, notas e lembretes; movimentos com pré-visualização; encerrar, reabrir, arquivar, eliminar |
| Gestão        | `/app/calendario`, `/app/carteiras`, `/app/instituicoes`, `/app/exportar`, `/app/definicoes`                 | Prazos por mês com marcas 30/7/1; carteiras e instituições; exportação JSON/CSV; perfil; eliminação da conta                                                                                                                                |

## 2. O que foi testado

- **`npm run check`** — lint, typecheck com tipos de rota, 67 testes Vitest e build de produção: tudo verde.
- **Unitários:**
  - métricas do §7: capital, devolvido, rendimentos, custos, resultado, retorno simples; custo médio com compras, vendas, comissões e frações; reinvestimentos e ajustes;
  - estimativa de depósito: simples, composto, ACT/365, ACT/360, personalizada, retenção;
  - agregação: moeda base, "por converter", taxas manuais;
  - prazos e desatualização; formatação pt-AO; leitura de valores; CSV; autenticação mock; limite de tentativas.
- **Contrato do repositório** (para correr também contra o Supabase):
  - isolamento entre dois utilizadores;
  - referências de outra conta recusadas e sem deixar nada a meio;
  - histórico de avaliações (duplicados e datas futuras recusados);
  - quantidade vendida ≤ detida;
  - encerrados só de leitura; encerramento atómico; arquivo que preserva a data;
  - auditoria só com nomes de campos; eliminação em cascata.
- **E2E (Playwright, 98 testes, Chromium desktop e 360 px, sobre o build de produção):**
  - os fluxos do plano: conta → onboarding → 1.º investimento → painel; depósito com lembrete; cripto com compra, venda parcial e avaliação, com os valores calculados verificados; pesquisa/filtros; exportação; eliminação de investimento e de conta;
  - prazos, carteiras, instituições, perfil;
  - axe (WCAG 2.0/2.1/2.2 A e AA) sem violações sérias ou críticas em 20 rotas;
  - sem scroll horizontal a 360 px em 18 rotas;
  - navegação só por teclado (skip link, diálogos, criação de investimento).
- **Revisão visual:** 36 capturas em `docs/marcos/capturas` (`npm run screens`).

## 3. Desvios ao plano e decisões

- **Ordem do trabalho:** UI-first com mock (ADR 0003). Sem migrations nem RLS neste marco: não há base de dados onde as testar.
- **Versões:**
  - TypeScript 6.0.3 em vez de 7 (limite do typescript-eslint);
  - ESLint 9.39.5 em vez de 10 (plugins do eslint-config-next) — ADR 0001.
- **Onboarding em `/boas-vindas`,** fora do shell da app, para um ecrã focado. O §9 não definia a rota.
- **Painel:**
  - o valor atual conhecido é o número em destaque, com as outras três métricas numa linha tipo livro-razão (o §9 previa 4 cartões iguais);
  - "Precisa de atenção" junta os pontos 3 e 6 do §9.
- **Modelo:** datas de calendário em movimentos, avaliações e lembretes; `adjustment_direction` nos ajustes; `closeInvestment` atómico no contrato (ADR 0003).
- **Erros encontrados e corrigidos durante os testes:**
  - "Continuar" no último passo submetia o formulário (o React reaproveitava o mesmo botão com outro `type`);
  - a pesquisa exigia a frase exata;
  - o onboarding saltava o passo 2 por causa de uma revalidação;
  - a landing transbordava a 360 px (grelha implícita).
- **Ambiente:** os E2E e as capturas usam builds de produção nas portas 3100 e 3200, para não interferir com um `npm run dev` aberto (o Next 16 só permite um servidor de dev por pasta).

## 4. Riscos e pendentes

1. **Dados em memória:** perdem-se ao reiniciar o servidor e não são fiáveis num deploy serverless. Desaparece com o Supabase.
2. **Autenticação demo:** não é segura para dados reais. O Supabase Auth com SMTP próprio é obrigatório antes de produção (`docs/ligacao-supabase.md`).
3. **Multi-moeda:** só Kwanza ativo. É comum haver USD em Angola; decisão pendente do dono do produto.
4. **Legal:** os textos são provisórios. Falta validar a Lei n.º 22/11, a região de alojamento e a política de retenção.
5. **CSP completa** (nonces), observabilidade e backups ficam para a fase de segurança/qualidade com infraestrutura real.

## 5. Próximo passo recomendado

**Ligar o Supabase**, seguindo `docs/ligacao-supabase.md`:

1. migrations com RLS e grants;
2. testes pgTAP entre dois utilizadores;
3. `SupabaseRepository` validado pelo mesmo contrato de testes;
4. sessão com `getClaims()` em `proxy.ts`.

Os ecrãs não precisam de mudar.
