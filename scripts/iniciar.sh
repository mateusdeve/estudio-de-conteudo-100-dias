#!/bin/zsh
# Prepara uma cópia nova do template: pastas, canal/ a partir do modelo, ferramentas e modelo do whisper.
#   scripts/iniciar.sh [AAAA-MM-DD do dia 1 do desafio]
set -e
cd "${0:A:h}/.."

mkdir -p brutos roteiros projetos exports assets/{fontes,musicas,logos,broll,modelos,sfx}

if [[ -d canal ]]; then
  echo "= canal/ já existe, não mexi"
else
  cp -R canal-modelo canal
  echo "+ canal/ criado a partir de canal-modelo/ → preencha canal/perfil.md"
fi

if [[ -n $1 && ! -f canal/desafio-100-dias.md ]]; then
  python3 scripts/novo-desafio.py "$1"
fi

echo
echo "── Ferramentas"
FF=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg
if [[ -x $FF ]]; then echo "✓ ffmpeg-full"; else echo "✗ ffmpeg-full → brew install ffmpeg-full"; fi
if command -v whisper-cli >/dev/null; then echo "✓ whisper-cli"; else echo "✗ whisper-cli → brew install whisper-cpp"; fi
if command -v maestri >/dev/null || [[ -n $MAESTRI_CLI ]]; then echo "✓ maestri"; else echo "✗ maestri (rode dentro de um terminal do Maestri)"; fi

MOD=assets/modelos/ggml-large-v3-turbo.bin
if [[ -f $MOD ]]; then
  echo "✓ modelo do whisper"
else
  printf "Baixar o modelo do whisper (~1,6 GB)? [s/N] "; read -r r
  if [[ $r == [sS] ]]; then
    curl -L --fail -o "$MOD.part" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
    mv "$MOD.part" "$MOD"
  fi
fi

echo
echo "Próximos passos: preencha canal/perfil.md e rode scripts/montar-canvas.sh dentro do Maestri."
