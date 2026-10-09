import {Composition, Folder} from 'remotion';
import {duracaoDoReel, Reel} from './Reel';
import type {ReelDados} from './tipos';
import {videos} from './videos';

const FPS = 30;

// Uma composição por arquivo em src/videos/<slug>.json. O id é o slug.
export const Root: React.FC = () => (
	<Folder name="Reels">
		{videos.map(({slug, dados}) => (
			<Composition
				key={slug}
				id={slug}
				component={Reel as unknown as React.FC<Record<string, unknown>>}
				width={1080}
				height={1920}
				fps={FPS}
				durationInFrames={duracaoDoReel(dados, FPS)}
				defaultProps={{dados} as {dados: ReelDados}}
			/>
		))}
	</Folder>
);
