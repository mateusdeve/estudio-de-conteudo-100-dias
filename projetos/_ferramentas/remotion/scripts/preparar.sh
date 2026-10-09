#!/bin/zsh
# Liga em public/ as pastas do workspace que o Remotion usa (links de PASTA; o servidor do Remotion
# recusa link de arquivo, então nunca ligue um arquivo solto aqui):
#   public/fontes → assets/fontes · public/sfx → assets/sfx · public/musicas → assets/musicas
#   public/<slug> → projetos/<slug>   (o "fonte" do JSON fica "<slug>/cortes/sdr.mov", por exemplo)
#   scripts/preparar.sh [slug ...]
set -e
cd "${0:A:h}/.."
RAIZ=${PWD:h:h:h}
mkdir -p public
for d in fontes sfx musicas; do [[ -e public/$d ]] || ln -s "$RAIZ/assets/$d" public/$d; done
for slug in "$@"; do
  [[ -d $RAIZ/projetos/$slug ]] || { echo "não existe projetos/$slug"; exit 1; }
  [[ -e public/$slug ]] || ln -s "$RAIZ/projetos/$slug" public/$slug
done
ls -l public | tail -n +2
