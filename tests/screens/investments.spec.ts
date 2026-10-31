import { type Page, test } from '@playwright/test';

/** Capturas da Etapa 4 (investimentos): lista, novo investimento, ficha. */
const OUT = 'docs/marcos/capturas';

async function enterDemoWithSample(page: Page) {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
  await page.waitForURL('**/app');
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
  await page.waitForURL('**/app');
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

test('lista de investimentos', async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemoWithSample(page);
  for (const [name, width, height] of [
    ['1280', 1280, 900],
    ['360', 360, 800],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/app/investimentos');
    await settle(page);
    await page.screenshot({ path: `${OUT}/investimentos-${name}.png`, fullPage: true });
  }
});

test('novo investimento — passos', async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemoWithSample(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/app/investimentos/novo');
  await settle(page);
  await page.screenshot({ path: `${OUT}/novo-1-tipo.png`, fullPage: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Nome').fill('Depósito a prazo 1 ano');
  await page.getByLabel('Capital aplicado').fill('3 000 000');
  await page.getByLabel('Taxa anual nominal').fill('13,5');
  const start = await page.getByLabel('Data de início').inputValue();
  const [y, m, d] = start.split('-').map(Number);
  await page
    .getByLabel('Data de vencimento')
    .fill(`${(y ?? 2026) + 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  await page.screenshot({ path: `${OUT}/novo-2-essencial.png`, fullPage: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.screenshot({ path: `${OUT}/novo-3-detalhes.png`, fullPage: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await settle(page);
  await page.screenshot({ path: `${OUT}/novo-4-resumo.png`, fullPage: true });
});

test('ficha do investimento', async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemoWithSample(page);
  for (const [name, width, height] of [
    ['1280', 1280, 900],
    ['360', 360, 800],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/app/investimentos/bitcoin');
    await settle(page);
    await page.screenshot({ path: `${OUT}/ficha-bitcoin-${name}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/app/investimentos/dp-12-meses');
  await settle(page);
  await page.screenshot({ path: `${OUT}/ficha-deposito-1280.png`, fullPage: true });
  await page.goto('/app/investimentos/bitcoin');
  await settle(page);
  await page.getByRole('button', { name: 'Movimento' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tipo de movimento').selectOption('redemption');
  await dialog.getByLabel('Quantidade').fill('0,005');
  await dialog.getByLabel('Preço unitário').fill('97 000 000');
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/movimento-venda-1280.png` });
});
