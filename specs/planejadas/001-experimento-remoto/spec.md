# Especificação de Funcionalidade: Experimento Remoto com Link de Participação

**Feature:** `001-experimento-remoto`
**Criado em:** 2026-10-12
**Status:** Rascunho (aguardando clarificações)
**Origem:** Reunião com o orientador (Prof. Fabio José Gomes de Sousa) — novos requisitos do TOV

> Esta especificação descreve **o quê** o sistema deve fazer e **por quê**.
> Decisões de **como** (framework, banco, hospedagem) ficam no `plan.md`.

---

## Contexto

Hoje o TOV_02 roda 100% no navegador: o pesquisador e o participante usam a **mesma máquina**,
as imagens ficam só na memória e o CSV é baixado ao final da sessão. Não há persistência,
nem conta de pesquisador, nem forma de aplicar o experimento a distância.

A nova versão separa os dois atores:

- o **Pesquisador** cria e guarda experimentos, compartilha um link e depois baixa os dados;
- o **Participante** abre o link no próprio computador, faz calibração e experimento **sem login**,
  e os dados vão automaticamente para o pesquisador.

O que já existe e deve ser **reaproveitado** sem mudança de comportamento: calibração por cliques,
validação de precisão, recalibração periódica, modos FIXED/MANUAL, aleatorização, filtro de Kalman
(descritos em `specs/aceitas/000-experimento-local/spec.md`) e o formato de dados do
`docs/DATA_DICTIONARY.md`.

---

## Cenários de Usuário e Testes *(obrigatório)*

### História 1 — Pesquisador cria e configura um experimento (Prioridade: P1)

O pesquisador cria um experimento com nome, instruções ao participante, imagens de estímulo e as
configurações já existentes (aleatório, modo, duração, intervalo de recalibração, Kalman, limite de
precisão). O experimento fica salvo e pode ser reaberto depois.

**Por que P1:** sem experimento persistido, não há o que compartilhar.

**Teste independente:** criar um experimento, fechar o navegador, entrar de novo e encontrar o
experimento com as mesmas imagens e configurações.

**Cenários de aceitação:**
1. **Dado** um pesquisador autenticado, **quando** ele envia 5 imagens e salva com modo FIXED e 5000 ms,
   **então** o experimento aparece na lista dele com 5 estímulos e as configurações salvas.
2. **Dado** um experimento salvo **sem** sessões de participantes, **quando** o pesquisador altera imagens
   ou configurações, **então** as alterações são salvas.
3. **Dado** um experimento que **já tem** sessões, **quando** o pesquisador tenta alterar estímulos ou
   configurações, **então** o sistema impede e oferece **duplicar** o experimento (para não misturar
   dados coletados com protocolos diferentes).

---

### História 2 — Pesquisador gera e compartilha o link de participação (Prioridade: P1)

Cada experimento tem um link público único. O pesquisador copia o link e envia ao participante pelo
canal que quiser (e-mail, WhatsApp). O pesquisador pode **abrir** e **encerrar** a coleta.

**Por que P1:** é o requisito central da reunião.

**Teste independente:** copiar o link, abrir em outro navegador/computador **sem estar logado** e ver
a tela inicial do experimento.

**Cenários de aceitação:**
1. **Dado** um experimento com coleta aberta, **quando** o pesquisador clica em "Copiar link",
   **então** o link vai para a área de transferência.
2. **Dado** um experimento com coleta **encerrada**, **quando** alguém abre o link, **então** vê a mensagem
   "Este experimento não está recebendo participações" e não consegue iniciar.
3. **Dado** um link com identificador inexistente, **quando** alguém o abre, **então** vê uma página de
   "experimento não encontrado" (sem revelar outros experimentos).

---

### História 3 — Participante executa o experimento pelo link, sem login (Prioridade: P1)

O participante abre o link e passa por: boas-vindas e instruções → termo de consentimento →
identificação → verificação da webcam → calibração → validação de precisão → apresentação dos
estímulos (com recalibrações, se configuradas) → envio dos dados → tela de agradecimento.

**Por que P1:** é onde os dados são produzidos.

**Teste independente:** em um computador diferente do pesquisador, completar o fluxo inteiro e
verificar que a sessão aparece para o pesquisador como "concluída".

**Cenários de aceitação:**
1. **Dado** um link válido, **quando** o participante abre, **então** vê as instruções do experimento
   e **nenhuma** tela de login.
2. **Dado** a tela de consentimento, **quando** o participante **não** aceita, **então** o experimento não
   inicia e a webcam não é ativada.
3. **Dado** que o navegador nega acesso à câmera, **quando** o participante tenta seguir, **então** vê
   instruções de como liberar a permissão e não avança para a calibração.
4. **Dado** que a precisão da validação ficou abaixo do limite, **quando** termina a validação, **então** o
   participante pode recalibrar (mesmo comportamento atual do TOV_02).
5. **Dado** a última imagem exibida, **quando** a coleta termina, **então** os dados são enviados ao servidor,
   a webcam é liberada e aparece a tela de agradecimento.
6. **Dado** uma falha de rede no envio, **quando** o envio não confirma, **então** o sistema tenta de novo e,
   se continuar falhando, oferece ao participante um botão para **baixar o arquivo de backup** e enviar
   ao pesquisador manualmente.

---

### História 4 — Pesquisador consulta e baixa os dados dos participantes (Prioridade: P1)

O pesquisador vê a lista de sessões de um experimento (identificação, data, status, precisão da
calibração, número de amostras) e baixa os dados.

**Por que P1:** fecha o ciclo da pesquisa; sem isso a coleta remota não serve.

**Teste independente:** com 2 sessões concluídas, baixar os dados e abrir no Excel/Python sem erro
de formato.

**Cenários de aceitação:**
1. **Dado** um experimento com sessões, **quando** o pesquisador abre a aba de resultados, **então** vê uma
   linha por sessão com status (`em andamento`, `concluída`, `incompleta`).
2. **Dado** uma sessão concluída, **quando** o pesquisador clica em "Baixar", **então** recebe um CSV no formato
   do `DATA_DICTIONARY.md`.
3. **Dado** várias sessões, **quando** o pesquisador clica em "Baixar todos", **então** recebe um único
   arquivo (ZIP com um CSV por sessão + um CSV de metadados das sessões).

---

### História 5 — Autenticação do pesquisador (Prioridade: P1)

O pesquisador entra com credenciais para acessar **somente os próprios** experimentos e dados.

**Por que P1:** os dados de olhar são dados de pessoas; sem autenticação, qualquer um baixaria tudo.

**Teste independente:** sem login, tentar acessar a lista de experimentos ou o download → bloqueado.

**Cenários de aceitação:**
1. **Dado** um visitante não autenticado, **quando** acessa qualquer página do pesquisador, **então** é
   levado para o login.
2. **Dado** dois pesquisadores A e B, **quando** A está logado, **então** não vê nem baixa dados de B.

---

### História 6 — Gestão básica (Prioridade: P3)

Excluir sessão, excluir experimento, duplicar experimento.

**Por que P3:** útil, mas o TCC fica de pé sem isso.

---

### Casos de Borda

- Participante **fecha a aba** no meio → sessão fica `incompleta`; o que já foi enviado é mantido.
- Participante abre o link **em celular** → aviso de que é necessário computador com webcam.
- Participante abre o link **duas vezes** → cada abertura gera uma sessão nova (não há login para deduplicar).
- Participante digita um **código já usado** no mesmo experimento → a sessão é criada normalmente e aparece
  sinalizada como "código repetido" na lista do pesquisador, que decide o que fazer.
- Participante digita código **fora do formato** → mensagem de validação e não avança.
- Tela do participante **diferente** da do pesquisador → resolução e viewport registradas na sessão; as
  coordenadas da imagem na tela (`ImageScreenX/Y`, `ImageWidth/Height`) já cobrem a análise.
- Imagens muito grandes → limite de tamanho por arquivo no upload.
- Pesquisador **encerra a coleta** com sessões em andamento → sessões em andamento podem terminar.
- Acesso via **HTTP** sem TLS → o navegador bloqueia a webcam; o sistema precisa ser servido em **HTTPS**.

---

## Requisitos *(obrigatório)*

### Requisitos Funcionais

**Pesquisador**
- **FR-001**: O sistema DEVE permitir que o pesquisador se autentique (login/logout).
- **FR-002**: O sistema DEVE permitir criar, listar, editar e visualizar experimentos do pesquisador autenticado.
- **FR-003**: O sistema DEVE permitir enviar múltiplas imagens como estímulos e armazená-las de forma persistente.
- **FR-004**: O sistema DEVE persistir as configurações: `isRandom`, `mode` (FIXED/MANUAL), `duration`,
  `recalibrationInterval`, `useKalmanFilter` e limite de precisão aceitável.
- **FR-005**: O sistema DEVE bloquear a edição de estímulos/configurações de experimentos que já possuem sessões.
- **FR-006**: O sistema DEVE gerar um link público e único por experimento, com identificador não sequencial
  (não adivinhável).
- **FR-007**: O sistema DEVE permitir abrir e encerrar a coleta de um experimento.
- **FR-008**: O sistema DEVE listar as sessões de um experimento com identificação, data/hora, status,
  precisão de calibração e número de amostras.
- **FR-009**: O sistema DEVE permitir baixar os dados de uma sessão em CSV conforme `DATA_DICTIONARY.md`.
- **FR-010**: O sistema DEVE permitir baixar os dados de todas as sessões de um experimento em um único arquivo.

**Participante**
- **FR-011**: O participante DEVE conseguir iniciar o experimento apenas acessando o link, **sem login**.
- **FR-012**: O sistema DEVE exibir as instruções e um termo de consentimento antes de ativar a webcam, e
  registrar o aceite (data/hora) na sessão.
- **FR-013**: O participante DEVE informar um **código de participante** combinado previamente com o pesquisador
  (letras, números e hífen, 1 a 20 caracteres). O sistema não pede nenhum outro dado pessoal.
- **FR-014**: O sistema DEVE executar calibração, validação e recalibração exatamente como o TOV_02 atual.
- **FR-015**: O sistema DEVE apresentar os estímulos conforme as configurações salvas do experimento.
- **FR-016**: O sistema DEVE enviar os dados coletados ao servidor e só mostrar "concluído" após confirmação.
- **FR-017**: O sistema DEVE oferecer download local de backup se o envio falhar após novas tentativas.
- **FR-018**: O sistema DEVE liberar a webcam (`webgazer.end()`) ao concluir ou abandonar o experimento.
- **FR-019**: O sistema DEVE registrar metadados da sessão: início, fim, resolução de tela, viewport,
  navegador (user agent), resultados de cada calibração/validação.

**Gestão (P3)**
- **FR-020**: O sistema PODE permitir excluir sessões, excluir experimentos e duplicar experimentos.

### Requisitos Não Funcionais

- **NFR-001 (Privacidade/LGPD)**: Nenhuma imagem ou vídeo da webcam sai do navegador do participante;
  só coordenadas de olhar e metadados técnicos são enviados.
- **NFR-002 (Minimização)**: O sistema não deve exigir nome, e-mail ou documento do participante.
- **NFR-003 (Segurança)**: Dados e estímulos só são acessíveis ao pesquisador dono do experimento.
- **NFR-004 (HTTPS)**: A aplicação deve ser servida em HTTPS (exigência do navegador para webcam).
- **NFR-005 (Implantação)**: O sistema deve subir com um único comando (`docker compose up`).
- **NFR-006 (Código aberto)**: Mantém-se open source e segue as regras de código do `AGENTS.md` e a skill `clean-code`.
- **NFR-007 (Compatibilidade)**: Chrome e Firefox de desktop recentes.

### Entidades Principais

- **Pesquisador**: quem cria experimentos. Conta própria (e-mail e senha); vê apenas os próprios experimentos.
- **Experimento**: nome, instruções, configurações, status da coleta (aberta/encerrada), identificador público do link. Pertence a um Pesquisador.
- **Estímulo**: imagem do experimento, com nome original e ordem. Pertence a um Experimento.
- **Sessão de Participação**: uma execução do experimento por um participante. Código de participante digitado, aceite do termo, status, início/fim, metadados do dispositivo. Pertence a um Experimento.
- **Calibração**: resultado de cada calibração/validação na sessão (precisão, momento). Pertence a uma Sessão.
- **Registro de Olhar**: linha do `DATA_DICTIONARY.md` (timestamp, estímulo, geometria da imagem, `GazeData_JSON`). Pertence a uma Sessão.

---

## Critérios de Sucesso *(obrigatório)*

- **SC-001**: Um pesquisador cria um experimento com 5 imagens e copia o link em menos de 5 minutos.
- **SC-002**: Um participante, sem ajuda, completa o fluxo do link até a tela de agradecimento em outro computador.
- **SC-003**: 100% das sessões concluídas aparecem na lista do pesquisador e podem ser baixadas.
- **SC-004**: O CSV baixado abre sem erro no Excel e em `pandas.read_csv`, com as 7 colunas do `DATA_DICTIONARY.md`.
- **SC-005**: Um usuário não autenticado não consegue acessar nenhum dado de sessão (teste manual + automatizado).
- **SC-006**: Nenhuma requisição do participante ao servidor contém imagem/vídeo da webcam (verificado na aba Network).

---

## Fora de Escopo

- Análise ou visualização dos dados (heatmap, fixações, sacadas).
- Estímulos em vídeo ou páginas web.
- Uso em celular/tablet.
- Colaboração entre pesquisadores no mesmo experimento.
- Recuperação de senha por e-mail.

---

## Rastreabilidade com o artigo (Quadro 2 do TCC)

| Requisito no TCC | Situação na nova versão |
| :--- | :--- |
| RF001 Upload e processamento de imagens | FR-003 (agora persistente) |
| RF002 Calibração | FR-014 (sem mudança) |
| RF003 Recalibração | FR-014 (sem mudança) |
| RF004 Conduzir o experimento registrando os dados | FR-011, FR-015, FR-016, FR-019 |
| RF005 Download dos dados | FR-009, FR-010 (agora pelo pesquisador, de várias sessões) |
| RF006 Iniciar novo experimento | FR-002 (vários experimentos salvos) |
| RF007 Autenticação (era Média) | FR-001 → **Alta** |
| RF008 Compartilhamento remoto (era Média) | FR-006, FR-007, FR-011 → **Alta** |

---

## Clarificações pendentes

1. Stack do backend e hospedagem → decidir no `plan.md`.
2. ~~Autenticação~~ → **decidido (2026-10-12):** conta por pesquisador (e-mail e senha).
3. ~~Identificação do participante~~ → **decidido (2026-10-12):** código digitado pelo participante (FR-013).
4. Envio dos dados: só no final, ou em lotes durante a execução (afeta o que sobra de uma sessão `incompleta`).
5. O termo de consentimento é texto fixo do sistema ou editável por experimento?
