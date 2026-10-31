import { readFile } from 'node:fs/promises';
import { expect, type Page, test } from '@playwright/test';

/** Fluxos da Etapa 5 em modo demonstração (dados de exemplo repostos em cada teste). */
async function enterDemoWithSample(page: Page) {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
  await page.waitForURL('**/app');
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
  await page.waitForURL('**/app');
}

test.beforeEach(async ({ page }) => {
  await enterDemoWithSample(page);
});

test('prazos: em atraso, novo lembrete e concluir', async ({ page }) => {
  await page.goto('/app/calendario');
  const overdue = page.getByRole('region', { name: 'Em atraso' });
  await expect(overdue).toContainText('Atualizar o valor do fundo imobiliário');

  await page.getByRole('button', { name: 'Novo lembrete' }).click();
  const dialog = page.getByRole('dialog', { name: 'Novo lembrete' });
  await dialog.getByLabel('O que lembrar').fill('Rever a carteira com a família');
  await dialog.getByRole('button', { name: 'Criar lembrete' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('main').getByText('Rever a carteira com a família')).toBeVisible();

  await page
    .getByRole('button', { name: 'Marcar como concluído: Atualizar o valor do fundo imobiliário' })
    .click();
  await expect(page.getByRole('region', { name: 'Em atraso' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Mostrar lembretes concluídos' }).click();
  await expect(page.getByRole('region', { name: 'Concluídos' })).toContainText(
    'Atualizar o valor do fundo imobiliário',
  );
});

test('carteiras: criar, renomear e arquivar', async ({ page }) => {
  await page.goto('/app/carteiras');
  await expect(
    page.getByRole('button', { name: 'Arquivar carteira: A minha carteira' }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'Nova carteira' }).click();
  let dialog = page.getByRole('dialog', { name: 'Nova carteira' });
  await dialog.getByLabel('Nome').fill('Estudos');
  await dialog.getByRole('button', { name: 'Criar carteira' }).click();
  await expect(page.getByRole('link', { name: 'Estudos' })).toBeVisible();

  await page.getByRole('button', { name: 'Editar carteira: Estudos' }).click();
  dialog = page.getByRole('dialog', { name: 'Renomear carteira' });
  await dialog.getByLabel('Nome').fill('Estudos dos filhos');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('link', { name: 'Estudos dos filhos' })).toBeVisible();

  await page.getByRole('button', { name: 'Arquivar carteira: Estudos dos filhos' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Arquivar' }).click();
  await expect(page.getByRole('link', { name: 'Estudos dos filhos' })).toHaveCount(0);
});

test('instituições: criar e editar', async ({ page }) => {
  await page.goto('/app/instituicoes');
  await page.getByRole('button', { name: 'Nova instituição' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nova instituição' });
  await dialog.getByLabel('Nome').fill('Corretora Kissama');
  await dialog.getByLabel('Tipo').selectOption('broker');
  await dialog.getByRole('button', { name: 'Criar instituição' }).click();
  await expect(page.getByRole('link', { name: 'Corretora Kissama' })).toBeVisible();

  await page.getByRole('button', { name: 'Editar instituição: Corretora Kissama' }).click();
  const edit = page.getByRole('dialog', { name: 'Editar instituição' });
  await edit.getByLabel('Nome').fill('Corretora Kissama Invest');
  await edit.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('link', { name: 'Corretora Kissama Invest' })).toBeVisible();
});

test('exportar: JSON completo e CSV com BOM', async ({ page }) => {
  await page.goto('/app/exportar');
  const [json] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Descarregar JSON' }).click(),
  ]);
  expect(json.suggestedFilename()).toMatch(/^investnote-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(await readFile((await json.path())!, 'utf8'));
  expect(data.formato).toBe('investnote-export');
  expect(data.investimentos).toHaveLength(10);
  expect(data.movimentos.length).toBeGreaterThan(10);
  expect(data.perfil.baseCurrency).toBe('AOA');

  const [csv] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Descarregar Movimentos em CSV' }).click(),
  ]);
  const text = await readFile((await csv.path())!, 'utf8');
  expect(text.charCodeAt(0)).toBe(0xfeff);
  expect(text).toContain('id,investimento_id,tipo,data,moeda,valor');
  expect(text).toContain(',redemption,');
});

test('definições: atualizar o nome e eliminar a conta', async ({ page }) => {
  await page.goto('/app/definicoes');
  await page.getByLabel('Nome').fill('Nzinga');
  await page.getByRole('button', { name: 'Guardar perfil' }).click();
  await expect(page.getByText('Perfil atualizado')).toBeVisible();
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nzinga');

  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Eliminar conta…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Eliminar a conta?' });
  const confirm = dialog.getByRole('button', { name: 'Eliminar definitivamente' });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel('Escreva «eliminar» para confirmar').fill('eliminar');
  await confirm.click();
  await page.waitForURL(/\/entrar\?conta=eliminada/);
});
