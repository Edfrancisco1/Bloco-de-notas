import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Verificação automática WCAG (2.0/2.1/2.2 A e AA) nas páginas principais. */
const ROUTES = [
  '/',
  '/entrar',
  '/criar-conta',
  '/recuperar-password',
  '/recuperar-password/nova',
  '/privacidade',
  '/termos',
  '/app',
  '/app/investimentos',
  '/app/investimentos/novo',
  '/app/investimentos/novo?tipo=term_deposit',
  '/app/investimentos/bitcoin',
  '/app/investimentos/dp-12-meses',
  '/app/investimentos/dp-12-meses/editar',
  '/app/calendario',
  '/app/calendario?concluidos=1',
  '/app/carteiras',
  '/app/instituicoes',
  '/app/exportar',
  '/app/definicoes',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
  await page.waitForURL('**/app');
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
  await page.waitForURL('**/app');
});

for (const route of ROUTES) {
  test(`sem violações graves: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(' ')}`);
    expect(serious).toEqual([]);
  });
}
