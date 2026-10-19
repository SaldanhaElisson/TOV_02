## createSubscriber

<blockquote class="since note">

Disponível desde a versão 5.7.0

</blockquote>

Retorna uma função `subscribe` que integra sistemas externos baseados em eventos com a reatividade do Svelte.
É particularmente útil para integrar com APIs web como `MediaQuery`, `IntersectionObserver` ou `WebSocket`.

Se `subscribe` for chamada dentro de um effect (inclusive indiretamente, por exemplo dentro de um getter),
o callback `start` será chamado com uma função `update`. Sempre que `update` for chamada, o effect é reexecutado.

Se `start` retornar uma função de cleanup, ela será chamada quando o effect for destruído.

Se `subscribe` for chamada em vários effects, `start` só será chamado uma vez enquanto os effects
estiverem ativos, e a função de teardown retornada só será chamada quando todos os effects forem destruídos.

Fica mais fácil de entender com um exemplo. Aqui está uma implementação de [`MediaQuery`](https://svelte.dev/docs/svelte/svelte-reactivity/llms.txt#MediaQuery):

```js
// @errors: 7031
import { createSubscriber } from 'svelte/reactivity';
import { on } from 'svelte/events';

export class MediaQuery {
	#query;
	#subscribe;

	constructor(query) {
		this.#query = window.matchMedia(`(${query})`);

		this.#subscribe = createSubscriber((update) => {
			// when the `change` event occurs, re-run any effects that read `this.current`
			const off = on(this.#query, 'change', update);

			// stop listening when all the effects are destroyed
			return () => off();
		});
	}

	get current() {
		// This makes the getter reactive, if read in an effect
		this.#subscribe();

		// Return the current state of the query, whether or not we're in an effect
		return this.#query.matches;
	}
}
```

<div class="ts-block">

```dts
function createSubscriber(
	start: (update: () => void) => (() => void) | void
): () => void;
```

</div>
