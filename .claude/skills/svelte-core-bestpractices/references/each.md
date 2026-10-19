## Blocos each com chave (keyed)

```svelte
<!--- copy: false  --->
{#each expression as name (key)}...{/each}
```

```svelte
<!--- copy: false  --->
{#each expression as name, index (key)}...{/each}
```

Se uma expressão de _chave_ for fornecida — que deve identificar cada item da lista de forma única —, o Svelte a usará para atualizar a lista de forma inteligente quando os dados mudarem, inserindo, movendo e removendo itens, em vez de adicionar ou remover itens no final e atualizar o state no meio.

A chave pode ser qualquer objeto, mas strings e números são recomendados, pois permitem que a identidade persista quando os próprios objetos mudam.

```svelte
{#each items as item (item.id)}
	<li>{item.name} x {item.qty}</li>
{/each}

<!-- or with additional index value -->
{#each items as item, i (item.id)}
	<li>{i + 1}: {item.name} x {item.qty}</li>
{/each}
```

Você pode usar livremente desestruturação e padrões rest em blocos each.

```svelte
{#each items as { id, name, qty }, i (id)}
	<li>{i + 1}: {name} x {qty}</li>
{/each}

{#each objects as { id, ...rest }}
	<li><span>{id}</span><MyComponent {...rest} /></li>
{/each}

{#each items as [id, ...rest]}
	<li><span>{id}</span><MyComponent values={rest} /></li>
{/each}
```
