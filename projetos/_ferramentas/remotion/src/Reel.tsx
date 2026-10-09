import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Camera} from './componentes/Camera';
import {Guias} from './componentes/Guias';
import {Legenda} from './componentes/Legenda';
import {Cards, MarcaTexto, Pergunta, Titulo} from './componentes/Textos';
import {criarLinha} from './linha';
import type {ReelDados} from './tipos';

export const Reel: React.FC<{dados: ReelDados}> = ({dados}) => {
	const {fps} = useVideoConfig();
	const linha = criarLinha(dados.cortes, fps);

	return (
		<AbsoluteFill style={{background: '#111'}}>
			<Camera dados={dados} linha={linha} />

			{dados.textos.map((t, i) => {
				const de = linha.quadro(t.ini);
				const duracao = Math.max(1, linha.quadro(t.fim) - de);
				let conteudo: React.ReactNode = null;
				if (t.tipo === 'gancho' || t.tipo === 'titulo')
					conteudo = <Titulo linhas={t.linhas} destaque={t.destaque} duracao={duracao} tamanho={t.tipo === 'gancho' ? 108 : 112} />;
				if (t.tipo === 'marca') conteudo = <MarcaTexto texto={t.texto} destaque={t.destaque} duracao={duracao} />;
				if (t.tipo === 'pergunta') conteudo = <Pergunta texto={t.texto} duracao={duracao} />;
				if (t.tipo === 'cards')
					conteudo = <Cards itens={t.itens.map((it) => ({...it, q: linha.quadro(it.em) - de}))} duracao={duracao} riscar={t.riscar} />;
				return (
					<Sequence key={i} from={de} durationInFrames={duracao} layout="none">
						{conteudo}
					</Sequence>
				);
			})}

			<Legenda palavras={dados.palavras} linha={linha} topo={dados.legendaTopo} />

			{(dados.sfx ?? []).map((s, i) => (
				<Sequence key={i} from={linha.quadro(s.em)} layout="none">
					<Audio src={staticFile(`sfx/${s.arquivo}`)} volume={s.volume ?? 0.5} />
				</Sequence>
			))}

			{dados.musica ? <Audio src={staticFile(dados.musica.arquivo)} volume={dados.musica.volume} loop /> : null}

			{dados.guias ? <Guias /> : null}
		</AbsoluteFill>
	);
};

export const duracaoDoReel = (dados: ReelDados, fps: number) => criarLinha(dados.cortes, fps).total;
