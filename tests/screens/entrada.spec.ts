import { test } from '@playwright/test';

/** Capturas da Etapa 6: landing, entrar, criar conta e onboarding. */
const OUT = 'docs/marcos/capturas';
const SIZES = [
  ['1280', 1280, 900],
  ['360', 360, 800],
] as const;

test('landing e autenticação', async ({ page }) => {
  test.setTimeout(120_000);
  for (const [size, width, height] of SIZES) {
    await page.setViewportSize({ width, height });
    for (const [name, path] of [
      ['landing', '/'],
      ['entrar', '/entrar'],
      ['criar-conta', '/criar-conta'],
    ] as const) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${OUT}/${name}-${size}.png`, fullPage: true });
    }
  }
});

test('onboarding com conta nova', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/criar-conta');
  await page.getByLabel('E-mail').fill(`capturas-${Date.now()}@teste.example`);
  await page.getByLabel('Palavra-passe', { exact: true }).fill('uma frase longa e segura');
  await page.getByLabel(/Li e aceito os/).check();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL('**/boas-vindas');
  await page.getByLabel('Como o devemos tratar?').fill('Kiala');
  await page.screenshot({ path: `${OUT}/boas-vindas-1-1280.png`, fullPage: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('heading', { name: /Que investimento/ }).waitFor();
  await page.screenshot({ path: `${OUT}/boas-vindas-2-1280.png`, fullPage: true });
});
