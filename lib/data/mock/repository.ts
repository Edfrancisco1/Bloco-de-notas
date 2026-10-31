import { computeInvestmentMetrics } from '@/lib/calculations/metrics';
import { dec } from '@/lib/calculations/decimal';
import { todayIn } from '@/lib/calculations/dates';
import { MARKET } from '@/lib/domain/market';
import { formatQuantity } from '@/lib/formatters/money';
import type {
  AuditAction,
  AuditEvent,
  Institution,
  Investment,
  InvestmentStatus,
  Portfolio,
  Reminder,
  Transaction,
  Valuation,
} from '@/lib/domain/types';
import { DomainError } from '../errors';
import type {
  InstitutionData,
  InvestmentData,
  NewInvestment,
  TransactionData,
  UserRepository,
  ValuationData,
} from '../repository';
import { deleteMockUser, getUserData, type UserData } from './store';

/**
 * Implementação em memória do UserRepository (modo demonstração).
 * Imita as garantias da base de dados real: propriedade, referências válidas, atomicidade
 * (valida tudo antes de alterar) e auditoria só com nomes de campos.
 */
export function createMockRepository(
  userId: string,
  clock: () => Date = () => new Date(),
): UserRepository {
  const now = () => clock().toISOString();
  const newId = () => crypto.randomUUID();
  const clone = <T>(value: T): T => structuredClone(value);

  function db(): UserData {
    const data = getUserData(userId);
    if (!data) throw new DomainError('not_found', 'Conta não encontrada.');
    return data;
  }

  function today() {
    return todayIn(db().profile.timezone || MARKET.timezone, clock());
  }

  function audit(
    entityType: AuditEvent['entityType'],
    entityId: string,
    action: AuditAction,
    changedFields: string[] | null = null,
  ) {
    db().audit.push({ id: newId(), entityType, entityId, action, changedFields, createdAt: now() });
  }

  const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  function changedKeys<T extends object>(before: T, after: Partial<T>): string[] {
    return (Object.keys(after) as (keyof T)[])
      .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      .map((key) => snake(String(key)));
  }

  function findPortfolio(id: string): Portfolio {
    const portfolio = db().portfolios.find((p) => p.id === id);
    if (!portfolio) throw new DomainError('not_found', 'Carteira não encontrada.');
    return portfolio;
  }

  function requireUsablePortfolio(id: string): Portfolio {
    const portfolio = db().portfolios.find((p) => p.id === id && !p.archivedAt);
    if (!portfolio) throw new DomainError('invalid_reference', 'Escolha uma carteira válida.');
    return portfolio;
  }

  function findInstitution(id: string): Institution {
    const institution = db().institutions.find((i) => i.id === id);
    if (!institution) throw new DomainError('not_found', 'Instituição não encontrada.');
    return institution;
  }

  function requireUsableInstitution(id: string | null): void {
    if (id === null) return;
    const institution = db().institutions.find((i) => i.id === id && !i.archivedAt);
    if (!institution) throw new DomainError('invalid_reference', 'Escolha uma instituição válida.');
  }

  function findInvestment(id: string): Investment {
    const investment = db().investments.find((i) => i.id === id);
    if (!investment) throw new DomainError('not_found', 'Investimento não encontrado.');
    return investment;
  }

  function requireOpenInvestment(id: string): Investment {
    const investment = db().investments.find((i) => i.id === id);
    if (!investment) throw new DomainError('invalid_reference', 'Investimento não encontrado.');
    if (investment.status === 'closed' || investment.status === 'archived') {
      throw new DomainError(
        'invalid_state',
        'Este investimento está encerrado ou arquivado. Reabra-o para registar alterações.',
      );
    }
    return investment;
  }

  function checkValuationDate(investment: Investment, valuedOn: string) {
    if (valuedOn > today()) {
      throw new DomainError('invalid_state', 'A data da avaliação não pode ser futura.');
    }
    if (valuedOn < investment.startDate) {
      throw new DomainError('invalid_state', 'A data é anterior ao início do investimento.');
    }
    const duplicate = db().valuations.some(
      (v) => v.investmentId === investment.id && v.valuedOn === valuedOn && v.source === 'manual',
    );
    if (duplicate) {
      throw new DomainError(
        'conflict',
        'Já existe uma avaliação nesta data. Elimine-a na ficha do investimento para a substituir.',
      );
    }
  }

  function checkQuantityAvailable(
    investment: Investment,
    input: TransactionData,
    ignoreId?: string,
  ) {
    const isExit = input.type === 'redemption' || input.type === 'withdrawal';
    if (!isExit || input.quantity === null) return;
    const metrics = computeInvestmentMetrics({
      status: investment.status,
      transactions: db().transactions.filter(
        (t) => t.investmentId === investment.id && t.id !== ignoreId,
      ),
      latestValuation: null,
    });
    if (metrics.quantity !== null && dec(input.quantity).greaterThan(metrics.quantity)) {
      throw new DomainError(
        'invalid_state',
        `A quantidade é superior à posição atual (${formatQuantity(metrics.quantity)}).`,
      );
    }
  }

  function buildTransaction(
    input: TransactionData,
    investment: Investment,
    createdAt: string,
  ): Transaction {
    return {
      id: newId(),
      investmentId: investment.id,
      type: input.type,
      occurredOn: input.occurredOn,
      currency: investment.currency,
      amount: input.amount,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      feeAmount: input.feeAmount,
      taxAmount: input.taxAmount,
      capitalComponent: input.capitalComponent,
      isReinvested: input.isReinvested,
      adjustmentDirection: input.type === 'adjustment' ? input.adjustmentDirection : null,
      notes: input.notes,
      createdAt,
      updatedAt: createdAt,
    };
  }

  function investmentFields(input: InvestmentData) {
    return {
      portfolioId: input.portfolioId,
      institutionId: input.institutionId,
      name: input.name,
      type: input.type,
      symbol: input.symbol,
      isin: input.isin,
      currency: input.currency,
      startDate: input.startDate,
      maturityDate: input.maturityDate,
      details: input.details,
      tags: input.tags,
      customFields: input.customFields,
      notes: input.notes,
    };
  }

  const repository: UserRepository = {
    userId,

    async getProfile() {
      return clone(db().profile);
    },

    async updateProfile(input) {
      const profile = db().profile;
      const changed = changedKeys(profile, input);
      Object.assign(profile, input, { updatedAt: now() });
      if (changed.length) audit('profile', userId, 'update', changed);
      return clone(profile);
    },

    async completeOnboarding(input) {
      const data = db();
      const timestamp = now();
      let portfolio = data.portfolios.find((p) => p.isDefault && !p.archivedAt);
      if (!portfolio) {
        portfolio = {
          id: newId(),
          name: input.portfolioName,
          baseCurrency: data.profile.baseCurrency,
          isDefault: true,
          archivedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        data.portfolios.push(portfolio);
        audit('portfolio', portfolio.id, 'create');
      }
      Object.assign(data.profile, {
        displayName: input.displayName,
        timezone: input.timezone,
        onboardedAt: data.profile.onboardedAt ?? timestamp,
        updatedAt: timestamp,
      });
      audit('profile', userId, 'update', ['display_name', 'timezone', 'onboarded_at']);
      return { profile: clone(data.profile), portfolio: clone(portfolio) };
    },

    async listPortfolios(options) {
      return clone(
        db()
          .portfolios.filter((p) => options?.includeArchived || !p.archivedAt)
          .sort(
            (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name),
          ),
      );
    },

    async createPortfolio(input) {
      const data = db();
      const name = input.name.trim();
      if (
        data.portfolios.some((p) => !p.archivedAt && p.name.toLowerCase() === name.toLowerCase())
      ) {
        throw new DomainError('conflict', 'Já existe uma carteira com este nome.');
      }
      const timestamp = now();
      const portfolio: Portfolio = {
        id: newId(),
        name,
        baseCurrency: data.profile.baseCurrency,
        isDefault: !data.portfolios.some((p) => p.isDefault && !p.archivedAt),
        archivedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      data.portfolios.push(portfolio);
      audit('portfolio', portfolio.id, 'create');
      return clone(portfolio);
    },

    async updatePortfolio(id, input) {
      const portfolio = findPortfolio(id);
      const changed = changedKeys(portfolio, input);
      Object.assign(portfolio, { name: input.name.trim(), updatedAt: now() });
      if (changed.length) audit('portfolio', id, 'update', changed);
      return clone(portfolio);
    },

    async archivePortfolio(id) {
      const portfolio = findPortfolio(id);
      if (portfolio.isDefault) {
        throw new DomainError('invalid_state', 'A carteira principal não pode ser arquivada.');
      }
      const hasOpen = db().investments.some(
        (i) => i.portfolioId === id && i.status !== 'archived' && i.status !== 'closed',
      );
      if (hasOpen) {
        throw new DomainError(
          'invalid_state',
          'Esta carteira tem investimentos ativos. Mova-os ou encerre-os primeiro.',
        );
      }
      portfolio.archivedAt = now();
      portfolio.updatedAt = portfolio.archivedAt;
      audit('portfolio', id, 'archive');
    },

    async listInstitutions(options) {
      return clone(
        db()
          .institutions.filter((i) => options?.includeArchived || !i.archivedAt)
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    },

    async createInstitution(input: InstitutionData) {
      const timestamp = now();
      const institution: Institution = {
        id: newId(),
        name: input.name.trim(),
        kind: input.kind,
        countryCode: null,
        notes: input.notes,
        archivedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db().institutions.push(institution);
      audit('institution', institution.id, 'create');
      return clone(institution);
    },

    async updateInstitution(id, input) {
      const institution = findInstitution(id);
      const changed = changedKeys(institution, input);
      Object.assign(institution, input, { updatedAt: now() });
      if (changed.length) audit('institution', id, 'update', changed);
      return clone(institution);
    },

    async archiveInstitution(id) {
      const institution = findInstitution(id);
      institution.archivedAt = now();
      institution.updatedAt = institution.archivedAt;
      audit('institution', id, 'archive');
    },

    async listInvestments(options) {
      return clone(
        db().investments.filter(
          (i) =>
            (options?.includeArchived || i.status !== 'archived') &&
            (!options?.portfolioId || i.portfolioId === options.portfolioId),
        ),
      );
    },

    async getInvestment(id) {
      const investment = db().investments.find((i) => i.id === id);
      return investment ? clone(investment) : null;
    },

    async createInvestment(input: NewInvestment) {
      // 1. Validar tudo antes de alterar (atomicidade).
      requireUsablePortfolio(input.portfolioId);
      if (!input.newInstitution) requireUsableInstitution(input.institutionId);
      if (input.initialValuation && input.initialValuation.valuedOn > today()) {
        throw new DomainError('invalid_state', 'A data do valor atual não pode ser futura.');
      }
      if (input.initialValuation && input.initialValuation.valuedOn < input.startDate) {
        throw new DomainError(
          'invalid_state',
          'A data do valor atual é anterior ao início do investimento.',
        );
      }

      const timestamp = now();
      const institution: Institution | null = input.newInstitution
        ? {
            id: newId(),
            name: input.newInstitution.name.trim(),
            kind: input.newInstitution.kind,
            countryCode: null,
            notes: input.newInstitution.notes,
            archivedAt: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          }
        : null;
      const investment: Investment = {
        id: newId(),
        ...investmentFields(input),
        institutionId: institution ? institution.id : input.institutionId,
        status: 'active',
        closedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const reminder: Reminder | null = input.reminder
        ? {
            id: newId(),
            investmentId: investment.id,
            title: input.reminder.title.trim(),
            dueOn: input.reminder.dueOn,
            status: 'pending',
            completedAt: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          }
        : null;
      const initial = buildTransaction(
        {
          investmentId: investment.id,
          type: 'initial',
          occurredOn: input.initialTransaction.occurredOn,
          amount: input.initialTransaction.amount,
          quantity: input.initialTransaction.quantity,
          unitPrice: input.initialTransaction.unitPrice,
          feeAmount: input.initialTransaction.feeAmount,
          taxAmount: '0' as Transaction['taxAmount'],
          capitalComponent: null,
          isReinvested: false,
          adjustmentDirection: null,
          notes: null,
        },
        investment,
        timestamp,
      );
      const valuation: Valuation | null = input.initialValuation
        ? {
            id: newId(),
            investmentId: investment.id,
            valuedOn: input.initialValuation.valuedOn,
            currency: investment.currency,
            quantity: input.initialValuation.quantity,
            unitPrice: input.initialValuation.unitPrice,
            totalValue: input.initialValuation.totalValue,
            source: 'manual',
            notes: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          }
        : null;

      // 2. Aplicar.
      const data = db();
      if (institution) {
        data.institutions.push(institution);
        audit('institution', institution.id, 'create');
      }
      data.investments.push(investment);
      data.transactions.push(initial);
      audit('investment', investment.id, 'create');
      audit('transaction', initial.id, 'create');
      if (valuation) {
        data.valuations.push(valuation);
        audit('valuation', valuation.id, 'create');
      }
      if (reminder) {
        data.reminders.push(reminder);
        audit('reminder', reminder.id, 'create');
      }
      return clone(investment);
    },

    async closeInvestment(id, input) {
      const investment = requireOpenInvestment(id);
      if (input.closedOn > today()) {
        throw new DomainError('invalid_state', 'A data de encerramento não pode ser futura.');
      }
      if (input.closedOn < investment.startDate) {
        throw new DomainError('invalid_state', 'A data é anterior ao início do investimento.');
      }
      let transaction: Transaction | null = null;
      if (input.finalTransaction) {
        const data: TransactionData = {
          ...input.finalTransaction,
          investmentId: id,
          occurredOn: input.closedOn,
        };
        if (data.type !== 'redemption' && data.type !== 'withdrawal') {
          throw new DomainError(
            'invalid_state',
            'O movimento final tem de ser uma venda ou resgate.',
          );
        }
        checkQuantityAvailable(investment, data);
        transaction = buildTransaction(data, investment, now());
      }
      const timestamp = now();
      if (transaction) {
        db().transactions.push(transaction);
        audit('transaction', transaction.id, 'create');
      }
      investment.status = 'closed';
      investment.closedAt = `${input.closedOn}T12:00:00.000Z`;
      investment.updatedAt = timestamp;
      audit('investment', id, 'close', ['status', 'closed_at']);
      return clone(investment);
    },

    async updateInvestment(id, input) {
      const investment = findInvestment(id);
      if (input.type !== investment.type) {
        throw new DomainError('invalid_state', 'Não é possível mudar o tipo de um investimento.');
      }
      requireUsablePortfolio(input.portfolioId);
      if (input.institutionId !== investment.institutionId) {
        requireUsableInstitution(input.institutionId);
      }
      const fields = investmentFields(input);
      const changed = changedKeys(investment, fields);
      Object.assign(investment, fields, { updatedAt: now() });
      if (changed.length) audit('investment', id, 'update', changed);
      return clone(investment);
    },

    async setInvestmentStatus(id, status: InvestmentStatus) {
      const investment = findInvestment(id);
      const previous = investment.status;
      if (previous === status) return clone(investment);
      const timestamp = now();
      investment.status = status;
      // Arquivar preserva a data de encerramento (para desarquivar como "encerrado").
      if (status === 'closed') investment.closedAt ??= timestamp;
      else if (status !== 'archived') investment.closedAt = null;
      investment.updatedAt = timestamp;
      const action: AuditAction =
        status === 'closed'
          ? 'close'
          : status === 'archived'
            ? 'archive'
            : previous === 'closed' || previous === 'archived'
              ? 'reopen'
              : 'status';
      audit('investment', id, action, ['status']);
      return clone(investment);
    },

    async deleteInvestment(id) {
      findInvestment(id);
      const data = db();
      data.investments = data.investments.filter((i) => i.id !== id);
      data.transactions = data.transactions.filter((t) => t.investmentId !== id);
      data.valuations = data.valuations.filter((v) => v.investmentId !== id);
      data.reminders = data.reminders.filter((r) => r.investmentId !== id);
      audit('investment', id, 'delete');
    },

    async listTransactions(options) {
      return clone(
        db().transactions.filter(
          (t) => !options?.investmentId || t.investmentId === options.investmentId,
        ),
      );
    },

    async createTransaction(input) {
      const investment = requireOpenInvestment(input.investmentId);
      checkQuantityAvailable(investment, input);
      const transaction = buildTransaction(input, investment, now());
      db().transactions.push(transaction);
      audit('transaction', transaction.id, 'create');
      return clone(transaction);
    },

    async updateTransaction(id, input) {
      const transaction = db().transactions.find((t) => t.id === id);
      if (!transaction) throw new DomainError('not_found', 'Movimento não encontrado.');
      if (input.investmentId !== transaction.investmentId) {
        throw new DomainError('invalid_state', 'Um movimento não pode mudar de investimento.');
      }
      const investment = requireOpenInvestment(transaction.investmentId);
      checkQuantityAvailable(investment, input, id);
      const {
        id: _id,
        createdAt,
        ...next
      } = buildTransaction(input, investment, transaction.createdAt);
      const changed = changedKeys(transaction, next);
      Object.assign(transaction, next, { createdAt, updatedAt: now() });
      if (changed.length) audit('transaction', id, 'update', changed);
      return clone(transaction);
    },

    async deleteTransaction(id) {
      const data = db();
      const transaction = data.transactions.find((t) => t.id === id);
      if (!transaction) throw new DomainError('not_found', 'Movimento não encontrado.');
      requireOpenInvestment(transaction.investmentId);
      data.transactions = data.transactions.filter((t) => t.id !== id);
      audit('transaction', id, 'delete');
    },

    async listValuations(options) {
      return clone(
        db().valuations.filter(
          (v) => !options?.investmentId || v.investmentId === options.investmentId,
        ),
      );
    },

    async createValuation(input: ValuationData) {
      const investment = requireOpenInvestment(input.investmentId);
      checkValuationDate(investment, input.valuedOn);
      const timestamp = now();
      const valuation: Valuation = {
        id: newId(),
        investmentId: investment.id,
        valuedOn: input.valuedOn,
        currency: investment.currency,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        totalValue: input.totalValue,
        source: 'manual',
        notes: input.notes,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db().valuations.push(valuation);
      audit('valuation', valuation.id, 'create');
      return clone(valuation);
    },

    async deleteValuation(id) {
      const data = db();
      const valuation = data.valuations.find((v) => v.id === id);
      if (!valuation) throw new DomainError('not_found', 'Avaliação não encontrada.');
      requireOpenInvestment(valuation.investmentId);
      data.valuations = data.valuations.filter((v) => v.id !== id);
      audit('valuation', id, 'delete');
    },

    async listReminders(options) {
      return clone(
        db().reminders.filter(
          (r) =>
            (!options?.investmentId || r.investmentId === options.investmentId) &&
            (!options?.statuses || options.statuses.includes(r.status)),
        ),
      );
    },

    async createReminder(input) {
      if (input.investmentId) findInvestment(input.investmentId);
      const timestamp = now();
      const reminder: Reminder = {
        id: newId(),
        investmentId: input.investmentId,
        title: input.title.trim(),
        dueOn: input.dueOn,
        status: 'pending',
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db().reminders.push(reminder);
      audit('reminder', reminder.id, 'create');
      return clone(reminder);
    },

    async setReminderStatus(id, status, dueOn) {
      const reminder = db().reminders.find((r) => r.id === id);
      if (!reminder) throw new DomainError('not_found', 'Lembrete não encontrado.');
      const timestamp = now();
      reminder.status = status;
      reminder.completedAt = status === 'done' ? timestamp : null;
      if (dueOn) reminder.dueOn = dueOn;
      reminder.updatedAt = timestamp;
      audit('reminder', id, 'status', dueOn ? ['status', 'due_on'] : ['status']);
      return clone(reminder);
    },

    async listAuditEvents() {
      return clone([...db().audit].reverse());
    },

    async deleteAccount() {
      db();
      deleteMockUser(userId);
    },
  };

  return repository;
}
