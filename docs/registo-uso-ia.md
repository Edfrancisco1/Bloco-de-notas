# Registo de utilização de Inteligência Artificial

## 1. Objetivo deste registo

Este documento descreve como uma ferramenta de Inteligência Artificial (IA) generativa foi utilizada no desenvolvimento do **InvestNote**. O objetivo é tornar o processo transparente, identificando os pedidos feitos pelo aluno, as decisões tomadas durante o trabalho, as tarefas executadas pela IA e os mecanismos usados para verificar os resultados.

Os prompts abaixo são **resumos fiéis das interações**, e não transcrições integrais palavra por palavra. Não foram incluídas credenciais, dados pessoais sensíveis nem informação financeira real.

## 2. Papel do aluno e papel da IA

O aluno assumiu o papel de dono do produto: definiu o problema, escolheu o mercado inicial, aprovou a direção visual, decidiu a ordem de implementação e avaliou os resultados apresentados. A IA foi utilizada como assistente de planeamento, pesquisa, programação, documentação e testes.

A IA não trabalhou de forma totalmente autónoma. As principais decisões de produto foram apresentadas ao aluno e o desenvolvimento avançou depois das suas escolhas e aprovações. O código gerado também foi sujeito a verificações automáticas e revisão visual.

## 3. Registo dos principais prompts e resultados

| Etapa | Pedido do aluno (resumo do prompt) | Ação realizada pela IA | Decisão ou validação do aluno |
| --- | --- | --- | --- |
| Início | Iniciar a execução do MVP descrito em `PLANO_MVP.md`. | Leu o plano, inspecionou o projeto, verificou as versões das tecnologias e propôs um plano para o primeiro marco. | Aprovou o arranque do Marco 1. |
| Mercado | Usar o **kwanza (Kz)** como moeda inicial. | Adaptou o produto ao contexto angolano, à moeda AOA e à formatação `pt-AO`, incluindo valores como `1 234 567,89 Kz`. | Confirmou o kwanza como moeda inicial. |
| Direção visual | Criar um design limpo, intuitivo e sem aparência de template comum, inspirado em bons produtos do mercado. | Analisou referências de trackers de investimento e apresentou alternativas de direção visual. | Escolheu a direção **Editorial claro**. |
| Estratégia técnica | Decidir entre ligar imediatamente o Supabase ou desenvolver primeiro a experiência visual. | Expôs as implicações das duas opções e propôs uma camada de dados substituível. | Escolheu desenvolver primeiro a interface com dados fictícios e deixar o Supabase para uma fase posterior. |
| Implementação | Construir o primeiro marco do InvestNote de acordo com o plano aprovado. | Criou a fundação técnica, o sistema visual, os cálculos financeiros, a camada de dados em memória e os ecrãs do MVP. | Acompanhou o resultado apresentado. |
| Continuação | Depois de observar o painel: **“Adorei o design, continue com o plano.”** | Prosseguiu com os restantes fluxos, ecrãs de investimentos, gestão, testes e documentação do marco. | Aprovou a direção visual e autorizou a continuação. |
| Publicação | Preparar e publicar o projeto no repositório GitHub do aluno. | Configurou a identidade Git correta, corrigiu a autenticação que estava associada a outra conta e publicou a branch `main`. | Indicou a conta GitHub correta: `Edfrancisco1`. |

## 4. Trabalho realizado com apoio da IA

### 4.1 Planeamento e pesquisa

A IA analisou o `PLANO_MVP.md`, verificou a compatibilidade das versões dos pacotes e estudou padrões usados por produtos de acompanhamento de investimentos, incluindo Kubera, Finary, Parqet e Copilot. Também consultou documentação técnica relevante para preparar a futura integração com o Supabase.

O trabalho foi dividido em marcos. As decisões que alteraram o plano original foram registadas em documentos ADR (*Architecture Decision Records*), para que as razões técnicas e de produto não ficassem apenas na conversa com a IA.

### 4.2 Fundação técnica

Com apoio da IA foi preparado um projeto Next.js com TypeScript, Tailwind CSS, testes automatizados e integração contínua. Foram ainda registados desvios de versões motivados por compatibilidade, nomeadamente TypeScript 6 e ESLint 9.

Foram escritos cinco ADRs, incluindo decisões sobre o contexto de Angola e do kwanza e sobre a estratégia de desenvolver primeiro a experiência visual com dados fictícios.

### 4.3 Design e experiência de utilização

A IA implementou a direção **Editorial claro**, aprovada pelo aluno. O sistema visual utiliza tons de papel e tinta, uma cor de destaque azul, números em tipografia serifada e linhas finas inspiradas num livro-razão. Procurou-se evitar o uso excessivo de cartões genéricos e o aspeto de um template pronto.

As cores associadas aos tipos de investimento foram verificadas para não dependerem apenas da distinção entre vermelho e verde e para serem mais seguras para pessoas com daltonismo.

### 4.4 Regras e cálculos

Foram implementadas funções para calcular capital investido, resultado, custo médio e estimativas de depósitos a prazo. Os valores monetários utilizam aritmética decimal, evitando que números de ponto flutuante sejam a fonte de verdade dos cálculos financeiros.

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

O trabalho da IA não foi aceite apenas por produzir código ou uma interface visual. Foram executadas verificações automáticas para detetar erros e confirmar os fluxos principais.

No final do marco:

- `npm run check` concluía lint, verificação de tipos, 67 testes e build de produção;
- 98 testes de ponta a ponta passavam em desktop e numa largura móvel de 360 px;
- 20 páginas eram verificadas automaticamente sem problemas graves ou críticos de acessibilidade;
- 18 páginas eram verificadas sem deslocamento horizontal a 360 px;
- o fluxo principal podia ser realizado apenas com teclado;
- foram produzidas 36 capturas para revisão visual.

Os testes encontraram problemas que foram corrigidos durante o desenvolvimento:

1. o botão “Continuar” guardava o investimento antes da confirmação final;
2. a pesquisa exigia uma frase exata em vez de aceitar termos parciais;
3. o onboarding saltava um passo em determinadas condições;
4. a landing page ultrapassava a largura do ecrã no telemóvel.

## 5. Decisões que permaneceram sob responsabilidade do aluno

Embora a IA tenha apresentado opções e recomendações, as seguintes decisões foram tomadas ou aprovadas pelo aluno:

- escolha do InvestNote como projeto a desenvolver;
- utilização inicial do kwanza e foco no contexto angolano;
- seleção da direção visual Editorial claro;
- desenvolvimento visual com dados fictícios antes da integração do Supabase;
- aprovação do painel e continuação do plano;
- identificação da conta GitHub em que o projeto seria publicado.

O aluno continua responsável por compreender o funcionamento do projeto, rever o resultado, apresentar o trabalho e decidir quais alterações serão integradas.

## 6. Limitações e trabalho ainda não concluído

O projeto publicado corresponde a um marco visual e funcional, não a uma versão pronta para guardar dados financeiros reais. Permanecem pendentes:

- autenticação real, migrations, base de dados e políticas RLS no Supabase;
- testes de isolamento entre utilizadores na base de dados real;
- decisão e implementação de suporte completo para USD e EUR;
- revisão jurídica dos textos de termos e privacidade;
- observabilidade, backups e restantes medidas necessárias antes de produção.

Os dados atuais são fictícios e mantidos em memória. Podem desaparecer quando o servidor reinicia e não devem ser usados para informação financeira real.

## 7. Evidências disponíveis no repositório

O trabalho descrito pode ser consultado nos seguintes ficheiros e diretórios:

- [`PLANO_MVP.md`](../PLANO_MVP.md) — definição do produto, arquitetura e critérios de aceitação;
- [`docs/marcos/marco-01.md`](./marcos/marco-01.md) — relatório do primeiro marco;
- [`docs/CHECKLIST.md`](./CHECKLIST.md) — acompanhamento da implementação;
- [`docs/adr`](./adr) — decisões arquiteturais e desvios registados;
- [`docs/marcos/capturas`](./marcos/capturas) — capturas usadas na revisão visual;
- [`docs/ligacao-supabase.md`](./ligacao-supabase.md) — plano para substituir os dados fictícios por persistência real;
- [`tests`](../tests) — testes unitários, de contrato, de interface e de ponta a ponta;
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — verificações automáticas executadas no repositório.

## 8. Declaração de transparência

A IA foi uma ferramenta relevante na produção do projeto: ajudou a pesquisar, planear, escrever código, criar testes, identificar erros e produzir documentação. O seu uso não é apresentado como trabalho exclusivamente manual do aluno. Ao mesmo tempo, as decisões de produto, a aprovação da direção seguida e a responsabilidade pela entrega pertencem ao aluno.

Este registo procura permitir que o professor avalie tanto o resultado técnico como o processo de colaboração entre o aluno e a IA.
