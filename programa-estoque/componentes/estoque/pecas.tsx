"use client";
// Peças visuais do estoque: barra de uso, célula de equipamento, selos de acessório e "Livre entre".

import { CampoData } from "@/componentes/ui/campo-data";
import Calendar from "@carbon/icons-react/es/Calendar";
import Close from "@carbon/icons-react/es/Close";
import { Badge } from "@/componentes/ui/badge";
import { FotoEquipamento } from "@/componentes/ui/basicos";
import { Button } from "@/componentes/ui/button";
import { Icon } from "@/componentes/ui/icon";
import { Label } from "@/componentes/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/componentes/ui/popover";
import { dataCurta, porcento } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function BarraUso({ fracao, className }: { fracao: number; className?: string }) {
	const pct = Math.round(fracao * 100);
	return (
		<span className={cn("inline-flex w-full min-w-0 items-center gap-2", className)} title={`Usado em ${pct}% dos dias dos últimos 90`}>
			<span aria-hidden className="relative h-1.5 w-full max-w-20 overflow-hidden rounded-full bg-muted">
				<span className="absolute inset-y-0 left-0 rounded-full bg-chart-1" style={{ width: `${pct}%` }} />
			</span>
			<span className="shrink-0 text-xs tabular-nums">{porcento(fracao)}</span>
		</span>
	);
}

export function SelosAcessorio({ basico, extra }: { basico: boolean; extra: boolean }) {
	if (!basico && !extra) return null;
	return (
		<span className="inline-flex gap-1">
			{basico ? (
				<Badge variant="outline" className="h-4 px-1.5 text-2xs">
					Pacote básico
				</Badge>
			) : null}
			{extra ? (
				<Badge variant="outline" className="h-4 px-1.5 text-2xs">
					Extra
				</Badge>
			) : null}
		</span>
	);
}

export function CelulaEquipamento({
	nome,
	detalhe,
	tamanho = 32,
	aoAbrir,
	extra,
}: {
	nome: string;
	detalhe: string;
	tamanho?: 32 | 40 | 48;
	aoAbrir?: () => void;
	extra?: React.ReactNode;
}) {
	return (
		<span className="flex min-w-0 items-center gap-2.5">
			<FotoEquipamento nome={nome} tamanho={tamanho} />
			<span className="flex min-w-0 flex-col">
				{aoAbrir ? (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							aoAbrir();
						}}
						className="w-fit max-w-full truncate text-left font-medium hover:underline"
					>
						{nome}
					</button>
				) : (
					<span className="truncate font-medium">{nome}</span>
				)}
				<span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
					<span className="truncate">{detalhe}</span>
					{extra}
				</span>
			</span>
		</span>
	);
}

/** Converte "2026-10-17" para a data local no horário dado. */
export function dataLocal(valor: string, horaLocal: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
	const d = new Date(`${valor}T${horaLocal}:00-03:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}

export function FiltroLivreEntre({
	de,
	ate,
	aoAplicar,
	desligado,
}: {
	de: string | null;
	ate: string | null;
	aoAplicar: (de: string | null, ate: string | null) => void;
	desligado?: boolean;
}) {
	const [aberto, setAberto] = useState(false);
	const [rDe, setRDe] = useState(de ?? "2026-10-17");
	const [rAte, setRAte] = useState(ate ?? "2026-10-18");
	const ativo = !!de && !!ate;
	const inicio = de ? dataLocal(de, "09:00") : null;
	const fim = ate ? dataLocal(ate, "18:00") : null;
	return (
		<Popover open={aberto} onOpenChange={setAberto}>
			<PopoverTrigger asChild>
				<Button
					variant={ativo ? "secondary" : "outline"}
					size="sm"
					disabled={desligado}
					title={desligado ? "Volta quando a internet voltar" : undefined}
					className="justify-start sm:justify-center"
				>
					<Icon icon={Calendar} data-icon="inline-start" />
					{ativo && inicio && fim ? `Livre de ${dataCurta(inicio)} a ${dataCurta(fim)}` : "Livre entre…"}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-72">
				<form
					className="flex flex-col gap-3"
					onSubmit={(e) => {
						e.preventDefault();
						if (rDe && rAte && rAte >= rDe) {
							aoAplicar(rDe, rAte);
							setAberto(false);
						}
					}}
				>
					<p className="text-muted-foreground text-xs">Mostra só o que tem unidade livre no período, já contando a folga de conferência.</p>
					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="livre-de">Retirada</Label>
							<CampoData semPassado id="livre-de" rotulo="Retirada" valor={rDe} aoMudar={setRDe} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="livre-ate">Devolução</Label>
							<CampoData semPassado id="livre-ate" rotulo="Devolução" valor={rAte} minimo={rDe} aoMudar={setRAte} />
						</div>
					</div>
					<div className="flex justify-between gap-2">
						{ativo ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => {
									aoAplicar(null, null);
									setAberto(false);
								}}
							>
								<Icon icon={Close} data-icon="inline-start" />
								Limpar
							</Button>
						) : (
							<span />
						)}
						<Button type="submit" size="sm">
							Ver o que está livre
						</Button>
					</div>
				</form>
			</PopoverContent>
		</Popover>
	);
}
