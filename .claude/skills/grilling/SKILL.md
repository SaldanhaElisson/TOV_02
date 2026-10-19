---
name: grilling
description: Sabatina o usuário de forma insistente sobre um plano, decisão ou ideia, até não restar nenhuma decisão assumida em silêncio. Use quando o usuário quiser testar o próprio raciocínio ou disser frases como "me sabatine", "me questione", "me grelhe", "faça perguntas sobre o plano", "clarificar a spec" ou "grill".
---

Entreviste o usuário de forma insistente até chegarem a um entendimento comum.
Organize isso como uma **árvore de decisões**: cada decisão se ramifica nas
decisões que dependem dela.

Trabalhe a árvore em **rodadas**. A **fronteira** é o conjunto de todas as
decisões cujos pré-requisitos já estão resolvidos — as perguntas que você pode
fazer _agora_ sem adivinhar respostas que ainda não ouviu. Faça a fronteira
inteira em uma única rodada: numere cada pergunta e dê a sua resposta
recomendada. Depois, espere as respostas do usuário antes da próxima rodada.

Cada pergunta deve ter este formato:

```
❓ **P1** - **<título da pergunta>**: <corpo da pergunta, podendo ter vários parágrafos e várias opções de escolha>

➡️ <sua resposta recomendada>
```

Cada rodada respondida pelo usuário reorganiza a árvore — decisões resolvidas
empurram a fronteira para frente e liberam as perguntas que dependiam delas.
Recalcule a fronteira e faça a próxima rodada. Uma pergunta cuja resposta depende
de outra pergunta ainda aberta nesta rodada pertence a uma rodada _posterior_, não
a esta.

Descobrir _fatos_ é trabalho seu, nunca do usuário. Quando uma pergunta da
fronteira precisar de um fato do ambiente (arquivos, código, ferramentas etc.),
dispare um subagente para descobri-lo — não pergunte ao usuário nada que você
mesmo possa verificar. Não fique bloqueado por isso: uma investigação em andamento
é um pré-requisito ainda não resolvido, então apenas as perguntas que dependem
dela esperam o subagente responder — faça o restante da fronteira agora. As
_decisões_ são do usuário — apresente cada uma a ele e espere.

A sessão termina quando a fronteira estiver vazia: todos os ramos da árvore de
decisões visitados, nada assumido em silêncio. Não aja com base nela até o usuário
confirmar que vocês chegaram a um entendimento comum.

Neste projeto, ao final da sessão, registre as decisões tomadas no documento
correspondente (`spec.md` ou `plan.md` da feature em `specs/planejadas/`), sempre
após a confirmação do usuário.
