import { type Page, test } from '@playwright/test';

/**
 * Capturas para revisão visual (npm run screens). Gravadas em docs/marcos/capturas.
 * Não são testes de regressão: servem para rever o design em 360, 768 e 1280 px.
 */
const OUT = 'docs/marcos/capturas';
const sizes = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
] as const;

async function enterDemo(page: Page) {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
  await page.waitForURL('**/app');
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

test('painel em três larguras', async ({ page }) => {
  test.setTimeout(180_000);
  await enterDemo(page);
  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('/app');
    await settle(page);
    await page.screenshot({ path: `${OUT}/painel-${size.name}.png`, fullPage: true });
  }
});

test('painel a 360px por secções (revisão de detalhe)', async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemo(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/app');
  await settle(page);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0, part = 1; y < height; y += 760, part++) {
    await page.screenshot({
      path: `test-results/partes/painel-360-${part}.png`,
      fullPage: true,
      clip: { x: 0, y, width: 360, height: Math.min(800, height - y) },
    });
  }
});

test('atualizar valor (diálogo)', async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemo(page);
  for (const size of [sizes[0], sizes[2]]) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('/app');
    await settle(page);
    await page.getByRole('button', { name: 'Atualizar valor' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const unitPrice = dialog.getByLabel('Preço unitário');
    if (await unitPrice.count()) await unitPrice.fill('1 061,40');
    else await dialog.getByLabel('Valor total atual').fill('1 520 000');
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT}/atualizar-valor-${size.name}.png` });
    await page.keyboard.press('Escape');
  }
});

test('definição de métrica e páginas de entrada', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await settle(page);
  await page.screenshot({ path: `${OUT}/landing-1280.png` });
  await enterDemo(page);
  await settle(page);
  await page.getByRole('button', { name: 'O que é: Resultado indicativo' }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/definicao-metrica-1280.png` });
});

test('painel vazio (no fim: repõe os dados de exemplo)', async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemo(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Começar com carteira vazia' }).click();
  await page.waitForURL('**/app');
  await settle(page);
  await page.screenshot({ path: `${OUT}/painel-vazio-1280.png` });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  await settle(page);
  await page.screenshot({ path: `${OUT}/painel-vazio-360.png` });
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
  await page.waitForURL('**/app');
});
