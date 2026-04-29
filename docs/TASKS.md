# 📋 Backlog de Tarefas - Migração e Implementação (TOV)

## 1. Setup da Infraestrutura (Svelte + SOLID)
- [ ] **Configurar Svelte 5 + Vite**: Estruturar pastas seguindo o padrão `/lib` para lógica pura e `/stores` para estado.
- [ ] **Criar GazeStore**: Implementar o "motor" que encapsula o WebGazer (DIP - Inversão de Dependência).
- [ ] **Implementar CsvService**: Criar a classe de exportação baseada no `DATA_DICTIONARY.md`.

## 2. Configuração do Experimento (Setup Stage)
- [ ] **Componente de Upload**: Refazer o input de arquivos para suportar múltiplas imagens e gerar Blob URLs.
- [ ] **Interface de Controle**:
    - [ ] Input para `isRandom` (Checkbox).
    - [ ] Toggle para `mode` (FIXED/MANUAL).
    - [ ] Input numérico para `duration`.
    - [ ] **[NOVO]** Input para `recalibrationInterval` (Ex: "A cada 5 imagens").

## 3. Calibração e Precisão
- [ ] **Componente CalibrationPoint**: Criar componente Svelte puro (sem indentação aninhada).
- [ ] **Lógica de 9 Cliques**: Implementar contador por ponto (Total 81 cliques).
- [ ] **Validação de 5 Segundos**: Implementar o ponto central de validação para cálculo de distância euclidiana.
- [ ] **Feedback de Erro**: Se precisão < limiar, exibir modal (SweetAlert2) para repetir ou prosseguir.

## 4. Motor de Execução (Run Stage)
- [ ] **Loop de Estímulos**: Implementar a lógica que percorre o array de imagens.
- [ ] **Gerenciador de Recalibração**:
    - [ ] Criar contador de imagens exibidas.
    - [ ] Implementar trigger: `if (currentCount % recalibrationInterval === 0) -> Pausar e Calibrar`.
- [ ] **Coleta em Tempo Real**:
    - [ ] Capturar `getBoundingClientRect()` da imagem ativa.
    - [ ] Vincular predições do WebGazer ao `ExportRow` model.
- [ ] **Controle de Teclado**: Listener para tecla `Spacebar` (apenas no modo MANUAL).

## 5. Exportação e Encerramento
- [ ] **Formatador JSON**: Implementar o escape de aspas duplicadas para a coluna `GazeData_JSON`.
- [ ] **Trigger de Download**: Gerar o Blob e disparar o download automaticamente ao fim da última imagem.
- [ ] **Cleanup**: Garantir que `webgazer.end()` seja chamado para liberar a câmera do usuário.

## 6. Refinamento (Object Calisthenics Check)
- [ ] Revisar funções: Garantir que nenhuma tenha mais de um nível de indentação.
- [ ] Remover todos os blocos `else` substituindo por `Early Returns`.
- [ ] Validar se as coordenadas `x, y` estão encapsuladas em objetos `Point`.