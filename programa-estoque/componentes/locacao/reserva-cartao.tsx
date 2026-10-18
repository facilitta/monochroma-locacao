"use client";
// Cartão da reserva no quadro e na lista do celular (seção 7.3), com o menu "Mover para…".

import ArrowsHorizontal from "@carbon/icons-react/es/ArrowsHorizontal";
import { Button } from "@/componentes/ui/button";
import { CartaoQuadro } from "@/componentes/quadro/quadro";
import { ContadorRegressivo, Dinheiro } from "@/componentes/ui/basicos";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import { Icon } from "@/componentes/ui/icon";
import { EtapaRotulo, Selo } from "@/componentes/ui/marcadores";
import { destinosPossiveis } from "@/componentes/locacao/reserva-mover";
import { ETAPAS, type Etapa } from "@/lib/regras/etapas";
import { usePapel } from "@/lib/papel";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { selosDaReserva, textoPeriodo } from "@/prototipo/consultas-reservas";
import { toast } from "sonner";

export function MenuMoverPara({
	reserva,
	aoMover,
	grande = false,
	desligado = false,
}: {
	reserva: D.Reserva;
	aoMover: (para: Etapa) => void;
	grande?: boolean;
	desligado?: boolean;
}) {
	const { ehDono } = usePapel();
	const destinos = destinosPossiveis(reserva.etapa, ehDono);
	const visiveis = ehDono ? destinos : destinos.filter((d) => d.tipo === "manual" && d.para === "separada");
	if (!ehDono && visiveis.length === 0) return null;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={grande ? "outline" : "ghost"}
					size={grande ? "default" : "icon-xs"}
					aria-label={`Mover a reserva ${reserva.id} para…`}
					disabled={desligado}
					title={desligado ? "Volta quando a internet voltar" : undefined}
					className={cn(grande && "w-full sm:w-auto")}
				>
					<Icon icon={ArrowsHorizontal} data-icon={grande ? "inline-start" : undefined} />
					{grande ? "Mover para…" : null}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-52">
				<DropdownMenuLabel>Mover para…</DropdownMenuLabel>
				{visiveis.map((d) => (
					<DropdownMenuItem
						key={d.para}
						disabled={d.tipo === "proibida"}
						onSelect={() => aoMover(d.para)}
					>
						<EtapaRotulo etapa={d.para} />
						{d.tipo === "outra-tela" ? <span className="ml-auto text-muted-foreground text-2xs">em outra tela</span> : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function CartaoReserva({
	reserva,
	agora,
	aoAbrir,
	aoMover,
	celular = false,
	desligado = false,
}: {
	reserva: D.Reserva;
	agora: Date;
	aoAbrir: () => void;
	aoMover: (para: Etapa) => void;
	celular?: boolean;
	desligado?: boolean;
}) {
	const { ehDono, podeVerFinanceiro } = usePapel();
	const c = Q.cliente(reserva.clienteId);
	const selos = selosDaReserva(reserva.id, agora, ehDono).filter((s) => podeVerFinanceiro || !s.financeiro);
	const preco = Q.precoDa(reserva.id);
	const pre = reserva.etapa === "pre_reserva" && reserva.expiraEm && reserva.expiraEm.getTime() > agora.getTime();
	return (
		<CartaoQuadro
			rotuloAbrir={`Abrir a reserva ${reserva.id} de ${c.nome}`}
			aoAbrir={aoAbrir}
			acao={celular ? undefined : <MenuMoverPara reserva={reserva} aoMover={aoMover} desligado={desligado} />}
			className={cn(celular && "p-4")}
		>
			<div className={cn("flex items-baseline justify-between gap-2", !celular && "pr-7")}>
				<span className="truncate font-medium">{c.tipo === "pj" ? Q.nomeCurtoCliente(c) : c.nome}</span>
				<span className="shrink-0 font-mono text-muted-foreground tabular-nums">{reserva.id}</span>
			</div>
			{celular ? <EtapaRotulo etapa={reserva.etapa} /> : null}
			<span className="text-muted-foreground">{textoPeriodo(reserva)}</span>
			{pre && reserva.expiraEm ? (
				<ContadorRegressivo
					expiraEm={reserva.expiraEm}
					aoExpirar={() => toast(`Reserva ${reserva.id} expirou`)}
				/>
			) : null}
			<span className="truncate">{Q.resumoItens(reserva.id)}</span>
			{selos.length || (podeVerFinanceiro && preco.valorAluguel > 0) || Q.ehSegundaChance(reserva.id) ? (
				<div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-0.5">
					<div className="flex min-w-0 flex-wrap gap-1">
						{Q.ehSegundaChance(reserva.id) && reserva.etapa === "pre_reserva" ? <Selo tom="info">2ª chance</Selo> : null}
						{selos.slice(0, 2).map((s) => (
							<Selo key={s.texto} tom={s.tom}>
								{s.texto}
							</Selo>
						))}
					</div>
					{podeVerFinanceiro ? <Dinheiro valor={preco.valorAluguel} className="ml-auto shrink-0 font-medium" /> : null}
				</div>
			) : null}
			{celular ? (
				<div className="pointer-events-auto pt-1">
					<MenuMoverPara reserva={reserva} aoMover={aoMover} grande desligado={desligado} />
				</div>
			) : null}
		</CartaoQuadro>
	);
}

export function nomeDaEtapa(e: Etapa) {
	return ETAPAS[e].nome;
}
