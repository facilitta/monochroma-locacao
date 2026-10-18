"use client";

// Os três grupos de cor, cada um com forma própria (seção 8.3):
// etapa = ponto quadrado de 6 px + nome; situação = selo tingido com ícone; estado da unidade = pílula com contorno.

import { Icon } from "@/componentes/ui/icon";
import { Spinner } from "@/componentes/ui/spinner";
import { ETAPAS, type Etapa } from "@/lib/regras/etapas";
import { TONS, type Tom } from "@/lib/regras/situacao";
import { ESTADOS_UNIDADE, type EstadoUnidade } from "@/lib/regras/unidades";
import type { CarbonIcon } from "@/componentes/ui/icon";
import { cn } from "@/lib/utils";
import type * as React from "react";

export function PontoEtapa({ etapa, className }: { etapa: Etapa; className?: string }) {
	return (
		<span
			aria-hidden
			data-etapa={etapa}
			className={cn("inline-block size-1.5 shrink-0", ETAPAS[etapa].ponto, className)}
		/>
	);
}

export function EtapaRotulo({
	etapa,
	className,
	sufixo,
}: {
	etapa: Etapa;
	className?: string;
	sufixo?: React.ReactNode;
}) {
	return (
		<span data-slot="etapa" className={cn("inline-flex min-w-0 items-center gap-2 text-xs text-foreground", className)}>
			<PontoEtapa etapa={etapa} />
			<span className="truncate">{ETAPAS[etapa].nome}</span>
			{sufixo ? <span className="text-muted-foreground tabular-nums">{sufixo}</span> : null}
		</span>
	);
}

export function Selo({
	tom,
	children,
	icone,
	className,
	tamanho = "padrao",
	title,
}: {
	tom: Tom;
	children: React.ReactNode;
	icone?: CarbonIcon;
	className?: string;
	tamanho?: "padrao" | "grande";
	title?: string;
}) {
	const def = TONS[tom];
	return (
		<span
			data-slot="selo"
			data-tom={tom}
			title={title}
			className={cn(
				"inline-flex w-fit max-w-full shrink-0 items-center gap-1 rounded-full px-2 font-medium whitespace-nowrap",
				tamanho === "grande" ? "h-7 text-sm" : "h-5 text-xs",
				def.fundo,
				def.texto,
				className,
			)}
		>
			<Icon icon={icone ?? def.icone} motion="none" className={cn("shrink-0", tamanho === "grande" ? "size-4" : "size-3")} />
			<span className="truncate">{children}</span>
		</span>
	);
}

export function PontoSituacao({
	tom,
	children,
	andamento = false,
	className,
}: {
	tom: Tom;
	children: React.ReactNode;
	andamento?: boolean;
	className?: string;
}) {
	return (
		<span data-slot="ponto-situacao" className={cn("inline-flex min-w-0 items-center gap-2 text-xs", className)}>
			{andamento ? (
				<Spinner size="sm" />
			) : (
				<span aria-hidden className={cn("inline-block size-1.5 shrink-0 shadow-brilho", TONS[tom].ponto)} />
			)}
			<span className={cn("truncate", tom === "neutro" ? "text-muted-foreground" : "text-foreground")}>{children}</span>
		</span>
	);
}

export function PilulaUnidade({
	estado,
	detalhe,
	className,
	compacta = false,
}: {
	estado: EstadoUnidade;
	detalhe?: React.ReactNode;
	className?: string;
	compacta?: boolean;
}) {
	const def = ESTADOS_UNIDADE[estado];
	return (
		<span
			data-slot="pilula-unidade"
			data-estado={estado}
			className={cn(
				"inline-flex w-fit max-w-full shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap",
				compacta ? "h-5" : "h-6",
				def.pilula,
				def.texto,
				className,
			)}
		>
			<Icon icon={def.icone} motion="none" className="size-3 shrink-0" />
			<span className={cn("truncate", estado === "baixada" && "line-through")}>{def.nome}</span>
			{detalhe ? <span className="truncate font-normal">· {detalhe}</span> : null}
		</span>
	);
}
