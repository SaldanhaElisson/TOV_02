# 🧪 Protocolo do Experimento

## 1. Configuração (Setup)
O pesquisador define os parâmetros iniciais para o controle do fluxo e qualidade dos dados.

- **Upload de Estímulos**: O pesquisador faz upload de N imagens.
- **Variáveis de Controle:**
    - `isRandom`: Booleano. Se `true`, as imagens são embaralhadas antes do início.
    - `mode`: Enum (`FIXED` | `MANUAL`). 
        - `FIXED`: Passagem automática por tempo.
        - `MANUAL`: Troca via tecla `Spacebar`.
    - `duration`: Inteiro. Tempo em milissegundos para o modo `FIXED`.
    - `recalibrationInterval`: Inteiro. Define a cada quantas imagens o sistema deve interromper o fluxo para uma nova calibração (Prevenção de Drift).

## 2. Calibração (O Padrão de Ouro)
- **Padrão:** 9 pontos de calibração dispostos em grid (3x3).
- **Interação:** 9 cliques por ponto para garantir o treinamento do modelo (Total: 81 cliques).
- **Validação de Precisão:** Após a calibração, o usuário observa um ponto central por 5 segundos.
- **Cálculo:** Distância euclidiana entre o olhar e o alvo. Se o erro for superior ao limite aceitável, a recalibração é sugerida.

## 3. Coleta de Dados e Recalibração Periódica
- **Registro**: Durante a exibição, o sistema registra coordenadas (X, Y) vinculadas ao `ImageName`.
- **Interrupção para Recalibração**: 
    - Se `recalibrationInterval > 0`, o sistema incrementa um contador a cada imagem exibida.
    - Ao atingir o limite definido, o fluxo de experimento é pausado e o usuário é redirecionado para a tela de Calibração antes de prosseguir com as imagens restantes.
- **Eventos de Transição**: No modo `MANUAL`, o pressionamento da tecla `Spacebar` encerra a coleta do estímulo atual e dispara o log de transição.