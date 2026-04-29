# 📊 Dicionário de Dados (Especificação Técnica do CSV)

Este documento define a estrutura obrigatória do arquivo de saída do sistema **TOV**. O formato deve ser um arquivo `.csv` utilizando a codificação **UTF-8**.

## 📋 Cabeçalho (Header)
O arquivo gerado deve conter exatamente as seguintes 7 colunas:

`timestamp,ImageName,ImageWidth,ImageHeight,ImageScreenX,ImageScreenY,GazeData_JSON`

---

## 🔍 Detalhamento das Colunas

| Coluna | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| **timestamp** | `Number` | Unix Epoch em ms no momento da captura. | `1774639661938` |
| **ImageName** | `String` | Nome do arquivo da imagem exibida. | `stimulus_01.jpg` |
| **ImageWidth** | `Number` | Largura da imagem renderizada no browser (pixels). | `1280` |
| **ImageHeight** | `Number` | Altura da imagem renderizada no browser (pixels). | `720` |
| **ImageScreenX** | `Number` | Posição X do topo-esquerdo da imagem na tela. | `320.5` |
| **ImageScreenY** | `Number` | Posição Y do topo-esquerdo da imagem na tela. | `180.0` |
| **GazeData_JSON** | `JSON Array` | Array JSON escapado contendo a predição bruta e metadados. | `"[ {""x"":841.27, ""y"":569.41, ""timestamp"":1774639661938, ""elapsedTime"":31947.9} ]"` |

---

## 📐 Regras de Coleta e Formatação (SOLID)

### 1. Estrutura do GazeData_JSON
Conforme os dados brutos extraídos, cada entrada nesta coluna deve ser um array contendo:
* `x`: Coordenada horizontal (float).
* `y`: Coordenada vertical (float).
* `timestamp`: O mesmo valor da primeira coluna (para redundância).
* `elapsedTime`: Tempo decorrido desde o início da sessão do WebGazer.

### 2. Formatação de Escape (CSV Compliance)
Para garantir que o JSON interno não quebre a estrutura das colunas:
1. O Array deve ser envolvido por aspas duplas: `"[...]"`
2. As aspas internas do JSON devem ser duplicadas: `""x"":` em vez de `"x":`
3. Exemplo de linha bruta no arquivo:
   `1774639661938,img.jpg,800,600,0,0,"[{""x"":841.27,""y"":569.41,""timestamp"":1774639661938,""elapsedTime"":31947.8}]"`

### 3. Responsabilidade da Captura (Single Responsibility)
* O componente de UI não deve formatar o JSON. 
* Deve existir um **Mapper** ou **Service** que receba o objeto bruto do WebGazer e transforme-o na string formatada para o CSV, garantindo que o arredondamento (ex: `.toFixed(2)`) seja consistente.