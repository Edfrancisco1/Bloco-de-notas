import { getRepository } from '@/lib/data';
import { CSV_ENTITIES, type CsvEntity, buildCsvExport } from '@/lib/services/export';

/** Descarrega uma entidade em CSV (UTF-8 com BOM). Só para a sessão autenticada. */
export async function GET(_request: Request, ctx: RouteContext<'/app/exportar/csv/[entidade]'>) {
  const { entidade } = await ctx.params;
  if (!(CSV_ENTITIES as readonly string[]).includes(entidade)) {
    return new Response('Entidade desconhecida.', { status: 404 });
  }
  const repo = await getRepository();
  const csv = await buildCsvExport(repo, entidade as CsvEntity);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="investnote-${entidade}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
