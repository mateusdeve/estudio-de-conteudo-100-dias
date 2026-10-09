#!/bin/zsh
# Copia o conteúdo atual das notas do canvas para os arquivos (canal/notas.tsv diz quem é quem).
# Rode antes de um commit: o canvas é onde você edita no dia a dia, os arquivos são o que vai pro git.
set -e
cd "${0:A:h}/.."
MAPA=canal/notas.tsv
[[ -f $MAPA ]] || { echo "Falta $MAPA."; exit 1; }
maestri=${MAESTRI_CLI:-maestri}
existentes=$($maestri list)

while IFS=$'\t' read -r nota arquivo; do
  [[ -z $nota || $nota == \#* ]] && continue
  print -r -- "$existentes" | grep -qF "name: \"$nota\"" || { echo "⚠️  nota $nota não está no canvas"; continue; }
  mkdir -p "${arquivo:h}"
  # a 1ª linha é "[N lines total]"; as demais vêm como "N<tab>texto"
  $maestri note read "$nota" | tail -n +2 | sed -E $'s/^ *[0-9]+\t//' > "$arquivo.tmp"
  if cmp -s "$arquivo.tmp" "$arquivo"; then rm "$arquivo.tmp"; echo "= $arquivo"
  else mv "$arquivo.tmp" "$arquivo"; echo "↓ $arquivo ← $nota"; fi
done < $MAPA

echo
echo "Lembrete: estudio/ vai pro git (é igual pra todo mundo); canal/ fica só na sua máquina."
