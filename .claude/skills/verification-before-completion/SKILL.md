---
name: verification-before-completion
description: Use quando estiver prestes a afirmar que um trabalho está concluído, corrigido ou passando, antes de fazer commit ou abrir PR — exige rodar os comandos de verificação e confirmar a saída antes de qualquer afirmação de sucesso; evidência antes de afirmações, sempre.
---

# Verificação antes da conclusão

## Visão geral

**Princípio central:** evidência antes de afirmações, sempre.

**Violar a letra desta regra é violar o espírito desta regra.**

## A Lei de Ferro

```
NENHUMA AFIRMAÇÃO DE CONCLUSÃO SEM EVIDÊNCIA DE VERIFICAÇÃO RECENTE
```

Se você não rodou o comando de verificação nesta mensagem, não pode afirmar que
ele passa.

## A função de bloqueio

```
ANTES de afirmar qualquer status ou demonstrar satisfação:

1. IDENTIFIQUE: Que comando prova esta afirmação?
2. RODE: Execute o comando COMPLETO (novo, inteiro)
3. LEIA: A saída inteira, confira o código de saída, conte as falhas
4. VERIFIQUE: A saída confirma a afirmação?
   - Se NÃO: Informe o status real com a evidência
   - Se SIM: Faça a afirmação COM a evidência
5. SÓ ENTÃO: Faça a afirmação

Pular qualquer etapa = mentir, não verificar
```

## Falhas comuns

| Afirmação | Exige | Não é suficiente |
|-------|----------|----------------|
| Os testes passam | Saída do comando de teste: 0 falhas | Execução anterior, "deve passar" |
| Linter limpo | Saída do linter: 0 erros | Checagem parcial, extrapolação |
| O build funciona | Comando de build: código de saída 0 | Linter passando, logs parecem ok |
| Bug corrigido | Testar o sintoma original: passa | Código alterado, presumido corrigido |
| O teste de regressão funciona | Ciclo vermelho-verde verificado | Teste passa uma vez |
| O agente concluiu | O diff do controle de versão mostra as mudanças | O agente relata "sucesso" |
| Requisitos atendidos | Checklist linha a linha | Testes passando |

## Sinais de alerta - PARE

- Usar "deve", "provavelmente", "parece que"
- Demonstrar satisfação antes de verificar ("Ótimo!", "Perfeito!", "Pronto!" etc.)
- Estar prestes a fazer commit/push/PR sem verificar
- Confiar em relatos de sucesso de agentes
- Depender de verificação parcial
- Pensar "só desta vez"
- Estar cansado e querer terminar o trabalho
- **QUALQUER formulação que implique sucesso sem ter rodado a verificação**

## Prevenção de racionalizações

| Desculpa | Realidade |
|--------|---------|
| "Deve funcionar agora" | RODE a verificação |
| "Estou confiante" | Confiança ≠ evidência |
| "Só desta vez" | Sem exceções |
| "O linter passou" | Linter ≠ compilador |
| "O agente disse que deu certo" | Verifique de forma independente |
| "Estou cansado" | Cansaço ≠ desculpa |
| "Uma checagem parcial basta" | Parcial não prova nada |
| "Com outras palavras a regra não se aplica" | O espírito vale mais que a letra |

## Padrões principais

**Testes:**
```
✅ [Roda o comando de teste] [Vê: 34/34 passam] "Todos os testes passam"
❌ "Deve passar agora" / "Parece correto"
```

**Testes de regressão (TDD vermelho-verde):**
```
✅ Escreve → Roda (passa) → Reverte a correção → Roda (TEM QUE FALHAR) → Restaura → Roda (passa)
❌ "Escrevi um teste de regressão" (sem verificação vermelho-verde)
```

**Build:**
```
✅ [Roda o build] [Vê: código de saída 0] "O build passa"
❌ "O linter passou" (o linter não verifica a compilação)
```

**Requisitos:**
```
✅ Relê o plano → Cria um checklist → Verifica cada item → Relata lacunas ou conclusão
❌ "Os testes passam, fase concluída"
```

**Delegação a agentes:**
```
✅ O agente relata sucesso → Confere o diff do controle de versão → Verifica as mudanças → Relata o estado real
❌ Confiar no relato do agente
```

## Quando aplicar

**SEMPRE antes de:**
- QUALQUER variação de afirmação de sucesso/conclusão
- QUALQUER demonstração de satisfação
- QUALQUER afirmação positiva sobre o estado do trabalho
- Commit, criação de PR, conclusão de tarefa
- Passar para a próxima tarefa
- Delegar a agentes

**A regra se aplica a:**
- Frases exatas
- Paráfrases e sinônimos
- Implicações de sucesso
- QUALQUER comunicação que sugira conclusão/correção

---

_Traduzido para o português a partir de [obra/superpowers](https://github.com/obra/superpowers) (`skills/verification-before-completion`), licença MIT — Copyright (c) 2025 Jesse Vincent. Veja `LICENSE` nesta pasta._
