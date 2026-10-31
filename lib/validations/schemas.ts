import { z } from 'zod';
import { dec } from '@/lib/calculations/decimal';
import {
  ADJUSTMENT_DIRECTIONS,
  ALTERNATIVE_SUBTYPES,
  DAY_COUNT_BASES,
  INSTITUTION_KINDS,
  INTEREST_METHODS,
  INVESTMENT_TYPES,
  PAYMENT_FREQUENCIES,
  RATE_TYPES,
  SECURITY_ASSET_CLASSES,
  TRANSACTION_TYPES,
} from '@/lib/domain/types';
import {
  currency,
  entityId,
  isValidTimeZone,
  isoDate,
  money,
  nullable,
  optionalIsoDate,
  optionalText,
  positiveMoney,
  quantity,
  ratePct,
  unitPrice,
} from './common';

/**
 * Schemas partilhados entre formulários (cliente) e Server Actions (servidor).
 * O servidor valida sempre de novo — o cliente só melhora a experiência.
 */

// ── Detalhes por tipo (PLANO_MVP §6) ─────────────────────────────────────────

const termDepositDetails = z.object({
  kind: z.literal('term_deposit'),
  annualRate: ratePct,
  rateType: z.enum(RATE_TYPES),
  interestMethod: z.enum(INTEREST_METHODS),
  compoundingFrequency: z.enum(PAYMENT_FREQUENCIES),
  dayCountBasis: z.enum(DAY_COUNT_BASES),
  customDayCount: z.number().int().min(1).max(400).nullable(),
  autoRenew: z.boolean(),
  estimatedTaxRate: nullable(ratePct),
});

const securityDetails = z.object({
  kind: z.literal('security'),
  assetClass: z.enum(SECURITY_ASSET_CLASSES),
  market: optionalText(40),
});

const cryptoDetails = z.object({
  kind: z.literal('crypto'),
  network: optionalText(40),
});

const bondDetails = z.object({
  kind: z.literal('bond'),
  issuer: optionalText(80),
  nominalValue: nullable(positiveMoney),
  couponRate: nullable(ratePct),
  couponFrequency: z.enum(PAYMENT_FREQUENCIES).nullable(),
});

const alternativeDetails = z.object({
  kind: z.literal('alternative'),
  subtype: z.enum(ALTERNATIVE_SUBTYPES),
  platformOrProject: optionalText(80),
  expectedRate: nullable(ratePct),
  expectedExitDate: optionalIsoDate,
});

const otherDetails = z.object({ kind: z.literal('other') });

export const investmentDetailsSchema = z.discriminatedUnion('kind', [
  termDepositDetails,
  securityDetails,
  cryptoDetails,
  bondDetails,
  alternativeDetails,
  otherDetails,
]);

/** Detalhes validados (o capital de um depósito vem do montante inicial, não do formulário). */
export type InvestmentDetailsData = z.output<typeof investmentDetailsSchema>;

// ── Investimento ─────────────────────────────────────────────────────────────

const customField = z.object({
  key: z.string().trim().min(1, { error: 'Indique o nome do campo.' }).max(40),
  value: z.string().trim().max(200),
});

const investmentFields = {
  name: z
    .string({ error: 'Indique um nome.' })
    .trim()
    .min(1, { error: 'Indique um nome.' })
    .max(120, { error: 'Máximo de 120 caracteres.' }),
  type: z.enum(INVESTMENT_TYPES, { error: 'Escolha um tipo.' }),
  portfolioId: entityId,
  institutionId: z.string().nullable(),
  currency,
  symbol: optionalText(20),
  isin: optionalText(12),
  startDate: isoDate,
  maturityDate: optionalIsoDate,
  tags: z.array(z.string().trim().min(1).max(30)).max(10, { error: 'Máximo de 10 etiquetas.' }),
  customFields: z.array(customField).max(20),
  notes: optionalText(5000),
  details: investmentDetailsSchema,
};

const NEEDS_MATURITY = new Set(['term_deposit', 'bond']);

function checkInvestment(
  value: {
    type: string;
    startDate: string;
    maturityDate: string | null;
    details: { kind: string; dayCountBasis?: string; customDayCount?: number | null };
  },
  ctx: z.RefinementCtx,
) {
  if (value.details.kind !== value.type) {
    ctx.addIssue({
      code: 'custom',
      path: ['details'],
      message: 'Detalhes não correspondem ao tipo.',
    });
  }
  if (NEEDS_MATURITY.has(value.type) && !value.maturityDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['maturityDate'],
      message: 'Indique a data de vencimento.',
    });
  }
  if (value.maturityDate && value.maturityDate <= value.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['maturityDate'],
      message: 'O vencimento tem de ser depois da data de início.',
    });
  }
  if (value.details.dayCountBasis === 'custom' && !value.details.customDayCount) {
    ctx.addIssue({
      code: 'custom',
      path: ['details', 'customDayCount'],
      message: 'Indique os dias por ano.',
    });
  }
}

export const updateInvestmentSchema = z.object(investmentFields).superRefine(checkInvestment);

export type UpdateInvestmentInput = z.input<typeof updateInvestmentSchema>;

export const createInvestmentSchema = z
  .object({
    ...investmentFields,
    initial: z.object({
      amount: positiveMoney,
      quantity: nullable(quantity),
      unitPrice: nullable(unitPrice),
      feeAmount: money,
    }),
    currentValue: z.object({ valuedOn: isoDate, totalValue: money }).nullable(),
    /** Instituição criada no mesmo passo (escolha "Nova instituição…"). */
    newInstitution: z
      .object({
        name: z.string().trim().min(1, { error: 'Indique o nome da instituição.' }).max(80),
        kind: z.enum(INSTITUTION_KINDS),
      })
      .nullable(),
    /** Criar um lembrete antes do vencimento. */
    remindBeforeMaturity: z.boolean(),
  })
  .superRefine(checkInvestment)
  .superRefine((value, ctx) => {
    if (value.currentValue && value.currentValue.valuedOn < value.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['currentValue', 'valuedOn'],
        message: 'A data do valor atual é anterior ao início.',
      });
    }
  });

export type CreateInvestmentInput = z.input<typeof createInvestmentSchema>;
export type CreateInvestmentData = z.output<typeof createInvestmentSchema>;

/** Encerrar (jornada E): data e, opcionalmente, a venda/resgate final. */
export const closeInvestmentSchema = z.object({
  investmentId: entityId,
  closedOn: isoDate,
  final: z
    .object({
      amount: positiveMoney,
      quantity: nullable(quantity),
      unitPrice: nullable(unitPrice),
      feeAmount: money,
      taxAmount: money,
      capitalComponent: nullable(money),
      notes: optionalText(1000),
    })
    .nullable(),
});

export type CloseInvestmentInput = z.input<typeof closeInvestmentSchema>;

// ── Movimentos ───────────────────────────────────────────────────────────────

export const transactionSchema = z
  .object({
    investmentId: entityId,
    type: z.enum(TRANSACTION_TYPES, { error: 'Escolha o tipo de movimento.' }),
    occurredOn: isoDate,
    amount: positiveMoney,
    quantity: nullable(quantity),
    unitPrice: nullable(unitPrice),
    feeAmount: money,
    taxAmount: money,
    capitalComponent: nullable(money),
    isReinvested: z.boolean(),
    adjustmentDirection: z.enum(ADJUSTMENT_DIRECTIONS).nullable(),
    notes: optionalText(1000),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'adjustment' && !value.adjustmentDirection) {
      ctx.addIssue({
        code: 'custom',
        path: ['adjustmentDirection'],
        message: 'Indique se o ajuste aumenta ou diminui o capital.',
      });
    }
    const isExit = value.type === 'redemption' || value.type === 'withdrawal';
    if (value.capitalComponent !== null) {
      if (!isExit) {
        ctx.addIssue({
          code: 'custom',
          path: ['capitalComponent'],
          message: 'Só se aplica a vendas, resgates e levantamentos.',
        });
      }
    }
    if (value.type === 'fee' || value.type === 'tax') {
      // Convenção §5: num movimento autónomo de custo, o custo vai em `amount`.
      if (!dec(value.feeAmount).isZero() || !dec(value.taxAmount).isZero()) {
        ctx.addIssue({
          code: 'custom',
          path: ['feeAmount'],
          message: 'Num movimento de comissão ou imposto, indique o custo só no valor principal.',
        });
      }
    }
  });

export type TransactionInput = z.input<typeof transactionSchema>;

// ── Avaliações ───────────────────────────────────────────────────────────────

export const valuationSchema = z.object({
  investmentId: entityId,
  valuedOn: isoDate,
  totalValue: money,
  quantity: nullable(quantity),
  unitPrice: nullable(unitPrice),
  notes: optionalText(500),
});

export type ValuationInput = z.input<typeof valuationSchema>;

// ── Lembretes, carteiras, instituições, perfil ───────────────────────────────

export const reminderSchema = z.object({
  investmentId: z.string().nullable(),
  title: z.string().trim().min(1, { error: 'Indique um título.' }).max(120),
  dueOn: isoDate,
});

export const portfolioSchema = z.object({
  name: z.string().trim().min(1, { error: 'Indique um nome.' }).max(60),
});

export const institutionSchema = z.object({
  name: z.string().trim().min(1, { error: 'Indique um nome.' }).max(80),
  kind: z.enum(INSTITUTION_KINDS),
  notes: optionalText(500),
});

const timezone = z
  .string()
  .min(1, { error: 'Escolha um fuso horário.' })
  .refine(isValidTimeZone, { error: 'Fuso horário inválido.' });

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, { error: 'Indique o seu nome.' }).max(60),
  timezone,
});

export const onboardingSchema = profileSchema.extend({
  portfolioName: z.string().trim().min(1, { error: 'Indique um nome para a carteira.' }).max(60),
});

// ── Autenticação ─────────────────────────────────────────────────────────────

const email = z.email({ error: 'Indique um e-mail válido.' });
const newPassword = z
  .string()
  .min(8, { error: 'A palavra-passe precisa de pelo menos 8 caracteres.' })
  .max(128);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Indique a palavra-passe.' }),
});

export const signUpSchema = z.object({ email, password: newPassword });

export const passwordResetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((value) => value.password === value.confirm, {
    path: ['confirm'],
    error: 'As palavras-passe não coincidem.',
  });
