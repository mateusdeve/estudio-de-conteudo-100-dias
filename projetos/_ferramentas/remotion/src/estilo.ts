import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Cores e fonte do canal. A fonte vem de assets/fontes (ligada em public/fontes por scripts/preparar.sh).
// Para outro canal, troque aqui (e em canal/estilo-visual.md).
export const FONTE = 'Familjen Grotesk';
export const COR = {
	texto: '#FFFFFF',
	destaque: '#FFD60A', // marca-texto amarelo
	escuro: '#111111',
	contorno: 'rgba(0,0,0,0.85)',
};

// Zonas seguras (UI do Instagram/TikTok) em px de 1080x1920.
export const SEGURO = {topo: 200, base: 250, direita: 120, esquerda: 60};

for (const peso of [500, 600, 700]) {
	loadFont({family: FONTE, url: staticFile(`fontes/FamiljenGrotesk-${peso}.ttf`), weight: String(peso)}).catch(
		(e) => console.warn('fonte', peso, e),
	);
}

export const contornoTexto = (px: number): React.CSSProperties => ({
	WebkitTextStroke: `${px}px ${COR.contorno}`,
	paintOrder: 'stroke fill',
	textShadow: '0 6px 18px rgba(0,0,0,0.35)',
});
