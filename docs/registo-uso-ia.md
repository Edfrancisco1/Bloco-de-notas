# Registo de utilização de Inteligência Artificial

## 1. Objetivo deste registo

Neste documento descrevo como utilizei uma ferramenta de Inteligência Artificial (IA) generativa no desenvolvimento do **InvestNote**. O meu objetivo é tornar o processo transparente, identificando os pedidos que fiz, as decisões que tomei durante o trabalho, as tarefas executadas pela IA e os mecanismos que usei para verificar os resultados.

Os prompts abaixo são **resumos fiéis das interações**, e não transcrições integrais palavra por palavra. Não incluí credenciais, dados pessoais sensíveis nem informação financeira real.

## 2. O meu papel e o papel da IA

Assumi o papel de dono do produto: defini o problema, escolhi o mercado inicial, aprovei a direção visual, decidi a ordem de implementação e avaliei os resultados apresentados. Utilizei a IA como assistente de planeamento, pesquisa, programação, documentação e testes.

A IA não trabalhou de forma totalmente autónoma. Analisei as principais decisões de produto e o desenvolvimento avançou depois das minhas escolhas e aprovações. Também sujeitei o código gerado a verificações automáticas e revisão visual.

## 3. Registo dos principais prompts e resultados

| Etapa | O meu pedido (resumo do prompt) | Ação realizada pela IA | A minha decisão ou validação |
| --- | --- | --- | --- |
| Início | Iniciar a execução do MVP descrito em `PLANO_MVP.md`. | Leu o plano, inspecionou o projeto, verificou as versões das tecnologias e propôs um plano para o primeiro marco. | Aprovei o arranque do Marco 1. |
| Mercado | Usar o **kwanza (Kz)** como moeda inicial. | Adaptou o produto ao contexto angolano, à moeda AOA e à formatação `pt-AO`, incluindo valores como `1 234 567,89 Kz`. | Confirmei o kwanza como moeda inicial. |
| Direção visual | Criar um design limpo, intuitivo e sem aparência de template comum, inspirado em bons produtos do mercado. | Analisou referências de trackers de investimento e apresentou alternativas de direção visual. | Escolhi a direção **Editorial claro**. |
| Estratégia técnica | Decidir entre ligar imediatamente o Supabase ou desenvolver primeiro a experiência visual. | Expôs as implicações das duas opções e propôs uma camada de dados substituível. | Escolhi desenvolver primeiro a interface com dados fictícios e deixar o Supabase para uma fase posterior. |
| Implementação | Construir o primeiro marco do InvestNote de acordo com o plano aprovado. | Criou a fundação técnica, o sistema visual, os cálculos financeiros, a camada de dados em memória e os ecrãs do MVP. | Acompanhei o resultado apresentado. |
| Continuação | Depois de observar o painel, escrevi: **“Adorei o design, continue com o plano.”** | Prosseguiu com os restantes fluxos, ecrãs de investimentos, gestão, testes e documentação do marco. | Aprovei a direção visual e autorizei a continuação. |
| Publicação | Preparar e publicar o projeto no meu repositório GitHub. | Configurou a identidade Git correta, corrigiu a autenticação que estava associada a outra conta e publicou a branch `main`. | Indiquei a minha conta GitHub correta: `Edfrancisco1`. |

## 4. Trabalho realizado com apoio da IA

### 4.1 Planeamento e pesquisa

A IA analisou o `PLANO_MVP.md`, verificou a compatibilidade das versões dos pacotes e estudou padrões usados por produtos de acompanhamento de investimentos, incluindo Kubera, Finary, Parqet e Copilot. Também consultou documentação técnica relevante para preparar a futura integração com o Supabase.

Dividi o trabalho em marcos com o apoio da IA. Registei as decisões que alteraram o plano original em documentos ADR (*Architecture Decision Records*), para que as razões técnicas e de produto não ficassem apenas na conversa com a IA.

### 4.2 Fundação técnica

Com o apoio da IA, preparei um projeto Next.js com TypeScript, Tailwind CSS, testes automatizados e integração contínua. Registei também os desvios de versões motivados por compatibilidade, nomeadamente TypeScript 6 e ESLint 9.

Com o apoio da IA, escrevi cinco ADRs, incluindo decisões sobre o contexto de Angola e do kwanza e sobre a estratégia de desenvolver primeiro a experiência visual com dados fictícios.

### 4.3 Design e experiência de utilização

A IA implementou a direção **Editorial claro**, que eu aprovei. O sistema visual utiliza tons de papel e tinta, uma cor de destaque azul, números em tipografia serifada e linhas finas inspiradas num livro-razão. Pedi que fosse evitado o uso excessivo de cartões genéricos e o aspeto de um template pronto.

Pedi à IA que verificasse as cores associadas aos tipos de investimento, para que não dependessem apenas da distinção entre vermelho e verde e fossem mais seguras para pessoas com daltonismo.

### 4.4 Regras e cálculos

Com o apoio da IA, implementei funções para calcular capital investido, resultado, custo médio e estimativas de depósitos a prazo. Decidi utilizar aritmética decimal nos valores monetários, evitando que números de ponto flutuante fossem a fonte de verdade dos cálculos financeiros.

A IA também criou uma interface `UserRepository` e uma implementação em memória com dados fictícios. Esta separação permite substituir a camada atual por uma implementação Supabase sem refazer os ecrãs e as regras financeiras.

### 4.5 Funcionalidades e ecrãs

O Marco 1 inclui:

- landing page, entrada, criação de conta, recuperação de palavra-passe e onboarding;
- painel com valor atual, resultado, distribuição, prazos, atividade e itens que precisam de atenção;
- lista de investimentos, pesquisa, filtros e ordenação;
- criação de investimento em quatro passos, com seis grupos de investimento;
- ficha de investimento com métricas, gráfico, histórico, movimentos e lembretes;
- ações para editar, encerrar, reabrir, arquivar e eliminar investimentos;
- gestão de carteiras e instituições;
- calendário de prazos;
- exportação em JSON e CSV;
- definições de perfil e conta.

### 4.6 Testes e correções

Não aceitei o trabalho da IA apenas por produzir código ou uma interface visual. Pedi a execução de verificações automáticas para detetar erros e confirmar os fluxos principais.

No final do marco:

- `npm run check` concluía lint, verificação de tipos, 67 testes e build de produção;
- 98 testes de ponta a ponta passavam em desktop e numa largura móvel de 360 px;
- 20 páginas eram verificadas automaticamente sem problemas graves ou críticos de acessibilidade;
- 18 páginas eram verificadas sem deslocamento horizontal a 360 px;
- o fluxo principal podia ser realizado apenas com teclado;
- produzi, com o apoio da IA, 36 capturas para revisão visual.

Os testes encontraram problemas que corrigi com o apoio da IA durante o desenvolvimento:

1. o botão “Continuar” guardava o investimento antes da confirmação final;
2. a pesquisa exigia uma frase exata em vez de aceitar termos parciais;
3. o onboarding saltava um passo em determinadas condições;
4. a landing page ultrapassava a largura do ecrã no telemóvel.

## 5. Decisões que permaneceram sob a minha responsabilidade

Embora a IA me tenha apresentado opções e recomendações, tomei ou aprovei as seguintes decisões:

- escolha do InvestNote como projeto a desenvolver;
- utilização inicial do kwanza e foco no contexto angolano;
- seleção da direção visual Editorial claro;
- desenvolvimento visual com dados fictícios antes da integração do Supabase;
- aprovação do painel e continuação do plano;
- identificação da conta GitHub em que o projeto seria publicado.

Continuo responsável por compreender o funcionamento do projeto, rever o resultado, apresentar o trabalho e decidir quais alterações serão integradas.

## 6. Limitações e trabalho ainda não concluído

O projeto que publiquei corresponde a um marco visual e funcional, não a uma versão pronta para guardar dados financeiros reais. Ainda tenho pendentes as seguintes tarefas:

- autenticação real, migrations, base de dados e políticas RLS no Supabase;
- testes de isolamento entre utilizadores na base de dados real;
- decisão e implementação de suporte completo para USD e EUR;
- revisão jurídica dos textos de termos e privacidade;
- observabilidade, backups e restantes medidas necessárias antes de produção.

Os dados atuais são fictícios e mantidos em memória. Podem desaparecer quando o servidor reinicia e não devem ser usados para informação financeira real.

## 7. Evidências disponíveis no repositório

Disponibilizei as evidências do trabalho descrito nos seguintes ficheiros e diretórios:

- [`PLANO_MVP.md`](../PLANO_MVP.md) — definição do produto, arquitetura e critérios de aceitação;
- [`docs/marcos/marco-01.md`](./marcos/marco-01.md) — relatório do primeiro marco;
- [`docs/CHECKLIST.md`](./CHECKLIST.md) — acompanhamento da implementação;
- [`docs/adr`](./adr) — decisões arquiteturais e desvios registados;
- [`docs/marcos/capturas`](./marcos/capturas) — capturas usadas na revisão visual;
- [`docs/ligacao-supabase.md`](./ligacao-supabase.md) — plano para substituir os dados fictícios por persistência real;
- [`tests`](../tests) — testes unitários, de contrato, de interface e de ponta a ponta;
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — verificações automáticas executadas no repositório.

## 8. Declaração de transparência

A IA foi uma ferramenta relevante na produção do projeto: ajudou-me a pesquisar, planear, escrever código, criar testes, identificar erros e produzir documentação. Não apresento este projeto como trabalho exclusivamente manual. Ao mesmo tempo, tomei as decisões de produto, aprovei a direção seguida e assumi a responsabilidade pela entrega.

Com este registo, procuro permitir que o professor avalie tanto o resultado técnico como o meu processo de colaboração com a IA.
