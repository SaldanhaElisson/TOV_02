---
name: clean-code
description: Diretrizes de código limpo (comentários, funções, separação em blocos, duplicação, nomes, formatação, globais). Use sempre que for escrever, alterar ou revisar código de produção ou de teste neste projeto.
---

# Diretrizes de código limpo

Aplique estas diretrizes nesta ordem de precedência: primeiro as ferramentas
configuradas, para questões mecânicas de formatação; depois as convenções da
linguagem, para escolhas estruturais e semânticas; e por fim as demais
orientações deste documento.

## Comentários

Escreva comentários concisos e informativos, que deem contexto e explicações
quando necessário, sem serem prolixos. Os comentários devem ser igualmente úteis
para os desenvolvedores de hoje e do futuro — incluindo modelos de IA como você —,
de modo que o propósito e o funcionamento do código fiquem claros sem a leitura de
grandes blocos de texto.

Quando uma funcionalidade for removida ou alterada, não mencione o motivo nos
comentários do código; isso polui o código e gera confusão. Se o motivo precisar
ser registrado, coloque-o na mensagem de commit ou na documentação. Trate
funcionalidades removidas ou alteradas como se nunca tivessem existido: os
comentários devem explicar o estado atual do código, não mudanças ou decisões
passadas.

Documente com clareza efeitos colaterais não óbvios, com comentários que ajudem
os outros a entender o impacto do código.

## Scripts de shell

Mantenha scripts de shell no mínimo absoluto; uma linguagem de alto nível do
projeto deve ser sempre a orquestradora.

Quando um script de shell for necessário, mantenha-o simples e direto, com um
propósito único e claro. Documente-o com comentários explicando o que ele faz e
como usá-lo, organize-o para que seja fácil de encontrar e manter, e projete-o
para se integrar naturalmente ao fluxo de trabalho do projeto.

Não presuma que os colegas têm o mesmo nível de conhecimento que você. Em scripts
de shell, especificamente, inclua comentários breves explicando os argumentos.

## Funções e estrutura

Evite funções grandes que fazem coisas demais. Divida-as em funções menores e
focadas, cada uma responsável por uma única tarefa ou operação.

Modularize o código em componentes menores e reutilizáveis. Não crie megaclasses
ou arquivos que fazem trabalho demais; prefira componentes menores e mais focados.

Estas diretrizes se aplicam principalmente ao código de produção. O código de
teste pode se desviar delas quando as convenções do framework de testes (por
exemplo, blocos Dado-Quando-Então repetidos, casos parametrizados ou asserções
verbosas) melhorarem a clareza e o isolamento; nos testes, priorize a legibilidade
e a verificação de comportamento nos limites, em vez de aplicar DRY de forma
rígida.

Prefira composição a herança. Em vez de hierarquias de classes complexas, crie
classes pequenas e focadas que se combinam para alcançar a funcionalidade
desejada — isso reduz a complexidade e aumenta a flexibilidade.

Evite mais de 3 a 4 parâmetros por função. Se uma função precisar de mais, agrupe
os parâmetros relacionados em um objeto/struct dedicado ou divida a função em
funções menores e focadas.

Evite mais de 2 a 3 sobrecargas (overloads) para o mesmo nome de função. Se forem
necessárias mais, consolide-as em uma única função com um objeto de configuração
ou use outro design. Assim como com os parâmetros, mantenha claro o propósito de
cada função e divida casos complexos em funções menores.

Evite uma quantidade excessiva de laços ou condicionais aninhados; prefira lógica
simples e direta. Se uma função precisar de muitos deles, divida-a em funções
menores.

Se estruturas de controle de fluxo (laços, condicionais, try/catch) estiverem
aninhadas em mais de 3 níveis dentro do corpo de uma função, refatore para reduzir
o aninhamento — por exemplo, extraindo funções menores ou usando retornos
antecipados (early returns).

## Instruções separadas em blocos

Agrupe instruções consecutivas do mesmo tipo em blocos separados por uma única
linha em branco, onde a linguagem permitir linhas em branco entre instruções. Os
tipos são:

- **Declarações** — atribuições de variáveis/constantes.
- **Ações** — efeitos colaterais e cálculos.
- **Retorno** — em sua própria linha, como seu próprio bloco.

A ordem segue o fluxo dos dados, não o tipo: quando uma declaração depende de uma
ação anterior, um novo bloco de declarações vem depois desse bloco de ações.
Assim, um corpo de função pode alternar — declarações, ações, mais declarações,
mais ações — quantas vezes a lógica exigir. As únicas restrições fixas são:

- Instruções adjacentes do mesmo tipo ficam em um único bloco contínuo (sem linhas
  em branco avulsas dividindo-as).
- Uma linha em branco separa cada bloco do seguinte.
- O `return` é sempre um bloco próprio, ao final.

Omita qualquer bloco (e seu separador) quando ele não tiver instruções.

**Exceção — cláusulas de guarda.** Uma guarda que valida a(s) declaração(ões)
imediatamente anterior(es) (`const x = ...; if (!x) throw ...`) fica junto desse
bloco de declarações — sem linha em branco entre eles. A guarda e o valor que ela
valida são lidos como uma unidade. Isso vale apenas para guardas sobre o valor
recém-declarado; um bloco de ações independente que venha depois das declarações
continua separado.

Lista de decisão:

1. Isto é uma guarda sobre a declaração imediatamente anterior? Se sim, junte-a
   sem linha em branco.
2. A próxima instrução é do mesmo tipo da atual? Se sim, não coloque linha em
   branco.
3. Caso contrário, insira uma linha em branco entre os blocos.

Exemplo reprovado (condicional independente confundida com guarda):

```ts
const user = findUser(id);
if (!featureFlags.auditLookups) return user;
auditLookup(id);
```

Exemplo aprovado:

```ts
const user = findUser(id);

if (!featureFlags.auditLookups) return user;

auditLookup(id);
```

Exemplo:

Antes:

```ts
const user = findUser(id);

if (!user) throw new Error('User not found');

auditLookup(id);
```

Depois:

```ts
const user = findUser(id);
if (!user) throw new Error('User not found');

auditLookup(id);
```

## Duplicação

Antes de escrever uma função auxiliar, procure uma já existente e importe-a.
Quando a mesma lógica for necessária uma segunda vez, extraia-a em vez de copiá-la
— e extraia-a no nível que os chamadores compartilham, não no primeiro lugar que
vier à mente.

Duas implementações que diferem apenas por um substantivo do domínio são uma única
implementação com um parâmetro. Parametrize sobre um descritor de domínio em vez de
manter as duas; cópias gêmeas divergem com o tempo, e essa divergência é invisível
na revisão, porque cada cópia parece correta isoladamente.

Repetição não é automaticamente duplicação. Código que apenas se parece, mas muda
por motivos diferentes, continua separado, e uma configuração fina por domínio
sobre uma abstração compartilhada é o custo esperado dessa abstração, não um
defeito. Extraia o que compartilha um motivo para mudar, não o que compartilha uma
forma — uma abstração prematura que precisa de uma flag para cada chamador é pior
do que a repetição que ela substituiu.

## Nomes e terminologia

Dê nomes a funções e variáveis que deixem claros o seu propósito e funcionamento.
Use nomes descritivos e evite abreviações ou siglas que possam ser pouco claras
para os outros.

Quando um componente tiver uma terminologia amplamente aceita, use-a de forma
consistente em todo o código. Use terminologia consistente em todo lugar, para que
o código seja fácil de entender.

## Simplicidade e previsibilidade

Busque sempre a simplicidade, evitando complexidade desnecessária e preferindo
soluções claras e diretas.

Adote o princípio da menor surpresa: o código deve se comportar de acordo com o
que os outros desenvolvedores esperam, evitando comportamentos ou efeitos
colaterais inesperados.

## Formatação

Quando nenhum formatador/linter configurado controlar o comprimento das linhas,
prefira linhas com até 80 caracteres e evite passar de 100 caracteres, a menos que
seja absolutamente inevitável.

Quando nenhum formatador ou linter configurado controlar o layout dos parâmetros e
a linguagem permitir, declare os parâmetros da função um por linha, indentados
para dar visibilidade, sempre que a declaração ou chamada da função tiver 2 ou
mais parâmetros.

Quando a linguagem permitir, prefira strings multilinha para expressões longas, em
vez de várias strings de uma linha.

## Recursos da linguagem

Aplique o seguinte quando a linguagem utilizada permitir:

- Prefira expressões `switch` modernas ou variantes de pattern matching em vez de
  instruções `switch` tradicionais com fall-through, quando a linguagem as
  oferecer (por exemplo, switch expressions em Java/C#, `match` em Rust/Swift).
- Use parâmetros nomeados, que tornam o código mais fácil de ler e entender.
- Use prefixos/sufixos curtos de tipo para melhorar a legibilidade — por exemplo,
  em Java, `float price = 5f;`, em que o sufixo `f` indica um literal float.
- Use tipos inferidos (`var`) em vez de tipos explícitos quando o contexto deixar o
  tipo óbvio — por exemplo, `auto` em C++ ou `var` em C# e Java. Isso reduz a
  poluição visual e mantém os benefícios da tipagem forte.
- Use a sintaxe abreviada de funções quando ela melhorar a legibilidade; use
  `return` explícito quando a estrutura da função exigir.
- Use declarações de tipo explícitas em lambdas.
- Use encadeamento de funções para melhorar a legibilidade e reduzir a necessidade
  de variáveis intermediárias.

Se a linguagem não permitir encadeamento de funções, use variáveis intermediárias
para melhorar a legibilidade. Retorne o resultado final diretamente, a menos que
mantê-lo em uma variável intermediária melhore a legibilidade de forma
significativa.

## Variáveis globais e tuplas

Evite variáveis globais. Se uma for absolutamente necessária, documente-a bem para
que seu propósito e funcionamento fiquem claros — e nunca a modifique, sem
exceções.

Evite tuplas, mesmo quando a linguagem as permitir, pois elas podem tornar o código
mais difícil de ler e manter. Se a linguagem usar tuplas de forma idiomática em
padrões específicos (por exemplo, desempacotamento de tuplas em Python para
retornar múltiplos valores), use-as nesses contextos; ainda assim, prefira
estruturas nomeadas quando os campos se beneficiarem de rótulos.

## Linters e formatadores configurados

Quando o projeto configurar um linter ou formatador (eslint, prettier ou
equivalente), essa configuração é a autoridade sobre todas as questões que ela
cobre — comprimento de linha, quebra de linha, layout de parâmetros, espaçamento e
qualquer outra regra mecânica ou estética. Quando estas diretrizes e as ferramentas
configuradas discordarem, as ferramentas vencem, e uma execução limpa de lint/format
encerra a questão. As orientações de formatação acima só se aplicam onde nenhuma
ferramenta configurada controlar o assunto.

## Princípio prevalecente

Se algum dos princípios acima conflitar com a filosofia geral ou com as práticas
amplamente aceitas da linguagem utilizada, priorize as convenções e boas práticas
da linguagem.

Quando as ferramentas configuradas e as convenções da linguagem conflitarem, as
ferramentas vencem em questões mecânicas e estéticas, enquanto as convenções da
linguagem vencem em questões estruturais e semânticas (por exemplo, padrões
idiomáticos e uso da biblioteca padrão).
