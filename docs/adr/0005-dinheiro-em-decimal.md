# ADR 0005 — Dinheiro em decimal, nunca em float

- Estado: aceite
- Data: 2026-10-30

## Contexto

O PLANO_MVP §7 e o CLAUDE.md (regras 4 e 8) proíbem `float` como fonte de verdade monetária. Com o Kwanza, os valores são grandes (dezenas de milhões são comuns). O PostgREST devolve `numeric` como número JSON, que o JavaScript converte em float.

## Decisão

- **Representação:**
  - os valores circulam como `DecimalString`, uma string canónica com tipo de marca (ex.: `"1234567.89"`);
  - o tipo de marca impede passar um `number` por engano.
- **Cálculos:**
  - usam `decimal.js` (`lib/calculations/decimal.ts`), com 40 dígitos de precisão e arredondamento half-up;
  - arredondam só na apresentação.
- **Formatação:** `Intl.NumberFormat('pt-AO')` formata a partir da string, sem passar por `number`.
- **Entrada:**
  - `parseDecimalInput` aceita "1 234 567,89", "1.234.567,89" e "1500.5";
  - num valor monetário, "1.500" é mil e quinhentos; numa quantidade, é decimal.
- **Lint:** o ESLint proíbe `parseFloat` e `Number.parseFloat`.
- **Com o Supabase:**
  - as colunas `numeric` são lidas como texto (`amount::text`);
  - as escritas enviam strings.

## Consequências

- O `decimal.js` também vai para o cliente (cerca de 12 KB gzip), para as pré-visualizações ao vivo. É aceitável.
- `Number(...)` só aparece para proporções visuais, como a largura de uma barra, nunca para valores.
