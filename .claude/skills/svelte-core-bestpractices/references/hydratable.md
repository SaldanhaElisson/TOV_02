No Svelte, quando você quer renderizar dados assíncronos no servidor, basta usar `await`. Isso é ótimo! No entanto, há uma armadilha: ao fazer a hydration desse conteúdo no cliente, o Svelte precisa refazer o trabalho assíncrono, o que bloqueia a hydration pelo tempo que isso levar:

```svelte
<script>
  import { getUser } from 'my-database-library';

  // This will get the user on the server, render the user's name into the h1,
  // and then, during hydration on the client, it will get the user _again_,
  // blocking hydration until it's done.
  const user = await getUser();
</script>

<h1>{user.name}</h1>
```

Mas isso não faz sentido. Se já tivemos o trabalho de obter os dados no servidor, não queremos obtê-los novamente durante a hydration no cliente. `hydratable` é uma API de baixo nível criada para resolver esse problema. Você provavelmente não vai precisar dela com muita frequência — ela será usada nos bastidores por qualquer biblioteca de data fetching que você utilizar. Por exemplo, ela é a base das [remote functions no SvelteKit](https://svelte.dev/docs/kit/remote-functions/llms.txt).

Para corrigir o exemplo acima:

```svelte
<script>
  import { hydratable } from 'svelte';
  import { getUser } from 'my-database-library';

  // During server rendering, this will serialize and stash the result of `getUser`, associating
  // it with the provided key and baking it into the `head` content. During hydration, it will
  // look for the serialized version, returning it instead of running `getUser`. After hydration
  // is done, if it's called again, it'll simply invoke `getUser`.
  const user = await hydratable('user', () => getUser());
</script>

<h1>{user.name}</h1>
```

Esta API também pode ser usada para fornecer acesso a valores aleatórios ou baseados em tempo que permanecem estáveis entre a renderização no servidor e a hydration. Por exemplo, para obter um número aleatório que não é atualizado na hydration:

```ts
import { hydratable } from 'svelte';
const rand = hydratable('random', () => Math.random());
```

Se você é autor de uma biblioteca, prefixe as chaves dos seus valores `hydratable` com o nome da sua biblioteca, para que suas chaves não entrem em conflito com as de outras bibliotecas.

## Serialização

Todos os dados retornados por uma função `hydratable` devem ser serializáveis. Mas isso não significa que você está limitado a JSON — o Svelte usa [`devalue`](https://npmjs.com/package/devalue), que consegue serializar todo tipo de coisa, incluindo `Map`, `Set`, `URL` e `BigInt`. Consulte a página da documentação para a lista completa. Além disso, graças a uma certa mágica do Svelte, você também pode usar promises sem medo:

```svelte
<script>
  import { hydratable } from 'svelte';
  const promises = hydratable('random', () => {
    return {
      one: Promise.resolve(1),
      two: Promise.resolve(2)
    }
  });
</script>

{await promises.one}
{await promises.two}
```

## CSP

`hydratable` adiciona um bloco `<script>` inline ao `head` retornado por `render`. Se você estiver usando [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) (CSP), esse script provavelmente não será executado. Você pode fornecer um `nonce` para `render`:

```js
const nonce = crypto.randomUUID();

const { head, body } = await render(App, {
	csp: { nonce }
});
```

Isso adicionará o `nonce` ao bloco de script, partindo do pressuposto de que você adicionará depois o mesmo nonce ao header CSP do documento que o contém:

```js
response.headers.set(
  'Content-Security-Policy',
  `script-src 'nonce-${nonce}'`
 );
```

É essencial que um `nonce` — que, deixando de lado a definição da gíria britânica, significa 'number used once' (número usado uma única vez) — seja usado apenas ao renderizar dinamicamente no servidor uma resposta individual.

Se, em vez disso, você estiver gerando HTML estático antecipadamente, deve usar hashes:

```js
const { head, body, hashes } = await render(App, {
	csp: { hash: true }
});
```

`hashes.script` será um array de strings como `["sha256-abcd123"]`. Assim como com o `nonce`, os hashes devem ser usados no seu header CSP:

```js
response.headers.set(
  'Content-Security-Policy',
  `script-src ${hashes.script.map((hash) => `'${hash}'`).join(' ')}`
 );
```

Recomendamos usar `nonce` em vez de hash sempre que possível, pois `hash` vai interferir no SSR com streaming no futuro.
