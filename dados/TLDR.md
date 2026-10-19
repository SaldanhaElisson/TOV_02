# dados/

Modelo de dados do TOV e estudos sobre como guardar os dados coletados.

- **[modelo-de-dados.md](./modelo-de-dados.md)**: fonte única do modelo de dados
  do backend (visão conceitual e modelo físico, com diagramas).

Cada estudo é uma pasta com um `README.md` (pergunta, método, resultados e
conclusão) e o código para repetir as medições.

| Estudo | Pergunta |
| :--- | :--- |
| [armazenamento-do-olhar/](./armazenamento-do-olhar/README.md) | PostgreSQL 18 ou MongoDB 8 para os registros de olhar? Uma linha por ponto ou um array por imagem? |

- Os estudos embasam decisões; a decisão em si é registrada no `plan.md` da spec
  correspondente (`specs/`).
- Cada estudo tem o próprio `package.json`; nada aqui entra no build do app.
