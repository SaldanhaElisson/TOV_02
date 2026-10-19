# Validação em Defesa em Profundidade

## Visão Geral

Quando você corrige um bug causado por dados inválidos, adicionar validação em um único lugar parece suficiente. Mas essa verificação única pode ser contornada por outros caminhos de código, por refatorações ou por mocks.

**Princípio central:** Valide em TODA camada pela qual os dados passam. Torne o bug estruturalmente impossível.

## Por Que Múltiplas Camadas

Validação única: "Corrigimos o bug"
Múltiplas camadas: "Tornamos o bug impossível"

Camadas diferentes capturam casos diferentes:
- A validação de entrada captura a maioria dos bugs
- A lógica de negócio captura casos extremos
- As guardas de ambiente previnem perigos específicos de contexto
- O log de depuração ajuda quando as outras camadas falham

## As Quatro Camadas

### Camada 1: Validação no Ponto de Entrada
**Propósito:** Rejeitar entradas obviamente inválidas na fronteira da API

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }
  // ... proceed
}
```

### Camada 2: Validação na Lógica de Negócio
**Propósito:** Garantir que os dados façam sentido para esta operação

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('projectDir required for workspace initialization');
  }
  // ... proceed
}
```

### Camada 3: Guardas de Ambiente
**Propósito:** Impedir operações perigosas em contextos específicos

```typescript
async function gitInit(directory: string) {
  // In tests, refuse git init outside temp directories
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `Refusing git init outside temp dir during tests: ${directory}`
      );
    }
  }
  // ... proceed
}
```

### Camada 4: Instrumentação de Depuração
**Propósito:** Capturar contexto para análise forense

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('About to git init', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... proceed
}
```

## Aplicando o Padrão

Quando encontrar um bug:

1. **Rastreie o fluxo de dados** - Onde o valor incorreto se origina? Onde é usado?
2. **Mapeie todos os pontos de verificação** - Liste cada ponto pelo qual os dados passam
3. **Adicione validação em cada camada** - Entrada, negócio, ambiente, depuração
4. **Teste cada camada** - Tente contornar a camada 1 e verifique se a camada 2 captura

## Exemplo de uma Sessão

Bug: `projectDir` vazio fez o `git init` rodar no código-fonte

**Fluxo de dados:**
1. Setup do teste → string vazia
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` roda em `process.cwd()`

**Quatro camadas adicionadas:**
- Camada 1: `Project.create()` valida que não está vazio/existe/tem permissão de escrita
- Camada 2: `WorkspaceManager` valida que projectDir não está vazio
- Camada 3: `WorktreeManager` recusa git init fora do tmpdir nos testes
- Camada 4: Log de stack trace antes do git init

**Resultado:** Todos os 1847 testes passaram, bug impossível de reproduzir

## Insight-Chave

Todas as quatro camadas foram necessárias. Durante os testes, cada camada capturou bugs que as outras deixaram passar:
- Caminhos de código diferentes contornaram a validação de entrada
- Mocks contornaram as verificações da lógica de negócio
- Casos extremos em plataformas diferentes exigiram guardas de ambiente
- O log de depuração identificou uso indevido estrutural

**Não pare em um único ponto de validação.** Adicione verificações em todas as camadas.
