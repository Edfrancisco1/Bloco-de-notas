# ADR 0004 — Direção visual "Editorial claro"

- Estado: aceite. A primeira revisão visual (Paragem 1 do Marco 1) ainda está pendente.
- Data: 2026-10-30

## Contexto

O dono do produto não quer o aspeto de um template comum. Quer um design limpo e intuitivo, baseado nos melhores produtos do mercado com o mesmo propósito. Das três direções propostas, escolheu "Editorial claro".

## Decisão

A metáfora é um caderno de investimentos: papel, tinta, marcador e linhas de livro-razão.

| Padrão                                                      | Referência          | Aplicação                                                                |
| ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| Lista tipo balanço, valores à direita, atualização na linha | Kubera              | Investimentos por tipo com subtotais; "Atualizar valor" na própria linha |
| Número em destaque e composição da carteira                 | Finary, Parqet      | Valor atual conhecido em destaque; barra empilhada e lista com valores   |
| Fila de revisão                                             | Copilot Money       | "Precisa de atenção": sem avaliação, desatualizado, vencido              |
| Histórico de atividades por tipo                            | Parqet, Wealthfolio | Timeline de movimentos e avaliações                                      |
| Cálculos explicados                                         | Sharesight          | Definição e fórmula de cada métrica num popover                          |
| Tom calmo e editorial                                       | Wealthsimple        | Serifa nos títulos e valores, muito espaço, pouca cor                    |

**Tokens** (em `app/globals.css`):

- Papel `#f6f3ec`, tinta `#1b1a17`, destaque azul-tinta `#1f3b73` e marcador `#f3e3a3`.
- Ganho `#2c6a4e` e perda `#a3432b`, sempre com sinal +/− e seta.
- Contrastes verificados:
  - texto ≥ 4,5:1 (tinta terciária: 5,09:1);
  - borda dos campos ≥ 3:1 (`#8c8475`, 3,34:1 sobre papel).

**Tipos de investimento:**

- Paleta categórica de 6 cores em ordem fixa:
  - DP `#3b68b0`, OB `#b07a12`, AC `#0b8a78`, CR `#8a56b8`, AL `#668a1c`, OU `#c4527c`.
- Validada com o validador do skill `dataviz` sobre o papel:
  - banda de luminosidade e croma ok;
  - pior par vizinho CVD ΔE 9,5 e visão normal ΔE 18,5;
  - todas ≥ 3:1.
- Os tons para tema escuro também foram validados e ficaram preparados, mas o tema escuro não está ativo neste marco.

**Tipografia:**

- Newsreader (serifa) nos títulos e nos números em destaque, com algarismos proporcionais lining.
- Inter na interface, com algarismos tabulares nas colunas.
- Nota: o skill `dataviz` desaconselha serifa em números em destaque, mas a direção editorial foi escolha explícita do dono do produto. Mantém-se, com algarismos proporcionais.

**Regras:**

- linhas finas em vez de caixas e sombras;
- sem gradientes, sem ícones em bolhas coloridas e sem cartões KPI genéricos;
- monogramas para os tipos;
- gráficos sem biblioteca: barra empilhada em ordem fixa, com 2 px de papel entre segmentos, e barras de uma só cor por instituição;
- mobile-first: barra inferior até 1024 px e lateral acima disso.

## Consequências

- O shadcn/ui não é usado como tema. As primitivas Radix são estilizadas só com estes tokens.
- Qualquer cor nova de dados tem de passar no validador antes de entrar.
