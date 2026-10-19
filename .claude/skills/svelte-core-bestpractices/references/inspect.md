> [!NOTE] `$inspect` só funciona durante o desenvolvimento. Em um build de produção, ele se torna um noop.

A rune `$inspect` é aproximadamente equivalente a `console.log`, com a diferença de que ela é reexecutada sempre que seu argumento muda. `$inspect` rastreia o state reativo em profundidade, o que significa que atualizar algo dentro de um objeto ou array usando reatividade granular fará com que ela seja disparada novamente:

<!-- codeblock:start {"title":"$inspect(...)"} -->

```svelte
<!--- file: App.svelte --->
<script>
	let count = $state(0);
	let message = $state('hello');

	$inspect(count, message); // will console.log when `count` or `message` change
</script>

<button onclick={() => count++}>Increment</button>
<input bind:value={message} />
```

<!-- codeblock:end -->

Nas atualizações, um stack trace será impresso, facilitando encontrar a origem de uma mudança de state (a menos que você esteja no playground, devido a limitações técnicas).

## $inspect(...).with

`$inspect(...)` retorna um objeto com um método `with`, que você pode invocar com um callback que será então chamado em vez de `console.log`. O primeiro argumento do callback é `"init"` ou `"update"`; os argumentos seguintes são os valores passados para `$inspect`:

<!-- codeblock:start {"title":"$inspect(...).with(...)"} -->

```svelte
<!--- file: App.svelte --->
<script>
	let count = $state(0);

	$inspect(count).with((type, count) => {
		if (type === 'update') {
			debugger; // or `console.trace`, or whatever you want
		}
	});
</script>

<button onclick={() => count++}>Increment</button>
```

<!-- codeblock:end -->

## $inspect.trace(...)

Esta rune, adicionada na versão 5.14, faz com que a função que a envolve seja _rastreada_ em desenvolvimento. Sempre que a função for reexecutada como parte de um [effect](https://svelte.dev/docs/svelte/$effect/llms.txt) ou de um [derived](https://svelte.dev/docs/svelte/$derived/llms.txt), informações serão impressas no console sobre quais partes do state reativo fizeram o effect ser disparado.

```svelte
<script>
	import { doSomeWork } from './elsewhere';

	$effect(() => {
		+++// $inspect.trace must be the first statement of a function body+++
		+++$inspect.trace();+++
		doSomeWork();
	});
</script>
```

`$inspect.trace` aceita um primeiro argumento opcional, que será usado como rótulo (label).
