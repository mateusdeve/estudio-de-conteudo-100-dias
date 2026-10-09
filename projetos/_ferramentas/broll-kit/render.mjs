#!/usr/bin/env node
// Renderiza uma cena HTML (window.render(t)) quadro a quadro e monta o .mp4 no padrão do CLAUDE.md.
//
// Uso:
//   node render.mjs <cena.html> "<query>" <saida.mp4> [--quadro <t>] [--png <saida.png>]
// Ex.:
//   node render.mjs cenas/canvas.html "dados=2026-10-06-saas-com-time-de-ias&modo=loop" out.mp4
//   node render.mjs cenas/canvas.html "dados=...&modo=loop" - --png previa.png --quadro 6
//   node render.mjs cenas/logo3d.html "svg=/node_modules/...svg" - --http 1 --seq pasta/   (PNGs RGBA, fundo transparente)
// --http 1: serve projetos/_ferramentas/ por HTTP local (necessário para módulos ES, ex. Three.js).
// --vp LxA: tamanho da viewport (padrão 1080x1920).
//
// Vídeo: 1080x1920, 30 fps, H.264 (crf 18, preset slow, yuv420p, bt709), +faststart, sem áudio.

import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";

const FFMPEG = "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg";
const [cena, query, saida, ...resto] = process.argv.slice(2);
if (!cena || query == null || !saida) {
  console.error('uso: node render.mjs <cena.html> "<query>" <saida.mp4|-> [--png f.png --quadro t]');
  process.exit(1);
}
const opt = {};
for (let i = 0; i < resto.length; i += 2) opt[resto[i].replace(/^--/, "")] = resto[i + 1];

if (saida !== "-" && fs.existsSync(saida)) {
  console.error("já existe, não sobrescrevo: " + saida);
  process.exit(1);
}

let url = pathToFileURL(path.resolve(cena)).href + "?" + query;
let servidor = null;
if (opt.http) {
  const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const tipos = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml",
                  ".css": "text/css", ".json": "application/json", ".ttf": "font/ttf", ".png": "image/png" };
  servidor = http.createServer((req, res) => {
    const p = path.join(raiz, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!p.startsWith(raiz) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": tipos[path.extname(p)] || "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  await new Promise(r => servidor.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${servidor.address().port}/${path.relative(raiz, path.resolve(cena))}?${query}`;
}
const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--force-color-profile=srgb"] });
const [vpL, vpA] = (opt.vp || "1080x1920").split("x").map(Number);  // --vp 720x720 para cenas não verticais
const page = await browser.newPage({ viewport: { width: vpL, height: vpA }, deviceScaleFactor: 1 });
page.on("pageerror", e => { console.error("erro na página:", e.message); process.exit(1); });
page.on("console", m => { if (m.type() === "error") console.error("console:", m.text()); });
await page.goto(url);
await page.waitForFunction(() => window.pronto !== undefined, null, { timeout: 30000 });
await page.evaluate(() => window.pronto);
await page.evaluate(() => document.fonts.ready);

const { duracao, fps } = await page.evaluate(() => window.CENA);

async function quadro(t) {
  await page.evaluate(t => window.render(t), t);
  return page.screenshot({ type: "png", animations: "disabled", omitBackground: !!opt.seq });
}

if (opt.seq) {  // sequência PNG RGBA (fundo transparente)
  fs.mkdirSync(opt.seq, { recursive: true });
  const n = Math.round(duracao * fps);
  for (let f = 0; f < n; f++) fs.writeFileSync(path.join(opt.seq, `q${String(f).padStart(4, "0")}.png`), await quadro(f / fps));
  console.log(`seq: ${n} quadros em ${opt.seq}`);
}

if (opt.png) {
  fs.writeFileSync(opt.png, await quadro(parseFloat(opt.quadro || "0")));
  console.log("png:", opt.png);
}

if (saida !== "-") {
  const n = Math.round(duracao * fps);
  const ff = spawn(FFMPEG, [
    "-hide_banner", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-r", String(fps), "-an", "-movflags", "+faststart", saida,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const fim = new Promise((ok, erro) => ff.on("close", c => (c === 0 ? ok() : erro(new Error("ffmpeg saiu com " + c)))));
  for (let f = 0; f < n; f++) {
    const buf = await quadro(f / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (f % 60 === 0) process.stdout.write(`\r${path.basename(saida)}: ${f}/${n}`);
  }
  ff.stdin.end();
  await fim;
  console.log(`\r${path.basename(saida)}: ${n}/${n} quadros ok`);
}
await browser.close();
if (servidor) servidor.close();
