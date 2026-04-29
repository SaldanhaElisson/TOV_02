# 🛠 Guia de Estilo e Princípios (SOLID & Calisthenics)

## Regras de Implementação
1. **Sem 'Else':** Use retornos antecipados para validar estados da câmera e permissões.
2. **Primitivos Encapsulados:** Coordenadas devem ser tratadas como objetos `Point { x, y }`.
3. **Lógica Pura:** Funções de cálculo de distância euclidiana devem ser exportadas como funções puras, sem dependências de DOM.
4. **Svelte Stores como Mediadores:** Nenhum componente acessa o `window.webgazer` diretamente; todos passam pela 
`webgazerStore`.
5. **Mantenha as entidades pequenas:** Arquivos no máximo 50 linas. Pacotes no máximo 10 arquivos

## Estrutura de Pastas de Acordo com SOLID
- `/src/lib/math`: Cálculos puros (S).
- `/src/lib/export`: Estratégias de download (O).
- `/src/stores`: Inversão de dependência (D).