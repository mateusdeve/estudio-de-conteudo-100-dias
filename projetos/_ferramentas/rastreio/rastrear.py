#!/usr/bin/env python3
# Rastreia mãos (centro da palma, escala, abertura) e rosto, quadro a quadro, com MediaPipe (API Tasks).
#   ../venv/bin/python rastrear.py <video_cfr.mov> <saida.json> [--debug pasta]
# O vídeo deve estar em fps constante (o índice do quadro é o tempo). Coordenadas em pixels do vídeo de entrada.
#
# Etapa 1: Pose no quadro inteiro (nariz, ombros, pulsos e pontos da mão da pose).
# Etapa 2: HandLandmarker num recorte ampliado em volta do corpo (as mãos são pequenas no plano aberto).
# Mão = lado da TELA ("tela_esq"/"tela_dir"), escolhida pela proximidade com os pulsos da pose.
# Centro da palma = média dos landmarks 0,5,9,13,17. Escala = distância 0→9 (pulso→base do dedo médio).
# Falhas são preenchidas pela mão da pose (com o deslocamento médio medido) e interpoladas; depois
# suavização Savitzky-Golay (fase zero, sem atraso).
import json, os, sys
import cv2
import numpy as np
from scipy.signal import savgol_filter
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

AQUI = os.path.dirname(os.path.abspath(__file__))
MOD = os.path.join(AQUI, "..", "modelos")
PALMA = [0, 5, 9, 13, 17]
PONTAS = [8, 12, 16, 20]

def abrir(arq):
    cap = cv2.VideoCapture(arq)
    fps = cap.get(cv2.CAP_PROP_FPS)
    quadros = []
    while True:
        ok, f = cap.read()
        if not ok: break
        quadros.append(f)
    return fps, quadros

def main():
    entrada, saida = sys.argv[1], sys.argv[2]
    debug = sys.argv[sys.argv.index("--debug") + 1] if "--debug" in sys.argv else None
    fps, quadros = abrir(entrada)
    H, W = quadros[0].shape[:2]
    print(f"{len(quadros)} quadros {W}x{H} @ {fps:.2f}")

    pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=os.path.join(MOD, "pose_landmarker_full.task")),
        running_mode=vision.RunningMode.VIDEO, min_pose_detection_confidence=0.3, min_tracking_confidence=0.3))
    maos = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=os.path.join(MOD, "hand_landmarker.task")),
        running_mode=vision.RunningMode.VIDEO, num_hands=2,
        min_hand_detection_confidence=0.3, min_hand_presence_confidence=0.3, min_tracking_confidence=0.3))

    bruto = []
    for i, f in enumerate(quadros):
        ts = int(round(i * 1000 / fps))
        rgb = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
        rp = pose.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), ts)
        reg = {"i": i}
        if rp.pose_landmarks:
            L = rp.pose_landmarks[0]
            P = lambda k: np.array([L[k].x * W, L[k].y * H])
            reg["nariz"] = P(0).tolist()
            reg["ombros"] = [P(11).tolist(), P(12).tolist()]
            # mão estimada pela pose: média de pulso, mindinho, indicador (15/17/19 e 16/18/20)
            reg["pose_maos"] = [((P(15) + P(17) + P(19)) / 3).tolist(), ((P(16) + P(18) + P(20)) / 3).tolist()]
            reg["pulsos"] = [P(15).tolist(), P(16).tolist()]
            xs = [L[k].x * W for k in range(23)]; ys = [L[k].y * H for k in range(23)]
            x0, x1 = max(0, min(xs) - 0.12 * W), min(W, max(xs) + 0.12 * W)
            y0, y1 = max(0, min(ys) - 0.10 * H), min(H, max(ys) + 0.06 * H)
        else:
            x0, x1, y0, y1 = 0, W, 0, H
        # recorte ampliado (lado maior ~900 px) para o detector de mãos
        x0, x1, y0, y1 = int(x0), int(x1), int(y0), int(y1)
        rec = rgb[y0:y1, x0:x1]
        k = 900 / max(rec.shape[:2])
        rec = cv2.resize(rec, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC)
        rh = maos.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rec)), ts)
        hs = []
        for lm, hd in zip(rh.hand_landmarks, rh.handedness):
            pts = np.array([[p.x * rec.shape[1] / k + x0, p.y * rec.shape[0] / k + y0] for p in lm])
            c = pts[PALMA].mean(0)
            esc = float(np.linalg.norm(pts[9] - pts[0]))
            # abertura: distância média pulso→pontas / tamanho da palma (~>1,7 = aberta)
            ab = float(np.mean([np.linalg.norm(pts[t] - pts[0]) for t in PONTAS]) / (esc + 1e-6))
            hs.append({"c": c.tolist(), "s": esc, "abertura": ab, "conf": float(hd[0].score), "pts": pts.tolist()})
        reg["maos"] = hs
        bruto.append(reg)
        if i % 60 == 0: print(f"  quadro {i}: pose={'nariz' in reg} mãos={len(hs)}", flush=True)

    # ---- atribuição por lado da tela, guiada pelos pulsos da pose (o de menor x = tela_esq)
    N = len(bruto)
    lados = {"tela_esq": [None] * N, "tela_dir": [None] * N}
    for i, r in enumerate(bruto):
        if "pose_maos" in r:
            pm = sorted(r["pose_maos"], key=lambda p: p[0])
            ref = {"tela_esq": np.array(pm[0]), "tela_dir": np.array(pm[1])}
        else:
            ref = {"tela_esq": np.array([W * 0.3, H * 0.5]), "tela_dir": np.array([W * 0.7, H * 0.5])}
        usados = set()
        for lado in ("tela_esq", "tela_dir"):
            melhor, dmin = None, 1e9
            for j, h in enumerate(r["maos"]):
                if j in usados: continue
                d = np.linalg.norm(np.array(h["c"]) - ref[lado])
                if d < dmin: melhor, dmin = j, d
            # aceita se perto do pulso da pose (até ~2,5 palmas)
            if melhor is not None and dmin < 2.5 * max(r["maos"][melhor]["s"], 12) + 25:
                usados.add(melhor)
                lados[lado][i] = r["maos"][melhor]

    def serie(lado):
        c = np.full((N, 2), np.nan); s = np.full(N, np.nan); ab = np.full(N, np.nan); fonte = ["nenhuma"] * N
        for i in range(N):
            h = lados[lado][i]
            if h is not None:
                c[i] = h["c"]; s[i] = h["s"]; ab[i] = h["abertura"]; fonte[i] = "maos"
        # fallback pela pose, corrigido pelo deslocamento mediano pose→palma
        idx = 0 if lado == "tela_esq" else 1
        pm = np.full((N, 2), np.nan)
        for i, r in enumerate(bruto):
            if "pose_maos" in r: pm[i] = sorted(r["pose_maos"], key=lambda p: p[0])[idx]
        ok = ~np.isnan(c[:, 0]) & ~np.isnan(pm[:, 0])
        off = np.nanmedian(c[ok] - pm[ok], axis=0) if ok.sum() > 5 else np.zeros(2)
        for i in range(N):
            if np.isnan(c[i, 0]) and not np.isnan(pm[i, 0]):
                c[i] = pm[i] + off; fonte[i] = "pose"
        # rejeita saltos absurdos (> 4 palmas num quadro) e interpola buracos
        sm = np.nanmedian(s) if np.isfinite(np.nanmedian(s)) else 20
        for i in range(1, N):
            if np.all(np.isfinite(c[i])) and np.all(np.isfinite(c[i - 1])) and np.linalg.norm(c[i] - c[i - 1]) > 4 * sm:
                c[i] = np.nan; fonte[i] = "descartado"
        t = np.arange(N)
        for d in range(2):
            v = np.isfinite(c[:, d])
            if v.sum() >= 2: c[:, d] = np.interp(t, t[v], c[v, d])
        v = np.isfinite(s); s = np.interp(t, t[v], s[v]) if v.sum() >= 2 else np.full(N, sm)
        v = np.isfinite(ab); ab = np.interp(t, t[v], ab[v]) if v.sum() >= 2 else np.zeros(N)
        cs = np.stack([savgol_filter(c[:, d], 9, 2) for d in range(2)], 1)
        ss = savgol_filter(s, 15, 2)
        abs_ = savgol_filter(ab, 9, 2)
        jit = float(np.median(np.linalg.norm(np.diff(np.diff(cs, axis=0), axis=0), axis=1)))
        return cs, ss, abs_, fonte, c, jit

    out = {"video": os.path.abspath(entrada), "fps": fps, "largura": W, "altura": H, "quadros": N, "maos": {}, "rosto": {}}
    for lado in ("tela_esq", "tela_dir"):
        cs, ss, ab, fonte, cru, jit = serie(lado)
        n_m = fonte.count("maos"); n_p = fonte.count("pose")
        out["maos"][lado] = {"x": cs[:, 0].round(2).tolist(), "y": cs[:, 1].round(2).tolist(), "escala": ss.round(2).tolist(),
                             "abertura": ab.round(3).tolist(), "fonte": fonte, "x_cru": np.round(cru[:, 0], 2).tolist(),
                             "y_cru": np.round(cru[:, 1], 2).tolist()}
        print(f"{lado}: MediaPipe Hands em {n_m}/{N} quadros, pose em {n_p}, jitter mediano (2ª diferença) {jit:.2f} px")
    # rosto (nariz) e ombros, suavizados
    t = np.arange(N)
    nz = np.array([r.get("nariz", [np.nan, np.nan]) for r in bruto], float)
    om = np.array([np.mean(r["ombros"], 0) if "ombros" in r else [np.nan, np.nan] for r in bruto], float)
    larg = np.array([abs(r["ombros"][0][0] - r["ombros"][1][0]) if "ombros" in r else np.nan for r in bruto], float)
    for arr in (nz, om):
        for d in range(2):
            v = np.isfinite(arr[:, d]); arr[:, d] = np.interp(t, t[v], arr[v, d])
    v = np.isfinite(larg); larg = np.interp(t, t[v], larg[v])
    out["rosto"] = {"x": savgol_filter(nz[:, 0], 11, 2).round(2).tolist(), "y": savgol_filter(nz[:, 1], 11, 2).round(2).tolist()}
    out["ombros"] = {"x": savgol_filter(om[:, 0], 11, 2).round(2).tolist(), "y": savgol_filter(om[:, 1], 11, 2).round(2).tolist(),
                     "largura": savgol_filter(larg, 15, 2).round(2).tolist()}
    json.dump(out, open(saida, "w"))
    print("ok", saida)

    if debug:  # quadros de conferência com os pontos desenhados
        os.makedirs(debug, exist_ok=True)
        for i in range(0, N, 15):
            f = quadros[i].copy()
            for lado, cor in (("tela_esq", (255, 120, 0)), ("tela_dir", (0, 140, 255))):
                m = out["maos"][lado]
                cv2.circle(f, (int(m["x"][i]), int(m["y"][i])), max(3, int(m["escala"][i] * 0.6)), cor, 2)
                cv2.putText(f, m["fonte"][i][0], (int(m["x"][i]) + 8, int(m["y"][i]) - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, cor, 1)
            cv2.circle(f, (int(out["rosto"]["x"][i]), int(out["rosto"]["y"][i])), 4, (0, 255, 0), -1)
            cv2.imwrite(os.path.join(debug, f"q{i:03d}.jpg"), f)

if __name__ == "__main__":
    main()
