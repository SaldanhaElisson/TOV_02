<section class="flex max-h-screen flex-col gap-5 overflow-y-auto rounded-xl border border-border bg-raised px-8 py-7">

  <div>
    <p class="text-xs font-semibold uppercase tracking-widest text-accent">Guia</p>
    <h2 class="mt-0.5 text-xl font-bold tracking-tight text-text">O que é Eye Tracking?</h2>
    <p class="mt-1 text-xs leading-relaxed text-muted">
      Eye tracking é a tecnologia que detecta <strong class="text-text/80">para onde você está olhando</strong> na tela.
      Neste sistema, a câmera do seu computador captura o rosto em tempo real e analisa a posição dos olhos
      para estimar o ponto de olhar — sem nenhum hardware especial.
    </p>
  </div>

  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Como funciona</h3>
    <div class="grid gap-3 md:grid-cols-3">

      <div class="rounded-lg border border-border bg-surface p-3 text-xs">
        <p class="mb-1 text-sm font-semibold text-text">1. Câmera captura o rosto</p>
        <p class="leading-relaxed text-muted">
          A câmera filma seu rosto continuamente. Um algoritmo de visão computacional
          identifica os olhos, pálpebras e íris em cada frame — cerca de 30 vezes por segundo.
        </p>
      </div>

      <div class="rounded-lg border border-border bg-surface p-3 text-xs">
        <p class="mb-1 text-sm font-semibold text-text">2. Calibração personaliza o modelo</p>
        <p class="leading-relaxed text-muted">
          Cada pessoa tem olhos e rosto diferentes. A calibração ensina ao sistema como
          <em>os seus</em> olhos se posicionam quando você olha para cada região da tela.
          Sem ela, as estimativas ficam imprecisas.
        </p>
      </div>

      <div class="rounded-lg border border-border bg-surface p-3 text-xs">
        <p class="mb-1 text-sm font-semibold text-text">3. Predição do olhar</p>
        <p class="leading-relaxed text-muted">
          Após a calibração, o sistema usa um modelo matemático para traduzir
          a posição dos olhos na câmera em coordenadas na tela — e registra
          para onde você olhava em cada momento do experimento.
        </p>
      </div>

    </div>
  </div>

  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Calibração por Cliques</h3>
    <div class="rounded-lg border border-accent/40 bg-accent/5 p-4 text-xs">
      <p class="mb-3 leading-relaxed text-muted">
        Pontos aparecem um a um na tela. Para cada ponto, <strong class="text-text/80">olhe fixamente para ele</strong>
        e clique nele <strong class="text-text/80">7 vezes seguidas</strong>. Após os 7 cliques, o próximo ponto aparece automaticamente.
        Ao todo são 13 pontos distribuídos por toda a tela.
      </p>
      <div class="grid gap-x-8 gap-y-0.5 md:grid-cols-2">
        <p class="text-muted/80"><span class="text-green-400">+</span> Clique apenas quando estiver olhando para o ponto</p>
        <p class="text-muted/80"><span class="text-green-400">+</span> Aguarde o ponto piscar antes de clicar</p>
        <p class="text-muted/80"><span class="text-red-400/70">–</span> Não clique se estiver olhando para outro lugar</p>
        <p class="text-muted/80"><span class="text-red-400/70">–</span> Não mova a cabeça entre os cliques</p>
      </div>
      <p class="mt-3 text-muted/50">⏱ ~3 min · 13 pontos · 7 cliques cada · 91 amostras no total</p>
    </div>
  </div>

  <div class="border-t border-border pt-3">
    <h3 class="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted">Dicas para melhor resultado</h3>
    <ul class="grid grid-cols-2 gap-x-8 gap-y-0.5 text-xs text-muted/70 md:grid-cols-3">
      <li><span class="text-accent">→</span> Mantenha a cabeça parada</li>
      <li><span class="text-accent">→</span> Boa iluminação no rosto</li>
      <li><span class="text-accent">→</span> Fique a ~60 cm da tela</li>
      <li><span class="text-accent">→</span> Enquadre o rosto inteiro na câmera</li>
      <li><span class="text-accent">→</span> Prefira desktop ou laptop</li>
      <li><span class="text-accent">→</span> Evite mover o mouse durante o experimento</li>
    </ul>
  </div>

</section>
