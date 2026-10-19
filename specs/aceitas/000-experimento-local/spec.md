# Especificação de Funcionalidade: Experimento Local (versão atual)

**Feature:** `000-experimento-local`
**Criado em:** 2026-10-19
**Status:** Aceita (retroativa)
**Origem:** documenta o comportamento do código no commit `abcc54c`. Substitui o
antigo `docs/EXPERIMENT_PROTOCOL.md`.

> Spec retroativa: descreve o que o sistema **já faz**, por isso não tem
> `plan.md` nem `tasks.md`. O formato do CSV está em `docs/DATA_DICTIONARY.md`.

---

## Contexto

O TOV roda 100% no navegador. Pesquisador e participante usam a **mesma máquina**:
o pesquisador carrega as imagens e configura o experimento, o participante faz a
calibração e vê as imagens, e o CSV é baixado no fim. Nada é salvo entre sessões.

Fluxo: **configuração → calibração → validação → apresentação das imagens
(com recalibrações, se configuradas) → download do CSV → volta à configuração.**

---

## Cenários de aceitação

### 1. Configuração

1. **Dado** a tela inicial, **quando** o pesquisador arrasta ou seleciona arquivos,
   **então** só os arquivos de imagem são adicionados (os demais são ignorados sem
   aviso) e cada um aparece como miniatura com botão de remover.
2. **Dado** nenhuma imagem carregada, **então** o botão "Iniciar Calibração" fica
   desabilitado.
3. **Dado** a tela inicial, **então** a webcam já está ligada e a imagem da câmera
   aparece na tela (o WebGazer é iniciado ao abrir a página).

### 2. Calibração

1. **Dado** o início da calibração, **então** a tela fica escura, mostra 13 pontos
   e só um está ativo por vez.
2. **Dado** um ponto que acabou de ficar ativo, **quando** o participante clica
   antes de 700 ms, **então** o clique é ignorado (o ponto pulsa enquanto espera).
3. **Dado** um ponto ativo e pronto, **quando** o participante clica nele 7 vezes,
   **então** o próximo ponto fica ativo. Cliques em pontos inativos são ignorados.
4. **Dado** a ordem dos pontos, **então** ela é aleatória a cada calibração, e o
   ponto central é sempre o último.
5. **Dado** o último clique do último ponto, **então** começa a validação.

### 3. Validação de precisão

1. **Dado** o fim da calibração, **então** aparece uma contagem regressiva de 3 s
   com a instrução de olhar para o ponto azul.
2. **Dado** a contagem encerrada, **então** um ponto percorre 5 posições, parando
   2,5 s em cada uma e levando 0,8 s para ir de uma à outra (cerca de 15,7 s no total).
3. **Dado** o resultado com precisão **≥ 65%**, **então** o sistema mostra
   "Calibração OK" e oferece "Iniciar Experimento" ou "Recalibrar".
4. **Dado** o resultado com precisão **< 65%**, **então** o sistema mostra
   "Precisão insuficiente" e só oferece "Repetir Calibração".
5. **Dado** "Recalibrar" ou "Repetir Calibração", **então** a calibração recomeça
   do zero, descartando os dados de treino anteriores do WebGazer.

### 4. Apresentação das imagens

1. **Dado** o início do experimento, **então** as imagens aparecem uma por vez,
   em tela cheia sobre fundo preto, ocupando até 90% da largura e da altura sem
   distorcer.
2. **Dado** "Ordem aleatória" ligada, **então** a ordem é embaralhada uma vez no
   início; desligada, segue a ordem de carregamento.
3. **Dado** o modo **Fixo**, **então** cada imagem fica na tela pela duração
   configurada e avança sozinha.
4. **Dado** o modo **Manual**, **quando** o participante aperta a barra de espaço,
   **então** a próxima imagem aparece. Outras teclas não fazem nada.
5. **Dado** a imagem exibida, **então** o sistema registra o olhar cerca de 30 vezes
   por segundo (a cada 33 ms). Pontos fora da janela do navegador são descartados.

### 5. Recalibração periódica

1. **Dado** "Recalibrar a cada N imagens" com N > 0, **quando** termina a N-ésima
   imagem (e a 2N-ésima, 3N-ésima…) e ainda há imagens, **então** a calibração e a
   validação completas aparecem antes da próxima imagem.
2. **Dado** uma recalibração durante o experimento, **então** os dados de treino
   anteriores do WebGazer são mantidos, a menos que o participante escolha
   "Recalibrar" ou "Repetir Calibração" na validação.
3. **Dado** uma recalibração, **então** nenhum olhar é registrado enquanto ela dura,
   e o tempo da imagem seguinte só começa a contar quando ela termina.
4. **Dado** N = 0, ou a última imagem, **então** não há recalibração.

### 6. Encerramento e exportação

1. **Dado** o fim da última imagem, **então** o CSV é baixado automaticamente com o
   nome `tov_result_<timestamp>.csv`.
2. **Dado** o download, **então** as imagens são descartadas, as configurações são
   mantidas e o sistema volta à tela inicial.
3. **Dado** que nenhuma imagem chegou a ser exibida, **então** nenhum arquivo é baixado.

---

## Requisitos

- **FR-001**: Aceitar várias imagens por arraste ou seleção (`image/*`), com remoção individual.
- **FR-002**: Permitir configurar `isRandom`, `mode` (`FIXED`/`MANUAL`), `duration`,
  `recalibrationInterval` e `useKalmanFilter`.
- **FR-003**: Calibrar com 13 pontos e 7 cliques por ponto (91 cliques), em ordem
  aleatória e com o ponto central por último. Cada clique treina o WebGazer com a
  posição do centro do ponto. Os movimentos e cliques comuns do mouse não treinam
  o modelo.
- **FR-004**: Validar com 5 pontos e calcular a precisão como descrito abaixo.
- **FR-005**: Liberar o experimento só com precisão ≥ 65%.
- **FR-006**: Apresentar as imagens nos modos `FIXED` e `MANUAL`.
- **FR-007**: Interromper o experimento para recalibrar a cada `recalibrationInterval` imagens.
- **FR-008**: Gerar uma linha de CSV por imagem exibida, com a geometria da área
  realmente desenhada da imagem (sem as faixas vazias) e a lista de olhares
  registrados nela.
- **FR-009**: Baixar o CSV no formato de `docs/DATA_DICTIONARY.md` ao fim do experimento.
- **FR-010**: Aplicar o filtro de Kalman do WebGazer assim que a opção é alterada.

### Cálculo da precisão

Para cada amostra coletada durante as paradas (depois de 800 ms parado, no
máximo uma a cada 50 ms, ignorando leituras `(0, 0)`):

```
distância = distância euclidiana entre o olhar e o ponto, em pixels
nota      = 100 − (distância ÷ (altura da janela ÷ 2)) × 100, mínimo 0
precisão  = média das notas, arredondada (0–100%)
```

Sem nenhuma amostra, a precisão é 0%.

---

## Parâmetros

| Parâmetro | Valor | Onde |
| :--- | :--- | :--- |
| Pontos de calibração | 13, em % da janela: os 8 da borda em 10/50/90, 4 internos em 30/70, centro em 50,50 | `calibration/calibrationPoints.ts` |
| Cliques por ponto | 7 | `calibrationPoints.ts` |
| Espera antes de aceitar clique | 700 ms | `calibrationPoints.ts` |
| Pontos de validação | (15,15), (85,15), (50,50), (15,85), (85,85), em % | `calibration/validation/validationConfig.ts` |
| Parada / deslocamento / acomodação | 2500 / 800 / 800 ms | `validationConfig.ts` |
| Intervalo entre amostras da validação | 50 ms | `validationConfig.ts` |
| Limite de precisão | 65% | `validationConfig.ts` |
| Contagem regressiva | 3 s | `validationConfig.ts` |
| Intervalo de coleta do olhar | 33 ms | `services/DataCollector.svelte.ts` |
| Padrões da configuração | `isRandom` falso, `FIXED`, 5000 ms, recalibração 0, Kalman desligado | `stores/experimentStore.svelte.ts` |
| Regressão do WebGazer | `ridge`, sem salvar dados entre sessões | `stores/GazeStore.svelte.ts` |

---

## Como os campos do CSV são preenchidos

- **`timestamp`** (coluna): momento em que a imagem terminou de carregar na tela.
  Depois de uma recalibração, passa a ser o momento em que ela terminou.
- **`ImageWidth`/`ImageHeight`/`ImageScreenX`/`ImageScreenY`**: área desenhada da
  imagem, já descontadas as faixas pretas do ajuste proporcional.
- **`GazeData_JSON`**: um objeto por amostra, com:
  - `x` e `y` sem arredondamento;
  - `timestamp`: momento em que a amostra foi registrada;
  - `elapsedTime`: milissegundos desde o `timestamp` da linha.

---

## Limitações conhecidas

Comportamentos atuais registrados aqui para não serem confundidos com requisitos.
Corrigir qualquer um deles exige uma tarefa própria.

- A webcam é ligada ao abrir a página e só é desligada ao fechar a aba. Isso
  contraria o princípio IV da constituição e é tratado na feature 001 (FR-012, FR-018).
- Se a câmera falhar ou for negada, o erro só aparece no console; a tela não avisa nada.
- O nome da imagem entra no CSV sem escape: um nome com vírgula desalinha as colunas.
- A duração aceita valores abaixo de 0,5 s ou vazios digitados à mão; o mínimo só
  existe no campo da tela.
- A descrição do filtro de Kalman na tela cita "Percurso/Lissajous", métodos de
  calibração que já não existem.

### Divergências com `docs/DATA_DICTIONARY.md`

- O dicionário diz que o `timestamp` de cada entrada é igual ao da primeira coluna.
  No código, ele é o momento da amostra.
- O dicionário diz que `elapsedTime` conta desde o início da sessão do WebGazer.
  No código, conta desde o `timestamp` da linha.
- O dicionário pede arredondamento consistente (ex.: `.toFixed(2)`). O código não
  arredonda.

Até que uma das duas versões seja escolhida, nenhuma é alterada.
