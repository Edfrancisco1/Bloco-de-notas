# Instruções do projeto para o Claude

O documento de referência é [`PLANO_MVP.md`](./PLANO_MVP.md). Leia-o integralmente antes de implementar.

Regras obrigatórias:

1. Trabalhe por fases e por fatias verticais funcionais.
2. Comece pelas Fases 0 e 1 do plano; não implemente P1 sem autorização.
3. Use TypeScript estrito e mantenha regras financeiras fora dos componentes de UI.
4. Todo valor monetário persistido usa decimal/numeric, nunca float como fonte de verdade.
5. Toda tabela exposta recebe grants mínimos, RLS e testes de isolamento entre dois utilizadores.
6. Toda mudança de base de dados é uma migration reproduzível.
7. Nunca exponha chaves secretas nem use `service_role` no browser ou nos fluxos normais.
8. Antes de concluir cada marco, execute lint, typecheck, testes e build.
9. Registe decisões e desvios do plano num ADR ou no relatório do marco.
10. Não adicione aconselhamento financeiro, execução de ordens, dados de mercado automáticos ou cálculos fiscais ao MVP.

Primeira tarefa: inspecione o repositório, confirme as versões atuais nas documentações oficiais, proponha uma checklist técnica curta e implemente a fundação reproduzível do projeto.

## Decisões em vigor (2026-10-30)

- Mercado inicial Angola, moeda AOA (Kz), locale pt-AO — [ADR 0002](./docs/adr/0002-mercado-angola-kwanza.md).
- Por decisão do dono do produto, o visual vem primeiro, com dados mock; a ligação ao Supabase (auth, migrations, RLS) fica para depois — [ADR 0003](./docs/adr/0003-visual-primeiro-com-mock.md) e [guia](./docs/ligacao-supabase.md).
- Direção visual "Editorial claro" — [ADR 0004](./docs/adr/0004-direcao-visual-editorial.md).
- Estado do trabalho: [docs/CHECKLIST.md](./docs/CHECKLIST.md).
