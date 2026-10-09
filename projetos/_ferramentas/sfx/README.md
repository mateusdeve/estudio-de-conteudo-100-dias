# Kit de SFX sintetizados (ffmpeg-full, nada baixado)

`python3 gerar_sfx.py` gera tudo em `assets/sfx/` (WAV 48 kHz, mono, 24 bits, pico em -6 dBFS) e
imprime a análise de cada som (pico, RMS, centroide espectral, % de energia acima de 4 kHz, DC e
nível no último 1 ms, para pegar estalo no fim). `--analise <pasta>` só analisa.

| Som | Duração | Como é feito | Uso |
|---|---|---|---|
| `whoosh.wav` | 0,36 s | ruído rosa num passa-faixa que varre 280→2600→900 Hz (`asendcmd`), envelope com pico em 0,22 s | troca de cena (pico no corte: comece 0,22 s antes) |
| `whoosh_curto.wav` | 0,20 s | igual, mais curto e leve (450→2600→1100 Hz), pico em 0,12 s | troca entre dois b-rolls, saída de spotlight |
| `click.wav` | 45 ms | ruído com queda muito rápida em passa-faixa de 1,9 kHz + corpo de 180 Hz | tecla/seleção |
| `pop.wav` | 0,13 s | seno com tom subindo 380→820 Hz, ataque de 4 ms | linha/selo entrando na tela |
| `tick.wav` | 30 ms | seno de 1,5 kHz + harmônico, queda rapidíssima | contador |
| `trava.wav` | 0,40 s | estalo metálico + baque grave (92/185 Hz) 55 ms depois | "travar" uma regra/título |
| `impacto.wav` | 1,1 s | seno descendo 110→38 Hz, corpo em 150/310 Hz (para o celular) e estalo no ataque | explosão / batida forte |
| `ding.wav` | 1,2 s | sino de 880 Hz com parciais 2,0/2,76/4,07 e eco leve | CTA final, com volume bem baixo |

Na mixagem, deixe os SFX de 18 a 24 dB abaixo da voz e faça o loudnorm de -14 LUFS depois do mix
(exemplo: `projetos/2026-10-06-saas-com-time-de-ias/edicao/mixar_sfx.py`).
