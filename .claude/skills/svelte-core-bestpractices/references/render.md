Para renderizar um [snippet](https://svelte.dev/docs/svelte/snippet/llms.txt), use uma tag `{@render ...}`.

```svelte
{#snippet sum(a, b)}
	<p>{a} + {b} = {a + b}</p>
{/snippet}

{@render sum(1, 2)}
{@render sum(3, 4)}
{@render sum(5, 6)}
```

A expressão pode ser um identificador como `sum` ou uma expressão JavaScript arbitrária:

```svelte
{@render (cool ? coolSnippet : lameSnippet)()}
```

## Snippets opcionais

Se o snippet puder ser undefined — por exemplo, porque é uma prop recebida —, você pode usar optional chaining para renderizá-lo apenas quando ele _estiver_ definido:

```svelte
{@render children?.()}
```

Como alternativa, use um bloco [`{#if ...}`](https://svelte.dev/docs/svelte/if/llms.txt) com uma cláusula `:else` para renderizar um conteúdo de fallback:

```svelte
{#if children}
	{@render children()}
{:else}
	<p>fallback content</p>
{/if}
```
