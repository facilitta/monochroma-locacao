"use client";
// /prototipo/linguagem-visual: os três grupos de cor lado a lado, em cor e em escala de cinza,
// mais tokens, botões, tipografia, raios e sombras (seções 8.2 a 8.4).

import Add from "@carbon/icons-react/es/Add";
import TrashCan from "@carbon/icons-react/es/TrashCan";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Cartao, Pagina, TituloSecao } from "@/componentes/ui/basicos";
import { Icon } from "@/componentes/ui/icon";
import { MarcaMonochroma } from "@/componentes/ui/logo";
import { EtapaRotulo, PilulaUnidade, PontoSituacao, Selo } from "@/componentes/ui/marcadores";
import { ETAPAS, ORDEM_DAS_ETAPAS } from "@/lib/regras/etapas";
import { TONS, type Tom } from "@/lib/regras/situacao";
import { ESTADOS_UNIDADE, ORDEM_DOS_ESTADOS } from "@/lib/regras/unidades";
import { cn } from "@/lib/utils";

const DETALHE_UNIDADE: Partial<Record<keyof typeof ESTADOS_UNIDADE, string>> = {
	pre_reservada: "14 min",
	na_rua: "volta dom 18h",
	pendente: "falta 1",
	conferencia: "até 21:30",
	reparo: "há 6 dias",
};

const FRASE_TOM: Record<Tom, string> = {
	ok: "Aluguel pago",
	atencao: "Caução: aguardando",
	info: "Caução a devolver",
	erro: "Atrasada há 1 h",
	neutro: "Caução devolvida",
};

function Grupos() {
	return (
		<div className="grid gap-6 lg:grid-cols-3">
			<section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
				<TituloSecao>Etapa da reserva</TituloSecao>
				<p className="text-muted-foreground text-xs">Ponto quadrado de 6 px e o nome. Na agenda, a barra; na régua, a faixa de 2 px.</p>
				<ul className="flex flex-col gap-2">
					{ORDEM_DAS_ETAPAS.map((e) => (
						<li key={e} className="flex items-center gap-3">
							<EtapaRotulo etapa={e} className="w-28" />
							<span aria-hidden className={cn("h-6 flex-1 rounded-sm", ETAPAS[e].barra)} />
							<span aria-hidden className={cn("h-0.5 w-10", ETAPAS[e].faixa)} />
						</li>
					))}
				</ul>
			</section>
			<section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
				<TituloSecao>Situação</TituloSecao>
				<p className="text-muted-foreground text-xs">Selo tingido com ícone à esquerda e texto. Ponto com brilho para listas.</p>
				<ul className="flex flex-col gap-2">
					{(Object.keys(TONS) as Tom[]).map((t) => (
						<li key={t} className="flex flex-wrap items-center gap-3">
							<Selo tom={t}>{FRASE_TOM[t]}</Selo>
							<PontoSituacao tom={t}>{TONS[t].nome}</PontoSituacao>
						</li>
					))}
					<li>
						<PontoSituacao tom="info" andamento>
							Robô respondendo
						</PontoSituacao>
					</li>
				</ul>
			</section>
			<section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
				<TituloSecao>Estado da unidade</TituloSecao>
				<p className="text-muted-foreground text-xs">Pílula com contorno, ícone próprio e padrão de preenchimento.</p>
				<ul className="flex flex-col gap-2">
					{ORDEM_DOS_ESTADOS.map((e) => (
						<li key={e} className="flex flex-wrap items-center gap-3">
							<PilulaUnidade estado={e} detalhe={DETALHE_UNIDADE[e]} />
							<span className="text-muted-foreground text-2xs">{ESTADOS_UNIDADE[e].padrao}</span>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}

const TOKENS: { nome: string; classe: string; uso: string }[] = [
	{ nome: "Fundo", classe: "bg-background", uso: "página" },
	{ nome: "Cartão", classe: "bg-card", uso: "cartões e menus" },
	{ nome: "Cinza de fundo", classe: "bg-muted", uso: "cabeçalho de tabela, selecionado" },
	{ nome: "Realce", classe: "bg-accent", uso: "passar o mouse" },
	{ nome: "Borda", classe: "bg-border", uso: "toda separação" },
	{ nome: "Texto", classe: "bg-foreground", uso: "texto principal" },
	{ nome: "Texto secundário", classe: "bg-muted-foreground", uso: "descrições" },
	{ nome: "Destaque", classe: "bg-primary", uso: "ação principal (magenta do logo)" },
	{ nome: "Foco e links", classe: "bg-ring", uso: "anel de foco, links" },
	{ nome: "Perigo", classe: "bg-destructive", uso: "o que não se desfaz" },
	{ nome: "Véu", classe: "bg-overlay", uso: "atrás da ficha" },
	{ nome: "Gráfico 1–5", classe: "bg-chart-1", uso: "séries de gráfico" },
];

export function TelaLinguagemVisual() {
	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Linguagem visual"
				descricao="Os três grupos de cor nunca se misturam e cada um tem forma própria. Abaixo, em cor e em escala de cinza: tudo continua distinguível pela forma, pelo ícone e pelo texto."
			/>
			<Cartao titulo="Destaque da Monochroma" descricao="O magenta da bolinha do logo vira a cor de ação. Preto, branco e cinzas continuam neutros, como no logo." corpoClassName="p-4">
				<div className="flex flex-wrap items-center gap-4">
					<MarcaMonochroma />
					<span aria-hidden className="size-10 rounded-lg bg-primary" />
					<Button>
						<Icon icon={Add} data-icon="inline-start" />
						Nova reserva
					</Button>
					<a href="#grupos" className="text-link text-xs underline-offset-4 hover:underline">
						Exemplo de link
					</a>
				</div>
				<p className="pt-3 text-muted-foreground text-xs">
					Atenção: o estado de unidade “Na rua” usa um rosa definido no prompt, parecido com o destaque. A forma é diferente (botão cheio × pílula com contorno e ícone de caminhão). Se confundir, troca-se a cor de “Na rua”.
				</p>
			</Cartao>

			<section id="grupos" className="flex flex-col gap-3">
				<h2 className="font-medium text-sm">Em cor</h2>
				<Grupos />
			</section>
			<section className="flex flex-col gap-3">
				<h2 className="font-medium text-sm">Em escala de cinza</h2>
				<div className="escala-de-cinza" data-escala-de-cinza>
					<Grupos />
				</div>
			</section>

			<Cartao titulo="Tokens" descricao="Variáveis em app/globals.css, uma versão para o tema claro e outra para o escuro. Nenhuma tela usa cor fora daqui." corpoClassName="p-4">
				<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{TOKENS.map((t) => (
						<li key={t.nome} className="flex items-center gap-3">
							<span aria-hidden className={cn("size-8 shrink-0 rounded-md border", t.classe)} />
							<span className="flex min-w-0 flex-col">
								<span className="font-medium text-xs">{t.nome}</span>
								<span className="truncate text-muted-foreground text-2xs">{t.uso}</span>
							</span>
						</li>
					))}
				</ul>
				<div className="mt-4 flex gap-1" aria-hidden>
					<span className="h-3 flex-1 rounded-sm bg-chart-1" />
					<span className="h-3 flex-1 rounded-sm bg-chart-2" />
					<span className="h-3 flex-1 rounded-sm bg-chart-3" />
					<span className="h-3 flex-1 rounded-sm bg-chart-4" />
					<span className="h-3 flex-1 rounded-sm bg-chart-5" />
				</div>
			</Cartao>

			<Cartao titulo="Botões" descricao="Só dois são cheios: destaque, para a ação principal (no máximo um por área), e perigo, para o que não se desfaz. Nunca botão preto." corpoClassName="flex flex-col gap-4 p-4">
				<div className="flex flex-wrap items-center gap-2">
					<Button>Principal</Button>
					<Button variant="outline">Com borda</Button>
					<Button variant="secondary">Secundário</Button>
					<Button variant="ghost">Sem borda</Button>
					<Button variant="destructive">
						<Icon icon={TrashCan} data-icon="inline-start" />
						Apagar para sempre
					</Button>
					<Button variant="link">Link</Button>
				</div>
				<div className="flex flex-wrap items-end gap-2">
					<Button variant="outline" size="xs">
						24 px
					</Button>
					<Button variant="outline" size="sm">
						28 px
					</Button>
					<Button variant="outline">32 px</Button>
					<Button variant="outline" size="lg">
						36 px
					</Button>
					<Button variant="outline" size="xl">
						40 px
					</Button>
					<Button variant="outline" size="touch">48 px · balcão</Button>
				</div>
			</Cartao>

			<div className="grid gap-6 lg:grid-cols-2">
				<Cartao titulo="Tipografia" descricao="Geist para textos; Geist Mono para etiqueta, nº de série, códigos e contadores." corpoClassName="flex flex-col gap-2 p-4">
					<span className="font-medium text-3xl tracking-tight">Título de página · 30 px</span>
					<span className="font-medium text-2xl tracking-tight">Título no celular · 24 px</span>
					<span className="font-medium text-lg">Título da ficha · 18 px</span>
					<span className="text-sm">Títulos de cartão e descrições · 14 px</span>
					<span className="text-xs">Interface · 12 px</span>
					<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Seção da ficha · 12 px</span>
					<span className="font-medium text-2xs text-muted-foreground uppercase tracking-wider">Grupo de lista · 11 px</span>
					<span className="font-mono text-sm tabular-nums">EQ-1A2B3C4D · nº 4021 · 12:41</span>
					<span className="text-base">No celular e no balcão · 16 px</span>
				</Cartao>
				<Cartao titulo="Cantos e sombras" descricao="Só estes raios e só sombra no que flutua." corpoClassName="flex flex-col gap-4 p-4">
					<div className="flex flex-wrap items-end gap-4 text-2xs text-muted-foreground">
						<span className="flex flex-col items-center gap-1">
							<span className="size-12 rounded-sm border bg-muted" />4 px · controles mínimos
						</span>
						<span className="flex flex-col items-center gap-1">
							<span className="size-12 rounded-md border bg-muted" />5 px · botões e campos
						</span>
						<span className="flex flex-col items-center gap-1">
							<span className="size-12 rounded-lg border bg-muted" />8 px · cartões e janelas
						</span>
						<span className="flex flex-col items-center gap-1">
							<span className="h-6 w-16 rounded-full border bg-muted" />pílula · selos
						</span>
					</div>
					<div className="flex flex-wrap items-end gap-4 text-2xs text-muted-foreground">
						<span className="flex flex-col items-center gap-1">
							<span className="size-12 rounded-md border bg-card shadow-xs" />botão
						</span>
						<span className="flex flex-col items-center gap-1">
							<span className="size-12 rounded-lg border bg-card shadow-md" />menu
						</span>
						<span className="flex flex-col items-center gap-1">
							<span className="size-12 rounded-lg border bg-card shadow-lg" />ficha e cartão arrastado
						</span>
					</div>
				</Cartao>
			</div>
		</Pagina>
	);
}
