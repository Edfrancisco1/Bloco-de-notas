import { expect, type Page, test } from '@playwright/test';

/** Fluxos da Etapa 4 em modo demonstração. Cada teste começa com os dados de exemplo repostos. */
const nb = (text: string) => text.replace(/ /g, ' ');

async function enterDemoWithSample(page: Page) {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Entrar em modo demonstração' }).click();
  await page.waitForURL('**/app');
  await page.goto('/app/definicoes');
  await page.getByRole('button', { name: 'Repor carteira de exemplo' }).click();
  await page.waitForURL('**/app');
}

function nextYear(isoDate: string) {
  const [y, m, d] = isoDate.split('-');
  return `${Number(y) + 1}-${m}-${d}`;
}

test.beforeEach(async ({ page }) => {
  await enterDemoWithSample(page);
});

test('lista: pesquisa sem acentos e filtro de encerrados', async ({ page }) => {
  await page.goto('/app/investimentos');
  await expect(page.getByRole('heading', { name: /Depósitos a prazo/ })).toBeVisible();

  await page.getByLabel('Pesquisar investimentos').fill('deposito 12');
  await page.waitForURL(/q=deposito/);
  await expect(page.getByRole('link', { name: 'Depósito a prazo 12 meses' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bitcoin' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await page.getByLabel('Estado').selectOption('encerrados');
  await page.waitForURL(/estado=encerrados/);
  await expect(page.getByRole('link', { name: 'Depósito a prazo 3 meses' })).toBeVisible();
  await expect(page.getByText('Encerrado', { exact: true }).first()).toBeVisible();
});

test('novo depósito a prazo com instituição nova, estimativa e lembrete', async ({ page }) => {
  await page.goto('/app/investimentos/novo');
  await page.getByRole('radio', { name: /Depósito a prazo/ }).check();
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Validação do passo: não avança sem os campos obrigatórios.
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Indique um nome.')).toBeVisible();

  await page.getByLabel('Nome', { exact: true }).fill('Depósito E2E 1 ano');
  await page.getByLabel('Instituição ou conta').selectOption('__nova__');
  await page.getByLabel('Nome da instituição').fill('Banco Teste E2E');
  await page.getByLabel('Capital aplicado').fill('3 000 000');
  await page.getByLabel('Taxa anual nominal').fill('13,5');
  const start = await page.getByLabel('Data de início').inputValue();
  await page.getByLabel('Data de vencimento').fill(nextYear(start));
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(page.getByRole('heading', { name: 'Detalhes' })).toBeVisible();
  await expect(page.getByLabel('Lembrar-me 7 dias antes do vencimento')).toBeChecked();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(page.getByRole('heading', { name: 'Confirme os dados' })).toBeVisible();
  await expect(page.getByText('Banco Teste E2E (nova, banco)')).toBeVisible();
  await expect(page.getByText('Juros brutos estimados')).toBeVisible();
  await expect(page.getByText('Estimativa', { exact: true })).toBeVisible();
  // Ainda não guardou: continua no resumo até carregar em "Guardar".
  await expect(page).toHaveURL(/\/novo/);

  await page.getByRole('button', { name: 'Guardar investimento' }).click();
  await page.waitForURL(/\/app\/investimentos\/[^/]+\?novo=1/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Depósito E2E 1 ano');
  await expect(page.getByText('Investimento registado.')).toBeVisible();
  await expect(page.getByText('Vencimento: Depósito E2E 1 ano')).toBeVisible();
  await expect(page.getByText(nb('3 000 000,00 Kz')).first()).toBeVisible();
});

test('cripto: compra, venda parcial e avaliação com os cálculos certos', async ({ page }) => {
  await page.goto('/app/investimentos/novo?tipo=crypto');
  await page.getByLabel('Nome', { exact: true }).fill('Ethereum');
  await page.getByLabel('Símbolo').fill('ETH');
  await page.getByLabel('Quantidade').fill('0,5');
  await page.getByLabel('Preço unitário').fill('2 000 000');
  await expect(page.getByText(nb('1 000 000,00 Kz'))).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Guardar investimento' }).click();
  await page.waitForURL(/\?novo=1/);

  // Venda parcial: 0,2 a 2 500 000 Kz.
  await page.getByRole('button', { name: 'Movimento' }).click();
  const movement = page.getByRole('dialog', { name: 'Registar movimento' });
  await movement.getByLabel('Tipo de movimento').selectOption('redemption');
  await movement.getByLabel('Quantidade').fill('0,2');
  await movement.getByLabel('Preço unitário').fill('2 500 000');
  await expect(movement.getByText(nb('600 000,00 Kz'))).toBeVisible(); // capital líquido depois
  await movement.getByRole('button', { name: 'Registar movimento' }).click();
  await expect(movement).toBeHidden();

  // Avaliação por unidades: 0,3 em carteira a 2 600 000 Kz.
  await page.getByRole('button', { name: 'Atualizar valor' }).click();
  const valuation = page.getByRole('dialog', { name: 'Atualizar valor' });
  await valuation.getByRole('radio', { name: 'Quantidade × preço' }).click();
  await expect(valuation.getByLabel('Quantidade')).toHaveValue('0,3');
  await valuation.getByLabel('Preço unitário').fill('2 600 000');
  await valuation.getByRole('button', { name: 'Guardar avaliação' }).click();
  await expect(valuation).toBeHidden();

  const metrics = page.getByRole('region', { name: 'Métricas' });
  await expect(metrics).toContainText(nb('780 000,00'));
  await expect(metrics).toContainText(nb('600 000,00'));
  // 780 000 + 500 000 − 1 000 000 = +280 000
  await expect(metrics).toContainText(nb('+280 000,00'));
});

test('encerrar um depósito com o resgate final', async ({ page }) => {
  await page.goto('/app/investimentos/dp-6-meses');
  await page.getByRole('button', { name: 'Mais ações' }).click();
  await page.getByRole('menuitem', { name: 'Encerrar…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Encerrar investimento' });
  await dialog.getByLabel('Valor recebido').fill('2 650 000');
  await expect(dialog.getByLabel('Parte de capital')).toHaveValue(nb('2 500 000,00'));
  await expect(dialog).toContainText(nb('+150 000,00 Kz'));
  await dialog.getByRole('button', { name: 'Encerrar investimento' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Reabrir' })).toBeVisible();
  await expect(page.getByText('Encerrado', { exact: true }).first()).toBeVisible();
});

test('editar os dados de um investimento', async ({ page }) => {
  await page.goto('/app/investimentos/negocio-familia/editar');
  await page.getByLabel('Nome', { exact: true }).fill('Negócio da família (15%)');
  await page.getByRole('button', { name: 'Guardar alterações' }).click();
  await page.waitForURL('**/app/investimentos/negocio-familia');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Negócio da família (15%)');
});

test('eliminar um investimento pede confirmação com as consequências', async ({ page }) => {
  await page.goto('/app/investimentos/crowdfunding-horta');
  await page.getByRole('button', { name: 'Mais ações' }).click();
  await page.getByRole('menuitem', { name: 'Eliminar…' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Projeto agrícola Horta Viva');
  await expect(dialog).toContainText('Não pode ser desfeito');
  await dialog.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await page.waitForURL(/eliminado=1/);
  await expect(page.getByText('O investimento e o seu histórico foram eliminados.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Projeto agrícola Horta Viva' })).toHaveCount(0);
});
