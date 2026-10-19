---
name: clean-tests
description: Diretrizes para testes — reais e verificados na fronteira, estruturados em Dado-Quando-Então e nunca alterados só para passar. Use sempre que for escrever, alterar, revisar ou corrigir testes neste projeto.
---

# Diretrizes de testes limpos

Testes reais e verificados na fronteira, estruturados em Dado-Quando-Então e
nunca alterados só para passar.

Siga as diretrizes da skill `clean-code`, com estes acréscimos para testes.

## Testes são reais, ou não existem

Todo teste exercita comportamento real e verifica algo que falharia se o código
quebrasse. Um teste que não pode falhar é pior do que nenhum teste — ele dá uma
falsa confiança. Nunca escreva:

- asserções tautológicas (`expect(true).toBe(true)`);
- um mock verificado contra ele mesmo, que só prova que o mock foi configurado;
- um teste que executa o código mas não verifica nada relevante sobre o resultado.

Verifique resultados observáveis: valores de retorno, estado persistido, eventos
emitidos, saída renderizada, status e corpo da resposta HTTP, conteúdo do CSV
gerado.

## Nunca altere um teste para fazê-lo passar

Um teste falhando é um sinal — corrija o código. Só altere o teste quando o
requisito que ele representa realmente mudou (ou seja, a spec mudou), e diga isso
explicitamente na alteração. Nunca enfraqueça uma asserção, apague um caso,
afrouxe um matcher ou adicione `.skip` / `.only` para chegar ao verde. Mockar cada
vez mais partes do sistema até o teste passar é o mesmo erro disfarçado.

Se um teste precisar ser desativado temporariamente por um motivo legítimo de
infraestrutura, documente isso em um comentário no código com o motivo e a tarefa
do `tasks.md` que vai reativá-lo, e avise o desenvolvedor — nunca use `.skip`
silenciosamente para chegar ao verde.

## Estruture todo teste como Dado-Quando-Então

Escreva testes no estilo Gherkin/BDD: cada teste é lido como um cenário, com um
**Dado** (contexto), um **Quando** (ação) e um **Então** (resultado esperado).
Expresse isso de forma nativa no Vitest — o `describe` nomeia a funcionalidade ou o
cenário e o corpo segue a ordem Dado → Quando → Então — sem adicionar um runner
pesado (como Cucumber).

Os nomes de `describe` e `it` são escritos em português; o código (variáveis,
funções, tipos) continua em inglês.

```ts
describe('Funcionalidade: exportação de CSV', () => {
  it('Cenário: sem registros de olhar, o CSV contém apenas o cabeçalho', () => {
    // Dado nenhum registro de olhar coletado
    const rows: ExportRow[] = [];

    // Quando o CSV é gerado
    const csv = exportToCsv(rows);

    // Então o arquivo tem uma única linha
    expect(csv.split('\n')).toHaveLength(1);
  });
});
```

Um comportamento por cenário. O nome do `it` descreve o comportamento esperado,
não a implementação.

## Teste o comportamento na fronteira

Teste a borda pública — uma rota HTTP, uma função exportada de um serviço ou
store, um componente renderizado — e não detalhes internos privados nem o próprio
framework. Refatorar a parte interna nunca deve quebrar um teste de
comportamento.

Em testes unitários, substitua por fakes ou stubs apenas o que é de fato I/O
externo: a webcam e o WebGazer, requisições HTTP, relógio e timers
(`vi.useFakeTimers`). Não mocke partes que pertencem ao mesmo módulo — teste-as
juntas.

Cubra todos os caminhos que importam, especialmente os de erro: uma rota que
responde 400 (dados inválidos), 401 (sem login), 403 (experimento de outro
pesquisador), 404 (link inexistente) ou 409 (coleta encerrada) merece um cenário
para cada caso.

## Importe a fonte da verdade

Tipe os testes importando os tipos do próprio código (por exemplo, `ExportRow`,
`GazeEntry`, `Stimulus`, `ExperimentConfig` e os tipos do banco/API definidos no
`plan.md`); nunca redeclare uma estrutura dentro do teste. Uma mudança de contrato
deve se propagar para os testes através do compilador.

Compartilhe fixtures, builders e fábricas de mocks. Nunca compartilhe lógica de
asserção nem a narrativa Dado-Quando-Então. Funções auxiliares compartilhadas só
podem preparar dados ou construir entradas; toda chamada a `expect()` deve ficar
exclusivamente no corpo do teste. Um cenário declara o seu próprio Dado e verifica
o seu próprio Então, mesmo quando um cenário vizinho parece parecido — essa
repetição é o que permite ler o teste isoladamente, e eliminá-la é o caminho para
uma suíte deixar de descrever comportamento.

Dados de teste do banco passam por um módulo de seed compartilhado, não por cópias
locais. Quando um teste precisar de um estado que os seeds não conseguem
expressar, amplie um seed para que o caso vire uma fixture nomeada que todos os
testes podem usar.

## Ferramentas

| Camada                         | Ferramenta                                              |
| ------------------------------ | ------------------------------------------------------- |
| Unidade (stores, serviços, math) | Vitest                                                |
| Componente (Svelte)            | Vitest + Testing Library (`@testing-library/svelte`) + jsdom |
| API ponta a ponta              | Vitest + banco SQLite temporário por execução (detalhes no `plan.md`) |
| Navegador ponta a ponta        | A definir no `plan.md` (candidato: Playwright)          |

## Isolamento

Os testes nunca dependem de ordem nem de estado compartilhado. Testes de API usam
um banco temporário (um por execução, por exemplo SQLite em memória ou em arquivo
temporário), nunca o banco de desenvolvimento. Reinicie o estado entre os testes —
inclusive os stores Svelte, que vivem no nível do módulo.

## Localização e nomes

Coloque os testes de unidade e integração junto do código, como `*.test.ts`, com o
nome da unidade testada (por exemplo, `CsvService.ts` → `CsvService.test.ts`). A
localização dos testes de navegador ponta a ponta será definida no `plan.md`.

## Testes existentes

Os testes que já existem no projeto não seguem todos o formato Dado-Quando-Então.
Não os reescreva por conta própria: só altere um teste existente quando a tarefa
atual do `tasks.md` exigir.
