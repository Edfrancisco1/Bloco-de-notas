import { addDays } from '@/lib/calculations/dates';
import { MARKET } from '@/lib/domain/market';
import type {
  DecimalString,
  Institution,
  Investment,
  InvestmentDetails,
  IsoDate,
  Portfolio,
  Profile,
  Reminder,
  Transaction,
  TransactionType,
  Valuation,
} from '@/lib/domain/types';
import type { UserData } from './store';

/**
 * Dados de demonstração FICTÍCIOS, gerados em relação a "hoje" para que os estados críticos
 * existam sempre: um depósito a vencer em 7 dias, um fundo com avaliação de há 45 dias, um
 * investimento sem avaliação, uma posição encerrada, cripto com venda parcial, rendimentos,
 * comissões e impostos.
 *
 * As instituições têm nomes inventados para não associar taxas inventadas a entidades reais.
 */

export const DEMO_USER_ID = 'demo';
export const DEMO_EMAIL = 'demo@investnote.example';

const ds = (value: string) => value as DecimalString;
const at = (date: IsoDate, hour = 10) => `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`;

export function buildDemoData(today: IsoDate): UserData {
  const d = (offset: number) => addDays(today, offset);

  const profile: Profile = {
    userId: DEMO_USER_ID,
    email: DEMO_EMAIL,
    displayName: 'Kiala',
    baseCurrency: MARKET.baseCurrency,
    timezone: MARKET.timezone,
    onboardedAt: at(d(-700)),
    createdAt: at(d(-700)),
    updatedAt: at(d(-700)),
  };

  const portfolio = (id: string, name: string, isDefault: boolean): Portfolio => ({
    id,
    name,
    baseCurrency: MARKET.baseCurrency,
    isDefault,
    archivedAt: null,
    createdAt: at(d(-700)),
    updatedAt: at(d(-700)),
  });

  const portfolios = [
    portfolio('pessoal', 'A minha carteira', true),
    portfolio('reforma', 'Reforma', false),
  ];

  const institution = (id: string, name: string, kind: Institution['kind']): Institution => ({
    id,
    name,
    kind,
    countryCode: 'AO',
    notes: null,
    archivedAt: null,
    createdAt: at(d(-700)),
    updatedAt: at(d(-700)),
  });

  const institutions = [
    institution('banco-mutamba', 'Banco Mutamba', 'bank'),
    institution('banco-kalandula', 'Banco Kalandula', 'bank'),
    institution('corretora-tundavala', 'Corretora Tundavala', 'broker'),
    institution('carteira-digital', 'Carteira digital pessoal', 'wallet'),
    institution('plataforma-imbondeiro', 'Plataforma Imbondeiro', 'platform'),
  ];

  const investments: Investment[] = [];
  const transactions: Transaction[] = [];
  const valuations: Valuation[] = [];

  let txSeq = 0;
  let valSeq = 0;

  function addInvestment(
    base: Pick<
      Investment,
      'id' | 'portfolioId' | 'institutionId' | 'name' | 'type' | 'startDate' | 'details'
    > &
      Partial<Investment>,
  ) {
    investments.push({
      currency: MARKET.baseCurrency,
      symbol: null,
      isin: null,
      tags: [],
      customFields: [],
      notes: null,
      maturityDate: null,
      status: 'active',
      closedAt: null,
      createdAt: at(base.startDate),
      updatedAt: at(base.startDate),
      ...base,
    });
  }

  function addTx(
    investmentId: string,
    type: TransactionType,
    occurredOn: IsoDate,
    amount: string,
    extra: {
      quantity?: string;
      unitPrice?: string;
      fee?: string;
      tax?: string;
      capital?: string;
      notes?: string;
    } = {},
  ) {
    txSeq += 1;
    transactions.push({
      id: `${investmentId}-mov-${txSeq}`,
      investmentId,
      type,
      occurredOn,
      currency: MARKET.baseCurrency,
      amount: ds(amount),
      quantity: extra.quantity ? ds(extra.quantity) : null,
      unitPrice: extra.unitPrice ? ds(extra.unitPrice) : null,
      feeAmount: ds(extra.fee ?? '0'),
      taxAmount: ds(extra.tax ?? '0'),
      capitalComponent: extra.capital ? ds(extra.capital) : null,
      isReinvested: false,
      adjustmentDirection: null,
      notes: extra.notes ?? null,
      createdAt: at(occurredOn, 11),
      updatedAt: at(occurredOn, 11),
    });
  }

  function addValuation(
    investmentId: string,
    valuedOn: IsoDate,
    totalValue: string,
    units?: { quantity: string; unitPrice: string },
  ) {
    valSeq += 1;
    valuations.push({
      id: `${investmentId}-aval-${valSeq}`,
      investmentId,
      valuedOn,
      currency: MARKET.baseCurrency,
      quantity: units ? ds(units.quantity) : null,
      unitPrice: units ? ds(units.unitPrice) : null,
      totalValue: ds(totalValue),
      source: 'manual',
      notes: null,
      createdAt: at(valuedOn, 18),
      updatedAt: at(valuedOn, 18),
    });
  }

  const termDeposit = (
    principal: string,
    annualRate: string,
    method: 'simple' | 'compound',
    frequency: 'monthly' | 'at_maturity',
    autoRenew: boolean,
  ): InvestmentDetails => ({
    kind: 'term_deposit',
    principal: ds(principal),
    annualRate: ds(annualRate),
    rateType: 'fixed',
    interestMethod: method,
    compoundingFrequency: frequency,
    dayCountBasis: 'act_365',
    customDayCount: null,
    autoRenew,
    estimatedTaxRate: null,
  });

  // 1. Depósito a prazo de 12 meses — avaliação recente.
  addInvestment({
    id: 'dp-12-meses',
    portfolioId: 'pessoal',
    institutionId: 'banco-mutamba',
    name: 'Depósito a prazo 12 meses',
    type: 'term_deposit',
    startDate: d(-200),
    maturityDate: d(165),
    details: termDeposit('5000000', '14.5', 'simple', 'at_maturity', false),
    tags: ['reserva'],
    notes: 'Decidir a renovação um mês antes do vencimento.',
  });
  addTx('dp-12-meses', 'initial', d(-200), '5000000');
  // Avaliações intermédias (extratos com juros corridos), para o gráfico de evolução.
  addValuation('dp-12-meses', d(-140), '5119178.08');
  addValuation('dp-12-meses', d(-70), '5258219.18');
  addValuation('dp-12-meses', d(-5), '5387328.77');

  // 2. Depósito a prazo de 6 meses — vence dentro de 7 dias.
  addInvestment({
    id: 'dp-6-meses',
    portfolioId: 'pessoal',
    institutionId: 'banco-kalandula',
    name: 'Depósito a prazo 6 meses',
    type: 'term_deposit',
    startDate: d(-176),
    maturityDate: d(7),
    details: termDeposit('2500000', '12', 'compound', 'monthly', true),
  });
  addTx('dp-6-meses', 'initial', d(-176), '2500000');
  addValuation('dp-6-meses', d(-20), '2630880');

  // 3. Obrigações do Tesouro — cupões semestrais.
  addInvestment({
    id: 'ot-2029',
    portfolioId: 'reforma',
    institutionId: 'banco-mutamba',
    name: 'Obrigações do Tesouro 2029',
    type: 'bond',
    startDate: d(-400),
    maturityDate: d(1100),
    details: {
      kind: 'bond',
      issuer: 'Tesouro Nacional',
      nominalValue: ds('1000000'),
      couponRate: ds('16'),
      couponFrequency: 'semiannual',
    },
  });
  addTx('ot-2029', 'initial', d(-400), '3000000', {
    quantity: '3',
    unitPrice: '1000000',
    fee: '15000',
  });
  addTx('ot-2029', 'interest', d(-217), '240000', { notes: 'Cupão semestral' });
  addTx('ot-2029', 'interest', d(-35), '240000', { notes: 'Cupão semestral' });
  addValuation('ot-2029', d(-14), '3060000', { quantity: '3', unitPrice: '1020000' });

  // 4. Ações — duas compras e um dividendo com imposto.
  addInvestment({
    id: 'acoes-lumbu',
    portfolioId: 'pessoal',
    institutionId: 'corretora-tundavala',
    name: 'Lumbu Telecom',
    type: 'security',
    symbol: 'LBT',
    startDate: d(-300),
    details: { kind: 'security', assetClass: 'stock', market: 'BODIVA' },
  });
  addTx('acoes-lumbu', 'initial', d(-300), '2000000', {
    quantity: '400',
    unitPrice: '5000',
    fee: '10000',
  });
  addTx('acoes-lumbu', 'contribution', d(-120), '620000', {
    quantity: '100',
    unitPrice: '6200',
    fee: '3100',
  });
  addTx('acoes-lumbu', 'dividend', d(-60), '90000', { tax: '9000' });
  addValuation('acoes-lumbu', d(-250), '2080000', { quantity: '400', unitPrice: '5200' });
  addValuation('acoes-lumbu', d(-180), '2240000', { quantity: '400', unitPrice: '5600' });
  addValuation('acoes-lumbu', d(-90), '3150000', { quantity: '500', unitPrice: '6300' });
  addValuation('acoes-lumbu', d(-2), '3425000', { quantity: '500', unitPrice: '6850' });

  // 5. Fundo imobiliário — avaliação desatualizada (45 dias).
  addInvestment({
    id: 'fundo-imbondeiro',
    portfolioId: 'reforma',
    institutionId: 'corretora-tundavala',
    name: 'Fundo Imobiliário Imbondeiro',
    type: 'security',
    startDate: d(-250),
    details: { kind: 'security', assetClass: 'fund', market: null },
  });
  addTx('fundo-imbondeiro', 'initial', d(-250), '4000000', {
    quantity: '4000',
    unitPrice: '1000',
  });
  addValuation('fundo-imbondeiro', d(-45), '4209200', { quantity: '4000', unitPrice: '1052.3' });

  // 6. Bitcoin — duas compras e uma venda parcial.
  addInvestment({
    id: 'bitcoin',
    portfolioId: 'pessoal',
    institutionId: 'carteira-digital',
    name: 'Bitcoin',
    type: 'crypto',
    symbol: 'BTC',
    startDate: d(-330),
    details: { kind: 'crypto', network: 'Bitcoin' },
  });
  addTx('bitcoin', 'initial', d(-330), '1160000', {
    quantity: '0.02',
    unitPrice: '58000000',
    fee: '11600',
  });
  addTx('bitcoin', 'contribution', d(-150), '810000', {
    quantity: '0.01',
    unitPrice: '81000000',
    fee: '8100',
  });
  addTx('bitcoin', 'redemption', d(-40), '736000', {
    quantity: '0.008',
    unitPrice: '92000000',
    fee: '7360',
  });
  addValuation('bitcoin', d(-300), '1200000', { quantity: '0.02', unitPrice: '60000000' });
  addValuation('bitcoin', d(-240), '1320000', { quantity: '0.02', unitPrice: '66000000' });
  addValuation('bitcoin', d(-180), '1440000', { quantity: '0.02', unitPrice: '72000000' });
  addValuation('bitcoin', d(-120), '2520000', { quantity: '0.03', unitPrice: '84000000' });
  addValuation('bitcoin', d(-60), '2640000', { quantity: '0.03', unitPrice: '88000000' });
  addValuation('bitcoin', d(-1), '2123000', { quantity: '0.022', unitPrice: '96500000' });

  // 7. Imobiliário — rendas trimestrais.
  addInvestment({
    id: 'quota-apartamento',
    portfolioId: 'reforma',
    institutionId: 'plataforma-imbondeiro',
    name: 'Quota num apartamento em Talatona',
    type: 'alternative',
    startDate: d(-500),
    details: {
      kind: 'alternative',
      subtype: 'real_estate',
      platformOrProject: 'Edifício Mulemba',
      expectedRate: ds('9'),
      expectedExitDate: d(730),
    },
  });
  addTx('quota-apartamento', 'initial', d(-500), '6000000');
  for (const offset of [-365, -275, -185, -95, -5]) {
    addTx('quota-apartamento', 'dividend', d(offset), '135000', { notes: 'Renda trimestral' });
  }
  addValuation('quota-apartamento', d(-12), '6300000');

  // 8. Crowdfunding — ainda sem avaliação.
  addInvestment({
    id: 'crowdfunding-horta',
    portfolioId: 'pessoal',
    institutionId: 'plataforma-imbondeiro',
    name: 'Projeto agrícola Horta Viva',
    type: 'alternative',
    startDate: d(-90),
    details: {
      kind: 'alternative',
      subtype: 'crowdfunding',
      platformOrProject: 'Horta Viva',
      expectedRate: ds('12'),
      expectedExitDate: d(365),
    },
  });
  addTx('crowdfunding-horta', 'initial', d(-90), '1500000');

  // 9. Outro — participação num negócio, com campos personalizados.
  addInvestment({
    id: 'negocio-familia',
    portfolioId: 'pessoal',
    institutionId: null,
    name: 'Participação no negócio da família',
    type: 'other',
    startDate: d(-700),
    details: { kind: 'other' },
    tags: ['família'],
    customFields: [
      { key: 'Setor', value: 'Comércio' },
      { key: 'Participação', value: '15%' },
    ],
  });
  addTx('negocio-familia', 'initial', d(-700), '3000000');
  addTx('negocio-familia', 'contribution', d(-200), '500000');
  addTx('negocio-familia', 'dividend', d(-30), '150000', { notes: 'Lucros distribuídos' });
  addValuation('negocio-familia', d(-8), '4000000');

  // 10. Depósito encerrado — resgate com juros e imposto.
  addInvestment({
    id: 'dp-3-meses-encerrado',
    portfolioId: 'pessoal',
    institutionId: 'banco-kalandula',
    name: 'Depósito a prazo 3 meses',
    type: 'term_deposit',
    status: 'closed',
    startDate: d(-400),
    maturityDate: d(-309),
    closedAt: at(d(-309), 12),
    details: termDeposit('1500000', '12', 'simple', 'at_maturity', false),
  });
  addTx('dp-3-meses-encerrado', 'initial', d(-400), '1500000');
  addTx('dp-3-meses-encerrado', 'redemption', d(-309), '1544876.71', {
    capital: '1500000',
    tax: '4487.67',
    notes: 'Resgate no vencimento',
  });

  const reminder = (
    id: string,
    investmentId: string | null,
    title: string,
    dueOn: IsoDate,
    status: Reminder['status'] = 'pending',
  ): Reminder => ({
    id,
    investmentId,
    title,
    dueOn,
    status,
    completedAt: status === 'done' ? at(addDays(dueOn, -1), 9) : null,
    createdAt: at(d(-60)),
    updatedAt: at(d(-60)),
  });

  const reminders = [
    reminder('lembrete-dp6', 'dp-6-meses', 'Vencimento do depósito a prazo 6 meses', d(6)),
    reminder('lembrete-dp12', 'dp-12-meses', 'Decidir a renovação do depósito de 12 meses', d(135)),
    reminder('lembrete-fundo', 'fundo-imbondeiro', 'Atualizar o valor do fundo imobiliário', d(-3)),
    reminder('lembrete-ot', 'ot-2029', 'Próximo cupão das OT 2029', d(147)),
    reminder(
      'lembrete-contrato',
      'quota-apartamento',
      'Rever o contrato de arrendamento',
      d(-20),
      'done',
    ),
  ];

  return {
    profile,
    portfolios,
    institutions,
    investments,
    transactions,
    valuations,
    reminders,
    audit: [],
  };
}

/** Conta nova, vazia, ainda por concluir o onboarding. */
export function buildEmptyData(userId: string, email: string, now: string): UserData {
  return {
    profile: {
      userId,
      email,
      displayName: null,
      baseCurrency: MARKET.baseCurrency,
      timezone: MARKET.timezone,
      onboardedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    portfolios: [],
    institutions: [],
    investments: [],
    transactions: [],
    valuations: [],
    reminders: [],
    audit: [],
  };
}
