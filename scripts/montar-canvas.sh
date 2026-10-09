#!/bin/zsh
# Cria no canvas do Maestri as notas listadas em canal/notas.tsv (nome da nota → arquivo),
# todas no fichário "Estúdio de Conteúdo". Notas que já existem não são tocadas.
#   scripts/montar-canvas.sh                 # cria só as que faltam
#   scripts/montar-canvas.sh --sobrescrever  # também substitui o conteúdo das existentes pelo do arquivo
# Rode de um terminal do Maestri dentro deste workspace.
set -e
cd "${0:A:h}/.."
FICHARIO="Estúdio de Conteúdo"
MAPA=canal/notas.tsv
[[ -f $MAPA ]] || { echo "Falta $MAPA. Rode scripts/iniciar.sh primeiro."; exit 1; }
maestri=${MAESTRI_CLI:-maestri}
existentes=$($maestri list)

# o note create/write decodifica \n; dobrar as barras mantém o texto literal
conteudo() { sed 's/\\/\\\\/g' "$1"; }

while IFS=$'\t' read -r nota arquivo; do
  [[ -z $nota || $nota == \#* ]] && continue
  if [[ ! -f $arquivo ]]; then echo "⚠️  $arquivo não existe, pulando $nota"; continue; fi
  if print -r -- "$existentes" | grep -qF "name: \"$nota\""; then
    if [[ $1 == --sobrescrever ]]; then
      $maestri note write "$nota" "$(conteudo $arquivo)" >/dev/null && echo "↻ $nota ← $arquivo"
    else
      echo "= $nota (já existe)"
    fi
  else
    $maestri note create "$(conteudo $arquivo)" --name "$nota" --stack "$FICHARIO" >/dev/null && echo "+ $nota ← $arquivo"
  fi
done < $MAPA
