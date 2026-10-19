A partir do Svelte 5.36, você pode usar a palavra-chave `await` dentro dos seus componentes em três lugares onde antes ela não estava disponível:

- no nível superior do `<script>` do seu componente
- dentro de declarações `$derived(...)`
- dentro do seu markup

Este recurso é atualmente experimental, e você precisa ativá-lo adicionando a opção `experimental.async` onde quer que você [configure](https://svelte.dev/docs/kit/configuration/llms.txt) o Svelte, geralmente em `svelte.config.js`:

```js
/// file: svelte.config.js
export default {
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};
```

A flag experimental será removida no Svelte 6.

## Atualizações sincronizadas

Quando uma expressão `await` depende de um determinado state, mudanças nesse state não serão refletidas na UI até que o trabalho assíncrono seja concluído, para que a UI não fique em um estado inconsistente. Em outras palavras, em um exemplo como este...

<!-- codeblock:start {"title":"Synchronized updates"} -->

```svelte
<!--- file: App.svelte --->
<script>
	let a = $state(1);
	let b = $state(2);

	async function add(a, b) {
		await new Promise((f) => setTimeout(f, 500)); // artificial delay
		return a + b;
	}
</script>

<input type="number" bind:value={a}>
<input type="number" bind:value={b}>

<p>{a} + {b} = {await add(a, b)}</p>
```

<!-- codeblock:end -->

...se você incrementar `a`, o conteúdo do `<p>` _não_ será atualizado imediatamente para exibir isto —

```html
<p>2 + 2 = 3</p>
```

— em vez disso, o texto será atualizado para `2 + 2 = 4` quando `add(a, b)` for resolvida.

Atualizações podem se sobrepor — uma atualização rápida será refletida na UI enquanto uma atualização lenta anterior ainda estiver em andamento.

## Concorrência

O Svelte fará o máximo de trabalho assíncrono possível em paralelo. Por exemplo, se você tiver duas expressões `await` no seu markup...

```svelte
<p>{await one(x)}</p>
<p>{await two(y)}</p>
```

...ambas as funções serão executadas ao mesmo tempo, pois são expressões independentes, embora sejam _visualmente_ sequenciais.

Isso não se aplica a expressões `await` sequenciais dentro do seu `<script>` ou dentro de funções async — elas são executadas como qualquer outro JavaScript assíncrono. Uma exceção é que expressões `$derived` independentes serão atualizadas de forma independente, embora sejam executadas sequencialmente quando são criadas pela primeira vez:

```js
// `b` will not be created until `a` has resolved,
// but once created they will update independently
// even if `x` and `y` update simultaneously
let a = $derived(await one(x));
let b = $derived(await two(y));
```

> [!NOTE] Se você escrever código assim, espere que o Svelte emita um aviso [`await_waterfall`](https://svelte.dev/docs/svelte/runtime-warnings/llms.txt#Client-warnings-await_waterfall)

## Indicando estados de carregamento

Para renderizar uma UI de placeholder, você pode envolver o conteúdo em um `<svelte:boundary>` com um snippet [`pending`](https://svelte.dev/docs/svelte/svelte-boundary/llms.txt#Properties-pending). Ele será exibido quando o boundary for criado pela primeira vez, mas não em atualizações subsequentes, que são coordenadas globalmente.

Depois que o conteúdo de um boundary for resolvido pela primeira vez e tiver substituído o snippet `pending`, você pode detectar trabalho assíncrono subsequente com [`$effect.pending()`](https://svelte.dev/docs/svelte/$effect/llms.txt#$effect.pending). É isso que você usaria para exibir um spinner de "estamos validando sua entrada de forma assíncrona" ao lado de um campo de formulário, por exemplo.

Você também pode usar [`settled()`](https://svelte.dev/docs/svelte/svelte/llms.txt#settled) para obter uma promise que é resolvida quando a atualização atual estiver concluída:

```js
import { tick, settled } from 'svelte';

async function onclick() {
	updating = true;

	// without this, the change to `updating` will be
	// grouped with the other changes, meaning it
	// won't be reflected in the UI
	await tick();

	color = 'octarine';
	answer = 42;

	await settled();

	// any updates affected by `color` or `answer`
	// have now been applied
	updating = false;
}
```

## Tratamento de erros

Erros em expressões `await` serão propagados até o [error boundary](https://svelte.dev/docs/svelte/svelte-boundary/llms.txt) mais próximo.

## Renderização no servidor

O Svelte oferece suporte à renderização assíncrona no servidor (SSR) com a API `render(...)`. Para usá-la, basta aguardar (await) o valor de retorno:

```js
/// file: server.js
import { render } from 'svelte/server';
import App from './App.svelte';

const { head, body } = +++await+++ render(App);
```

> [!NOTE] Se você está usando um framework como o SvelteKit, isso é feito por você.

Se um `<svelte:boundary>` com um snippet `pending` for encontrado durante o SSR, esse snippet será renderizado enquanto o restante do conteúdo é ignorado. Todas as expressões `await` encontradas fora de boundaries com snippets `pending` serão resolvidas e terão seu conteúdo renderizado antes de `await render(...)` retornar.

> [!NOTE] No futuro, planejamos adicionar uma implementação com streaming que renderiza o conteúdo em segundo plano.

## Forking

A API [`fork(...)`](https://svelte.dev/docs/svelte/svelte/llms.txt#fork), adicionada na versão 5.42, torna possível executar expressões `await` que você _espera_ que aconteçam em um futuro próximo. Ela se destina principalmente a frameworks como o SvelteKit, para implementar preloading quando (por exemplo) os usuários sinalizam a intenção de navegar.

```svelte
<script>
	import { fork } from 'svelte';
	import Menu from './Menu.svelte';

	let open = $state(false);

	/** @type {import('svelte').Fork | null} */
	let pending = null;

	function preload() {
		pending ??= fork(() => {
			open = true;
		});
	}

	function discard() {
		pending?.discard();
		pending = null;
	}
</script>

<button
	onfocusin={preload}
	onfocusout={discard}
	onpointerenter={preload}
	onpointerleave={discard}
	onclick={() => {
		pending?.commit();
		pending = null;

		// in case `pending` didn't exist
		// (if it did, this is a no-op)
		open = true;
	}}
>open menu</button>

{#if open}
	<!-- any async work inside this component will start
	     as soon as the fork is created -->
	<Menu onclose={() => open = false} />
{/if}
```

## Ressalvas

Por ser um recurso experimental, os detalhes de como o `await` é tratado (e de APIs relacionadas, como `$effect.pending()`) estão sujeitos a breaking changes fora de uma versão major do semver, embora pretendamos manter essas mudanças no mínimo absoluto.

## Breaking changes

Os effects são executados em uma ordem ligeiramente diferente quando a opção `experimental.async` é `true`. Especificamente, effects de _bloco_ como `{#if ...}` e `{#each ...}` agora são executados antes de um `$effect.pre` ou `beforeUpdate` no mesmo componente, o que significa que em situações muito raras.
