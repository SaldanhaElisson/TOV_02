Attachments são funções que são executadas em um [effect](https://svelte.dev/docs/svelte/$effect/llms.txt) quando um elemento é montado no DOM ou quando o [state](https://svelte.dev/docs/svelte/$state/llms.txt) lido dentro da função é atualizado.

Opcionalmente, elas podem retornar uma função que é chamada antes de o attachment ser reexecutado, ou depois que o elemento for removido do DOM.

> [!NOTE]
> Attachments estão disponíveis no Svelte 5.29 e versões mais recentes.

```svelte
<!--- file: App.svelte --->
<script>
	/** @type {import('svelte/attachments').Attachment} */
	function myAttachment(element) {
		console.log(element.nodeName); // 'DIV'

		return () => {
			console.log('cleaning up');
		};
	}
</script>

<div {@attach myAttachment}>...</div>
```

Um elemento pode ter qualquer quantidade de attachments.

## Fábricas de attachments

Um padrão útil é uma função, como `tooltip` neste exemplo, _retornar_ um attachment (demo:

```svelte
<!--- file: App.svelte --->
<script>
	import tippy from 'tippy.js';

	let content = $state('Hello!');

	/**
	 * @param {string} content
	 * @returns {import('svelte/attachments').Attachment}
	 */
	function tooltip(content) {
		return (element) => {
			const tooltip = tippy(element, { content });
			return tooltip.destroy;
		};
	}
</script>

<input bind:value={content} />

<button {@attach tooltip(content)}>
	Hover me
</button>
```

Como a expressão `tooltip(content)` é executada dentro de um [effect](https://svelte.dev/docs/svelte/$effect/llms.txt), o attachment será destruído e recriado sempre que `content` mudar. O mesmo aconteceria com qualquer state lido _dentro_ da função de attachment quando ela é executada pela primeira vez. (Se não é isso que você quer, veja [Controlando quando attachments são reexecutados](#Controlling-when-attachments-re-run).)

## Attachments inline

Attachments também podem ser criados inline (demo:

```svelte
<!--- file: App.svelte --->
<canvas
	width={32}
	height={32}
	{@attach (canvas) => {
		const context = canvas.getContext('2d');

		$effect(() => {
			context.fillStyle = color;
			context.fillRect(0, 0, canvas.width, canvas.height);
		});
	}}
></canvas>
```

> [!NOTE]
> O effect aninhado é executado sempre que `color` muda, enquanto o effect externo (onde `canvas.getContext(...)` é chamado) é executado apenas uma vez, já que não lê nenhum state reativo.

## Attachments condicionais

Valores falsy como `false` ou `undefined` são tratados como ausência de attachment, permitindo o uso condicional:

```svelte
<div {@attach enabled && myAttachment}>...</div>
```

## Passando attachments para componentes

Quando usado em um componente, `{@attach ...}` cria uma prop cuja chave é um [`Symbol`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol). Se o componente então fizer [spread](https://svelte.dev/tutorial/svelte/spread-props/llms.txt) das props em um elemento, esse elemento receberá esses attachments.

Isso permite criar _componentes wrapper_ que estendem elementos (demo:

```svelte
<!--- file: Button.svelte --->
<script>
	/** @type {import('svelte/elements').HTMLButtonAttributes} */
	let { children, ...props } = $props();
</script>

<!-- `props` includes attachments -->
<button {...props}>
	{@render children?.()}
</button>
```

```svelte
<!--- file: App.svelte --->
<script>
	import tippy from 'tippy.js';
	import Button from './Button.svelte';

	let content = $state('Hello!');

	/**
	 * @param {string} content
	 * @returns {import('svelte/attachments').Attachment}
	 */
	function tooltip(content) {
		return (element) => {
			const tooltip = tippy(element, { content });
			return tooltip.destroy;
		};
	}
</script>

<input bind:value={content} />

<Button {@attach tooltip(content)}>
	Hover me
</Button>
```

## Controlando quando attachments são reexecutados

Attachments, diferentemente de [actions](https://svelte.dev/docs/svelte/use/llms.txt), são totalmente reativos: `{@attach foo(bar)}` será reexecutado quando `foo` _ou_ `bar` mudarem (ou qualquer state lido dentro de `foo`):

```js
// @errors: 7006 2304 2552
function foo(bar) {
	return (node) => {
		veryExpensiveSetupWork(node);
		update(node, bar);
	};
}
```

No caso raro de isso ser um problema (por exemplo, se `foo` faz um trabalho de inicialização custoso e inevitável), considere passar os dados dentro de uma função e lê-los em um effect filho:

```js
// @errors: 7006 2304 2552
function foo(+++getBar+++) {
	return (node) => {
		veryExpensiveSetupWork(node);

+++		$effect(() => {
			update(node, getBar());
		});+++
	}
}
```

## Criando attachments programaticamente

Para adicionar attachments a um objeto que será espalhado (spread) em um componente ou elemento, use [`createAttachmentKey`](https://svelte.dev/docs/svelte/svelte-attachments/llms.txt#createAttachmentKey).

## Convertendo actions em attachments

Se você está usando uma biblioteca que fornece apenas actions, pode convertê-las em attachments com [`fromAction`](https://svelte.dev/docs/svelte/svelte-attachments/llms.txt#fromAction), o que permite (por exemplo) usá-las com componentes.
