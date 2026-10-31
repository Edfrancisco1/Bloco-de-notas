import { expect, test } from '@playwright/test';

/** Etapa 6: landing, autenticação (modo demonstração) e onboarding. */
function nextYear(isoDate: string) {
  const [y, m, d] = isoDate.split('-');
  return `${Number(y) + 1}-${m}-${d}`;
}

test('rotas da aplicação exigem sessão', async ({ page }) => {
  await page.goto('/app/investimentos');
  await expect(page).toHaveURL(/\/entrar$/);
});

test('landing: proposta, chamadas para a ação e aviso legal', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Todos os seus investimentos, num só caderno.',
  );
  await expect(page.getByRole('link', { name: 'Criar conta gratuita' })).toBeVisible();
  await expect(page.getByText('não presta aconselhamento financeiro')).toBeVisible();
  await page.getByRole('button', { name: 'Ver a demonstração' }).click();
  await page.waitForURL('**/app');
});

test('criar conta → onboarding → primeiro investimento → painel', async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.round(Math.random() * 1e6)}@teste.example`;
  await page.goto('/criar-conta');

  // Validação: campos obrigatórios e aceitação dos termos.
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByText('Indique um e-mail válido.')).toBeVisible();
  await expect(page.getByText('Aceite os termos para continuar.')).toBeVisible();

  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Palavra-passe', { exact: true }).fill('uma frase longa e segura');
  await page.getByLabel(/Li e aceito os/).check();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL('**/boas-vindas');

  await page.getByLabel('Como o devemos tratar?').fill('Teste');
  await expect(page.getByLabel('Fuso horário')).toHaveValue('Africa/Luanda');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(
    page.getByRole('heading', { name: /Que investimento quer registar primeiro, Teste/ }),
  ).toBeVisible();

  await page.getByRole('link', { name: /Depósito a prazo/ }).click();
  await page.waitForURL(/tipo=term_deposit/);
  await page.getByLabel('Nome', { exact: true }).fill('Primeiro depósito');
  await page.getByLabel('Capital aplicado').fill('1 000 000');
  await page.getByLabel('Taxa anual nominal').fill('12');
  const start = await page.getByLabel('Data de início').inputValue();
  await page.getByLabel('Data de vencimento').fill(nextYear(start));
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Guardar investimento' }).click();
  await page.waitForURL(/\?novo=1/);

  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Teste');
  const summary = page.getByRole('region', { name: 'Resumo da carteira' });
  await expect(summary).toContainText('0 de 1 investimento aberto com valor registado');
  await expect(page.getByRole('region', { name: /Precisa de atenção/ })).toContainText(
    'Primeiro depósito',
  );

  // Sair e voltar a entrar com a conta criada.
  await page.goto('/app/definicoes');
  const signOut = page.getByRole('button', { name: 'Terminar sessão' });
  if (await signOut.isVisible()) {
    await signOut.click();
  } else {
    await page.getByRole('button', { name: 'Mais' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Terminar sessão' }).click();
  }
  await page.waitForURL('**/entrar');

  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Palavra-passe', { exact: true }).fill('palavra errada');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('E-mail ou palavra-passe incorretos.')).toBeVisible();
  await expect(page.getByLabel('E-mail')).toHaveValue(email);

  await page.getByLabel('Palavra-passe', { exact: true }).fill('uma frase longa e segura');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/app');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Teste');
});

test('recuperar palavra-passe não revela se o e-mail tem conta', async ({ page }) => {
  await page.goto('/recuperar-password');
  await page.getByLabel('E-mail').fill('ninguem@teste.example');
  await page.getByRole('button', { name: 'Enviar instruções' }).click();
  await expect(page.getByRole('status')).toContainText('Se existir uma conta com');
});
