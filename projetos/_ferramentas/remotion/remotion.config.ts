import {Config} from '@remotion/cli/config';

// Padrão do CLAUDE.md: H.264 crf 18, yuv420p, bt709. Loudness e +faststart são feitos no scripts/render.sh.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setX264Preset('slow');
Config.setOverwriteOutput(false);
Config.setConcurrency(1); // com pouco disco/memória, vários quadros em paralelo derrubam o extrator de vídeo
// Na 1ª vez o Remotion copia a `fonte` (4K, ~1 GB) para o cache antes do 1º quadro: dar tempo.
Config.setDelayRenderTimeoutInMilliseconds(300000);
// Cache de quadros do extrator: o padrão (~2 GB) estoura com 4K e disco apertado.
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);
