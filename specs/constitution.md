# Constituição do TOV

**Versão:** 1.0.1 · **Ratificada em:** 2026-10-19 · **Última alteração:** 2026-10-19

Princípios inegociáveis do projeto. Toda spec, todo `plan.md` e todo código são
avaliados contra eles. O `AGENTS.md` diz **como** trabalhar no dia a dia; esta
constituição diz **o que não pode ser violado**. Em caso de conflito, a
constituição prevalece.

---

## I. O pesquisador não precisa programar

- O pesquisador DEVE conseguir criar e configurar experimentos, compartilhar o
  link de participação e baixar os dados apenas pela interface.
- Nenhuma dessas ações pode exigir editar código, arquivos de configuração ou
  usar o terminal.

**Por quê:** essa é a lacuna que o TOV preenche. Uma funcionalidade que exige
programar não serve ao público do projeto.

## II. O participante só abre um link

- O participante NUNCA precisa de cadastro, login ou instalação.
- Do link à tela de agradecimento, cada passo DEVE ter uma instrução curta do
  que fazer.
- O sistema DEVE funcionar no Chrome e no Firefox de desktop recentes. Em celular
  ou tablet, DEVE avisar que é preciso um computador com webcam.

**Por quê:** cada obstáculo a mais faz o participante desistir no meio da sessão.

## III. Linguagem simples

- Todo texto visível ao pesquisador ou ao participante DEVE estar em português
  simples.
- Um termo técnico (ex.: filtro de Kalman, viewport, timestamp) só aparece na
  tela acompanhado de uma explicação curta e clara.

**Por quê:** nem o pesquisador nem o participante têm a obrigação de saber o que
é eye tracking.

## IV. Privacidade do participante

- Nenhuma imagem ou vídeo da webcam DEVE sair do navegador do participante. Só
  coordenadas de olhar e metadados técnicos são enviados.
- O sistema NÃO DEVE pedir nome, e-mail, documento ou qualquer outro dado
  pessoal do participante além do código combinado com o pesquisador.
- A webcam só é ativada depois do aceite do termo de consentimento e DEVE ser
  liberada ao concluir ou abandonar o experimento.
- Dados de sessões e estímulos só são acessíveis ao pesquisador dono do
  experimento.

**Por quê:** dados de olhar são dados de pessoas (LGPD). Coletar o mínimo
protege o participante e a pesquisa.

## V. Fidelidade dos dados científicos

- O formato dos dados exportados é o de `docs/DATA_DICTIONARY.md`. Mudar o
  formato exige atualizar o dicionário antes do código.
- Calibração, validação e recalibração seguem
  `specs/aceitas/000-experimento-local/spec.md`. Mudar o protocolo exige
  atualizar a spec antes do código.
- Uma sessão só aparece como concluída depois que o envio dos dados foi
  confirmado. Se o envio falhar, o participante DEVE poder baixar um arquivo de
  backup.
- Um experimento que já tem sessões NÃO pode ter estímulos ou configurações
  alterados, para não misturar dados coletados com protocolos diferentes.

**Por quê:** dado perdido ou coletado com protocolos misturados invalida a
análise.

## VI. Spec antes do código

- Toda funcionalidade segue a ordem `spec.md` → `plan.md` → `tasks.md` → código.
- Uma mudança de comportamento atualiza a spec antes do código.
- `specs/aceitas/` descreve o que o sistema faz hoje.

**Por quê:** a spec é o que se compara com o TCC e com o que foi combinado com o
orientador. Código sem spec não tem como ser avaliado.

## VII. Testes reais

- Lógica nova DEVE ter testes reais, escritos em Dado-Quando-Então.
- Um teste NUNCA é alterado só para passar.
- Nada é declarado pronto sem `npm run check` e `npm run test:run` passando, com
  a saída mostrada como evidência.

**Por quê:** os resultados do TCC dependem de o sistema fazer o que diz fazer.

## VIII. Simplicidade

- Uma regra (validação, cálculo, formato) tem uma única implementação.
- O código segue as regras de tamanho e estilo do `AGENTS.md`.
- Toda dependência, serviço ou camada nova DEVE ser justificada no `plan.md`,
  com a alternativa mais simples que foi descartada e o motivo.

**Por quê:** o projeto é mantido por uma pessoa, no prazo de um TCC.
Complexidade que não resolve um requisito da spec é custo sem retorno.

## IX. Aberto e reproduzível

- O TOV é gratuito e open source.
- O sistema DEVE subir com um único comando (`docker compose up`).
- Em produção, DEVE ser servido em HTTPS (o navegador bloqueia a webcam sem TLS).
- Segredos nunca entram no repositório. Toda variável de ambiente fica
  documentada em `.env.example`.

**Por quê:** outro pesquisador precisa conseguir rodar o TOV e reproduzir o
experimento.

---

## Governança

- **Verificação:** todo `plan.md` começa por uma seção "Verificação da
  constituição" que classifica cada princípio como *atende*, *não se aplica* ou
  *violação justificada*. Uma violação só é aceita com o motivo e a alternativa
  descartada registrados no próprio plano.
- **Emendas:** só o autor do projeto altera esta constituição, por um commit
  `docs:` que diga o que mudou e por quê. Toda emenda atualiza a versão e a data
  da última alteração.
- **Versionamento:**
  - MAJOR: remover ou redefinir um princípio;
  - MINOR: acrescentar um princípio ou ampliar um já existente;
  - PATCH: mudar só a redação, sem mudar o sentido.
