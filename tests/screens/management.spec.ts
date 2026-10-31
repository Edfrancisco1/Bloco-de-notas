import { type Page, test } from '@playwright/test';

/** Capturas da Etapa 5: prazos, carteiras, instituições, exportar, definições. */
const OUT = 'docs/marcos/capturas';

async function enterDemoWithSample(page: Page) {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
  await page.waitForURL('**/app');
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
  await page.waitForURL('**/app');
}

const PAGES = [
  ['prazos', '/app/calendario'],
  ['carteiras', '/app/carteiras'],
  ['instituicoes', '/app/instituicoes'],
  ['exportar', '/app/exportar'],
  ['definicoes', '/app/definicoes'],
] as const;

test('páginas de gestão em desktop e 360px', async ({ page }) => {
  test.setTimeout(180_000);
  await enterDemoWithSample(page);
  for (const [name, path] of PAGES) {
    for (const [size, width, height] of [
      ['1280', 1280, 900],
      ['360', 360, 800],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${OUT}/${name}-${size}.png`, fullPage: true });
    }
  }
});
