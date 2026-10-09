# Estúdio de Conteúdo · Desafio 100 dias × 2 Reels

Template para produzir **2 Reels/TikToks por dia durante 100 dias** com um time de agentes de IA
no Maestri: você grava a fala, o time roteiriza, edita, legenda e revisa.

```
Você ──grava──▶ brutos/ ──▶ ✂️ Navalha (edição) ──▶ 🎧 Eco (legendas) ──▶ 🔍 Lupa (revisão) ──▶ exports/ ──▶ 🚀 postar
   ▲                                                                                                   │
   └──────── ✍️ Pena (roteiros em lote de 7) ◀── canal/perfil.md + banco de ideias ◀─── métricas ───────┘
```

## O que tem aqui

| Pasta | O que é | Vai pro git? |
|---|---|---|
| `estudio/` | O processo: painel, calendário do desafio, ganchos, legendas, checklist, técnicas de edição | ✅ igual pra todo mundo |
| `canal-modelo/` | Seu canal em branco: perfil, banco de ideias, estilo, bastidores, fila | ✅ |
| `canal/` | **O seu canal**, criado a partir do modelo | ❌ só na sua máquina |
| `scripts/` | Preparação, gerador do desafio, sincronização com o canvas | ✅ |
| `.maestri/roles/` | Os 4 papéis do time (Roteirista, Editor, Legendador, Revisor) | ✅ |
| `projetos/_ferramentas/` | broll-kit (b-roll animado em HTML → mp4), SFX, rastreio de mãos, player | ✅ |
| `brutos/` `roteiros/` `projetos/<slug>/` `exports/` `assets/` | O trabalho de cada vídeo | ❌ |

## Começando

**1. Ferramentas** (Mac com Apple Silicon)

```sh
brew install ffmpeg-full whisper-cpp
```

Opcionais, só para o 🎬 nível completo:

```sh
cd projetos/_ferramentas
npm install && npx playwright install chromium          # broll-kit
python3 -m venv venv && venv/bin/pip install -r requirements.txt   # rastreio de mãos/rosto
mkdir -p modelos && cd modelos
curl -LO https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
curl -LO https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task
```

**2. Preparar a sua cópia** (troque pela data do seu dia 1)

```sh
scripts/iniciar.sh 2026-10-09
```

Isso cria `canal/` a partir do modelo, gera `canal/desafio-100-dias.md` (100 dias × 2 Reels),
confere as ferramentas e oferece baixar o modelo do whisper (~1,6 GB).

**3. Preencher o seu perfil** — `canal/perfil.md`. É o arquivo mais importante: nicho, pra quem você fala,
pilares, o que não pode ser dito, horários, ganchos/CTAs/hashtags do seu nicho. Peça ajuda ao Claude:
*"me entrevista e preenche o canal/perfil.md"*. Depois, o banco de ideias (`canal/banco-de-ideias.md`)
com pelo menos 30 ideias.

**4. Montar o canvas no Maestri** — abra a pasta como workspace, crie um terminal (o Maestro) e rode:

```sh
scripts/montar-canvas.sh
```

Isso cria o fichário "Estúdio de Conteúdo" com todas as notas. Depois crie os 4 agentes
(Pena, Navalha, Eco, Lupa) com os papéis de `.maestri/roles/` e conecte-os às notas. Se os papéis não
aparecerem no Maestri, crie cada um copiando o `prompt` do `role.json` correspondente.

## O dia a dia

- **Dom e Qua**: *"Maestro, roteiriza os 7 vídeos do próximo lote"* → Pena escreve em `roteiros/`.
- **Seg e Qui**: grave o lote (7 vídeos, ~2h) e solte em `brutos/` com o slug no nome.
- **Todo dia**: *"Maestro, edita os brutos novos na versão ⚡ rápida"* → poste 2, marque ✅ na nota `desafio-100-dias`.
- **Domingo**: revisão das métricas e escolha do formato vencedor.

Detalhes, regras do desafio e o colchão de vídeos prontos: `estudio/calendario-editorial.md`.

## Canvas ↔ arquivos

No dia a dia você edita as notas no canvas. Antes de um commit:

```sh
scripts/salvar-canvas.sh   # copia as notas do canvas para estudio/ e canal/
```

Melhorou algo do processo (um gancho novo, uma regra de edição)? Isso fica em `estudio/`: faça um PR,
assim os dois ficam com a mesma versão. O que é do seu canal fica em `canal/` e nunca sobe.
`canal/notas.tsv` diz qual nota corresponde a qual arquivo.

## Regras que valem pra todo mundo

- `brutos/` é intocável; exports nunca são sobrescritos (`_v2`, `_v3`…).
- Nada de senha, chave, `.env` ou dado de cliente em tela.
- Nenhum número inventado: o time usa placeholder e pergunta.
- Especificação de export, zonas seguras e ferramentas: `CLAUDE.md`.
