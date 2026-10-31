import { todayIn } from '@/lib/calculations/dates';
import { MARKET } from '@/lib/domain/market';
import type {
  AuditEvent,
  Institution,
  Investment,
  Portfolio,
  Profile,
  Reminder,
  Transaction,
  Valuation,
} from '@/lib/domain/types';
import { DEMO_EMAIL, DEMO_USER_ID, buildDemoData, buildEmptyData } from './fixtures';

/**
 * Base de dados em memória para o modo demonstração. Vive em `globalThis` para sobreviver ao
 * hot reload do servidor de desenvolvimento. Perde-se ao reiniciar o servidor (é esperado).
 */
export interface UserData {
  profile: Profile;
  portfolios: Portfolio[];
  institutions: Institution[];
  investments: Investment[];
  transactions: Transaction[];
  valuations: Valuation[];
  reminders: Reminder[];
  audit: AuditEvent[];
}

export interface MockAccount {
  userId: string;
  email: string;
  /** Hash scrypt com sal (lib/auth/mock-auth.ts) — nunca a palavra-passe em claro. */
  passwordHash: string;
}

interface MockDb {
  users: Map<string, UserData>;
  accounts: Map<string, MockAccount>;
}

const globalStore = globalThis as typeof globalThis & { __investnoteMockDb?: MockDb };

function createDb(): MockDb {
  return { users: new Map(), accounts: new Map() };
}

export function getMockDb(): MockDb {
  globalStore.__investnoteMockDb ??= createDb();
  return globalStore.__investnoteMockDb;
}

/** Dados do utilizador. A conta de demonstração é criada (com dados) na primeira utilização. */
export function getUserData(userId: string): UserData | null {
  const db = getMockDb();
  let data = db.users.get(userId);
  if (!data && userId === DEMO_USER_ID) {
    data = buildDemoData(todayIn(MARKET.timezone));
    db.users.set(userId, data);
  }
  return data ?? null;
}

/**
 * Repõe a conta de demonstração: `sample` com a carteira de exemplo; `empty` com o perfil e a
 * carteira principal, mas sem investimentos (para ver o painel vazio).
 */
export function resetDemoData(mode: 'sample' | 'empty'): void {
  const db = getMockDb();
  const sample = buildDemoData(todayIn(MARKET.timezone));
  if (mode === 'sample') {
    db.users.set(DEMO_USER_ID, sample);
    return;
  }
  const empty = buildEmptyData(DEMO_USER_ID, DEMO_EMAIL, new Date().toISOString());
  empty.profile = { ...sample.profile };
  empty.portfolios = sample.portfolios.filter((p) => p.isDefault);
  db.users.set(DEMO_USER_ID, empty);
}

export function createMockAccount(email: string, passwordHash: string): MockAccount {
  const db = getMockDb();
  const userId = `conta-${crypto.randomUUID()}`;
  const account = { userId, email: email.toLowerCase(), passwordHash };
  db.accounts.set(account.email, account);
  db.users.set(userId, buildEmptyData(userId, account.email, new Date().toISOString()));
  return account;
}

export function findMockAccount(email: string): MockAccount | null {
  return getMockDb().accounts.get(email.toLowerCase()) ?? null;
}

export function deleteMockUser(userId: string): void {
  const db = getMockDb();
  db.users.delete(userId);
  for (const [email, account] of db.accounts) {
    if (account.userId === userId) db.accounts.delete(email);
  }
}

/** Só para testes: começa do zero. */
export function __resetMockDbForTests(): void {
  globalStore.__investnoteMockDb = createDb();
}
