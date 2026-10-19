## Function bindings

Você também pode usar `bind:property={get, set}`, em que `get` e `set` são funções, o que permite realizar validação e transformação:

```svelte
<input bind:value={
	() => value,
	(v) => value = v.toLowerCase()}
/>
```

No caso de bindings somente leitura, como os [bindings de dimensão](#Dimensions), o valor de `get` deve ser `null`:

```svelte
<div
	bind:clientWidth={null, redraw}
	bind:clientHeight={null, redraw}
>...</div>
```

> [!NOTE]
> Function bindings estão disponíveis no Svelte 5.9.0 e versões mais recentes.
