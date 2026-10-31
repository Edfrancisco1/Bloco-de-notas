import type { InvestmentType } from '@/lib/domain/types';
import type { CreateInvestmentInput } from '@/lib/validations/schemas';

/** Valores iniciais dos detalhes de cada tipo (PLANO_MVP §6). Nada fiscal é pré-preenchido. */
export function defaultDetails(type: InvestmentType): CreateInvestmentInput['details'] {
  switch (type) {
    case 'term_deposit':
      return {
        kind: 'term_deposit',
        annualRate: '',
        rateType: 'fixed',
        interestMethod: 'simple',
        compoundingFrequency: 'at_maturity',
        dayCountBasis: 'act_365',
        customDayCount: null,
        autoRenew: false,
        estimatedTaxRate: null,
      };
    case 'bond':
      return {
        kind: 'bond',
        issuer: null,
        nominalValue: null,
        couponRate: null,
        couponFrequency: 'semiannual',
      };
    case 'security':
      return { kind: 'security', assetClass: 'stock', market: null };
    case 'crypto':
      return { kind: 'crypto', network: null };
    case 'alternative':
      return {
        kind: 'alternative',
        subtype: 'p2p',
        platformOrProject: null,
        expectedRate: null,
        expectedExitDate: null,
      };
    default:
      return { kind: 'other' };
  }
}

/** Tipos registados por quantidade × preço unitário. */
export const UNIT_TYPES: ReadonlySet<InvestmentType> = new Set(['bond', 'security', 'crypto']);

export function newInvestmentDefaults(
  type: InvestmentType,
  options: { today: string; defaultPortfolioId: string },
): CreateInvestmentInput {
  return {
    name: '',
    type,
    portfolioId: options.defaultPortfolioId,
    institutionId: null,
    currency: 'AOA',
    symbol: null,
    isin: null,
    startDate: options.today,
    maturityDate: null,
    tags: [],
    customFields: [],
    notes: null,
    details: defaultDetails(type),
    initial: { amount: '', quantity: null, unitPrice: null, feeAmount: '0' },
    currentValue: null,
    newInstitution: null,
    remindBeforeMaturity: type === 'term_deposit' || type === 'bond',
  };
}
