import type {ReelDados} from '../tipos';

// Carrega todos os src/videos/*.json (cada um vira uma composição com o nome do arquivo).
declare const require: {context: (dir: string, sub: boolean, re: RegExp) => {keys: () => string[]; (k: string): unknown}};
const ctx = require.context('./', false, /\.json$/);

export const videos = ctx
	.keys()
	.filter((k) => k.startsWith('./'))
	.map((k) => ({slug: k.replace('./', '').replace('.json', ''), dados: ctx(k) as ReelDados}))
	.sort((a, b) => b.slug.localeCompare(a.slug));
