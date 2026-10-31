import { expect, test } from '@playwright/test';

/** PLANO_MVP §14/§20: o fluxo principal funciona só com o teclado. */
test.skip(({ isMobile }) => Boolean(isMobile), 'Teclado físico: só no desktop.');

test.beforeEach(async ({ page }) => {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
  await page.waitForURL('**/app');
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
  await page.waitForURL('**/app');
});

test('saltar para o conteúdo e abrir/fechar "Atualizar valor" com o teclado', async ({ page }) => {
  await page.goto('/app');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Saltar para o conteúdo' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#conteudo')).toBeFocused();

  const update = page.getByRole('button', { name: 'Atualizar valor' }).first();
  await update.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Atualizar valor' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Valor total atual')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(update).toBeFocused();
});

test('registar um investimento só com o teclado', async ({ page }) => {
  await page.goto('/app/investimentos/novo');
  // Escolher o tipo com as setas (grupo de rádio nativo) e avançar.
  await page.getByRole('radio', { name: /Depósito a prazo/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /Obrigação/ })).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: /Depósito a prazo/ })).toBeChecked();
  await page.getByRole('button', { name: 'Continuar' }).focus();
  await page.keyboard.press('Enter');

  // O nome recebe o foco; os restantes campos seguem por Tab.
  await expect(page.getByLabel('Nome', { exact: true })).toBeFocused();
  await page.keyboard.type('Depósito por teclado');
  await page.getByLabel('Capital aplicado').focus();
  await page.keyboard.type('750000');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Taxa anual nominal')).toBeFocused();
  await page.keyboard.type('11');
  const start = await page.getByLabel('Data de início').inputValue();
  const [y, m, d] = start.split('-');
  await page.getByLabel('Data de vencimento').fill(`${Number(y) + 1}-${m}-${d}`);
  await page.getByRole('button', { name: 'Continuar' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Detalhes' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Guardar investimento' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/\?novo=1/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Depósito por teclado');
});
