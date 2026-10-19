# 0001 — Backend com NestJS, Prisma e PostgreSQL 18

**Data:** 2026-10-19
**Status:** Aceita
**Decidido por:** Elisson Saldanha (autor do projeto)

## Contexto

As specs do experimento remoto (conta de pesquisador, link de participação,
envio e download dos dados) exigem um servidor e um banco. Hoje o TOV roda só no
navegador.

## Decisão

| Camada | Escolha |
| :--- | :--- |
| Servidor | NestJS (TypeScript) |
| Acesso ao banco e migrações | Prisma |
| Banco | PostgreSQL 18, único banco do sistema, inclusive para os registros de olhar |

## Por quê

- **TypeScript nos dois lados:** o frontend já é TypeScript strict; tipos e regras
  podem ser compartilhados em vez de reescritos.
- **NestJS:** organiza o servidor em módulos (pesquisador, experimento, sessão),
  o que acompanha a divisão das specs e facilita testar cada parte.
- **Prisma:** schema declarativo, client tipado e migrações versionadas no
  repositório, o que ajuda a reproduzir o banco (constituição IX).
- **PostgreSQL:** os dados são relacionais (pesquisador → experimento → sessão →
  registros de olhar) e precisam de transação: a sessão só fica "concluída"
  junto com os dados dela.

## Alternativas descartadas

- **MongoDB para os registros de olhar (junto com o Postgres):** o benchmark em
  [dados/armazenamento-do-olhar](../../dados/armazenamento-do-olhar/README.md)
  mostrou que, no mesmo formato, o Postgres ocupa o mesmo espaço e grava mais
  rápido. Um segundo banco traria mais um serviço, mais um backup, nenhuma
  transação entre os dois e exclusão de dados (LGPD) em dois lugares.
- **Servidor sem framework (Express ou Fastify direto):** menos dependências, mas
  a organização em módulos e a injeção de dependência teriam de ser feitas à mão.

## Consequências

- O `docker compose up` passa a subir frontend, backend e PostgreSQL.
- A versão do Prisma precisa suportar o PostgreSQL 18; confirmar no `plan.md` da
  primeira spec com backend.
- O formato dos registros de olhar (uma linha por ponto ou um array por imagem)
  é decidido no `plan.md` da spec de envio dos dados, com base no benchmark.
- Continuam em aberto: hospedagem e testes no navegador (E2E).
