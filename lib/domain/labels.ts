import type {
  AlternativeSubtype,
  DayCountBasis,
  InstitutionKind,
  InterestMethod,
  InvestmentStatus,
  InvestmentType,
  PaymentFrequency,
  RateType,
  ReminderStatus,
  SecurityAssetClass,
  TransactionType,
} from './types';

/** Etiquetas em português, centralizadas para facilitar uma futura i18n. */

export const investmentTypeLabel: Record<InvestmentType, string> = {
  term_deposit: 'Depósito a prazo',
  bond: 'Obrigação',
  security: 'Ação, ETF ou fundo',
  crypto: 'Criptomoeda',
  alternative: 'P2P, crowdfunding ou imobiliário',
  other: 'Outro investimento',
};

/** Forma plural e curta, usada em grupos, distribuição e filtros. */
export const investmentTypeGroupLabel: Record<InvestmentType, string> = {
  term_deposit: 'Depósitos a prazo',
  bond: 'Obrigações',
  security: 'Ações, ETF e fundos',
  crypto: 'Cripto',
  alternative: 'Alternativos',
  other: 'Outros',
};

export const investmentTypeMonogram: Record<InvestmentType, string> = {
  term_deposit: 'DP',
  bond: 'OB',
  security: 'AC',
  crypto: 'CR',
  alternative: 'AL',
  other: 'OU',
};

export const investmentTypeDescription: Record<InvestmentType, string> = {
  term_deposit: 'Capital aplicado num banco com taxa e data de vencimento.',
  bond: 'Títulos de dívida, como Obrigações do Tesouro ou de empresas.',
  security: 'Ações cotadas, ETF ou fundos de investimento.',
  crypto: 'Bitcoin, stablecoins e outros criptoativos.',
  alternative: 'Empréstimos entre particulares, projetos de crowdfunding ou imóveis.',
  other: 'Qualquer outro investimento: um negócio, um terreno, gado.',
};

/** Ordem de apresentação dos tipos em listas e na distribuição. */
export const investmentTypeOrder: InvestmentType[] = [
  'term_deposit',
  'bond',
  'security',
  'crypto',
  'alternative',
  'other',
];

export const investmentStatusLabel: Record<InvestmentStatus, string> = {
  active: 'Ativo',
  matured: 'Vencido',
  closed: 'Encerrado',
  archived: 'Arquivado',
};

export const institutionKindLabel: Record<InstitutionKind, string> = {
  bank: 'Banco',
  broker: 'Corretora',
  exchange: 'Exchange',
  wallet: 'Wallet',
  platform: 'Plataforma',
  other: 'Outra',
};

export const transactionTypeLabel: Record<TransactionType, string> = {
  initial: 'Investimento inicial',
  contribution: 'Compra ou reforço',
  redemption: 'Venda ou resgate',
  withdrawal: 'Levantamento',
  interest: 'Juros',
  dividend: 'Dividendo ou rendimento',
  fee: 'Comissão',
  tax: 'Imposto',
  adjustment: 'Ajuste',
};

export const securityAssetClassLabel: Record<SecurityAssetClass, string> = {
  stock: 'Ação',
  etf: 'ETF',
  fund: 'Fundo',
};

export const alternativeSubtypeLabel: Record<AlternativeSubtype, string> = {
  p2p: 'P2P',
  crowdfunding: 'Crowdfunding',
  real_estate: 'Imobiliário',
};

export const rateTypeLabel: Record<RateType, string> = {
  fixed: 'Fixa',
  variable: 'Variável',
};

export const interestMethodLabel: Record<InterestMethod, string> = {
  simple: 'Juros simples',
  compound: 'Capitalização',
};

export const paymentFrequencyLabel: Record<PaymentFrequency, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
  at_maturity: 'No vencimento',
};

export const dayCountBasisLabel: Record<DayCountBasis, string> = {
  act_365: 'ACT/365',
  act_360: 'ACT/360',
  custom: 'Personalizada',
};

export const reminderStatusLabel: Record<ReminderStatus, string> = {
  pending: 'Pendente',
  done: 'Concluído',
  snoozed: 'Adiado',
  cancelled: 'Cancelado',
};
