# scripts/

Código do benchmark. Entradas: `postgres.mjs rows|array` e `mongo.mjs docs|embedded`
(chamadas pelo `../run.sh`).

| Arquivo | Papel |
| :--- | :--- |
| `config.mjs` | Tamanho do teste: sessões, imagens, pontos, participantes simultâneos |
| `session.mjs` | Gera sessões falsas e determinísticas (mesma semente → mesmos pontos) |
| `csv.mjs` | Gera o CSV no formato do `src/lib/services/CsvService.ts` |
| `runner.mjs` | Envia as sessões em paralelo e mede o tempo de exportar o CSV |
| `report.mjs` | Calcula p50/p95 e imprime uma linha JSON por formato |
| `postgres-schema.mjs` | Tabelas, consulta de leitura e de tamanho no Postgres |
| `postgres-insert.mjs` | INSERTs em lote de cada formato |
| `postgres.mjs` | Benchmark do Postgres |
| `mongo.mjs` | Benchmark do Mongo |

- O CSV aqui é uma cópia do `CsvService.ts` em JavaScript; se o formato do
  `docs/DATA_DICTIONARY.md` mudar, atualize os dois.
- O Mongo grava com `{ w: 1, j: true }` para ter a mesma garantia de durabilidade
  do Postgres padrão; sem isso a comparação favorece o Mongo.
