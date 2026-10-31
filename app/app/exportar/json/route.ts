import { getRepository } from '@/lib/data';
import { buildJsonExport } from '@/lib/services/export';

/** Descarrega todos os dados do utilizador em JSON. Só para a sessão autenticada. */
export async function GET() {
  const repo = await getRepository();
  const data = await buildJsonExport(repo);
  const date = data.exportadoEm.slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="investnote-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
