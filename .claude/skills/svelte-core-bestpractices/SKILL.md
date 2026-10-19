---
name: svelte-core-bestpractices
description: Orientações para escrever código Svelte rápido, robusto e moderno. Carregue esta skill sempre que estiver em um projeto Svelte e for solicitado a escrever/editar ou analisar um componente ou módulo Svelte. Abrange reatividade, tratamento de eventos, estilização, integração com bibliotecas e mais.
---

## `$state`

Use a rune `$state` apenas para variáveis que devem ser _reativas_ — em outras palavras, variáveis que fazem um `$effect`, um `$derived` ou uma expressão de template ser atualizado. Todo o resto pode ser uma variável normal.

Objetos e arrays (`$state({...})` ou `$state([...])`) se tornam profundamente reativos, o que significa que mutações vão disparar atualizações. Isso tem um custo: em troca da reatividade granular, os objetos precisam ser envolvidos em proxies, o que gera overhead de desempenho. Nos casos em que você lida com objetos grandes que são apenas reatribuídos (e não mutados), use `$state.raw` no lugar. Esse costuma ser o caso de respostas de API, por exemplo.

## `$derived`

Para calcular algo a partir do state, use `$derived` em vez de `$effect`:

```js
// do this
let square = $derived(num * num);

// don't do this
let square;

$effect(() => {
	square = num * num;
});
```

> [!NOTE] `$derived` recebe uma expressão, _não_ uma função. Se você precisar usar uma função (porque a expressão é complexa, por exemplo), use `$derived.by`.

Deriveds são graváveis — você pode atribuir valores a eles, assim como com `$state`, exceto que eles serão reavaliados quando sua expressão mudar.

Se a expressão do derived for um objeto ou array, ela será retornada como está — ela _não_ se torna profundamente reativa. Você pode, no entanto, usar `$state` dentro de `$derived.by` nos raros casos em que precisar disso.

## `$effect`

Effects são uma válvula de escape e devem ser evitados na maioria dos casos. Em particular, evite atualizar state dentro de effects.

- Se você precisa sincronizar state com uma biblioteca externa como D3, geralmente é mais limpo usar [`{@attach ...}`](references/attach.md)
- Se você precisa executar algum código em resposta a uma interação do usuário, coloque o código diretamente em um event handler ou use uma [function binding](references/bind.md), conforme o caso
- Se você precisa registrar valores em log para fins de depuração, use [`$inspect`](references/inspect.md)
- Se você precisa observar algo externo ao Svelte, use [`createSubscriber`](references/svelte-reactivity.md)

Nunca envolva o conteúdo de um effect em `if (browser) {...}` ou algo semelhante — effects não são executados no servidor.

## `$props`

Trate props como se elas fossem mudar. Por exemplo, valores que dependem de props normalmente devem usar `$derived`:

```js
// @errors: 2451
let { type } = $props();

// do this
let color = $derived(type === 'danger' ? 'red' : 'green');

// don't do this — `color` will not update if `type` changes
let color = type === 'danger' ? 'red' : 'green';
```

## `$inspect.trace`

`$inspect.trace` é uma ferramenta de depuração para reatividade. Se algo não está atualizando corretamente ou está sendo executado mais vezes do que deveria, você pode adicionar `$inspect.trace(label)` como a primeira linha de um `$effect` ou `$derived.by` (ou de qualquer função que eles chamem) para rastrear suas dependências e descobrir qual delas disparou uma atualização.

## Bloco `#key`

Embora o bloco `#key` seja útil quando você quer que transitions/animations sejam executadas quando uma determinada expressão muda, ele pode ser muito custoso — ele desmonta todos os elementos/componentes internos a cada vez, então deve ser usado com moderação. Em vez de usar `#key` para fazer com que expressões no bloco `<script>` de um componente filho sejam reexecutadas, por exemplo, considere envolver essas expressões em `$derived`.

## Eventos

Qualquer atributo de elemento que comece com `on` é tratado como um event listener:

```svelte
<button onclick={() => {...}}>click me</button>

<!-- attribute shorthand also works -->
<button {onclick}>...</button>

<!-- so do spread attributes -->
<button {...props}>...</button>
```

Se você precisar adicionar listeners a `window` ou `document`, pode usar `<svelte:window>` e `<svelte:document>`:

```svelte
<svelte:window onkeydown={...} />
<svelte:document onvisibilitychange={...} />
```

Evite usar `onMount` ou `$effect` para isso.

## Snippets

[Snippets](references/snippet.md) são uma forma de definir trechos reutilizáveis de markup que podem ser instanciados com a tag [`{@render ...}`](references/render.md) ou passados para componentes como props. Eles devem ser declarados dentro do template.

```svelte
{#snippet greeting(name)}
	<p>hello {name}!</p>
{/snippet}

{@render greeting('world')}
```

> [!NOTE] Snippets declarados no nível superior de um componente (ou seja, não dentro de elementos ou blocos) podem ser referenciados dentro do `<script>`. Um snippet que não referencia o state do componente também fica disponível em um `<script module>`, caso em que pode ser exportado para uso por outros componentes.

## Blocos each

Prefira usar [blocos each com chave (keyed)](references/each.md) — isso melhora o desempenho ao permitir que o Svelte insira ou remova itens cirurgicamente, em vez de atualizar o DOM pertencente aos itens existentes.

> [!NOTE] A chave _deve_ identificar o objeto de forma única. Não use o índice como chave.

Evite desestruturação se você precisar mutar o item (com algo como `bind:value={item.count}`, por exemplo).

## Usando variáveis JavaScript no CSS

Se você tem uma variável JS que quer usar dentro do CSS, pode definir uma CSS custom property com a diretiva `style:`.

```svelte
<div style:--columns={columns}>...</div>
```

Depois, você pode referenciar `var(--columns)` dentro do `<style>` do componente.

## Estilizando componentes filhos

O CSS no `<style>` de um componente tem escopo restrito a esse componente. Se um componente pai precisa controlar os estilos do filho, a forma preferida é usar CSS custom properties:

```svelte
<!-- Parent.svelte -->
<Child --color="red" />

<!-- Child.svelte -->
<h1>Hello</h1>

<style>
	h1 {
		color: var(--color);
	}
</style>
```

Se isso for impossível (por exemplo, o componente filho vem de uma biblioteca), você pode usar `:global` para sobrescrever estilos:

```svelte
<div>
	<Child />
</div>

<style>
	div :global {
		h1 {
			color: red;
		}
	}
</style>
```

## Context

Considere usar context em vez de declarar state em um módulo compartilhado. Isso restringe o escopo do state à parte da aplicação que precisa dele e elimina a possibilidade de ele vazar entre usuários durante a renderização no servidor (server-side rendering).

Use `createContext` em vez de `setContext` e `getContext`, pois ele oferece segurança de tipos.

## Svelte assíncrono

Se estiver usando a versão 5.36 ou superior, você pode usar [await expressions](references/await-expressions.md) e [hydratable](references/hydratable.md) para usar promises diretamente dentro de componentes. Observe que esses recursos exigem que a opção `experimental.async` esteja habilitada nas opções do plugin em `vite.config.js` ou em `svelte.config.js`, pois ainda não são considerados totalmente estáveis.

## Evite recursos legados

Sempre use o modo runes para código novo e evite recursos que têm substitutos mais modernos:

- use `$state` em vez de reatividade implícita (por exemplo, `let count = 0; count += 1`)
- use `$derived` e `$effect` em vez de atribuições e declarações `$:` (mas só use effects quando não houver solução melhor)
- use `$props` em vez de `export let`, `$$props` e `$$restProps`
- use `onclick={...}` em vez de `on:click={...}`
- use `{#snippet ...}` e `{@render ...}` em vez de `<slot>`, `$$slots` e `<svelte:fragment>`
- use `<DynamicComponent>` em vez de `<svelte:component this={DynamicComponent}>`
- use `import Self from './ThisComponent.svelte'` e `<Self>` em vez de `<svelte:self>`
- use classes com campos `$state` para compartilhar reatividade entre componentes, em vez de usar stores
- use `{@attach ...}` em vez de `use:action`
- use arrays e objetos no estilo clsx em atributos `class`, em vez da diretiva `class:`

---

_Traduzido para o português a partir de [sveltejs/ai-tools](https://github.com/sveltejs/ai-tools) (`tools/skills/svelte-core-bestpractices`), licença MIT — Copyright (c) 2026 Svelte Contributors. Veja `LICENSE` nesta pasta._
