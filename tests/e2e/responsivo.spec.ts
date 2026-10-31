import { expect, type Page, test } from '@playwright/test';

/**
 * PLANO_MVP §20: "o fluxo principal funciona em 360 px". Nenhuma página pode ter scroll
 * horizontal a 360 px. Em caso de falha, lista os elementos que transbordam.
 */
const PUBLIC = ['/', '/entrar', '/criar-conta', '/recuperar-password', '/privacidade', '/termos'];
const APP = [
  '/app',
  '/app/investimentos',
  '/app/investimentos/novo',
  '/app/investimentos/novo?tipo=crypto',
  '/app/investimentos/bitcoin',
  '/app/investimentos/dp-12-meses',
  '/app/investimentos/ot-2029/editar',
  '/app/calendario',
  '/app/carteiras',
  '/app/instituicoes',
  '/app/exportar',
  '/app/definicoes',
];

test.skip(({ viewport }) => (viewport?.width ?? 0) > 400, 'Só a 360 px.');

async function overflowing(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      const rect = el.getBoundingClientRect();
      if (rect.right > width + 1 && rect.width > 0) {
        const style = getComputedStyle(el);
        if (style.position === 'fixed') continue;
        offenders.push(
          `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} → ${Math.round(rect.right)}px`,
        );
      }
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      width,
      offenders: offenders.slice(0, 8),
    };
  });
}

for (const route of PUBLIC) {
  test(`sem scroll horizontal a 360px: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const result = await overflowing(page);
    expect(result.offenders, `scrollWidth ${result.scrollWidth}`).toEqual([]);
  });
}

test.describe('área autenticada', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
    await page.waitForURL('**/app');
    await page.goto('/app/definicoes');
    await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
    await page.waitForURL('**/app');
  });

  for (const route of APP) {
    test(`sem scroll horizontal a 360px: ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const result = await overflowing(page);
      expect(result.offenders, `scrollWidth ${result.scrollWidth}`).toEqual([]);
    });
  }
});
