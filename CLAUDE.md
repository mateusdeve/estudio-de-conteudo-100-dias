# Estúdio de Conteúdo — edição de vídeos para Instagram/TikTok

Este workspace serve só para produzir vídeos curtos (Reels / TikTok), no ritmo do desafio
**100 dias × 2 Reels por dia**. É um template: o processo (`estudio/`) é igual para todo mundo,
e o canal de cada pessoa (`canal/`) fica só na máquina dela.

## Antes de tudo: leia o perfil do canal
@canal/perfil.md

Se `canal/perfil.md` não existir, rode `scripts/iniciar.sh` e peça para a pessoa preencher o perfil.
Tudo que é específico do canal (nicho, público, o que não pode ser dito, identidade visual, horários,
ganchos/CTAs/hashtags do nicho) mora lá e vale mais que qualquer regra genérica deste arquivo.

## Pastas
- `brutos/` — material original gravado. NUNCA editar nem apagar arquivos daqui.
- `roteiros/` — roteiros, ganchos, legendas de post e hashtags (`<slug>.md`).
- `projetos/<slug>/` — trabalho de um vídeo: cortes intermediários, transcrição (`.srt`/`.ass`), notas.
- `projetos/_ferramentas/` — ferramentas reutilizáveis (broll-kit, sfx, rastreio, player).
- `exports/` — versões finais prontas para postar: `<slug>_v<N>.mp4`.
- `assets/` — fontes, músicas, logos, b-roll, sfx e o modelo do whisper.
- `estudio/` — processo comum (painel, calendário do desafio, ganchos, legendas, checklist, técnicas). Vai pro git.
- `canal/` — o canal desta pessoa (perfil, banco de ideias, estilo, bastidores, fila, desafio). Fora do git.
- `canal-modelo/` — `canal/` em branco, para quem está começando. Não editar com dados pessoais.
- `scripts/` — `iniciar.sh`, `novo-desafio.py`, `montar-canvas.sh`, `salvar-canvas.sh`.

`<slug>` = `AAAA-MM-DD-tema-curto` (ex.: `2026-10-09-dica-produtividade`).
Só `estudio/`, `canal-modelo/`, `scripts/`, ferramentas e configuração vão pro repositório (ver `.gitignore`).
Nunca coloque nada de `canal/`, `brutos/`, `exports/`, `roteiros/` ou `projetos/<slug>/` em arquivos versionados.

## Especificação de export (padrão)
- 1080x1920 (9:16), 30 fps, H.264 (`libx264`, `-crf 18`, `-preset slow`, `yuv420p`), `+faststart`
- Áudio AAC 48 kHz, 192 kbps, loudness ~ -14 LUFS (`loudnorm=I=-14:TP=-1.5:LRA=11`)
- Duração ideal 15–60 s (máx. 90 s para Reels)
- Zonas seguras: deixar texto/legendas longe dos ~250 px de baixo e ~200 px de cima e ~120 px da direita (UI do app)

## Ritmo do desafio
- 2 Reels por dia. Padrão é ⚡ **rápido** (fala + legenda animada + zooms + 1–2 textos, receita em
  `estudio/tecnicas-de-edicao.md`). 🎬 **completo** (b-roll animado, telas) só quando pedido, 2–3 por semana.
- Manter sempre ~4 vídeos prontos em `exports/` (colchão de 2 dias). Detalhes em `estudio/calendario-editorial.md`.
- Ao postar, marcar ✅ na nota `desafio-100-dias` e atualizar o placar.

## Ferramentas
- Use SEMPRE o ffmpeg completo: `/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg` (e `.../ffprobe`, `.../ffplay`).
  Ele tem `libass` (filtros `subtitles`/`ass`) e `drawtext`. O `ffmpeg` do PATH é o build simples, sem esses filtros.
- Transcrição: `whisper-cli` (whisper.cpp, usa a GPU do Mac). Modelo: `assets/modelos/ggml-large-v3-turbo.bin`.
  Exemplo: extrair áudio 16 kHz mono (`ffmpeg -i in.mp4 -ar 16000 -ac 1 audio.wav`) e rodar
  `whisper-cli -m assets/modelos/ggml-large-v3-turbo.bin -l pt -osrt -ml 20 -of projetos/<slug>/transcricao audio.wav`
  (`-ojf` gera JSON com timestamps por palavra, útil para legendas palavra a palavra).

## Notas no canvas (Maestri)
Fichário "Estúdio de Conteúdo". `canal/notas.tsv` diz qual nota corresponde a qual arquivo
(o nome da nota pode variar de pessoa para pessoa; use sempre o nome que está lá).
- O canvas é onde se edita no dia a dia; os arquivos são o que vai pro git. Quando uma instrução citar
  um arquivo de `estudio/` ou `canal/`, leia a nota correspondente (`maestri note read`), que é a versão
  mais atual; leia o arquivo só se não houver canvas.
  `scripts/salvar-canvas.sh` traz o canvas para os arquivos; `scripts/montar-canvas.sh` cria as notas que faltam.
- Atualize a nota `fila-de-producao` quando um vídeo mudar de etapa e a `desafio-100-dias` quando postar.
- Para abrir qualquer página no navegador, use um portal do canvas do Maestri (`maestri portal ...`), nunca o navegador externo.

## Regras
- Nunca sobrescrever um export existente: incremente a versão (`_v2`, `_v3`).
- Todo texto para o público em português do Brasil, tom direto e natural.
- Nunca mostrar senhas, chaves, `.env` ou dados de clientes reais em tela.
- Nunca inventar números (clientes, vendas, seguidores): placeholder e perguntar.
