---
name: svelte-code-writer
description: Ferramentas de linha de comando para consultar a documentação do Svelte 5 e analisar código. DEVE ser usada sempre que for criar, editar ou analisar qualquer componente Svelte (`.svelte`) ou módulo Svelte (`.svelte.ts`/`.svelte.js`).
---

## Ferramentas de linha de comando

Você tem acesso à CLI `@sveltejs/mcp` para ajuda específica de Svelte. Use estes
comandos via `npx`:

### Listar as seções da documentação

```bash
npx @sveltejs/mcp list-sections
```

Lista todas as seções disponíveis da documentação do Svelte 5 e do SvelteKit, com
títulos e caminhos.

### Obter a documentação

```bash
npx @sveltejs/mcp get-documentation "<section1>,<section2>,..."
```

Busca a documentação completa das seções indicadas. Use depois do
`list-sections` para trazer a documentação relevante.

**Exemplo:**

```bash
npx @sveltejs/mcp get-documentation "$state,$derived,$effect"
```

### Svelte autofixer

```bash
npx @sveltejs/mcp svelte-autofixer "<code_or_path>" [options]
```

Analisa código Svelte e sugere correções para problemas comuns.

**Opções:**

- `--async` - Ativa o modo async do Svelte (padrão: false)
- `--svelte-version` - Versão alvo, de preferência a versão completa do
  `package.json` (por exemplo, `5.16.0`), para ativar as sugestões específicas
  da versão. A versão principal deve ser 4 ou 5 (padrão: 5)

**Exemplos:**

```bash
# Analyze inline code (escape $ as \$)
npx @sveltejs/mcp svelte-autofixer '<script>let count = \$state(0);</script>'

# Analyze a file
npx @sveltejs/mcp svelte-autofixer ./src/lib/Component.svelte

# Target Svelte 4
npx @sveltejs/mcp svelte-autofixer ./Component.svelte --svelte-version 4
```

**Importante:** ao passar código com runes (`$state`, `$derived` etc.) pelo
terminal, escape o caractere `$` como `\$` para evitar que o shell faça a
substituição de variáveis.

## Fluxo de trabalho

1. **Em dúvida sobre a sintaxe?** Rode `list-sections` e depois
   `get-documentation` para os tópicos relevantes
2. **Revisando/depurando?** Rode o `svelte-autofixer` no código para detectar
   problemas
3. **Sempre valide** - Rode o `svelte-autofixer` antes de finalizar qualquer
   componente Svelte

---

_Traduzido para o português a partir de [sveltejs/ai-tools](https://github.com/sveltejs/ai-tools) (`tools/skills/svelte-code-writer`), licença MIT — Copyright (c) 2026 Svelte Contributors. Veja `LICENSE` nesta pasta._
