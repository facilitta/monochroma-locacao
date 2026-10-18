"use client";
// Régua de etapas (adaptado de trycompai/crm stage-stepper, MIT): segmentos com traço de 2 px em cima,
// as alcançadas escuras e a atual em negrito.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Regua<T extends string>({
	passos,
	atual,
	rotulo,
	aoEscolher,
	className,
}: {
	passos: readonly T[];
	atual: T | null;
	rotulo: (p: T) => ReactNode;
	aoEscolher?: (p: T) => void;
	className?: string;
}) {
	const indice = atual ? passos.indexOf(atual) : -1;
	return (
		<ol tabIndex={0} aria-label="Etapas" className={cn("flex w-full gap-1 overflow-x-auto", className)}>
			{passos.map((p, i) => {
				const alcancada = i <= indice;
				const corrente = p === atual;
				const conteudo = <span className="block truncate">{rotulo(p)}</span>;
				const classe = cn(
					"min-w-16 flex-1 border-t-2 pt-2 text-left text-xs transition-colors",
					alcancada ? "border-foreground text-foreground" : "border-border text-muted-foreground",
					corrente && "font-semibold",
				);
				return (
					<li key={p} className="flex min-w-16 flex-1" aria-current={corrente ? "step" : undefined}>
						{aoEscolher ? (
							<button type="button" className={cn(classe, "hover:text-foreground")} onClick={() => aoEscolher(p)}>
								{conteudo}
							</button>
						) : (
							<div className={classe}>{conteudo}</div>
						)}
					</li>
				);
			})}
		</ol>
	);
}
