import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COR, contornoTexto, FONTE, SEGURO} from '../estilo';

const area: React.CSSProperties = {
	position: 'absolute',
	top: SEGURO.topo + 40,
	left: SEGURO.esquerda,
	right: SEGURO.direita,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	fontFamily: FONTE,
	textAlign: 'center',
};

const saida = (frame: number, duracao: number) =>
	interpolate(frame, [duracao - 6, duracao], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// Pinta o trecho `destaque` de uma linha com o fundo amarelo.
const comDestaque = (linha: string, destaque: string | undefined, largura: number) => {
	if (!destaque || !linha.includes(destaque)) return linha;
	const [antes, depois] = linha.split(destaque);
	return (
		<>
			{antes}
			<span
				style={{
					position: 'relative',
					display: 'inline-block',
					color: COR.escuro,
					padding: '0 22px 0 14px',
					letterSpacing: 0,
					WebkitTextStroke: '0px transparent',
					textShadow: 'none',
				}}
			>
				<span
					style={{
						position: 'absolute',
						inset: '6% 0',
						background: COR.destaque,
						transformOrigin: 'left',
						transform: `scaleX(${largura})`,
						zIndex: -1,
					}}
				/>
				{destaque}
			</span>
			{depois}
		</>
	);
};

// Gancho / título: linhas grandes entrando de baixo, uma depois da outra.
const LARGURA_UTIL = 1080 - SEGURO.esquerda - SEGURO.direita - 40;
// Encolhe a fonte para a linha caber inteira (Familjen em caixa alta ≈ 0,62 em por caractere).
const caber = (linha: string, tamanho: number) => Math.min(tamanho, LARGURA_UTIL / (linha.length * 0.62));

export const Titulo: React.FC<{linhas: string[]; destaque?: string; duracao: number; tamanho?: number}> = ({
	linhas,
	destaque,
	duracao,
	tamanho = 104,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const marca = interpolate(frame, [linhas.length * 3 + 4, linhas.length * 3 + 12], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<div style={{...area, opacity: saida(frame, duracao), isolation: 'isolate'}}>
			{linhas.map((l, i) => {
				const s = spring({frame: frame - i * 3, fps, config: {damping: 13, stiffness: 180}});
				return (
					<div
						key={i}
						style={{
							fontWeight: 700,
							fontSize: caber(l, tamanho),
							lineHeight: 1.02,
							whiteSpace: 'nowrap',
							letterSpacing: '-0.02em',
							color: COR.texto,
							textTransform: 'uppercase',
							transform: `translateY(${(1 - s) * 60}px) scale(${0.9 + 0.1 * s})`,
							opacity: s,
							...contornoTexto(12),
						}}
					>
						{comDestaque(l, destaque, marca)}
					</div>
				);
			})}
		</div>
	);
};

// Marca-texto: frase com o trecho importante sendo riscado de amarelo.
export const MarcaTexto: React.FC<{texto: string; destaque: string; duracao: number}> = ({texto, destaque, duracao}) => (
	<Titulo linhas={[texto]} destaque={destaque} duracao={duracao} tamanho={118} />
);

// Pergunta final: balão claro com a pergunta do CTA.
export const Pergunta: React.FC<{texto: string; duracao: number}> = ({texto, duracao}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame, fps, config: {damping: 12, stiffness: 160}});
	return (
		<div style={{...area, opacity: saida(frame, duracao)}}>
			<div
				style={{
					background: COR.texto,
					color: COR.escuro,
					fontWeight: 700,
					fontSize: 64,
					lineHeight: 1.1,
					padding: '28px 40px',
					borderRadius: 36,
					maxWidth: 820,
					transform: `scale(${0.7 + 0.3 * s}) rotate(${(1 - s) * -4}deg)`,
					opacity: s,
					boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
				}}
			>
				{texto}
			</div>
		</div>
	);
};

// Cards: itens entrando um a um (no quadro `q` de cada um); o mais novo fica em destaque.
export const Cards: React.FC<{itens: {texto: string; emoji?: string; q: number}[]; duracao: number; riscar?: boolean}> = ({
	itens,
	duracao,
	riscar,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const visiveis = itens.filter((it) => frame >= it.q);
	return (
		<div style={{...area, gap: 18, opacity: saida(frame, duracao)}}>
			{visiveis.map((it, i) => {
				const atual = i === visiveis.length - 1;
				const s = spring({frame: frame - it.q, fps, config: {damping: 11, stiffness: 240}});
				// risco passa no item anterior quando o próximo entra
				const prox = visiveis[i + 1];
				const risco = riscar && prox ? interpolate(frame - prox.q, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
				return (
					<div
						key={it.texto}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							padding: atual ? '20px 44px' : '10px 30px',
							borderRadius: 28,
							background: atual ? COR.destaque : 'rgba(17,17,17,0.78)',
							color: atual ? COR.escuro : COR.texto,
							fontWeight: 700,
							fontSize: atual ? caber(it.texto + (it.emoji ? '  ' : ''), 92) : 50,
							letterSpacing: '-0.02em',
							textTransform: 'uppercase',
							transform: `scale(${0.4 + 0.6 * s})`,
							opacity: Math.min(1, s * 1.5),
							boxShadow: atual ? '0 18px 50px rgba(0,0,0,0.4)' : 'none',
							position: 'relative',
							whiteSpace: 'nowrap',
						}}
					>
						{it.emoji ? <span style={{fontSize: atual ? 88 : 46}}>{it.emoji}</span> : null}
						{it.texto}
						{risco > 0 ? (
							<span
								style={{
									position: 'absolute',
									left: 16,
									right: 16,
									top: '50%',
									height: 6,
									background: COR.destaque,
									transformOrigin: 'left',
									transform: `scaleX(${risco})`,
								}}
							/>
						) : null}
					</div>
				);
			})}
		</div>
	);
};
