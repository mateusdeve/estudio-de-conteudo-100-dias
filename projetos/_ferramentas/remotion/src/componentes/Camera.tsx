import {AbsoluteFill, getRemotionEnvironment, interpolate, OffthreadVideo, Series, staticFile, useCurrentFrame} from 'remotion';
import type {Linha} from '../linha';
import type {ReelDados} from '../tipos';

const FADE = 2; // quadros de fade no áudio de cada corte (tira o "clique" da emenda)
const PUNCH = {subida: 3, descida: 10, forca: 0.07};

// A-roll: um segmento do bruto por corte, alternando aberto/close (jump cut), com punch-in nos momentos fortes.
export const Camera: React.FC<{dados: ReelDados; linha: Linha}> = ({dados, linha}) => {
	const frame = useCurrentFrame();
	const close = dados.close ?? {escala: 1.38, focoX: 0.5, focoY: 0.36};

	let punch = 1;
	for (const t of dados.punch ?? []) {
		const p = linha.quadro(t);
		const d = frame - p;
		if (d >= 0 && d < PUNCH.subida + PUNCH.descida) {
			const forma =
				d < PUNCH.subida
					? interpolate(d, [0, PUNCH.subida], [0, 1])
					: interpolate(d, [PUNCH.subida, PUNCH.subida + PUNCH.descida], [1, 0], {
							easing: (x) => 1 - Math.pow(1 - x, 3),
						});
			punch = Math.max(punch, 1 + PUNCH.forca * forma);
		}
	}

	// No Studio, o navegador sofre com 4K: usa a prévia leve se houver.
	const arquivo = getRemotionEnvironment().isStudio && dados.fontePrevia ? dados.fontePrevia : dados.fonte;

	if (!arquivo) {
		return <AbsoluteFill style={{background: 'linear-gradient(#2a2a2a,#151515)'}} />;
	}

	return (
		<AbsoluteFill style={{transform: `scale(${punch})`, transformOrigin: `${close.focoX * 100}% ${close.focoY * 100}%`}}>
			<Series>
				{linha.segmentos.map((s, i) => {
					const escala = s.enquadramento === 'close' ? close.escala : 1;
					return (
						<Series.Sequence key={i} durationInFrames={s.quadros}>
							<AbsoluteFill
								style={{transform: `scale(${escala})`, transformOrigin: `${close.focoX * 100}% ${close.focoY * 100}%`}}
							>
								<OffthreadVideo
									src={staticFile(arquivo)}
									toneMapped={false} // a fonte já é SDR bt709; o tone mapping trava o extrator em resoluções altas
									startFrom={s.entrada}
									endAt={s.entrada + s.quadros}
									volume={(f) =>
										interpolate(f, [0, FADE, s.quadros - FADE, s.quadros], [0, 1, 1, 0], {
											extrapolateLeft: 'clamp',
											extrapolateRight: 'clamp',
										})
									}
									style={{width: '100%', height: '100%', objectFit: 'cover'}}
								/>
							</AbsoluteFill>
						</Series.Sequence>
					);
				})}
			</Series>
		</AbsoluteFill>
	);
};
