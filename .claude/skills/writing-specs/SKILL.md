---
name: writing-specs
description: Ajuda o usuário a escrever uma spec granular — um ator e um resultado verificável por spec — antes de qualquer plano ou código. Use sempre que o usuário pedir uma tarefa que mude comportamento e ainda não tenha spec em `specs/`, ou disser frases como "nova spec", "criar spec", "especificar", "quero fazer X" ou "nova feature".
---

# Escrevendo specs granulares

Uma spec descreve **um ator** alcançando **um resultado verificável**. Nada além
disso. Um épico com várias histórias não é uma spec: é uma lista de specs.

## A unidade: o critério

Toda spec nasce de uma única frase, o **critério**:

```
C-NNN: Um <ator> consegue <resultado> <restrição mensurável>.
```

- `NNN` é o mesmo número da pasta da spec (`specs/planejadas/NNN-slug/`).
- `<ator>` é `Pesquisador` ou `Participante` (glossário do `AGENTS.md`).
- `<restrição mensurável>` é o que torna o critério verificável: tempo, quantidade,
  condição ("sem login", "em outro computador", "depois de fechar o navegador").

Exemplos:

- C-002: Um pesquisador cria uma conta, entra e sai do sistema.
- C-004: Um pesquisador cria um experimento com 5 imagens e copia o link em menos de 5 minutos.
- C-006: Um participante abre o link em outro computador e vê as instruções sem fazer login.

## Teste de granularidade

Antes de escrever, aplique cada teste ao critério proposto:

1. **Tem "e" ligando dois resultados?** Divida. "Faz login e cria experimento" são
   duas specs. Um "e" dentro de um mesmo resultado é aceitável ("entra e sai").
2. **Pode ser demonstrado sozinho, de ponta a ponta, por quem usa?** Se não
   (ex.: "criar a tabela de sessões", "configurar o backend"), não é spec: é
   tarefa de um `tasks.md`.
3. **Precisa de mais de 5 cenários Dado-Quando-Então?** Provavelmente são duas specs.
4. **Precisa de algo que outra spec entrega?** Declare em `Depende de:` e não copie
   o conteúdo da outra spec.
5. **Fala de tipo de coluna, índice, framework ou endpoint?** Tire da spec. O
   modelo físico fica em `dados/modelo-de-dados.md` e é alterado pelo `plan.md`.

## Fluxo

1. **Descubra o contexto você mesmo.** Leia `specs/constitution.md`, as specs em
   `specs/aceitas/` e `specs/planejadas/` e `dados/modelo-de-dados.md`. Procure
   uma spec que já cubra o pedido, as specs de que ele depende e as entidades que
   já existem. Não pergunte ao usuário o que você pode ler.
2. **Proponha o critério.** Escreva a frase `C-NNN` e espere a confirmação.
3. **Aplique o teste de granularidade.** Se o pedido virar várias specs, mostre a
   lista (critério e dependências de cada uma, em ordem de dependência) e pergunte
   qual escrever agora. Escreva uma spec por vez.
4. **Esclareça as ambiguidades** daquela spec no formato de rodadas da skill
   `grilling`, com uma resposta recomendada por pergunta. Pergunte só o que muda
   cenários, casos de borda, dados ou o que fica fora de escopo.
5. **Escreva** `specs/planejadas/NNN-slug/spec.md` pelo modelo em
   [modelo.md](./modelo.md). `NNN` é o próximo número livre entre `aceitas/` e
   `planejadas/`; `slug` em português, curto, com hífens.
6. **Atualize a visão conceitual** em `dados/modelo-de-dados.md` se a spec criar
   uma entidade ou uma relação nova. O modelo físico não muda nesta etapa.
7. **Valide os diagramas** (ver abaixo) e **pare.** Mostre a spec e não escreva
   `plan.md`, `tasks.md` nem código na mesma etapa.

## Diagramas

Toda spec tem diagramas em Mermaid: são texto, ficam versionados com a spec e
aparecem desenhados no GitHub e no VS Code.

| Diagrama | Quando | Mostra |
| :--- | :--- | :--- |
| `flowchart` | sempre | o caminho do ator: o que ele faz, o que vê e onde o caminho se divide |
| `sequenceDiagram` | quando dados vão do navegador ao servidor ou voltam | quem envia o quê, em que ordem e o que acontece numa falha |
| `erDiagram` | quando a spec cria ou altera dados | entidades e relações, sem tipos nem colunas |

- Um diagrama responde a uma pergunta. Com mais de ~10 entidades ou ~12 caixas,
  divida em dois.
- Entidades com o nome do código (glossário do `AGENTS.md`: `Researcher`,
  `Experiment`, `Stimulus`, `Session`...); rótulos e textos em português, entre aspas.
- Diagrama e texto dizem a mesma coisa. Mudou um, mude o outro.
- Valide antes de concluir; o comando sai com erro se algum diagrama não desenhar:

  ```bash
  docker run --rm -u "$(id -u):$(id -g)" -v "$PWD":/data minlag/mermaid-cli \
    -i /data/<arquivo>.md -o /tmp/mermaid-check.md
  ```

## Regras

- Escreva em português simples, sem jargão técnico, do ponto de vista do ator.
- Cenários descrevem o que o ator vê ou faz, nunca o estado interno do sistema.
- A seção "Termos" define só o que a spec introduz ou usa num sentido próprio; os
  termos gerais ficam no glossário do `AGENTS.md`.
- Uma spec só fica com status "Pronta para o plano" quando não restam perguntas
  em aberto e o usuário confirmou.
- Uma spec com cenários que contradizem a constituição ou uma spec aceita é
  rejeitada: aponte o conflito e pergunte qual mudar.
