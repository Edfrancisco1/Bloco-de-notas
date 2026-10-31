import { beforeEach, describe, expect, it } from 'vitest';
import { addDays, todayIn } from '@/lib/calculations/dates';
import { isDomainError } from '@/lib/data/errors';
import type { NewInvestment, UserRepository } from '@/lib/data/repository';
import { MARKET } from '@/lib/domain/market';
import type { DecimalString } from '@/lib/domain/types';

/**
 * Contrato que qualquer implementação do UserRepository tem de cumprir.
 * Corre hoje contra o mock; quando existir a implementação Supabase, corre também contra ela
 * (com dois utilizadores reais), cobrindo o isolamento que as políticas RLS garantem.
 */
export interface RepositoryPair {
  a: UserRepository;
  b: UserRepository;
}

const ds = (v: string) => v as DecimalString;
const today = () => todayIn(MARKET.timezone);

async function expectDomainError(promise: Promise<unknown>, code: string) {
  try {
    await promise;
  } catch (error) {
    expect(isDomainError(error) && error.code).toBe(code);
    return;
  }
  throw new Error(`Era esperado um erro "${code}".`);
}

async function setup(repo: UserRepository) {
  const { portfolio } = await repo.completeOnboarding({
    displayName: 'Teste',
    timezone: MARKET.timezone,
    portfolioName: 'A minha carteira',
  });
  const institution = await repo.createInstitution({
    name: 'Banco Teste',
    kind: 'bank',
    notes: null,
  });
  return { portfolio, institution };
}

function newDeposit(portfolioId: string, institutionId: string | null): NewInvestment {
  const start = addDays(today(), -100);
  return {
    portfolioId,
    institutionId,
    name: 'Depósito teste',
    type: 'term_deposit',
    symbol: null,
    isin: null,
    currency: 'AOA',
    startDate: start,
    maturityDate: addDays(today(), 265),
    details: {
      kind: 'term_deposit',
      principal: ds('1000000'),
      annualRate: ds('12'),
      rateType: 'fixed',
      interestMethod: 'simple',
      compoundingFrequency: 'at_maturity',
      dayCountBasis: 'act_365',
      customDayCount: null,
      autoRenew: false,
      estimatedTaxRate: null,
    },
    tags: [],
    customFields: [],
    notes: null,
    initialTransaction: {
      occurredOn: start,
      amount: ds('1000000'),
      quantity: null,
      unitPrice: null,
      feeAmount: ds('0'),
    },
    initialValuation: {
      valuedOn: today(),
      totalValue: ds('1030000'),
      quantity: null,
      unitPrice: null,
    },
  };
}

export function defineRepositoryContract(name: string, createPair: () => Promise<RepositoryPair>) {
  describe(`contrato do UserRepository — ${name}`, () => {
    let a: UserRepository;
    let b: UserRepository;

    beforeEach(async () => {
      ({ a, b } = await createPair());
    });

    it('cria o investimento com movimento inicial e avaliação numa só operação', async () => {
      const { portfolio, institution } = await setup(a);
      const investment = await a.createInvestment(newDeposit(portfolio.id, institution.id));
      const transactions = await a.listTransactions({ investmentId: investment.id });
      const valuations = await a.listValuations({ investmentId: investment.id });
      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.type).toBe('initial');
      expect(valuations).toHaveLength(1);
      expect(investment.status).toBe('active');
    });

    it('isola os dados entre utilizadores', async () => {
      const { portfolio, institution } = await setup(a);
      const investment = await a.createInvestment(newDeposit(portfolio.id, institution.id));
      await setup(b);
      expect(await b.getInvestment(investment.id)).toBeNull();
      expect(await b.listInvestments()).toHaveLength(0);
      expect(await b.listTransactions()).toHaveLength(0);
      await expectDomainError(b.setInvestmentStatus(investment.id, 'archived'), 'not_found');
      await expectDomainError(b.deleteInvestment(investment.id), 'not_found');
      await expectDomainError(
        b.createValuation({
          investmentId: investment.id,
          valuedOn: today(),
          totalValue: ds('1'),
          quantity: null,
          unitPrice: null,
          notes: null,
        }),
        'invalid_reference',
      );
    });

    it('não aceita carteira ou instituição de outro utilizador e não deixa nada a meio', async () => {
      const mine = await setup(a);
      const theirs = await setup(b);
      await expectDomainError(
        a.createInvestment(newDeposit(theirs.portfolio.id, mine.institution.id)),
        'invalid_reference',
      );
      await expectDomainError(
        a.createInvestment(newDeposit(mine.portfolio.id, theirs.institution.id)),
        'invalid_reference',
      );
      expect(await a.listInvestments()).toHaveLength(0);
      expect(await a.listTransactions()).toHaveLength(0);
      expect(await a.listValuations()).toHaveLength(0);
    });

    it('acumula histórico de avaliações e recusa duplicados e datas futuras', async () => {
      const { portfolio, institution } = await setup(a);
      const investment = await a.createInvestment(newDeposit(portfolio.id, institution.id));
      const base = { investmentId: investment.id, quantity: null, unitPrice: null, notes: null };
      await a.createValuation({
        ...base,
        valuedOn: addDays(today(), -10),
        totalValue: ds('1020000'),
      });
      expect(await a.listValuations({ investmentId: investment.id })).toHaveLength(2);
      await expectDomainError(
        a.createValuation({ ...base, valuedOn: today(), totalValue: ds('1') }),
        'conflict',
      );
      await expectDomainError(
        a.createValuation({ ...base, valuedOn: addDays(today(), 1), totalValue: ds('1') }),
        'invalid_state',
      );
    });

    it('não vende mais unidades do que as detidas', async () => {
      const { portfolio } = await setup(a);
      const investment = await a.createInvestment({
        ...newDeposit(portfolio.id, null),
        type: 'crypto',
        maturityDate: null,
        details: { kind: 'crypto', network: null },
        initialTransaction: {
          occurredOn: addDays(today(), -30),
          amount: ds('900000'),
          quantity: ds('0.01'),
          unitPrice: ds('90000000'),
          feeAmount: ds('0'),
        },
        initialValuation: null,
      });
      const sale = {
        investmentId: investment.id,
        type: 'redemption' as const,
        occurredOn: today(),
        amount: ds('950000'),
        unitPrice: null,
        feeAmount: ds('0'),
        taxAmount: ds('0'),
        capitalComponent: null,
        isReinvested: false,
        adjustmentDirection: null,
        notes: null,
      };
      await expectDomainError(
        a.createTransaction({ ...sale, quantity: ds('0.02') }),
        'invalid_state',
      );
      await a.createTransaction({ ...sale, quantity: ds('0.004') });
      expect(await a.listTransactions({ investmentId: investment.id })).toHaveLength(2);
    });

    it('investimentos encerrados não aceitam alterações até serem reabertos', async () => {
      const { portfolio, institution } = await setup(a);
      const investment = await a.createInvestment(newDeposit(portfolio.id, institution.id));
      await a.setInvestmentStatus(investment.id, 'closed');
      const valuation = {
        investmentId: investment.id,
        valuedOn: addDays(today(), -1),
        totalValue: ds('1'),
        quantity: null,
        unitPrice: null,
        notes: null,
      };
      await expectDomainError(a.createValuation(valuation), 'invalid_state');
      await a.setInvestmentStatus(investment.id, 'active');
      await a.createValuation(valuation);
    });

    it('a auditoria guarda nomes de campos, nunca valores', async () => {
      const { portfolio, institution } = await setup(a);
      const investment = await a.createInvestment(newDeposit(portfolio.id, institution.id));
      const {
        initialTransaction: _t,
        initialValuation: _v,
        ...data
      } = newDeposit(portfolio.id, institution.id);
      await a.updateInvestment(investment.id, { ...data, name: 'Depósito renomeado' });
      const events = await a.listAuditEvents();
      const update = events.find((e) => e.entityId === investment.id && e.action === 'update');
      expect(update?.changedFields).toEqual(['name']);
      expect(JSON.stringify(events)).not.toContain('Depósito renomeado');
    });

    it('eliminar um investimento elimina o seu histórico', async () => {
      const { portfolio, institution } = await setup(a);
      const investment = await a.createInvestment(newDeposit(portfolio.id, institution.id));
      await a.createReminder({ investmentId: investment.id, title: 'Vencimento', dueOn: today() });
      await a.deleteInvestment(investment.id);
      expect(await a.listTransactions()).toHaveLength(0);
      expect(await a.listValuations()).toHaveLength(0);
      expect(await a.listReminders()).toHaveLength(0);
    });

    it('a carteira principal não pode ser arquivada', async () => {
      const { portfolio } = await setup(a);
      await expectDomainError(a.archivePortfolio(portfolio.id), 'invalid_state');
    });

    it('cria instituição nova e lembrete no mesmo passo — ou nada, se algo falhar', async () => {
      const { portfolio } = await setup(a);
      const before = (await a.listInstitutions()).length;
      const base = {
        ...newDeposit(portfolio.id, null),
        newInstitution: { name: 'Banco Novo', kind: 'bank' as const, notes: null },
        reminder: { title: 'Vencimento', dueOn: addDays(today(), 258) },
      };
      await expectDomainError(
        a.createInvestment({ ...base, portfolioId: 'carteira-inexistente' }),
        'invalid_reference',
      );
      expect(await a.listInstitutions()).toHaveLength(before);
      expect(await a.listReminders()).toHaveLength(0);

      const investment = await a.createInvestment(base);
      const institutions = await a.listInstitutions();
      expect(institutions).toHaveLength(before + 1);
      expect(investment.institutionId).toBe(institutions.find((i) => i.name === 'Banco Novo')?.id);
      expect(await a.listReminders({ investmentId: investment.id })).toHaveLength(1);
    });

    it('encerra com o movimento final numa só operação e permite reabrir', async () => {
      const { portfolio, institution } = await setup(a);
      const investment = await a.createInvestment(newDeposit(portfolio.id, institution.id));
      const closed = await a.closeInvestment(investment.id, {
        closedOn: today(),
        finalTransaction: {
          type: 'redemption',
          amount: ds('1032000'),
          quantity: null,
          unitPrice: null,
          feeAmount: ds('0'),
          taxAmount: ds('3200'),
          capitalComponent: ds('1000000'),
          isReinvested: false,
          adjustmentDirection: null,
          notes: null,
        },
      });
      expect(closed.status).toBe('closed');
      expect(closed.closedAt?.slice(0, 10)).toBe(today());
      expect(await a.listTransactions({ investmentId: investment.id })).toHaveLength(2);
      await expectDomainError(
        a.closeInvestment(investment.id, { closedOn: today(), finalTransaction: null }),
        'invalid_state',
      );
      const reopened = await a.setInvestmentStatus(investment.id, 'active');
      expect(reopened.closedAt).toBeNull();
    });

    it('arquivar preserva a data de encerramento', async () => {
      const { portfolio, institution } = await setup(a);
      const investment = await a.createInvestment(newDeposit(portfolio.id, institution.id));
      await a.closeInvestment(investment.id, { closedOn: today(), finalTransaction: null });
      const archived = await a.setInvestmentStatus(investment.id, 'archived');
      expect(archived.closedAt?.slice(0, 10)).toBe(today());
      expect(await a.listInvestments()).toHaveLength(0);
      expect(await a.listInvestments({ includeArchived: true })).toHaveLength(1);
    });
  });
}
