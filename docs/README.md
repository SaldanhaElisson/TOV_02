# Documentação do TOV

- **[../AGENTS.md](../AGENTS.md)** — instruções canônicas para agentes de IA: mapa do repositório, convenções, fluxo de trabalho e definição de pronto.
- **[../specs/constitution.md](../specs/constitution.md)** — princípios inegociáveis do projeto, que toda spec, plano e código precisam respeitar.
- **[decisoes/](./decisoes/)** — registros de decisão (ADR): o que foi decidido, por quê e quais alternativas foram descartadas. [0001](./decisoes/0001-backend-nestjs-prisma-postgres.md): backend com NestJS, Prisma e PostgreSQL 18.
- **[DATA_DICTIONARY.md](./DATA_DICTIONARY.md)** — formato do CSV exportado: as 7 colunas, o `GazeData_JSON` e as regras de escape.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — visão geral da arquitetura e dos stores. *Desatualizado — descreve a versão sem backend; será reescrito após o plan.md.*
- **[TASKS.md](./TASKS.md)** — backlog de tarefas. *Obsoleto — backlog da migração para Svelte, substituído pelas specs.*
- **[../specs/aceitas/](../specs/aceitas/)** — specs do que o sistema faz hoje. O protocolo de calibração, validação e execução está em [000-experimento-local](../specs/aceitas/000-experimento-local/spec.md).
- **[../specs/planejadas/](../specs/planejadas/)** — specs de features em andamento ou em rascunho.
- **[../dados/](../dados/TLDR.md)** — estudos sobre armazenamento dos dados coletados. O [benchmark de armazenamento do olhar](../dados/armazenamento-do-olhar/README.md) compara PostgreSQL 18 e MongoDB 8.

Este repositório é a fonte da verdade da documentação do projeto.
