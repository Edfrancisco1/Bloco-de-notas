# ADR 0002 — Mercado inicial: Angola, em kwanzas

- Estado: aceite
- Data: 2026-10-30
- Desvio de: PLANO_MVP §21.1 (default Portugal/UE, pt-PT, EUR) e §6 (EUR como sugestão)

## Contexto

O dono do produto pediu a moeda inicialmente em kwanza.

## Decisão

- **Mercado e formatos:**
  - mercado inicial em Angola: locale `pt-AO`, fuso `Africa/Luanda`, moeda base AOA;
  - formato dos valores `1 234 567,89 Kz`, com espaço não separável e o "Kz" depois do número;
  - o texto da interface segue a ortografia pt-PT, em registo formal e impessoal.
- **Uma só moeda ativa no início:**
  - os formulários não têm seletor de moeda e mostram o sufixo "Kz";
  - mesmo assim, cada investimento, movimento e avaliação guarda `currency` (ISO 4217);
  - a agregação (`lib/calculations/aggregate.ts`) já separa os valores noutras moedas em "por converter" e aceita taxas manuais datadas;
  - ativar USD/EUR é, por isso, uma alteração de configuração e de UI, não de modelo.
- **Configuração centralizada:** tudo o que depende do país está em `lib/domain/market.ts`.
- **Formato compacto:** só nas etiquetas de gráficos, com "M Kz" (milhões) e "mil M Kz" (mil milhões). O "mM" do Intl para pt-AO é ambíguo.
- **Nada de dados fiscais pré-preenchidos:** a retenção estimada de um depósito é sempre indicada pelo utilizador.

## Consequências

- **Multi-moeda:** decidir quando ativar USD e EUR. Em Angola o USD é comum em depósitos, em títulos em moeda estrangeira e em cripto.
- **Lei n.º 22/11 (proteção de dados):** validar o enquadramento e a região de alojamento antes de haver dados reais. Os termos e a política de privacidade terão de a referir.
