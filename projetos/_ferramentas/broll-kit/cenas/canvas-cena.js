// Canvas estilo Maestri: grid de pontos, terminais de agentes digitando, cordas com pulsos.
// criarCanvas(container, dados) -> { render(t, cam, opts) }
//   cam = { x, y, s }: ponto do mundo que fica no centro-alvo da tela e escala
//   opts = { foco: id|null, focoTela: [x,y], escuro: 0..1, incluirExtras: bool }

const LINHA_H = 30;      // px por linha de terminal (no mundo)
const VEL_DIGITA = 20;   // caracteres/s nas linhas cmd
const DUR_PULSO = 1.1;

function criarCanvas(container, D) {
  const NS = "http://www.w3.org/2000/svg";
  const mundo = document.createElement("div");
  mundo.className = "mundo";
  container.appendChild(mundo);

  const pontos = document.createElement("div");
  pontos.className = "pontos";
  mundo.appendChild(pontos);

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "cordas");
  svg.setAttribute("width", 1080); svg.setAttribute("height", 1920);
  mundo.appendChild(svg);

  const porId = {};
  for (const T of D.terminais) porId[T.id] = T;

  // Porta de saída de uma corda: lado do terminal voltado para o outro.
  // As portas se espalham pela borda conforme a posição do outro terminal (evita nó de cordas).
  function porta(A, B) {
    const ca = [A.x + A.w / 2, A.y + A.h / 2], cb = [B.x + B.w / 2, B.y + B.h / 2];
    const dx = cb[0] - ca[0], dy = cb[1] - ca[1];
    if (Math.abs(dx) > 140) {
      const y = ca[1] + clamp(dy * 0.3, -A.h * 0.32, A.h * 0.32);
      return dx > 0 ? { p: [A.x + A.w, y], d: [1, 0] } : { p: [A.x, y], d: [-1, 0] };
    }
    const x = ca[0] + clamp(dx * 0.5, -A.w * 0.3, A.w * 0.3);
    return dy > 0 ? { p: [x, A.y + A.h], d: [0, 1] } : { p: [x, A.y], d: [0, -1] };
  }

  const cordas = {};
  for (const [a, b] of D.cordas) {
    const A = porId[a], B = porId[b];
    const pa = porta(A, B), pb = porta(B, A);
    const k = Math.min(110, Math.hypot(pb.p[0] - pa.p[0], pb.p[1] - pa.p[1]) * 0.3);
    const dStr = `M${pa.p[0]},${pa.p[1]} C${pa.p[0] + pa.d[0] * k},${pa.p[1] + pa.d[1] * k} ${pb.p[0] + pb.d[0] * k},${pb.p[1] + pb.d[1] * k} ${pb.p[0]},${pb.p[1]}`;
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", dStr);
    path.setAttribute("class", "corda");
    svg.appendChild(path);
    for (const pp of [pa.p, pb.p]) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", pp[0]); c.setAttribute("cy", pp[1]); c.setAttribute("r", 7);
      c.setAttribute("class", "porta");
      svg.appendChild(c);
    }
    cordas[a + ">" + b] = { path, len: path.getTotalLength(), ida: true };
    cordas[b + ">" + a] = { path, len: path.getTotalLength(), ida: false };
  }

  // Pulsos: cabeça + rastro (círculos)
  const pulsos = D.pulsos.map(([de, para, t0]) => {
    const c = cordas[de + ">" + para];
    if (!c) throw new Error("sem corda " + de + ">" + para);
    const g = document.createElementNS(NS, "g");
    const rastro = [];
    for (let i = 5; i >= 0; i--) {
      const ci = document.createElementNS(NS, "circle");
      ci.setAttribute("r", i === 0 ? 9 : 7 - i);
      ci.setAttribute("class", i === 0 ? "pulso" : "rastro");
      ci.style.opacity = i === 0 ? 1 : 0.55 - i * 0.08;
      g.appendChild(ci); rastro.push([ci, i]);
    }
    svg.appendChild(g);
    return { de, para, t0, c, g, rastro };
  });

  // Terminais
  const els = {};
  for (const T of D.terminais) {
    const el = document.createElement("div");
    el.className = "terminal" + (T.extra ? " extra" : "");
    Object.assign(el.style, { left: T.x + "px", top: T.y + "px", width: T.w + "px", height: T.h + "px" });
    el.innerHTML = `
      <div class="cab">
        <span class="luzes"><i></i><i></i><i></i></span>
        <span class="nome">${esc(T.nome)}</span>
        <span class="motor">${esc(T.motor)}</span>
      </div>
      <div class="corpo"></div>`;
    mundo.appendChild(el);
    els[T.id] = { el, corpo: el.querySelector(".corpo"), T, ultimo: "" };
  }

  // Linhas visíveis de um terminal no instante t (com "rolagem" e loop sem emenda).
  function linhasEm(T, t, semLoop) {
    const P = D.periodo;
    semLoop = semLoop || T.loop === false;
    const ciclos = semLoop ? [0] : [-1, 0];
    const tl = semLoop ? t : mod(t, P);
    const vis = [];
    for (const k of ciclos) for (const [ti, tipo, txt] of T.linhas) {
      const T0 = ti + k * P;
      if (T0 > tl) continue;
      const n = tipo === "cmd" ? Math.floor((tl - T0) * VEL_DIGITA) : txt.length;
      vis.push({ tipo, txt: txt.slice(0, n), digitando: tipo === "cmd" && n < txt.length, T0 });
    }
    vis.sort((a, b) => a.T0 - b.T0);
    const max = Math.floor((T.h - 70) / LINHA_H);
    const ult = vis.slice(-max);
    // cursor piscando na última linha se nada está sendo digitado
    return ult;
  }

  function htmlLinhas(ls, t) {
    let h = "";
    ls.forEach((l, i) => {
      const cur = (l.digitando || (i === ls.length - 1 && Math.floor(t * 2) % 2 === 0)) ? '<b class="cur"></b>' : "";
      const pre = { cmd: '<em>❯</em> ', ok: '<em>\uf00c</em> ', msg: '<em>→</em> ', out: "" }[l.tipo];
      h += `<div class="l ${l.tipo}">${pre}${esc(l.txt)}${l.digitando || i === ls.length - 1 ? cur : ""}</div>`;
    });
    return h;
  }

  function render(t, cam, opts = {}) {
    const focoTela = opts.focoTela || [540, 960];
    const tx = focoTela[0] - cam.x * cam.s, ty = focoTela[1] - cam.y * cam.s;
    mundo.style.transform = `translate(${tx}px, ${ty}px) scale(${cam.s})`;

    const P = D.periodo;
    const brilho = {};
    for (const p of pulsos) {
      // instância do pulso mais recente que já começou
      const dt = mod(t - p.t0, P);
      const k = dt / DUR_PULSO;
      const ativo = k <= 1;
      p.g.style.display = ativo ? "" : "none";
      if (ativo) {
        for (const [ci, i] of p.rastro) {
          const kk = clamp(ease.inOut(clamp(k)) - i * 0.035);
          const L = p.c.ida ? kk * p.c.len : (1 - kk) * p.c.len;
          const pt = p.c.path.getPointAtLength(L);
          ci.setAttribute("cx", pt.x); ci.setAttribute("cy", pt.y);
        }
      }
      // brilho no terminal de destino logo após a chegada
      const desde = dt - DUR_PULSO;
      if (desde >= 0 && desde < 0.9) brilho[p.para] = Math.max(brilho[p.para] || 0, 1 - desde / 0.9);
      if (dt < 0.4) brilho[p.de] = Math.max(brilho[p.de] || 0, 0.5 * (1 - dt / 0.4));
    }

    for (const id in els) {
      const { el, corpo, T } = els[id];
      if (T.extra && !(opts.incluirExtras && opts.foco === id)) { el.style.display = "none"; continue; }
      el.style.display = "";
      const h = htmlLinhas(linhasEm(T, t, opts.foco === id), t);
      if (h !== els[id].ultimo) { corpo.innerHTML = h; els[id].ultimo = h; }
      const b = brilho[id] || 0;
      el.style.setProperty("--brilho", b.toFixed(3));
      const apagado = opts.foco && opts.foco !== id ? (opts.escuro || 0) : 0;
      el.style.setProperty("--apagado", apagado.toFixed(3));
    }
    const apagCordas = opts.foco ? (opts.escuro || 0) : 0;
    svg.style.opacity = (1 - apagCordas * 0.85).toFixed(3);
  }

  return { render, mundo };
}
