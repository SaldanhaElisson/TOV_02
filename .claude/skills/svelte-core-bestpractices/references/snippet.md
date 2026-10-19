```svelte
<!--- copy: false  --->
{#snippet name()}...{/snippet}
```

```svelte
<!--- copy: false  --->
{#snippet name(param1, param2, paramN)}...{/snippet}
```

Snippets, junto com as [render tags](https://svelte.dev/docs/svelte/@render/llms.txt), são uma forma de criar trechos reutilizáveis de markup dentro dos seus componentes. Em vez de escrever código duplicado como este...

```svelte
{#each images as image}
	{#if image.href}
		<a href={image.href}>
			<figure>
				<img src={image.src} alt={image.caption} width={image.width} height={image.height} />
				<figcaption>{image.caption}</figcaption>
			</figure>
		</a>
	{:else}
		<figure>
			<img src={image.src} alt={image.caption} width={image.width} height={image.height} />
			<figcaption>{image.caption}</figcaption>
		</figure>
	{/if}
{/each}
```

...você pode escrever isto:

```svelte
{#snippet figure(image)}
	<figure>
		<img src={image.src} alt={image.caption} width={image.width} height={image.height} />
		<figcaption>{image.caption}</figcaption>
	</figure>
{/snippet}

{#each images as image}
	{#if image.href}
		<a href={image.href}>
			{@render figure(image)}
		</a>
	{:else}
		{@render figure(image)}
	{/if}
{/each}
```

Assim como declarações de função, snippets podem ter um número arbitrário de parâmetros, que podem ter valores padrão, e você pode desestruturar cada parâmetro. No entanto, não é possível usar parâmetros rest.

## Escopo de snippets

Snippets podem ser declarados em qualquer lugar dentro do seu componente. Eles podem referenciar valores declarados fora deles mesmos, por exemplo na tag `<script>` ou em blocos `{#each ...}`...

<!-- codeblock:start {"title":"Snippets"} -->

```svelte
<!--- file: App.svelte --->
<script>
	let { message = `it's great to see you!` } = $props();
</script>

{#snippet hello(name)}
	<p>hello {name}! {message}!</p>
{/snippet}

{@render hello('alice')}
{@render hello('bob')}
```

<!-- codeblock:end -->

...e eles são 'visíveis' para tudo no mesmo escopo léxico (ou seja, elementos irmãos e os filhos desses irmãos):

```svelte
<div>
	{#snippet x()}
		{#snippet y()}...{/snippet}

		<!-- this is fine -->
		{@render y()}
	{/snippet}

	<!-- this will error, as `y` is not in scope -->
	{@render y()}
</div>

<!-- this will also error, as `x` is not in scope -->
{@render x()}
```

Snippets podem referenciar a si mesmos e uns aos outros:

<!-- codeblock:start {"title":"Self-referencing snippets"} -->

```svelte
<!--- file: App.svelte --->
{#snippet blastoff()}
	<span>🚀</span>
{/snippet}

{#snippet countdown(n)}
	{#if n > 0}
		<span>{n}...</span>
		{@render countdown(n - 1)}
	{:else}
		{@render blastoff()}
	{/if}
{/snippet}

{@render countdown(10)}
```

<!-- codeblock:end -->

## Passando snippets para componentes

### Props explícitas

Dentro do template, snippets são valores como quaisquer outros. Sendo assim, eles podem ser passados para componentes como props:

<!-- codeblock:start {"title":"Explicit snippet props"} -->

```svelte
<!--- file: App.svelte --->
<script>
	import Table from './Table.svelte';

	const fruits = [
		{ name: 'apples', qty: 5, price: 2 },
		{ name: 'bananas', qty: 10, price: 1 },
		{ name: 'cherries', qty: 20, price: 0.5 }
	];
</script>

{#snippet header()}
	<th>fruit</th>
	<th>qty</th>
	<th>price</th>
	<th>total</th>
{/snippet}

{#snippet row(d)}
	<td>{d.name}</td>
	<td>{d.qty}</td>
	<td>{d.price}</td>
	<td>{d.qty * d.price}</td>
{/snippet}

<Table data={fruits} +++{header} {row}+++ />
```

```svelte
<!--- file: Table.svelte --->
<script>
	let { data, header, row } = $props();
</script>

<table>
	{#if header}
		<thead>
			<tr>{@render header()}</tr>
		</thead>
	{/if}

	<tbody>
		{#each data as d}
			<tr>{@render row(d)}</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		text-align: left;
		border-spacing: 0;
	}

	tbody tr:nth-child(2n+1) {
		background: ButtonFace;
	}

	table :global(th), table :global(td) {
		padding: 0.5em;
	}
</style>
```

<!-- codeblock:end -->

Pense nisso como passar conteúdo, em vez de dados, para um componente. O conceito é semelhante aos slots em web components.

### Props implícitas

Como conveniência de escrita, snippets declarados diretamente _dentro_ de um componente se tornam implicitamente props _do_ componente:

<!-- codeblock:start {"title":"Implicit snippet props"} -->

```svelte
<!--- file: App.svelte --->
<script>
	import Table from './Table.svelte';

	const fruits = [
		{ name: 'apples', qty: 5, price: 2 },
		{ name: 'bananas', qty: 10, price: 1 },
		{ name: 'cherries', qty: 20, price: 0.5 }
	];
</script>

<Table data={fruits}>
	{#snippet header()}
		<th>fruit</th>
		<th>qty</th>
		<th>price</th>
		<th>total</th>
	{/snippet}

	{#snippet row(d)}
		<td>{d.name}</td>
		<td>{d.qty}</td>
		<td>{d.price}</td>
		<td>{d.qty * d.price}</td>
	{/snippet}
</Table>
```

```svelte
<!--- file: Table.svelte --->
<script>
	let { data, header, row } = $props();
</script>

<table>
	{#if header}
		<thead>
			<tr>{@render header()}</tr>
		</thead>
	{/if}

	<tbody>
		{#each data as d}
			<tr>{@render row(d)}</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		text-align: left;
		border-spacing: 0;
	}

	tbody tr:nth-child(2n+1) {
		background: ButtonFace;
	}

	table :global(th), table :global(td) {
		padding: 0.5em;
	}
</style>
```

<!-- codeblock:end -->

### Snippet `children` implícito

Qualquer conteúdo dentro das tags do componente que _não_ seja uma declaração de snippet passa a fazer parte, implicitamente, do snippet `children`:

<!-- codeblock:start {"title":"Implicit children snippet","selected":"Button.svelte"} -->

```svelte
<!--- file: App.svelte --->
<script>
	import Button from './Button.svelte';
</script>

<Button>click me</Button>
```

```svelte
<!--- file: Button.svelte --->
<script>
	let { children } = $props();
</script>

<!-- result will be <button>click me</button> -->
<button>{@render children()}</button>
```

<!-- codeblock:end -->

> [!NOTE] Observe que você não pode ter uma prop chamada `children` se também tiver conteúdo dentro do componente — por esse motivo, você deve evitar ter props com esse nome

### Props de snippet opcionais

Você pode declarar props de snippet como opcionais. Você pode usar optional chaining para não renderizar nada se o snippet não estiver definido...

```svelte
<script>
    let { children } = $props();
</script>

{@render children?.()}
```

...ou usar um bloco `#if` para renderizar um conteúdo de fallback:

```svelte
<script>
    let { children } = $props();
</script>

{#if children}
    {@render children()}
{:else}
    fallback content
{/if}
```

## Tipando snippets

Snippets implementam a interface `Snippet`, importada de `'svelte'`:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		data: any[];
		children: Snippet;
		row: Snippet<[any]>;
	}

	let { data, children, row }: Props = $props();
</script>
```

Com essa mudança, sublinhados vermelhos aparecerão se você tentar usar o componente sem fornecer uma prop `data` e um snippet `row`. Observe que o argumento de tipo fornecido a `Snippet` é uma tupla, já que snippets podem ter vários parâmetros.

Podemos deixar isso ainda mais rigoroso declarando um generic, para que `data` e `row` se refiram ao mesmo tipo:

```svelte
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	let {
		data,
		children,
		row
	}: {
		data: T[];
		children: Snippet;
		row: Snippet<[T]>;
	} = $props();
</script>
```

## Exportando snippets

Snippets declarados no nível superior de um arquivo `.svelte` podem ser exportados a partir de um `<script module>` para uso em outros componentes, desde que não referenciem nenhuma declaração de um `<script>` que não seja de módulo (seja diretamente ou indiretamente, por meio de outros snippets):

<!-- codeblock:start {"title":"Exported snippets","selected":"snippets.svelte"} -->

```svelte
<!--- file: App.svelte --->
<script>
	import { add } from './snippets.svelte';
</script>

{@render add(1, 2)}

```

```svelte
<!--- file: snippets.svelte --->
<script module>
	export { add };
</script>

{#snippet add(a, b)}
	{a} + {b} = {a + b}
{/snippet}
```

<!-- codeblock:end -->

> [!NOTE]
> Isto requer o Svelte 5.5.0 ou mais recente

## Snippets programáticos

Snippets podem ser criados programaticamente com a API [`createRawSnippet`](https://svelte.dev/docs/svelte/svelte/llms.txt#createRawSnippet). Ela se destina a casos de uso avançados.

## Snippets e slots

No Svelte 4, conteúdo pode ser passado para componentes usando [slots](https://svelte.dev/docs/svelte/legacy-slots/llms.txt). Snippets são mais poderosos e flexíveis, e por isso os slots foram descontinuados (deprecated) no Svelte 5.
