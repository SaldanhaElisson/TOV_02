---
name: systematic-debugging
description: Use ao se deparar com qualquer bug, falha de teste ou comportamento inesperado, antes de propor correções
---

# Depuração Sistemática

## Visão Geral

**Princípio central:** SEMPRE encontre a causa raiz antes de tentar correções. Corrigir sintomas é fracasso.

**Violar a letra deste processo é violar o espírito da depuração.**

## A Lei de Ferro

```
NENHUMA CORREÇÃO SEM INVESTIGAR A CAUSA RAIZ PRIMEIRO
```

Se você não concluiu a Fase 1, não pode propor correções.

## Quando Usar

Use para QUALQUER problema técnico:
- Falhas de teste
- Bugs em produção
- Comportamento inesperado
- Problemas de desempenho
- Falhas de build
- Problemas de integração

**Use ESPECIALMENTE quando:**
- Estiver sob pressão de tempo (emergências tornam o chute tentador)
- "Só uma correção rápida" parecer óbvia
- Você já tiver tentado várias correções
- A correção anterior não tiver funcionado
- Você não entender totalmente o problema

**Não pule quando:**
- O problema parecer simples (bugs simples também têm causa raiz)
- Você estiver com pressa (a pressa garante retrabalho)
- O gestor quiser a correção AGORA (o sistemático é mais rápido que ficar se debatendo)

## As Quatro Fases

Você DEVE concluir cada fase antes de passar para a próxima.

### Fase 1: Investigação da Causa Raiz

**ANTES de tentar QUALQUER correção:**

1. **Leia as Mensagens de Erro com Atenção**
   - Não passe por cima de erros ou avisos
   - Eles frequentemente contêm a solução exata
   - Leia os stack traces por completo
   - Anote números de linha, caminhos de arquivo, códigos de erro

2. **Reproduza de Forma Consistente**
   - Você consegue provocá-lo de forma confiável?
   - Quais são os passos exatos?
   - Acontece toda vez?
   - Se não for reproduzível → colete mais dados, não chute

3. **Verifique as Mudanças Recentes**
   - O que mudou que poderia causar isso?
   - Git diff, commits recentes
   - Novas dependências, mudanças de configuração
   - Diferenças de ambiente

4. **Colete Evidências em Sistemas com Múltiplos Componentes**

   **QUANDO o sistema tiver múltiplos componentes (CI → build → assinatura, API → serviço → banco de dados):**

   **ANTES de propor correções, adicione instrumentação de diagnóstico:**
   ```
   Para CADA fronteira entre componentes:
     - Registre em log quais dados entram no componente
     - Registre em log quais dados saem do componente
     - Verifique a propagação de ambiente/configuração
     - Verifique o estado em cada camada

   Execute uma vez para coletar evidências mostrando ONDE quebra
   DEPOIS analise as evidências para identificar o componente com falha
   DEPOIS investigue esse componente específico
   ```

   **Exemplo (sistema com várias camadas):**
   ```bash
   # Layer 1: Workflow
   echo "=== Secrets available in workflow: ==="
   echo "IDENTITY: $([ -n "${IDENTITY:-}" ] && echo SET || echo UNSET)"

   # Layer 2: Build script
   echo "=== Env vars in build script: ==="
   printenv IDENTITY >/dev/null 2>&1 && echo "IDENTITY in environment" || echo "IDENTITY not in environment"

   # Layer 3: Signing script
   echo "=== Keychain state: ==="
   security list-keychains
   security find-identity -v

   # Layer 4: Actual signing
   codesign --sign "$IDENTITY" --verbose=4 "$APP"
   ```

   **Isso revela:** Qual camada falha (secrets → workflow ✓, workflow → build ✗)

5. **Rastreie o Fluxo de Dados**

   **QUANDO o erro estiver no fundo da pilha de chamadas:**

   Veja `root-cause-tracing.md` neste diretório para a técnica completa de rastreamento retroativo.

   **Versão rápida:**
   - Onde o valor incorreto se origina?
   - O que chamou isto com o valor incorreto?
   - Continue rastreando para cima até encontrar a origem
   - Corrija na origem, não no sintoma

### Fase 2: Análise de Padrões

**Encontre o padrão antes de corrigir:**

1. **Encontre Exemplos que Funcionam**
   - Localize código semelhante que funciona na mesma base de código
   - O que funciona e é parecido com o que está quebrado?

2. **Compare com as Referências**
   - Se estiver implementando um padrão, leia a implementação de referência POR COMPLETO
   - Não leia por cima - leia cada linha
   - Entenda o padrão totalmente antes de aplicá-lo

3. **Identifique as Diferenças**
   - O que há de diferente entre o que funciona e o que está quebrado?
   - Liste cada diferença, por menor que seja
   - Não presuma que "isso não pode importar"

4. **Entenda as Dependências**
   - De quais outros componentes isto precisa?
   - Quais definições, configurações, ambiente?
   - Quais suposições isto faz?

### Fase 3: Hipótese e Teste

**Método científico:**

1. **Formule Uma Única Hipótese**
   - Declare com clareza: "Acho que X é a causa raiz porque Y"
   - Escreva-a
   - Seja específico, não vago

2. **Teste de Forma Mínima**
   - Faça a MENOR mudança possível para testar a hipótese
   - Uma variável por vez
   - Não corrija várias coisas de uma vez

3. **Verifique Antes de Continuar**
   - Funcionou? Sim → Fase 4
   - Não funcionou? Formule uma NOVA hipótese
   - NÃO acrescente mais correções por cima

4. **Quando Você Não Souber**
   - Diga "Não entendo X"
   - Não finja saber
   - Peça ajuda
   - Pesquise mais

### Fase 4: Implementação

**Corrija a causa raiz, não o sintoma:**

1. **Crie um Caso de Teste que Falha**
   - A reprodução mais simples possível
   - Teste automatizado, se possível
   - Script de teste avulso, se não houver framework
   - DEVE existir antes da correção
   - Use a skill `clean-tests` para escrever o teste que falha

2. **Implemente Uma Única Correção**
   - Ataque a causa raiz identificada
   - UMA mudança por vez
   - Nada de melhorias do tipo "já que estou aqui"
   - Nada de refatoração embutida

3. **Verifique a Correção**
   - O teste passa agora?
   - Nenhum outro teste quebrou?
   - O problema foi realmente resolvido?
   - Use a skill `verification-before-completion` antes de declarar sucesso

4. **Se a Correção Não Funcionar**
   - PARE
   - Conte: quantas correções você já tentou?
   - Se < 3: Volte à Fase 1, reanalise com as novas informações
   - **Se ≥ 3: PARE e questione a arquitetura (passo 5 abaixo)**
   - NÃO tente a Correção nº 4 sem uma discussão sobre a arquitetura

5. **Se 3 ou Mais Correções Falharam: Questione a Arquitetura**

   **Padrão que indica problema de arquitetura:**
   - Cada correção revela novo estado compartilhado/acoplamento/problema em outro lugar
   - As correções exigem uma "refatoração massiva" para serem implementadas
   - Cada correção cria novos sintomas em outro lugar

   **PARE e questione os fundamentos:**
   - Este padrão é fundamentalmente sólido?
   - Estamos "insistindo nele por pura inércia"?
   - Devemos refatorar a arquitetura em vez de continuar corrigindo sintomas?

   **Discuta com o desenvolvedor antes de tentar mais correções**

   Isto NÃO é uma hipótese que falhou - é uma arquitetura errada.

## Sinais de Alerta - PARE e Siga o Processo

Se você se pegar pensando:
- "Correção rápida por enquanto, investigo depois"
- "Só tenta mudar X e vê se funciona"
- "Faz várias mudanças, roda os testes"
- "Pula o teste, eu verifico manualmente"
- "Provavelmente é X, deixa eu corrigir isso"
- "Não entendo totalmente, mas isto pode funcionar"
- "O padrão diz X, mas vou adaptar de outro jeito"
- "Estes são os principais problemas: [lista correções sem investigação]"
- Propor soluções antes de rastrear o fluxo de dados
- **"Só mais uma tentativa de correção" (quando já tentou 2 ou mais)**
- **Cada correção revela um novo problema em outro lugar**

**TODOS estes significam: PARE. Volte à Fase 1.**

**Se 3 ou mais correções falharam:** Questione a arquitetura (veja a Fase 4.5)

## Sinais do Desenvolvedor de que Você Está Fazendo Errado

**Fique atento a estes redirecionamentos:**
- "Isso não está acontecendo?" - Você presumiu sem verificar
- "Isso vai nos mostrar...?" - Você deveria ter adicionado coleta de evidências
- "Pare de chutar" - Você está propondo correções sem entender
- "Pense a fundo nisso" - Questione os fundamentos, não só os sintomas
- "Estamos travados?" (frustrado) - Sua abordagem não está funcionando

**Quando vir estes sinais:** PARE. Volte à Fase 1.

## Racionalizações Comuns

| Desculpa | Realidade |
|----------|-----------|
| "O problema é simples, não preciso de processo" | Problemas simples também têm causa raiz. O processo é rápido para bugs simples. |
| "É emergência, não há tempo para processo" | A depuração sistemática é MAIS RÁPIDA que ficar se debatendo no chute e verificação. |
| "Só tenta isto primeiro, depois investiga" | A primeira correção define o padrão. Faça certo desde o início. |
| "Escrevo o teste depois de confirmar que a correção funciona" | Correções sem teste não se sustentam. Testar primeiro comprova. |
| "Várias correções de uma vez economizam tempo" | Não dá para isolar o que funcionou. Causa novos bugs. |
| "A referência é longa demais, vou adaptar o padrão" | Entendimento parcial garante bugs. Leia por completo. |
| "Estou vendo o problema, deixa eu corrigir" | Ver sintomas ≠ entender a causa raiz. |
| "Só mais uma tentativa de correção" (após 2 ou mais falhas) | 3 ou mais falhas = problema de arquitetura. Questione o padrão, não corrija de novo. |

## Referência Rápida

| Fase | Atividades-Chave | Critérios de Sucesso |
|------|------------------|----------------------|
| **1. Causa Raiz** | Ler erros, reproduzir, verificar mudanças, coletar evidências | Entender O QUÊ e POR QUÊ |
| **2. Padrão** | Encontrar exemplos que funcionam, comparar | Identificar diferenças |
| **3. Hipótese** | Formular teoria, testar de forma mínima | Hipótese confirmada ou nova hipótese |
| **4. Implementação** | Criar teste, corrigir, verificar | Bug resolvido, testes passando |

## Quando o Processo Revela "Sem Causa Raiz"

Se a investigação sistemática revelar que o problema é realmente ambiental, dependente de timing ou externo:

1. Você concluiu o processo
2. Documente o que você investigou
3. Implemente o tratamento adequado (retry, timeout, mensagem de erro)
4. Adicione monitoramento/logging para investigações futuras

**Mas:** 95% dos casos de "sem causa raiz" são investigação incompleta.

## Técnicas de Apoio

Estas técnicas fazem parte da depuração sistemática e estão disponíveis neste diretório:

- **`root-cause-tracing.md`** - Rastreie bugs para trás pela pilha de chamadas para encontrar o gatilho original
- **`defense-in-depth.md`** - Adicione validação em múltiplas camadas depois de encontrar a causa raiz
- **`condition-based-waiting.md`** - Substitua timeouts arbitrários por polling de condição

---

_Traduzido e adaptado para o português a partir de [obra/superpowers](https://github.com/obra/superpowers) (`skills/systematic-debugging`), licença MIT — Copyright (c) 2025 Jesse Vincent. Veja `LICENSE` nesta pasta._
