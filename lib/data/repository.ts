import type {
  AdjustmentDirection,
  AuditEvent,
  CustomField,
  DecimalString,
  Institution,
  InstitutionKind,
  Investment,
  InvestmentDetails,
  InvestmentStatus,
  InvestmentType,
  IsoDate,
  Portfolio,
  Profile,
  Reminder,
  ReminderStatus,
  Transaction,
  TransactionType,
  Valuation,
} from '@/lib/domain/types';

/**
 * Contrato de acesso a dados de UM utilizador (contratos lógicos do PLANO_MVP §13).
 *
 * Hoje é implementado pelo mock em memória; depois, pelo Supabase. Os ecrãs e os services só
 * conhecem esta interface. Garantias que qualquer implementação tem de dar (testadas em
 * tests/contract):
 * - só devolve e altera dados do próprio utilizador;
 * - referências (carteira, instituição, investimento) têm de pertencer ao mesmo utilizador;
 * - criar um investimento com movimento inicial e avaliação é atómico;
 * - nada é sobrescrito: movimentos e avaliações acumulam histórico;
 * - alterações relevantes ficam no registo de auditoria (só nomes de campos, nunca valores).
 */
export interface UserRepository {
  readonly userId: string;

  getProfile(): Promise<Profile>;
  updateProfile(input: ProfileUpdate): Promise<Profile>;
  /** Grava nome/fuso e cria a carteira por defeito, numa só operação. */
  completeOnboarding(input: OnboardingData): Promise<{ profile: Profile; portfolio: Portfolio }>;

  listPortfolios(options?: { includeArchived?: boolean }): Promise<Portfolio[]>;
  createPortfolio(input: { name: string }): Promise<Portfolio>;
  updatePortfolio(id: string, input: { name: string }): Promise<Portfolio>;
  archivePortfolio(id: string): Promise<void>;

  listInstitutions(options?: { includeArchived?: boolean }): Promise<Institution[]>;
  createInstitution(input: InstitutionData): Promise<Institution>;
  updateInstitution(id: string, input: InstitutionData): Promise<Institution>;
  archiveInstitution(id: string): Promise<void>;

  listInvestments(options?: {
    portfolioId?: string;
    includeArchived?: boolean;
  }): Promise<Investment[]>;
  getInvestment(id: string): Promise<Investment | null>;
  createInvestment(input: NewInvestment): Promise<Investment>;
  updateInvestment(id: string, input: InvestmentData): Promise<Investment>;
  /**
   * Encerra (PLANO_MVP §8, jornada E): regista o movimento final, se houver, e marca como
   * encerrado, numa só operação. O histórico e as métricas ficam preservados.
   */
  closeInvestment(id: string, input: CloseInvestmentData): Promise<Investment>;
  /** Reabrir, arquivar, desarquivar ou marcar como vencido. Arquivar preserva a data de encerramento. */
  setInvestmentStatus(id: string, status: InvestmentStatus): Promise<Investment>;
  deleteInvestment(id: string): Promise<void>;

  listTransactions(options?: { investmentId?: string }): Promise<Transaction[]>;
  createTransaction(input: TransactionData): Promise<Transaction>;
  updateTransaction(id: string, input: TransactionData): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  listValuations(options?: { investmentId?: string }): Promise<Valuation[]>;
  createValuation(input: ValuationData): Promise<Valuation>;
  deleteValuation(id: string): Promise<void>;

  listReminders(options?: {
    investmentId?: string;
    statuses?: ReminderStatus[];
  }): Promise<Reminder[]>;
  createReminder(input: ReminderData): Promise<Reminder>;
  setReminderStatus(id: string, status: ReminderStatus, dueOn?: IsoDate): Promise<Reminder>;

  listAuditEvents(): Promise<AuditEvent[]>;
  deleteAccount(): Promise<void>;
}

export interface ProfileUpdate {
  displayName: string;
  timezone: string;
}

export interface OnboardingData extends ProfileUpdate {
  portfolioName: string;
}

export interface InstitutionData {
  name: string;
  kind: InstitutionKind;
  notes: string | null;
}

export interface InvestmentData {
  portfolioId: string;
  institutionId: string | null;
  name: string;
  type: InvestmentType;
  symbol: string | null;
  isin: string | null;
  currency: string;
  startDate: IsoDate;
  maturityDate: IsoDate | null;
  details: InvestmentDetails;
  tags: string[];
  customFields: CustomField[];
  notes: string | null;
}

export interface NewInvestment extends InvestmentData {
  initialTransaction: {
    occurredOn: IsoDate;
    amount: DecimalString;
    quantity: DecimalString | null;
    unitPrice: DecimalString | null;
    feeAmount: DecimalString;
  };
  initialValuation: {
    valuedOn: IsoDate;
    totalValue: DecimalString;
    quantity: DecimalString | null;
    unitPrice: DecimalString | null;
  } | null;
  /** Instituição criada no mesmo passo (substitui `institutionId`). */
  newInstitution?: InstitutionData | null;
  /** Lembrete sugerido (ex.: antes do vencimento), criado no mesmo passo. */
  reminder?: { title: string; dueOn: IsoDate } | null;
}

export interface CloseInvestmentData {
  /** Data de encerramento (também a do movimento final). */
  closedOn: IsoDate;
  /** Venda/resgate final; `null` se já estiver registado. */
  finalTransaction: Omit<TransactionData, 'investmentId' | 'occurredOn'> | null;
}

export interface TransactionData {
  investmentId: string;
  type: TransactionType;
  occurredOn: IsoDate;
  amount: DecimalString;
  quantity: DecimalString | null;
  unitPrice: DecimalString | null;
  feeAmount: DecimalString;
  taxAmount: DecimalString;
  capitalComponent: DecimalString | null;
  isReinvested: boolean;
  adjustmentDirection: AdjustmentDirection | null;
  notes: string | null;
}

export interface ValuationData {
  investmentId: string;
  valuedOn: IsoDate;
  totalValue: DecimalString;
  quantity: DecimalString | null;
  unitPrice: DecimalString | null;
  notes: string | null;
}

export interface ReminderData {
  investmentId: string | null;
  title: string;
  dueOn: IsoDate;
}
