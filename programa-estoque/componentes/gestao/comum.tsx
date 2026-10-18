"use client";

import { Button } from "@/componentes/ui/button";
import { Switch } from "@/componentes/ui/switch";
import { cn } from "@/lib/utils";
import type * as React from "react";

/** Interruptor com área de toque de 44 px no celular (seção 8.7). */
export function Interruptor({
	ligado,
	aoMudar,
	rotulo,
	desligado = false,
	className,
}: {
	ligado: boolean;
	aoMudar: (v: boolean) => void;
	rotulo: string;
	desligado?: boolean;
	className?: string;
}) {
	return (
		<span
			data-slot="switch-alvo"
			className={cn("inline-flex shrink-0 items-center justify-center", className)}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
		>
			<Switch checked={ligado} onCheckedChange={aoMudar} aria-label={rotulo} disabled={desligado} />
		</span>
	);
}

/** Barra flutuante "Alterações não salvas", presa ao fim da área que rola. */
export function BarraAlteracoes({
	aberta,
	aoDescartar,
	aoSalvar,
	desligado = false,
}: {
	aberta: boolean;
	aoDescartar: () => void;
	aoSalvar: () => void;
	desligado?: boolean;
}) {
	if (!aberta) return null;
	return (
		<div className="pointer-events-none sticky bottom-4 z-30 flex justify-center">
			<div
				role="status"
				className="pointer-events-auto flex w-full max-w-2xl items-center gap-4 rounded-lg border bg-popover px-4 py-3 text-popover-foreground shadow-lg"
			>
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium text-sm">Alterações não salvas</p>
					<p className="truncate text-muted-foreground text-xs">
						{desligado ? "Volta quando a internet voltar." : "Salve para valer em todo o app."}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button variant="outline" size="sm" onClick={aoDescartar}>
						Descartar
					</Button>
					<Button size="sm" onClick={aoSalvar} disabled={desligado}>
						Salvar
					</Button>
				</div>
			</div>
		</div>
	);
}

export function Definir({ children }: { children?: React.ReactNode }) {
	return (
		<span className="inline-flex items-center rounded-sm border border-dashed border-atencao-borda bg-atencao-fundo px-1.5 font-mono text-2xs text-atencao">
			A DEFINIR{children ? `: ${children}` : ""}
		</span>
	);
}
