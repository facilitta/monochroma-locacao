"use client";
// Linha do tempo única das fichas: eventos agrupados por dia; automáticos e do robô ficam recolhidos.

import Bot from "@carbon/icons-react/es/Bot";
import ChevronDown from "@carbon/icons-react/es/ChevronDown";
import Settings from "@carbon/icons-react/es/Settings";
import UserAvatar from "@carbon/icons-react/es/UserAvatar";
import { Icon, type CarbonIcon } from "@/componentes/ui/icon";
import { TituloGrupo } from "@/componentes/ui/basicos";
import { data, diaSemanaLongo, horaRelogio, mesmoDia } from "@/lib/formatos";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

export type EventoLinha = {
	id: string;
	em: Date;
	texto: ReactNode;
	ator: "dono" | "balcao" | "robo" | "automacao" | "integracao" | "cliente";
	quem?: string;
	icone?: CarbonIcon;
};

const ICONE_ATOR: Record<EventoLinha["ator"], CarbonIcon> = {
	dono: UserAvatar,
	balcao: UserAvatar,
	cliente: UserAvatar,
	robo: Bot,
	automacao: Settings,
	integracao: Settings,
};

function Grupo({ eventos }: { eventos: EventoLinha[] }) {
	const [abertos, setAbertos] = useState<Set<number>>(new Set());
	const blocos: (EventoLinha | { automaticos: EventoLinha[]; chave: number })[] = [];
	let i = 0;
	for (const e of eventos) {
		const auto = e.ator === "robo" || e.ator === "automacao" || e.ator === "integracao";
		const ultimo = blocos[blocos.length - 1];
		if (auto && ultimo && "automaticos" in ultimo) ultimo.automaticos.push(e);
		else if (auto) blocos.push({ automaticos: [e], chave: i++ });
		else blocos.push(e);
	}
	return (
		<ol className="flex flex-col">
			{blocos.map((b) => {
				if ("automaticos" in b) {
					const aberto = abertos.has(b.chave);
					return (
						<li key={`a${b.chave}`} className="flex flex-col">
							<button
								type="button"
								onClick={() =>
									setAbertos((s) => {
										const n = new Set(s);
										if (n.has(b.chave)) n.delete(b.chave);
										else n.add(b.chave);
										return n;
									})
								}
								aria-expanded={aberto}
								className="flex items-center gap-2 py-1.5 text-muted-foreground text-xs hover:text-foreground"
							>
								<Icon icon={Settings} className="size-3.5" />
								{b.automaticos.length === 1 ? "1 evento automático" : `${b.automaticos.length} eventos automáticos`}
								<Icon icon={ChevronDown} className={cn("size-3 transition-transform", aberto && "rotate-180")} />
							</button>
							{aberto ? b.automaticos.map((e) => <Linha key={e.id} e={e} />) : null}
						</li>
					);
				}
				return <Linha key={b.id} e={b} />;
			})}
		</ol>
	);
}

function Linha({ e }: { e: EventoLinha }) {
	return (
		<li className="flex items-start gap-3 py-1.5">
			<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<Icon icon={e.icone ?? ICONE_ATOR[e.ator]} className="size-3" />
			</span>
			<div className="min-w-0 flex-1 text-xs/5">
				<span>{e.texto}</span>
				<span className="ml-2 text-muted-foreground tabular-nums">
					{horaRelogio(e.em)}
					{e.quem ? ` · ${e.quem}` : ""}
				</span>
			</div>
		</li>
	);
}

export function LinhaDoTempo({ eventos, className }: { eventos: EventoLinha[]; className?: string }) {
	const agora = useAgora(60_000);
	const ordenados = [...eventos].sort((a, b) => b.em.getTime() - a.em.getTime());
	const dias: { chave: string; rotulo: string; eventos: EventoLinha[] }[] = [];
	for (const e of ordenados) {
		const chave = data(e.em);
		let d = dias.find((x) => x.chave === chave);
		if (!d) {
			const ontem = new Date(agora.getTime() - 86_400_000);
			const rotulo = mesmoDia(e.em, agora) ? "Hoje" : mesmoDia(e.em, ontem) ? "Ontem" : `${diaSemanaLongo(e.em)}, ${chave}`;
			d = { chave, rotulo, eventos: [] };
			dias.push(d);
		}
		d.eventos.push(e);
	}
	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{dias.map((d) => (
				<div key={d.chave} className="flex flex-col gap-1">
					<TituloGrupo>{d.rotulo}</TituloGrupo>
					<Grupo eventos={d.eventos} />
				</div>
			))}
		</div>
	);
}
