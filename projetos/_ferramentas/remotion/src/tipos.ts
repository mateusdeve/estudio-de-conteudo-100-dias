// Formato dos dados de um Reel (src/videos/<slug>.json).
// TODOS os tempos (de/ate/ini/fim/em) são em segundos DO BRUTO, não da timeline final.
// Assim textos, legendas e SFX ficam presos à fala: mudar um corte não desalinha nada.

export type Enquadramento = 'aberto' | 'close';

export type Corte = {
	de: number;
	ate: number;
	enquadramento?: Enquadramento; // padrão: alterna aberto/close a cada corte
};

export type Palavra = {
	texto: string;
	ini: number;
	fim: number;
	destaque?: boolean; // força a cor de destaque mesmo fora da palavra atual
};

export type Texto =
	| {tipo: 'gancho' | 'titulo'; linhas: string[]; destaque?: string; ini: number; fim: number}
	| {tipo: 'marca'; texto: string; destaque: string; ini: number; fim: number}
	| {tipo: 'pergunta'; texto: string; ini: number; fim: number}
	| {tipo: 'cards'; itens: {texto: string; emoji?: string; em: number}[]; riscar?: boolean; ini: number; fim: number};

export type Sfx = {arquivo: string; em: number; volume?: number};

export type ReelDados = {
	titulo: string;
	fonte: string | null; // "<slug>/..." (vídeo SDR do bruto inteiro; scripts/preparar.sh <slug> liga a pasta); null = fundo liso
	fontePrevia?: string; // versão leve (ex.: 1080p) usada só no Studio; o render usa sempre `fonte`
	close?: {escala: number; focoX: number; focoY: number}; // focoX/focoY em 0–1 (onde fica o rosto)
	cortes: Corte[];
	palavras: Palavra[];
	textos: Texto[];
	punch?: number[]; // momentos (s do bruto) de punch-in rápido
	sfx?: Sfx[];
	musica?: {arquivo: string; volume: number} | null;
	legendaTopo?: number; // y (px) da legenda; padrão 1360. Desça (até ~1560) se o rosto estiver baixo no quadro
	guias?: boolean; // mostra as zonas seguras (só para conferir no Studio)
};
