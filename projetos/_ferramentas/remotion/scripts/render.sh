#!/bin/zsh
# Renderiza um Reel e finaliza no padrão do CLAUDE.md (loudnorm -14 LUFS, AAC 48k 192k, +faststart).
#   scripts/render.sh <slug> <versão>      ex.: scripts/render.sh 2026-10-09-dica-produtividade 2
# Recusa sobrescrever exports/<slug>_v<versão>.mp4.
set -e
cd "${0:A:h}/.."
RAIZ=${PWD:h:h:h}
SLUG=$1; V=$2
[[ -n $SLUG && -n $V ]] || { echo "uso: $0 <slug> <versão>"; exit 1; }
SAIDA=$RAIZ/exports/${SLUG}_v$V.mp4
[[ -e $SAIDA ]] && { echo "$SAIDA já existe. Use outra versão."; exit 1; }
TMP=$(mktemp -d)
npx remotion render src/index.ts "$SLUG" "$TMP/bruto.mp4" --log=error --timeout=300000
[[ -s $TMP/bruto.mp4 ]] || { echo "render falhou"; exit 1; }
FF=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg
# loudnorm em duas passadas: mede primeiro, depois aplica (uma passada só fica ~1 LU abaixo do alvo)
M=$($FF -hide_banner -nostats -i "$TMP/bruto.mp4" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
v() { print -r -- "$M" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
LN="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true"
$FF -v error -i "$TMP/bruto.mp4" -map 0:v -map 0:a -c:v copy \
  -af "$LN,aresample=48000" -c:a aac -b:a 192k -ar 48000 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$SAIDA"
rm -rf "$TMP"
echo "✓ $SAIDA"
