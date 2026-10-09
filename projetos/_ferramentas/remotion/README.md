# Remotion: modelo de Reel

Monta o Reel inteiro em código: A-roll com cortes e alternância aberto/close, punch-in, legenda
palavra a palavra, gancho, cards, marca-texto, pergunta final, SFX e trilha. Um arquivo de dados por
vídeo (`src/videos/<slug>.json`) vira uma composição no Studio.

## Instalar (uma vez)
```sh
cd projetos/_ferramentas/remotion && npm install
scripts/preparar.sh            # liga public/fontes, public/sfx e public/musicas em assets/
```
Fonte: baixe a [Familjen Grotesk](https://fonts.google.com/specimen/Familjen+Grotesk) e coloque
`FamiljenGrotesk-500.ttf`, `-600.ttf` e `-700.ttf` em `assets/fontes/` (ou troque a fonte em `src/estilo.ts`).
Licença: o Remotion é gratuito para pessoas físicas e empresas pequenas. Confira em remotion.dev/license.

## Um vídeo novo
1. Converta o bruto para SDR (o iPhone grava HDR/HLG) em `projetos/<slug>/`. Faça duas versões:
   1440x2560 .mov SEM quadros B (`-bf 0 -g 15`, áudio pcm) para o render (`fonte`; 4K e .mp4 com
   quadros B travam o extrator do Remotion) e
   1080p para o Studio (`fontePrevia`).
2. `scripts/preparar.sh <slug>` liga `public/<slug>` → `projetos/<slug>`.
3. Crie `src/videos/<slug>.json` (modelo: `src/videos/exemplo.json`, tipos em `src/tipos.ts`).
   **Todos os tempos são em segundos do BRUTO.** Mudar um corte não desalinha legenda, texto nem SFX,
   e palavras de takes descartados somem sozinhas da legenda.
4. Veja no Studio: `npm run studio` (porta 3100), aberto num portal do Maestri. `"guias": true` mostra as zonas seguras.
5. Exporte: `scripts/render.sh <slug> <versão>` → `exports/<slug>_v<versão>.mp4`
   (H.264 crf 18, bt709, -14 LUFS, AAC 192k, +faststart; recusa sobrescrever).

## Tipos de texto
- `gancho` / `titulo`: linhas grandes entrando em sequência; `destaque` ganha o marca-texto amarelo.
- `marca`: uma frase com o trecho `destaque` marcado.
- `cards`: itens que entram um a um em `em`; o mais novo fica grande e amarelo.
- `pergunta`: balão claro para o CTA.

## Observações
- Na primeira renderização o Remotion copia o vídeo da `fonte` para o cache. Com 4K, isso exige
  alguns GB livres em disco.
- Cores, fonte e zonas seguras ficam em `src/estilo.ts`. Para outro canal, troque ali.
- Nunca ligue um **arquivo** solto em `public/`: o servidor do Remotion recusa links de arquivo.
  Ligue a pasta (`preparar.sh` já faz assim).
