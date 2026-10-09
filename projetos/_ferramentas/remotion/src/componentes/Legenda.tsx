import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COR, contornoTexto, FONTE, SEGURO} from '../estilo';
import type {Linha} from '../linha';
import type {Palavra} from '../tipos';

const MAX_PALAVRAS = 3;
const PAUSA_QUEBRA = 0.35; // s de silêncio que forçam uma página nova

type Pagina = {palavras: (Palavra & {q: number; qFim: number})[]; ini: number; fim: number};

const paginar = (palavras: Palavra[], linha: Linha, fps: number): Pagina[] => {
	const paginas: Pagina[] = [];
	let atual: Pagina['palavras'] = [];
	const fechar = () => {
		if (atual.length) paginas.push({palavras: atual, ini: atual[0].q, fim: atual[atual.length - 1].qFim});
		atual = [];
	};
	const usadas = palavras.filter((p) => linha.dentro((p.ini + p.fim) / 2)); // fora dos cortes = take descartado
	usadas.forEach((p, i) => {
		const q = linha.quadro(p.ini);
		const qFim = Math.max(q + 1, linha.quadro(p.fim));
		const anterior = atual[atual.length - 1];
		const outroCorte = anterior && linha.corte((anterior.ini + anterior.fim) / 2) !== linha.corte((p.ini + p.fim) / 2);
		if (anterior && (atual.length >= MAX_PALAVRAS || outroCorte || q - anterior.qFim > PAUSA_QUEBRA * fps)) fechar();
		atual.push({...p, q, qFim});
		if (/[.,!?:;]$/.test(p.texto)) fechar();
		if (i === usadas.length - 1) fechar();
	});
	// cada página fica na tela até a próxima começar (sem piscar entre palavras)
	paginas.forEach((pg, i) => {
		const prox = paginas[i + 1];
		pg.fim = prox ? Math.min(prox.ini, pg.fim + Math.round(0.6 * fps)) : pg.fim + Math.round(0.4 * fps);
	});
	return paginas;
};

// Legenda palavra a palavra: 1–3 palavras por vez, palavra falada em amarelo com "pop".
export const Legenda: React.FC<{palavras: Palavra[]; linha: Linha; topo?: number}> = ({palavras, linha, topo = 1360}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const paginas = paginar(palavras, linha, fps);
	const pg = paginas.find((p) => frame >= p.ini && frame < p.fim);
	if (!pg) return null;

	const entrada = spring({frame: frame - pg.ini, fps, config: {damping: 14, stiffness: 220}, durationInFrames: 8});

	return (
		<div
			style={{
				position: 'absolute',
				top: topo,
				left: SEGURO.esquerda,
				right: SEGURO.direita,
				display: 'flex',
				justifyContent: 'center',
				flexWrap: 'wrap',
				gap: '0 22px',
				fontFamily: FONTE,
				fontWeight: 700,
				fontSize: 78,
				lineHeight: 1.05,
				textTransform: 'uppercase',
				transform: `scale(${0.85 + 0.15 * entrada})`,
				opacity: entrada,
			}}
		>
			{pg.palavras.map((p, i) => {
				const falando = frame >= p.q && (frame < p.qFim || i === pg.palavras.length - 1);
				const pop = falando ? spring({frame: frame - p.q, fps, config: {damping: 10, stiffness: 300}, durationInFrames: 6}) : 0;
				return (
					<span
						key={i}
						style={{
							color: falando || p.destaque ? COR.destaque : COR.texto,
							display: 'inline-block',
							transform: `scale(${falando ? 1.16 - 0.16 * pop : 1})`,
							...contornoTexto(10),
						}}
					>
						{p.texto.replace(/[.,!?:;]+$/, '')}
					</span>
				);
			})}
		</div>
	);
};
