import {AbsoluteFill} from 'remotion';
import {SEGURO} from '../estilo';

const faixa: React.CSSProperties = {position: 'absolute', background: 'rgba(255,0,60,0.28)'};

// Zonas onde a interface do app cobre o vídeo. Ligue com "guias": true no JSON (nunca no export final).
export const Guias: React.FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{...faixa, top: 0, left: 0, right: 0, height: SEGURO.topo}} />
		<div style={{...faixa, bottom: 0, left: 0, right: 0, height: SEGURO.base}} />
		<div style={{...faixa, top: SEGURO.topo, bottom: SEGURO.base, right: 0, width: SEGURO.direita}} />
	</AbsoluteFill>
);
