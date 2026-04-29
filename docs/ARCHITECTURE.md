# 🏛 Arquitetura do Sistema - TOV (Eye Tracking)

## Visão Geral
Sistema de rastreamento ocular baseado em navegador, operando 100% no client-side (Serverless/No-Backend). Focado em pesquisadores que precisam de uma ferramenta rápida para experimentos de visualização de imagens.

## Stack Tecnológica
- **Framework:** Svelte 5 (Vite)
- **Engine de Rastreamento:** WebGazer.js
- **UI:** Tailwind CSS 4 + Radix UI (Svelte versions)
- **Persistência:** Svelte Stores (Memória) + Download de Blob (CSV)

## Gestão de Estado (Svelte Stores)
1. **experimentStore**: Armazena as imagens enviadas (como Blob URLs), o modo de tempo (Fixo vs Livre) e as configurações.
2. **webgazerStore**: Gerencia a instância do WebGazer, garantindo que o ciclo de vida (`begin`, `pause`, `end`) seja respeitado entre as trocas de rotas/componentes.
3. **resultsStore**: Um array reativo que acumula os pontos capturados `[timestamp, x, y, imageId]`.

## Fluxo de Ciclo de Vida do WebGazer
- **Inicialização**: Ocorre no componente de Calibração.
- **Interrupção**: Ocorre obrigatoriamente ao finalizar o experimento para liberar a Webcam.
- **Coleta**: O listener do WebGazer envia dados para a `resultsStore` apenas enquanto o estágio for `experiment_run`.