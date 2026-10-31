import 'server-only';
import type { UserRepository } from '@/lib/data/repository';
import { toCsv } from '@/lib/formatters/csv';

/**
 * Exportação dos dados do utilizador (PLANO_MVP §4 e §20: "inclui todos os dados funcionais").
 * - JSON: tudo, numa estrutura versionada.
 * - CSV: uma tabela por entidade, UTF-8 com BOM (abre bem no Excel), vírgula como separador,
 *   ponto decimal e datas ISO — formato estável para reimportar ou analisar.
 */
export const EXPORT_VERSION = 1;

export const CSV_ENTITIES = [
  'investimentos',
  'movimentos',
  'avaliacoes',
  'lembretes',
  'carteiras',
  'instituicoes',
] as const;
export type CsvEntity = (typeof CSV_ENTITIES)[number];

export async function buildJsonExport(repo: UserRepository) {
  const [
    profile,
    portfolios,
    institutions,
    investments,
    transactions,
    valuations,
    reminders,
    audit,
  ] = await Promise.all([
    repo.getProfile(),
    repo.listPortfolios({ includeArchived: true }),
    repo.listInstitutions({ includeArchived: true }),
    repo.listInvestments({ includeArchived: true }),
    repo.listTransactions(),
    repo.listValuations(),
    repo.listReminders(),
    repo.listAuditEvents(),
  ]);
  return {
    formato: 'investnote-export',
    versao: EXPORT_VERSION,
    exportadoEm: new Date().toISOString(),
    nota: 'Valores monetários em texto decimal (ponto decimal), na moeda de cada registo.',
    perfil: profile,
    carteiras: portfolios,
    instituicoes: institutions,
    investimentos: investments,
    movimentos: transactions,
    avaliacoes: valuations,
    lembretes: reminders,
    auditoria: audit,
  };
}

export async function buildCsvExport(repo: UserRepository, entity: CsvEntity): Promise<string> {
  switch (entity) {
    case 'investimentos': {
      const items = await repo.listInvestments({ includeArchived: true });
      return toCsv(
        [
          'id',
          'nome',
          'tipo',
          'estado',
          'carteira_id',
          'instituicao_id',
          'moeda',
          'simbolo',
          'isin',
          'data_inicio',
          'data_vencimento',
          'encerrado_em',
          'etiquetas',
          'detalhes_json',
          'campos_personalizados_json',
          'notas',
        ],
        items.map((i) => [
          i.id,
          i.name,
          i.type,
          i.status,
          i.portfolioId,
          i.institutionId,
          i.currency,
          i.symbol,
          i.isin,
          i.startDate,
          i.maturityDate,
          i.closedAt,
          i.tags.join('; '),
          JSON.stringify(i.details),
          JSON.stringify(i.customFields),
          i.notes,
        ]),
      );
    }
    case 'movimentos': {
      const items = await repo.listTransactions();
      return toCsv(
        [
          'id',
          'investimento_id',
          'tipo',
          'data',
          'moeda',
          'valor',
          'quantidade',
          'preco_unitario',
          'comissao',
          'imposto',
          'componente_capital',
          'reinvestido',
          'direcao_ajuste',
          'notas',
        ],
        items.map((t) => [
          t.id,
          t.investmentId,
          t.type,
          t.occurredOn,
          t.currency,
          t.amount,
          t.quantity,
          t.unitPrice,
          t.feeAmount,
          t.taxAmount,
          t.capitalComponent,
          t.isReinvested,
          t.adjustmentDirection,
          t.notes,
        ]),
      );
    }
    case 'avaliacoes': {
      const items = await repo.listValuations();
      return toCsv(
        [
          'id',
          'investimento_id',
          'data',
          'moeda',
          'valor_total',
          'quantidade',
          'preco_unitario',
          'fonte',
          'notas',
        ],
        items.map((v) => [
          v.id,
          v.investmentId,
          v.valuedOn,
          v.currency,
          v.totalValue,
          v.quantity,
          v.unitPrice,
          v.source,
          v.notes,
        ]),
      );
    }
    case 'lembretes': {
      const items = await repo.listReminders();
      return toCsv(
        ['id', 'investimento_id', 'titulo', 'data', 'estado', 'concluido_em'],
        items.map((r) => [r.id, r.investmentId, r.title, r.dueOn, r.status, r.completedAt]),
      );
    }
    case 'carteiras': {
      const items = await repo.listPortfolios({ includeArchived: true });
      return toCsv(
        ['id', 'nome', 'moeda_base', 'principal', 'arquivada_em'],
        items.map((p) => [p.id, p.name, p.baseCurrency, p.isDefault, p.archivedAt]),
      );
    }
    case 'instituicoes': {
      const items = await repo.listInstitutions({ includeArchived: true });
      return toCsv(
        ['id', 'nome', 'tipo', 'pais', 'notas', 'arquivada_em'],
        items.map((i) => [i.id, i.name, i.kind, i.countryCode, i.notes, i.archivedAt]),
      );
    }
  }
}
