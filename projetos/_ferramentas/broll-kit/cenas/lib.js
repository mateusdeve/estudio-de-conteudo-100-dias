// Utilitários das cenas. Toda cena expõe window.render(t) (t em segundos) e
// window.CENA = { duracao, fps }. O render.mjs chama render(t) quadro a quadro.

const Q = new URLSearchParams(location.search);

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, ini, dur) => clamp((t - ini) / dur);
const ease = {
  linear: k => k,
  inOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  out: k => 1 - Math.pow(1 - k, 3),
  outExpo: k => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  // "pop" com leve passada do ponto
  outBack: k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
};
const mod = (a, n) => ((a % n) + n) % n;

// Carrega o arquivo de dados do vídeo (dados/<nome>.js define window.DADOS).
function carregarDados() {
  const nome = Q.get("dados");
  if (!nome) return Promise.resolve();
  return new Promise((ok, erro) => {
    const s = document.createElement("script");
    s.src = `../dados/${nome}.js`;
    s.onload = ok; s.onerror = () => erro(new Error("dados não encontrados: " + nome));
    document.head.appendChild(s);
  });
}

function guias(palco) {
  if (Q.get("guias") !== "1") return;
  palco.classList.add("guias");
  const d = document.createElement("div"); d.className = "guia-dir"; palco.appendChild(d);
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Prévia no navegador: ?play=1 roda em tempo real; senão desenha t=?t (padrão 0).
function previa() {
  if (Q.get("play") === "1") {
    const t0 = performance.now();
    const loop = () => { window.render(((performance.now() - t0) / 1000) % window.CENA.duracao); requestAnimationFrame(loop); };
    loop();
  } else {
    window.render(parseFloat(Q.get("t") || "0"));
  }
}
