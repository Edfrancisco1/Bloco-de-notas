import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * Painel em modo demonstração (dados fictícios). Cada teste começa com os dados de exemplo
 * repostos, para não depender da ordem.
 */
async function enterDemoWithSample(page: Page) {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
  await page.waitForURL('**/app');
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
  await page.waitForURL('**/app');
}

test.describe('painel', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoWithSample(page);
  });

  test('mostra o valor atual conhecido em kwanzas, com a cobertura das avaliações', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Bom (dia|tarde|noite)|Boa (tarde|noite)/,
    );
    const summary = page.getByRole('region', { name: 'Resumo da carteira' });
    await expect(summary).toContainText('31\u00a0135\u00a0408,77');
    await expect(summary).toContainText('8 de 9 investimentos abertos com valor registado');
    await expect(summary).toContainText('Kz');
  });

  test('atualizar o valor a partir do painel tira o investimento de "Precisa de atenção"', async ({
    page,
  }) => {
    const attention = page.getByRole('region', { name: /Precisa de atenção/ });
    await expect(attention.getByRole('listitem')).toHaveCount(2);

    const row = attention.getByRole('listitem').filter({ hasText: 'Projeto agrícola Horta Viva' });
    await row.getByRole('button', { name: 'Atualizar valor' }).click();

    const dialog = page.getByRole('dialog', { name: 'Atualizar valor' });
    await dialog.getByLabel('Valor total atual').fill('1 520 000');
    await expect(dialog).toContainText('+20\u00a0000,00\u00a0Kz');
    await dialog.getByRole('button', { name: 'Guardar avaliação' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('Valor atualizado')).toBeVisible();
    await expect(attention.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'Resumo da carteira' })).toContainText(
      '9 de 9 investimentos abertos com valor registado',
    );
  });

  test('recusa um valor inválido junto ao campo, sem fechar o diálogo', async ({ page }) => {
    const attention = page.getByRole('region', { name: /Precisa de atenção/ });
    await attention.getByRole('button', { name: 'Atualizar valor' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Atualizar valor' });
    const field = dialog.getByLabel('Valor total atual');
    await field.fill('12,345');
    await expect(dialog.getByRole('alert')).toContainText('Demasiadas casas decimais');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  });

  test('não tem violações de acessibilidade graves', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
