import type {Corte} from './tipos';

export type Segmento = Corte & {
	quadros: number; // duração na timeline final
	saida: number; // quadro em que começa na timeline final
	entrada: number; // quadro do bruto em que começa
};

export type Linha = {
	segmentos: Segmento[];
	total: number;
	// tempo do bruto (s) → quadro da timeline final. Tempo que caiu num trecho cortado
	// vai para o começo do próximo segmento.
	quadro: (t: number) => number;
	// o tempo do bruto (s) está dentro de algum corte?
	dentro: (t: number) => boolean;
	// índice do corte que contém o tempo do bruto (s), ou -1
	corte: (t: number) => number;
};

export const criarLinha = (cortes: Corte[], fps: number): Linha => {
	let saida = 0;
	const segmentos = cortes.map((c, i) => {
		const entrada = Math.round(c.de * fps);
		const quadros = Math.max(1, Math.round(c.ate * fps) - entrada);
		const s: Segmento = {
			...c,
			enquadramento: c.enquadramento ?? (i % 2 === 0 ? 'aberto' : 'close'),
			quadros,
			saida,
			entrada,
		};
		saida += quadros;
		return s;
	});
	const total = saida;
	const quadro = (t: number) => {
		const q = Math.round(t * fps);
		for (const s of segmentos) {
			if (q < s.entrada) return s.saida;
			if (q < s.entrada + s.quadros) return s.saida + (q - s.entrada);
		}
		return total;
	};
	const dentro = (t: number) => segmentos.some((s) => t >= s.de && t < s.ate);
	const corte = (t: number) => segmentos.findIndex((s) => t >= s.de && t < s.ate);
	return {segmentos, total, quadro, dentro, corte};
};
