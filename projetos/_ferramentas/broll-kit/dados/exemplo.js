// Exemplo de dados de b-roll (copie para dados/<slug>.js e edite). Tudo aqui é fictício.
// Textos de terminal são genéricos/fictícios (nada de chave, IP, domínio ou cliente real).
// Tipos de linha: cmd (❯ digitando), out (saída), ok (✓), msg (→ mensagem para outro agente).

window.DADOS = {
  periodo: 12, // segundos; terminais e pulsos repetem nesse período (loop sem emenda)

  // Posições no "mundo" (1080x1920 = enquadramento final, todo o canvas visível).
  terminais: [
    { id: "tucano",    nome: "Tucano",     motor: "claude", x: 70,  y: 240,  w: 400, h: 300, linhas: [
      [0.4, "cmd", "abrir tokens/cores.ts"],
      [1.6, "out", "lendo 42 tokens…"],
      [3.0, "cmd", "spec do selo Destaque"],
      [4.4, "out", "raio 8 · peso 600 · 14px"],
      [6.0, "ok",  "contraste 7,1:1"],
      [8.0, "msg", "Opala: spec pronta"],
      [10.0, "out", "aguardando preview…"],
    ]},
    { id: "opala",     nome: "Opala",      motor: "claude", x: 550, y: 290,  w: 400, h: 300, linhas: [
      [0.8, "cmd", "pnpm dev"],
      [1.6, "ok",  "Ready em 1,8s"],
      [3.2, "cmd", "editar SeloDestaque.tsx"],
      [5.0, "out", "+24 linhas  −3 linhas"],
      [6.6, "cmd", "pnpm tsc --noEmit"],
      [8.0, "ok",  "tipos ok, 0 erros"],
      [9.4, "msg", "Beija-flor: confere?"],
    ]},
    { id: "kombi",     nome: "Kombi",      motor: "claude", x: 70,  y: 600,  w: 400, h: 300, linhas: [
      [0.2, "cmd", "supabase migration new"],
      [1.4, "out", "127_selo_destaque.sql"],
      [2.6, "cmd", "supabase db push"],
      [4.2, "ok",  "migration 127 aplicada"],
      [5.6, "ok",  "RLS: 3 policies ok"],
      [7.2, "msg", "Opala: tipos gerados"],
      [9.8, "out", "schema sem drift"],
    ]},
    { id: "maritaca",  nome: "Maritaca",   motor: "claude", x: 550, y: 650,  w: 400, h: 300, linhas: [
      [0.5, "cmd", "testar fluxo whatsapp"],
      [1.8, "out", "cliente: tem SUV até 90k?"],
      [3.4, "out", "ia: tenho 3 opções, quer ver?"],
      [4.6, "ok",  "resposta em 1,2s"],
      [6.4, "cmd", "rodar evals do atendimento"],
      [8.6, "ok",  "48/50 passaram"],
      [10.2, "msg", "Kombi: campo novo?"],
    ]},
    { id: "beija-flor", nome: "Beija-flor", motor: "claude", x: 70,  y: 960,  w: 400, h: 300, linhas: [
      [0.3, "cmd", "abrir /loja no navegador"],
      [1.8, "out", "viewport 390×844"],
      [3.0, "out", "screenshot salvo"],
      [4.4, "ok",  "selo visível no card"],
      [6.2, "out", "! texto corta em 320px"],
      [7.8, "msg", "Opala: ajustar quebra"],
      [10.4, "ok", "ok em 320px agora"],
    ]},
    { id: "coruja",    nome: "Coruja",     motor: "claude", x: 550, y: 1010, w: 400, h: 300, linhas: [
      [0.7, "cmd", "git diff --stat"],
      [1.8, "out", "6 arquivos  +112  −18"],
      [3.0, "out", "revisando diff…"],
      [4.3, "out", "checando multi-tenant…"],
      [7.4, "ok",  "nenhum bug encontrado"],
      [8.8, "msg", "Radar: 2ª opinião?"],
      [10.6, "ok", "aprovado pra push"],
    ]},
    { id: "radar",     nome: "Radar",      motor: "codex",  x: 310, y: 1340, w: 400, h: 300, linhas: [
      [0.9, "cmd", "codex review"],
      [2.4, "out", "lendo 6 arquivos…"],
      [4.2, "out", "revisando diff…"],
      [6.8, "ok",  "sem achados graves"],
      [9.4, "ok",  "concordo com a Coruja"],
      [11.0, "out", "pronto."],
    ]},
    // Fora do canvas (subagente): só aparece no spotlight, sem loop.
    { id: "guincho",   nome: "Guincho",    motor: "subagente", extra: true, loop: false, x: 310, y: 810, w: 400, h: 300, linhas: [
      [0.0, "cmd", "deploy produção"],
      [0.5, "ok",  "build ok · testes ok"],
      [0.9, "out", "▸ build da imagem… ok"],
      [1.3, "out", "▸ push da imagem… ok"],
      [1.7, "out", "▸ migrations em dia"],
      [2.1, "out", "▸ healthcheck 200"],
      [2.5, "ok",  "deploy ok"],
    ]},
  ],

  cordas: [
    ["tucano", "opala"], ["kombi", "opala"], ["kombi", "maritaca"], ["opala", "beija-flor"],
    ["beija-flor", "coruja"], ["opala", "coruja"], ["coruja", "radar"], ["beija-flor", "radar"],
  ],

  // [de, para, início(s)]: um pulso de mensagem viajando pela corda (~1,1 s).
  pulsos: [
    ["opala", "coruja", 1.0], ["kombi", "maritaca", 3.0], ["beija-flor", "coruja", 5.0],
    ["kombi", "opala", 7.2], ["beija-flor", "opala", 7.8], ["tucano", "opala", 8.0],
    ["coruja", "radar", 8.8], ["opala", "beija-flor", 9.4], ["maritaca", "kombi", 10.2],
    ["radar", "coruja", 11.2], ["opala", "tucano", 2.2], ["radar", "beija-flor", 5.8],
  ],

  // Spotlight: em que instante do canvas começa (para a linha-chave cair dentro dos 2 s).
  spotlight: {
    "opala": 6.3, "kombi": 2.7, "maritaca": 1.5, "beija-flor": 2.8, "coruja": 2.6, "guincho": 1.0,
  },

  quadro: {
    titulo: "QUADRO DOS 10",
    agentes: [
      ["🧑‍💻", "Opala", "dev Next.js"],
      ["🗄️", "Kombi", "guardião do banco"],
      ["💬", "Maritaca", "IA do WhatsApp"],
      ["🎨", "Tucano", "dono do design"],
      ["🐦", "Beija-flor", "inspetor visual"],
      ["🦉", "Coruja", "revisora de código"],
      ["📡", "Radar", "2ª opinião (Codex)"],
      ["🔎", "Bem-te-vi", "auditor de legibilidade"],
      ["✉️", "Carteiro", "APIs da Meta"],
      ["🚛", "Guincho", "infra e deploy"],
    ],
    divisao: 7, // depois do 7º: subagentes
    rodape: "7 no canvas do Maestri · 3 subagentes do Claude Code",
  },

  contador: {
    total: 579,
    rotulo: "COMMITS",
    periodo: "24/05 → hoje",
    inicio: "2026-05-24",
    fim: "2026-10-06",
    // commits por dia: gere com git log --format=%ad --date=short | sort | uniq -c
    porDia: {"2026-05-24":4,"2026-05-25":26,"2026-05-26":5,"2026-06-09":19,"2026-06-10":10,"2026-06-11":2,"2026-06-15":8,"2026-06-17":2,"2026-06-23":8,"2026-06-24":5,"2026-06-25":10,"2026-06-29":3,"2026-07-06":4,"2026-07-07":3,"2026-07-08":2,"2026-07-09":20,"2026-07-10":1,"2026-07-14":23,"2026-07-15":8,"2026-07-16":10,"2026-07-17":20,"2026-07-18":11,"2026-07-19":26,"2026-07-20":12,"2026-07-26":1,"2026-07-27":5,"2026-07-28":4,"2026-08-04":2,"2026-08-05":7,"2026-08-06":48,"2026-08-07":12,"2026-08-08":7,"2026-08-09":7,"2026-08-10":24,"2026-08-12":10,"2026-08-13":24,"2026-08-17":8,"2026-08-18":8,"2026-08-19":6,"2026-08-20":4,"2026-08-21":1,"2026-08-22":8,"2026-08-23":10,"2026-08-24":5,"2026-08-25":18,"2026-08-26":2,"2026-08-27":2,"2026-08-28":21,"2026-08-30":1,"2026-09-01":2,"2026-09-03":3,"2026-09-07":3,"2026-09-18":7,"2026-09-19":2,"2026-09-20":5,"2026-09-26":14,"2026-09-29":8,"2026-10-03":34,"2026-10-04":14},
  },

  card: {
    arquivo: "meu-app/.claude/agents/coruja.md",
    linha: 3,
    // trecho do arquivo mostrado no card
    codigo: ["description: …", "Só lê e reporta;", "não edita código."],
    destaque: "não edita código.",
    titulo: "REGRA > PROMPT",
  },
};
