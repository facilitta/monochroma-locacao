"use client";

import { Button } from "@/componentes/ui/button";
import { Icon, type CarbonIcon } from "@/componentes/ui/icon";
import { Skeleton } from "@/componentes/ui/skeleton";
import { Spinner } from "@/componentes/ui/spinner";
import { Link } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { dinheiro, iniciais as iniciaisDe, mmss } from "@/lib/formatos";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import Renew from "@carbon/icons-react/es/Renew";
import WifiOff from "@carbon/icons-react/es/WifiOff";
import type * as React from "react";
import { useEffect, useRef } from "react";

/* ---------- Página ---------- */

export function Pagina({
	children,
	className,
	larga = false,
	contida = false,
}: {
	children: React.ReactNode;
	className?: string;
	larga?: boolean;
	contida?: boolean;
}) {
	return (
		<main
			id="conteudo"
			data-slot="pagina"
			className={cn(
				"flex min-w-0 flex-1 flex-col px-4 pt-4 pb-6 md:px-6 md:pt-6",
				contida ? "min-h-0 overflow-hidden" : "overflow-y-auto",
			)}
		>
			<div
				className={cn(
					"mx-auto flex w-full min-w-0 flex-1 flex-col gap-6",
					larga ? "max-w-none" : "max-w-pagina",
					contida && "min-h-0",
					className,
				)}
			>
				{children}
			</div>
		</main>
	);
}

export function CabecalhoPagina({
	titulo,
	descricao,
	acoes,
	antes,
}: {
	titulo: React.ReactNode;
	descricao?: React.ReactNode;
	acoes?: React.ReactNode;
	antes?: React.ReactNode;
}) {
	return (
		<header data-slot="cabecalho-pagina" className="flex flex-col gap-3">
			{antes}
			<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div className="flex min-w-0 flex-col gap-1">
					<h1 className="min-w-0 text-balance font-medium text-2xl tracking-tight md:text-3xl">{titulo}</h1>
					{descricao ? <p className="text-balance text-muted-foreground text-sm">{descricao}</p> : null}
				</div>
				{acoes ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{acoes}</div> : null}
			</div>
		</header>
	);
}

/* ---------- Cartão com título fora da caixa ---------- */

export function Cartao({
	titulo,
	descricao,
	acao,
	children,
	className,
	corpoClassName,
	semMoldura = false,
	id,
}: {
	titulo?: React.ReactNode;
	descricao?: React.ReactNode;
	acao?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	corpoClassName?: string;
	semMoldura?: boolean;
	id?: string;
}) {
	return (
		<section data-slot="cartao" id={id} className={cn("flex min-w-0 flex-col gap-2", className)}>
			{titulo || acao ? (
				<div className="flex min-h-7 items-end justify-between gap-3">
					<div className="flex min-w-0 flex-col">
						{titulo ? <h2 className="truncate font-medium text-sm">{titulo}</h2> : null}
						{descricao ? <p className="text-muted-foreground text-xs">{descricao}</p> : null}
					</div>
					{acao ? <div className="flex shrink-0 items-center gap-2">{acao}</div> : null}
				</div>
			) : null}
			<div className={cn(!semMoldura && "rounded-lg border bg-card", "min-w-0", corpoClassName)}>{children}</div>
		</section>
	);
}

export function TituloSecao({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<h3 className={cn("font-medium text-muted-foreground text-xs uppercase tracking-wider", className)}>{children}</h3>
	);
}

export function TituloGrupo({ children, className }: { children: React.ReactNode; className?: string }) {
	return <h4 className={cn("font-medium text-2xs text-muted-foreground uppercase tracking-wider", className)}>{children}</h4>;
}

/* ---------- Bloco de 4 números ---------- */

export type Numero = {
	rotulo: string;
	valor: React.ReactNode;
	detalhe?: React.ReactNode;
	href?: string;
	variacao?: { texto: string; direcao: "sobe" | "desce" | "igual"; bom?: boolean };
};

export function BlocoNumeros({ itens, className }: { itens: Numero[]; className?: string }) {
	return (
		<div
			data-slot="bloco-numeros"
			className={cn(
				"grid grid-cols-2 overflow-hidden rounded-lg border bg-card lg:grid-cols-4",
				"[&>*]:border-border [&>*:nth-child(odd)]:border-r lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0 [&>*:nth-child(-n+2)]:border-b lg:[&>*]:border-b-0",
				className,
			)}
		>
			{itens.map((n) => {
				const conteudo = (
					<>
						<span className="truncate text-muted-foreground text-xs">{n.rotulo}</span>
						<span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
							<span className="font-medium text-xl tabular-nums tracking-tight">{n.valor}</span>
							{n.variacao ? (
								<span
									className={cn(
										"inline-flex items-baseline gap-0.5 text-xs font-medium tabular-nums",
										n.variacao.direcao === "igual"
											? "text-muted-foreground"
											: (n.variacao.bom ?? n.variacao.direcao === "sobe")
												? "text-ok"
												: "text-erro",
									)}
								>
									<span aria-hidden>{n.variacao.direcao === "sobe" ? "↑" : n.variacao.direcao === "desce" ? "↓" : "→"}</span>
									{n.variacao.texto}
								</span>
							) : null}
						</span>
						{n.detalhe ? <span className="truncate text-muted-foreground text-xs">{n.detalhe}</span> : null}
					</>
				);
				return n.href ? (
					<Link
						key={n.rotulo}
						href={n.href}
						data-alvo
						className="flex min-w-0 flex-col gap-1 p-4 transition-colors hover:bg-muted focus-visible:bg-muted"
					>
						{conteudo}
					</Link>
				) : (
					<div key={n.rotulo} className="flex min-w-0 flex-col gap-1 p-4">
						{conteudo}
					</div>
				);
			})}
		</div>
	);
}

/* ---------- Estados: vazio, erro, carregando ---------- */

export function EstadoVazio({
	icone,
	titulo,
	descricao,
	acao,
	className,
}: {
	icone: CarbonIcon;
	titulo: string;
	descricao: React.ReactNode;
	acao?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="estado-vazio"
			className={cn("flex w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center", className)}
		>
			<span className="flex size-8 items-center justify-center rounded-md bg-muted text-foreground">
				<Icon icon={icone} className="size-4" />
			</span>
			<div className="flex max-w-sm flex-col gap-1">
				<p className="font-medium text-sm">{titulo}</p>
				<p className="text-balance text-muted-foreground text-xs/5">{descricao}</p>
			</div>
			{acao}
		</div>
	);
}

export function EstadoErro({ frase, aoTentar, className }: { frase: string; aoTentar?: () => void; className?: string }) {
	return (
		<div role="alert" className={cn("flex flex-col items-center gap-3 px-6 py-8 text-center", className)}>
			<p className="text-sm">{frase}</p>
			<Button variant="outline" size="sm" onClick={aoTentar}>
				<Icon icon={Renew} data-icon="inline-start" />
				Tentar de novo
			</Button>
		</div>
	);
}

export function EsqueletoLinhas({ linhas = 8, className }: { linhas?: number; className?: string }) {
	return (
		<div aria-busy="true" className={cn("flex flex-col gap-2", className)}>
			<span className="sr-only">Carregando</span>
			{Array.from({ length: linhas }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: esqueleto sem identidade
				<Skeleton key={i} className="h-10 w-full rounded-md" />
			))}
		</div>
	);
}

export function Carregando({ rotulo = "Carregando" }: { rotulo?: string }) {
	return (
		<div className="flex items-center justify-center py-10 text-muted-foreground">
			<Spinner rotulo={rotulo} />
		</div>
	);
}

export function FaixaSemInternet({ hora }: { hora: string }) {
	return (
		<div
			role="status"
			className="sticky top-0 z-40 flex items-center gap-2 border-atencao-borda border-b bg-atencao-fundo px-4 py-2 text-atencao text-xs"
		>
			<Icon icon={WifiOff} className="size-4" />
			<span>Sem internet. Mostrando o que foi carregado às {hora}.</span>
		</div>
	);
}

/* ---------- Fotos e códigos ---------- */

export function FotoCliente({ nome, tamanho = 20, className }: { nome: string; tamanho?: 16 | 20 | 24 | 32 | 40 | 48; className?: string }) {
	const medida: Record<number, string> = {
		16: "size-4 text-[8px]",
		20: "size-5 text-[9px]",
		24: "size-6 text-2xs",
		32: "size-8 text-xs",
		40: "size-10 text-sm",
		48: "size-12 text-base",
	};
	return (
		<span
			aria-hidden
			className={cn(
				"inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
				medida[tamanho],
				className,
			)}
		>
			{iniciaisDe(nome)}
		</span>
	);
}

export function FotoEquipamento({ nome, tamanho = 32, className }: { nome: string; tamanho?: 16 | 20 | 24 | 32 | 40 | 48; className?: string }) {
	const medida: Record<number, string> = {
		16: "size-4 text-[8px]",
		20: "size-5 text-[9px]",
		24: "size-6 text-2xs",
		32: "size-8 text-xs",
		40: "size-10 text-sm",
		48: "size-12 text-base",
	};
	return (
		<span
			aria-hidden
			className={cn(
				"inline-flex shrink-0 items-center justify-center rounded-md border bg-muted font-medium text-muted-foreground",
				medida[tamanho],
				className,
			)}
		>
			{iniciaisDe(nome)}
		</span>
	);
}

export function Codigo({ children, className }: { children: React.ReactNode; className?: string }) {
	return <span className={cn("font-mono text-xs tabular-nums", className)}>{children}</span>;
}

/* ---------- Dinheiro: some para quem não vê o financeiro ---------- */

export function Dinheiro({ valor, className }: { valor: number; className?: string }) {
	const { podeVerFinanceiro } = usePapel();
	if (!podeVerFinanceiro) return null;
	return <span className={cn("tabular-nums", className)}>{dinheiro(valor)}</span>;
}

/* ---------- Contador regressivo da pré-reserva ---------- */

export function ContadorRegressivo({
	expiraEm,
	totalMs = 20 * 60_000,
	aoExpirar,
	barra = true,
	className,
}: {
	expiraEm: Date;
	totalMs?: number;
	aoExpirar?: () => void;
	barra?: boolean;
	className?: string;
}) {
	const agora = useAgora(1000);
	const resta = expiraEm.getTime() - agora.getTime();
	const avisou = useRef(false);
	useEffect(() => {
		if (resta <= 0 && !avisou.current) {
			avisou.current = true;
			aoExpirar?.();
		}
	}, [resta, aoExpirar]);
	if (resta <= 0) {
		return <span className={cn("text-muted-foreground text-xs", className)}>Expirou</span>;
	}
	const fracao = Math.max(0, Math.min(1, resta / totalMs));
	return (
		<span data-slot="contador" className={cn("inline-flex min-w-0 items-center gap-2", className)}>
			<span className="font-mono text-xs tabular-nums" aria-label={`expira em ${mmss(resta)}`}>
				◷ {mmss(resta)}
			</span>
			{barra ? (
				<span aria-hidden className="relative h-1 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
					<span
						className="absolute inset-y-0 left-0 bg-etapa-pre-reserva transition-[width] duration-1000 ease-linear"
						style={{ width: `${fracao * 100}%` }}
					/>
				</span>
			) : null}
		</span>
	);
}

/* ---------- Valor preenchido pelo robô ---------- */

export function ValorDoRobo({ children, origem }: { children: React.ReactNode; origem: string }) {
	return (
		<span
			title={origem}
			data-origem="robo"
			className="underline decoration-dotted decoration-muted-foreground underline-offset-4"
		>
			{children}
			<span className="sr-only"> ({origem})</span>
		</span>
	);
}
