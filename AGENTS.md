# AGENTS.md — TOV

## Sobre este arquivo

Este é o arquivo canônico de instruções para qualquer agente de IA (Claude Code,
Copilot, Cursor). O `CLAUDE.md` apenas remete a ele. Leia-o por inteiro antes de
qualquer mudança. Os princípios inegociáveis estão em `specs/constitution.md`;
em caso de conflito, a constituição prevalece.

## O que é o TOV

Pesquisas com rastreamento ocular (eye tracking) costumam depender de
equipamentos caros. O WebGazer reduz esse custo ao estimar o olhar usando
apenas a webcam, mas ainda não existe um sistema gratuito e open source que
permita usá-lo sem programar. O TOV preenche essa lacuna com uma interface
simples e sem jargão técnico para os dois lados da pesquisa: o pesquisador,
que cria experimentos e coleta os dados sem precisar saber programar, e o
participante, que só abre um link e segue as instruções na tela, sem cadastro,
login ou instalação.

**Estado atual:** hoje o sistema roda 100% no navegador (Svelte 5 + WebGazer),
sem backend, e pesquisador e participante usam a mesma máquina. A feature
`specs/planejadas/001-experimento-remoto` acrescenta backend, conta de
pesquisador, link de participação sem login e download dos dados. Toda tarefa
que envolva backend, banco ou autenticação é trabalho novo que começa pela spec
e pelo plano, nunca como extensão do código atual. Backend: **NestJS + Prisma +
PostgreSQL 18** (`docs/decisoes/0001-backend-nestjs-prisma-postgres.md`).
Hospedagem e testes no navegador: **a definir no plan.md**.

## Mapa do repositório

| Caminho | O que é | Stack |
| :--- | :--- | :--- |
| `src/App.svelte` | Alterna as etapas `setup` → `calibration` → `experiment` e liga/desliga o WebGazer | Svelte 5 |
| `src/lib/stores/` | Estado compartilhado: `experimentStore` (estímulos e configuração), `executionStore` (ordem, estímulo atual, pausa para recalibração), `gazeStore` em `GazeStore.svelte.ts` (único acesso ao WebGazer; define `Point`), `resultsStore` (linhas do CSV e exportação) | Svelte 5 runes, TS |
| `src/lib/services/` | `CsvService.ts` gera o CSV; `DownloadService.ts` baixa o arquivo via Blob; `DataCollector.svelte.ts` amostra o olhar a cada 33 ms durante a execução | TS |
| `src/lib/math/` | Cálculos puros: distância euclidiana, erro médio, conversão de percentual para pixels | TS |
| `src/lib/components/` (raiz) | `ConfigPanel` (configurações do experimento), `UploadZone` (envio de imagens), `StimulusCard` (miniatura removível) | Svelte 5, Tailwind 4, bits-ui, lucide-svelte |
| `src/lib/components/setup/` | `SetupView` (tela inicial do pesquisador) e `CalibrationGuide` (explicação do eye tracking) | Svelte 5, Tailwind 4 |
| `src/lib/components/calibration/` | Calibração por cliques (`CalibrationOverlay`, `CalibrationPoint`, pontos em `calibrationPoints.ts`) e validação de precisão (`ValidationOverlay`, com SweetAlert2 para refazer ou seguir) | Svelte 5, TS |
| `src/lib/components/calibration/click/` | Ordem aleatória dos pontos de calibração | TS |
| `src/lib/components/calibration/validation/` | Constantes da validação (incl. limite de precisão), animação do ponto e cálculo da precisão | TS |
| `src/lib/components/experiment/` | `RunView` (execução e recalibração periódica) e `StimulusDisplay` (exibe a imagem, registra sua posição na tela e trata a tecla no modo MANUAL) | Svelte 5 |
| `src/**/*.test.ts` | Testes ao lado do código | Vitest, jsdom, @testing-library/svelte |
| `public/` | `webgazer.js` (carregado pelo `index.html` antes do app) e `mediapipe/face_mesh/` (modelo de rosto usado pelo WebGazer) | Arquivos estáticos |
| `docs/` | Documentação do projeto; índice em `docs/README.md` | Markdown |
| `dados/` | Modelo de dados do backend (`modelo-de-dados.md`) e estudos sobre armazenamento (ex.: benchmark Postgres × Mongo), com código para repetir as medições; índice em `dados/TLDR.md` | Markdown, Node, Docker |
| `specs/` | Constituição (`constitution.md`) e specs SDD: `aceitas/` e `planejadas/` | Markdown |
| `.claude/skills/` | Skills dos agentes (ver abaixo) | Markdown |

## Fontes únicas da verdade

- Formato do CSV exportado: `docs/DATA_DICTIONARY.md`.
- Modelo de dados do backend (visão conceitual e modelo físico):
  `dados/modelo-de-dados.md`. Quando existir, o `schema.prisma` prevalece e o
  documento é corrigido no mesmo commit.
- Comportamento do sistema: `specs/aceitas/`. O protocolo atual de calibração,
  validação e execução está em `specs/aceitas/000-experimento-local/spec.md`.
- Tipos de domínio são importados dos módulos que os definem (ex.: `ExportRow` e
  `GazeEntry` em `CsvService.ts`; `Stimulus` e `ExperimentConfig` em
  `experimentStore.svelte.ts`) e nunca redeclarados.
- Uma regra (validação, cálculo, formato) tem uma única implementação; o segundo
  lugar que precisar dela a importa.
- Nenhum componente acessa `window.webgazer` diretamente; tudo passa pelo
  `gazeStore`.

## Specs (SDD)

- `specs/aceitas/`: o que o sistema faz hoje; obrigatório para qualquer tarefa
  que toque no assunto.
- `specs/planejadas/`: rascunhos e features em andamento; ignore, a menos que a
  tarefa atual pertença a uma delas.
- Cada spec é granular: um ator e um resultado verificável, resumidos num
  critério `C-NNN` (skill writing-specs). Um épico vira várias specs, ligadas
  por `Depende de:`.
- Cada feature é uma pasta com `spec.md`, `plan.md` e `tasks.md`. A pasta
  inteira passa de `planejadas/` para `aceitas/` quando a feature estiver
  implementada e com os testes passando. Exceção: specs retroativas, que
  documentam código anterior ao SDD, têm só `spec.md` (ex.: `000-experimento-local`).
- Toda spec tem diagramas Mermaid (fluxo e, quando houver, troca de dados e
  entidades), conforme a skill writing-specs.
- Todo `plan.md` começa pela "Verificação da constituição" (`specs/constitution.md`).
- Todo `plan.md` de spec que cria ou altera dados tem a seção "Modelo de dados":
  o que muda em `dados/modelo-de-dados.md` e a migração do Prisma.
- Mudança de comportamento: atualize a spec antes do código.

## Fluxo de trabalho

1. Se a tarefa pedida mudar comportamento e ainda não tiver spec, comece pela
   skill writing-specs; nada de plano ou código antes da spec confirmada.
2. Só implemente o que estiver em uma tarefa do `tasks.md` da feature atual,
   uma tarefa por vez.
3. Altere apenas o necessário para a tarefa. Exceção: criar e atualizar
   `README.md` e `TLDR.md` conforme a skill helpful-documentation. Se outro
   código precisar de refatoração, não refatore: proponha uma nova tarefa e pare.
4. Se a tarefa estiver ambígua ou contradisser a spec, pergunte antes de codar.
5. Nunca altere um teste só para fazê-lo passar (skill clean-tests).

## Convenções

- **Idioma:** documentação, specs e nomes de testes (`describe`/`it`) em
  português; código (identificadores, nomes de arquivo) e mensagens de commit
  em inglês.
- **Glossário:**

  | Português | Código |
  | :--- | :--- |
  | Pesquisador | `Researcher` |
  | Experimento | `Experiment` |
  | Estímulo | `Stimulus` |
  | Sessão de participação | `Session` |
  | Código do participante | `participantCode` |
  | Registro de olhar | `GazeRecord` |
  | Calibração | `Calibration` |

- **Interface sem jargão técnico:** todo texto visível ao pesquisador ou ao
  participante é em português simples. Termos técnicos (ex.: filtro de Kalman,
  viewport, timestamp) não aparecem na tela sem uma explicação curta e clara.
- **Participante sem atrito:** nunca precisa de cadastro, login ou instalação;
  do link à tela de agradecimento, cada passo tem uma instrução curta do que fazer.
- **Svelte 5 com runes**, sem sintaxe legada (skill svelte-core-bestpractices).
- **Estado compartilhado:** o padrão atual são módulos `.svelte.ts` com `$state`
  no nível do módulo, expostos por getters (ex.: `experimentStore`). É o padrão
  aceito até o `plan.md` decidir outro.
- **TypeScript strict;** nenhum `any` sem comentário justificando.
- **Regras de código** (complementam a skill clean-code; quando forem mais
  rígidas que ela, prevalecem):
  - sem `else`: use retornos antecipados;
  - arquivos com no máximo 50 linhas;
  - pastas com no máximo 10 arquivos;
  - coordenadas como objetos `Point { x, y }` (importado de `GazeStore.svelte.ts`);
  - cálculos puros, sem dependência de DOM, em `src/lib/math`.
  Arquivos existentes que excedem esses limites só mudam dentro de uma tarefa.
- **Privacidade:** nenhuma imagem ou vídeo da webcam sai do navegador do
  participante; só coordenadas de olhar e metadados técnicos.
- **Segredos:** nunca commitar; toda variável de ambiente nova vai documentada
  em `.env.example`.

## Skills disponíveis

- **clean-code** — ao escrever, alterar ou revisar código de produção ou de teste.
- **clean-tests** — ao escrever, alterar, revisar ou corrigir testes.
- **grilling** — para sabatinar um plano ou decisão, ou clarificar uma spec.
- **writing-specs** — antes de qualquer tarefa que mude comportamento sem spec; escreve uma spec granular por vez.
- **helpful-documentation** — ao criar, alterar ou visitar código, pastas ou docs; mantém `README.md` e `TLDR.md` sincronizados.
- **svelte-code-writer** — obrigatória ao criar, editar ou analisar `.svelte` ou `.svelte.ts`/`.svelte.js`.
- **svelte-core-bestpractices** — ao escrever, editar ou analisar componentes e módulos Svelte.
- **systematic-debugging** — diante de bug, falha de teste ou comportamento inesperado, antes de propor correção.
- **verification-before-completion** — antes de declarar algo pronto, fazer commit ou abrir PR.

## Comandos

- `npm install` — instala as dependências.
- `npm run dev` — servidor de desenvolvimento do Vite.
- `npm run build` — build de produção em `dist/`.
- `npm run preview` — serve o build localmente.
- `npm run check` — `svelte-check` com `tsconfig.app.json` e `tsc` com `tsconfig.node.json`.
- `npm test` — Vitest em modo observação.
- `npm run test:run` — Vitest uma vez (jsdom, `src/**/*.test.ts`).
- `docker compose up` — build com Node 22 e serve `dist/` via nginx em `http://localhost:8080`.

Testes no navegador (E2E): a definir no plan.md.

## Definição de pronto

1. `npm run check` limpo.
2. `npm run test:run` passando.
3. Lógica nova com testes reais em Dado-Quando-Então (clean-tests), sem nenhum
   teste enfraquecido.
4. `README.md` e `TLDR.md` das pastas tocadas atualizados (helpful-documentation).
5. Tarefa marcada com `[x]` no `tasks.md`.
6. Diff restrito à tarefa e revisável de uma vez; commit em inglês (`feat:`,
   `fix:`, `docs:`, `test:`, `refactor:`).
7. Evidência da verificação mostrada antes de declarar pronto
   (verification-before-completion).
