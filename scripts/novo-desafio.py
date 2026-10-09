#!/usr/bin/env python3
"""Gera canal/desafio-100-dias.md: uma linha por dia, um ☐ por Reel.

  python3 scripts/novo-desafio.py 2026-10-09            # 100 dias, 2 Reels por dia
  python3 scripts/novo-desafio.py 2026-10-09 --dias 30 --por-dia 1

Recusa sobrescrever um controle existente (use --forcar).
"""
import argparse
import datetime as dt
import pathlib
import sys

DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]
RAIZ = pathlib.Path(__file__).resolve().parent.parent


def main():
    p = argparse.ArgumentParser()
    p.add_argument("inicio", help="data do dia 1, AAAA-MM-DD")
    p.add_argument("--dias", type=int, default=100)
    p.add_argument("--por-dia", type=int, default=2)
    p.add_argument("--saida", default=str(RAIZ / "canal" / "desafio-100-dias.md"))
    p.add_argument("--forcar", action="store_true")
    a = p.parse_args()

    inicio = dt.date.fromisoformat(a.inicio)
    fim = inicio + dt.timedelta(days=a.dias - 1)
    saida = pathlib.Path(a.saida)
    if saida.exists() and not a.forcar:
        sys.exit(f"{saida} já existe. Use --forcar para gerar de novo (perde as marcações).")

    total = a.dias * a.por_dia
    reels = " | ".join(f"Reel {i + 1}" for i in range(a.por_dia))
    linhas = [
        f"🏁 Desafio {a.dias} dias · {a.por_dia} Reels por dia",
        "",
        f"Dia 1 = {inicio:%d/%m/%Y} · Dia {a.dias} = {fim:%d/%m/%Y} · Meta: {total} vídeos",
        "Marque ☐ → ✅ ao postar (ou ❌ se furou). Na última coluna: slug ou observação.",
        "",
        "📊 PLACAR: 0/" + str(total) + " postados · sequência atual: 0 dias",
        "",
    ]
    semana = None
    for n in range(a.dias):
        d = inicio + dt.timedelta(days=n)
        s = n // 7 + 1
        if s != semana:
            semana = s
            linhas += ["", f"━━ Semana {s} ━━", "", f"| Dia | Data | {reels} | Notas |",
                       "|---|---|" + "---|" * a.por_dia + "---|"]
        caixas = " | ".join("☐" for _ in range(a.por_dia))
        linhas.append(f"| {n + 1} | {DIAS_SEMANA[d.weekday()]} {d:%d/%m} | {caixas} | |")

    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"Gerado {saida} ({inicio:%d/%m/%Y} → {fim:%d/%m/%Y}, {total} Reels)")


if __name__ == "__main__":
    main()
