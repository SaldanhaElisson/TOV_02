# armazenamento-do-olhar/

Benchmark de armazenamento dos registros de olhar. Relatório completo em
[README.md](./README.md).

## Rodar

```bash
cd dados/armazenamento-do-olhar
npm install
./run.sh                            # 1.000 sessões = 6 milhões de pontos por formato (~2,5 min)
SESSIONS=20 ./run.sh                # rodada rápida para conferir que funciona
CONCURRENCY=50 ./run.sh             # mais participantes enviando ao mesmo tempo
```

Cada linha impressa é o resultado de um formato, em JSON.

## Arquivos

- `run.sh`: sobe cada banco sozinho no Docker (4 CPUs, 4 GB), roda os formatos e apaga o contêiner.
- `scripts/`: código do benchmark (ver [scripts/TLDR.md](./scripts/TLDR.md)).
- `resultados.jsonl`: saída das 3 execuções registradas no README (campo `run`).

## Atenção

- Precisa de Docker e das portas **55432** (Postgres) e **57017** (Mongo) livres.
- `run.sh` apaga os contêineres `tov-bench-pg` e `tov-bench-mongo` se existirem.
- Tempos variam de máquina para máquina; compare os formatos entre si, não com outra máquina.
