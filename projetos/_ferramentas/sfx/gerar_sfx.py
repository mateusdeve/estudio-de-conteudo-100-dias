#!/usr/bin/env python3
# Kit de SFX sintetizados só com o ffmpeg-full (lavfi). Nada baixado.
#   python3 gerar_sfx.py [pasta_saida]          (padrão: assets/sfx da raiz do workspace)
#   python3 gerar_sfx.py --analise [pasta]      (pico, RMS, centroide espectral e espectrograma de cada som)
# Saída: WAV 48 kHz mono 24 bits, pico normalizado em -6 dBFS.
import os, re, subprocess, sys, tempfile

F = "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
SR = 48000
PICO = -6.0
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))

def varredura(filtro, pontos, dur, passo=0.008):
    """asendcmd que move a frequência de um filtro por uma curva [(t, Hz)], interpolando em passos curtos."""
    cmds, t = [], 0.0
    while t <= dur + 1e-9:
        for (t0, f0), (t1, f1) in zip(pontos, pontos[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0) if t1 > t0 else 1
                f = f0 * (f1 / f0) ** k  # interpolação exponencial (soa mais natural que linear)
                cmds.append(f"{t:.3f} {filtro} f {f:.0f}")
                break
        t += passo
    return "asendcmd=c='" + ";".join(cmds) + "'"  # ';' separa instantes

def envelope(expr):
    return f"volume='{expr}':eval=frame"

# Cada som: (duração, cadeia lavfi). Fontes com nb_samples pequeno para o envelope por quadro ficar liso.
def sons():
    ns = "nb_samples=64"
    s = {}
    # whoosh: ruído rosa num passa-faixa que sobe 280→2600 Hz e desce a 900; envelope sobe e cai, pico em ~60%.
    d = 0.36
    s["whoosh"] = (d,
        f"anoisesrc=color=pink:amplitude=0.9:sample_rate={SR}:duration={d}:{ns}:seed=7,"
        f"highpass=f=120,{varredura('bandpass@bp', [(0, 280), (0.22, 2600), (d, 900)], d)},bandpass@bp=f=280:width_type=q:w=1.1,"
        f"lowpass=f=7000,{envelope(f'if(lt(t,0.22),pow(t/0.22,2.2),pow(max(0,1-(t-0.22)/{d-0.22:.3f}),1.6))')}")
    d = 0.2
    s["whoosh_curto"] = (d,
        f"anoisesrc=color=pink:amplitude=0.9:sample_rate={SR}:duration={d}:{ns}:seed=11,"
        f"highpass=f=180,{varredura('bandpass@bp', [(0, 450), (0.12, 2600), (d, 1100)], d)},bandpass@bp=f=500:width_type=q:w=1.3,"
        f"lowpass=f=6500,{envelope(f'if(lt(t,0.12),pow(t/0.12,2),pow(max(0,1-(t-0.12)/{d-0.12:.3f}),1.4))')}")
    # click: estalo de tecla — ruído filtrado com queda muito rápida + "corpo" curto em 180 Hz.
    d = 0.045
    s["click"] = (d,
        f"aevalsrc='0.9*(random(0)*2-1)*exp(-t*260)+0.5*sin(2*PI*180*t)*exp(-t*140)':s={SR}:d={d}:{ns},"
        "bandpass=f=1900:width_type=q:w=0.8,highpass=f=90,lowpass=f=6000,afade=t=out:st=0.035:d=0.01")
    # pop: bolha de UI — seno com tom subindo 380→820 Hz, ataque de 4 ms e queda suave.
    d = 0.13
    s["pop"] = (d,
        f"aevalsrc='sin(2*PI*(380*t+440*(t-(1-exp(-t*55))/55)))*min(1,t/0.004)*exp(-t*32)':s={SR}:d={d}:{ns},"
        "lowpass=f=2800,highpass=f=120,afade=t=out:st=0.11:d=0.02")
    # tick: madeira bem curta (contador) — seno 1500 Hz + harmônico, queda rapidíssima.
    d = 0.03
    s["tick"] = (d,
        f"aevalsrc='(sin(2*PI*1500*t)+0.35*sin(2*PI*3100*t)+0.25*(random(1)*2-1))*min(1,t/0.0008)*exp(-t*300)':s={SR}:d={d}:{ns},"
        "bandpass=f=1700:width_type=q:w=0.9,lowpass=f=6000,afade=t=out:st=0.022:d=0.008")
    # trava: cadeado — estalo metálico curto e, 55 ms depois, um baque grave (90/180 Hz) com corpo.
    d = 0.4
    s["trava"] = (d,
        f"aevalsrc='0.55*(random(2)*2-1)*exp(-t*220)"
        f"+if(gte(t,0.055),(0.9*sin(2*PI*92*(t-0.055))+0.45*sin(2*PI*185*(t-0.055))+0.35*(random(3)*2-1)*exp(-(t-0.055)*90))*exp(-(t-0.055)*16)*min(1,(t-0.055)/0.002),0)'"
        f":s={SR}:d={d}:{ns},lowpass=f=3500,highpass=f=50,afade=t=out:st=0.33:d=0.07")
    # ding: sino curto e suave — parciais 1, 2,0, 2,76 e 4,07 de um Lá5 (880 Hz), cada uma morrendo num ritmo.
    d = 1.2
    s["ding"] = (d,
        f"aevalsrc='(sin(2*PI*880*t)*exp(-t*3.2)+0.32*sin(2*PI*1760*t)*exp(-t*5)+0.16*sin(2*PI*2429*t)*exp(-t*7)"
        f"+0.06*sin(2*PI*3582*t)*exp(-t*11))*min(1,t/0.003)':s={SR}:d={d}:{ns},"
        "lowpass=f=6000,aecho=0.8:0.5:43|71:0.18|0.1,afade=t=out:st=1.0:d=0.2")
    # impacto: boom grave — seno descendo 110→38 Hz, corpo em 150/310 Hz (celular) e estalo de ruído no ataque.
    d = 1.1
    s["impacto"] = (d,
        f"aevalsrc='(0.9*sin(2*PI*(38*t+72*(1-exp(-t*9))/9))*exp(-t*3.2)"
        f"+0.55*sin(2*PI*150*t)*exp(-t*9)+0.3*sin(2*PI*310*t)*exp(-t*16)"   # corpo audível no celular
        f"+0.6*(random(4)*2-1)*exp(-t*28))*min(1,t/0.003)':s={SR}:d={d}:{ns},"
        "lowpass=f=1400,highpass=f=28,afade=t=out:st=0.9:d=0.2")
    return s

def pico_db(arq):
    out = subprocess.run([F, "-hide_banner", "-i", arq, "-af", "astats=measure_perchannel=none", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return float(re.findall(r"Peak level dB: ([-\d.inf]+)", out)[-1])

def gerar(pasta):
    os.makedirs(pasta, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for nome, (d, cadeia) in sons().items():
            bruto = os.path.join(tmp, nome + ".wav")
            subprocess.run([F, "-v", "error", "-y", "-f", "lavfi", "-i", cadeia, "-t", f"{d}",
                            "-ac", "1", "-ar", str(SR), "-c:a", "pcm_f32le", bruto], check=True)
            g = PICO - pico_db(bruto)
            saida = os.path.join(pasta, nome + ".wav")
            subprocess.run([F, "-v", "error", "-y", "-i", bruto, "-af", f"volume={g:.2f}dB",
                            "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s24le", saida], check=True)
            print(f"{nome:13s} {d:.3f}s  ganho {g:+.1f} dB  -> {saida}")

def analise(pasta):
    import numpy as np
    for nome in sons():
        arq = os.path.join(pasta, nome + ".wav")
        raw = subprocess.run([F, "-v", "error", "-i", arq, "-f", "f32le", "-ac", "1", "-"], capture_output=True).stdout
        x = np.frombuffer(raw, np.float32)
        X = np.abs(np.fft.rfft(x * np.hanning(len(x))))
        fr = np.fft.rfftfreq(len(x), 1 / SR)
        cent = (fr * X).sum() / X.sum()
        acima4k = (X[fr > 4000] ** 2).sum() / (X ** 2).sum() * 100
        pk = 20 * np.log10(np.abs(x).max() + 1e-12)
        rms = 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
        dc = x.mean()
        borda = 20 * np.log10(np.abs(x[-48:]).max() + 1e-12)  # últimos 1 ms (estalo no fim?)
        print(f"{nome:13s} dur {len(x)/SR:.3f}s  pico {pk:5.1f} dBFS  rms {rms:5.1f}  centroide {cent:5.0f} Hz  "
              f">4k {acima4k:4.1f}%  dc {dc:+.4f}  fim {borda:5.1f} dBFS")
        subprocess.run([F, "-v", "error", "-y", "-i", arq, "-lavfi",
                        "showspectrumpic=s=400x200:legend=0:scale=log:fscale=lin:stop=12000",
                        os.path.join(pasta, "_analise", nome + ".png")] if os.path.isdir(os.path.join(pasta, "_analise")) else ["true"])

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    pasta = args[0] if args else os.path.join(RAIZ, "assets/sfx")
    if "--analise" in sys.argv:
        analise(pasta)
    else:
        gerar(pasta)
        analise(pasta)
