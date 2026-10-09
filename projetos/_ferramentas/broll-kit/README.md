# broll-kit — b-roll animado (HTML → mp4)

Cenas HTML com tempo determinístico (`window.render(t)`), capturadas quadro a quadro com
Playwright (Chromium headless do cache) e montadas com o ffmpeg-full no padrão do CLAUDE.md
(1080x1920, 30 fps, H.264 crf 18 slow, yuv420p bt709, +faststart, sem áudio).

- `cenas/` — `canvas.html` (modo `loop` ou `spotlight&agente=<id>`), `quadro.html`, `contador.html`, `card.html`
  + `base.css` (cores/fonte), `lib.js` (easing, dados, prévia), `canvas-cena.js`/`canvas.css` (canvas estilo Maestri).
- `dados/<slug>.js` — tudo que muda por vídeo (terminais, cordas, pulsos, quadro, contador, cartão). Comece copiando `dados/exemplo.js`; os dados de cada vídeo ficam fora do git.
- `render.mjs` — `node render.mjs cenas/X.html "dados=<slug>&..." saida.mp4` (recusa sobrescrever).
  Prévia de um quadro: `... - --png f.png --quadro 3.5`. Guias de zona segura: `&guias=1`.
  No navegador: abrir o HTML com `?dados=<slug>&play=1`.
- `gerar-<slug>.sh` — gera todos os clipes de um vídeo (rodar de dentro de `broll-kit/`).

Dependência: `playwright-core` instalado em `projetos/_ferramentas/` (Chromium já no cache ms-playwright).
