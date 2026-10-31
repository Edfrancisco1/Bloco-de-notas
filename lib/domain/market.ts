/**
 * Mercado inicial: Angola (ver docs/adr/0002). Tudo o que depende do país vive aqui,
 * para que um segundo mercado seja uma configuração e não uma procura por todo o código.
 */
export const MARKET = {
  locale: 'pt-AO',
  baseCurrency: 'AOA',
  currencySymbol: 'Kz',
  currencyName: 'Kwanza',
  timezone: 'Africa/Luanda',
  /** Moedas ativas nos formulários. Multi-moeda fica para uma fase seguinte. */
  activeCurrencies: ['AOA'] as const,
  /** Casas decimais de apresentação do Kwanza (unidade menor ISO 4217). */
  moneyDecimals: 2,
  /** Casas decimais máximas para quantidades (cripto). */
  quantityDecimals: 8,
  /** Dias até uma avaliação ser considerada desatualizada. */
  staleAfterDays: 30,
} as const;
