"use client";
// Peças da tela Manutenção (7.18) usadas também pela ficha: cartão, menu de situação e janelas de liberar e descartar.

import ArrowsHorizontal from "@carbon/icons-react/es/ArrowsHorizontal";
import { Button } from "@/componentes/ui/button";
import { CartaoQuadro } from "@/componentes/quadro/quadro";
import { Codigo, Dinheiro, FotoEquipamento } from "@/componentes/ui/basicos";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/componentes/ui/dropdown-menu";
import { Icon } from "@/componentes/ui/icon";
import { PontoSituacao, Selo } from "@/componentes/ui/marcadores";
import { useFicha } from "@/componentes/ui/ficha";
import { useConexao } from "@/lib/estado-prototipo";
import { usePapel } from "@/lib/papel";
import { dataCurta } from "@/lib/formatos";
import type { Tom } from "@/lib/regras/situacao";
import { cn } from "@/lib/utils";
import type * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { SITUACOES_MANUTENCAO, TIPOS_DANO, diasParada, moverManutencao, paradaHa, reservaFuturaDaUnidade } from "@/prototipo/consultas-reservas";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

export const TOM_SITUACAO: Record<D.SituacaoManutencao, Tom> = {
	aberta: "atencao",
	na_oficina: "info",
	esperando_peca: "atencao",
	pronta: "ok",
	liberada: "neutro",
	descartada: "neutro",
};

export function nomeSituacao(s: D.SituacaoManutencao) {
	return SITUACOES_MANUTENCAO.find((x) => x.id === s)?.nome ?? s;
}

type PedidoMover = { id: number; para: D.SituacaoManutencao } | null;

export function useMoverManutencao(agora: Date): { pedir: (id: number, para: D.SituacaoManutencao) => void; janela: ReactNode } {
	const [pedido, setPedido] = useState<PedidoMover>(null);
	const { offline } = useConexao();
	const pedir = (id: number, para: D.SituacaoManutencao) => {
		if (offline) {
			toast.error("Sem internet. Volta quando a internet voltar.");
			return;
		}
		const m = Q.manutencao(id);
		if (m.situacao === para) return;
		if (m.situacao === "liberada" || m.situacao === "descartada") {
			toast.error("Esta manutenção já foi encerrada.");
			return;
		}
		if (para === "liberada" || para === "descartada") {
			setPedido({ id, para });
			return;
		}
		const de = m.situacao;
		moverManutencao(id, para, agora);
		toast.success(`Manutenção ${id} em ${nomeSituacao(para)}`, {
			duration: 6000,
			action: { label: "Desfazer", onClick: () => moverManutencao(id, de, agora) },
		});
	};
	return { pedir, janela: <JanelaEncerrar pedido={pedido} aoFechar={() => setPedido(null)} agora={agora} /> };
}

function JanelaEncerrar({ pedido, aoFechar, agora }: { pedido: PedidoMover; aoFechar: () => void; agora: Date }) {
	const { abrir } = useFicha();
	if (!pedido) return null;
	const m = Q.manutencao(pedido.id);
	const u = Q.unidade(m.unidadeId);
	const falta = pedido.para === "liberada" && m.reservaOrigemId && !m.cobrancaDecididaEm;
	return (
		<Dialog open onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{falta ? "Falta isto" : pedido.para === "liberada" ? "Liberar para aluguel" : "Descartar a unidade"}</DialogTitle>
					<DialogDescription>
						{falta
							? `A peça voltou com dano da reserva ${m.reservaOrigemId}. Decida a cobrança antes de liberar.`
							: pedido.para === "liberada"
								? `${Q.equipamento(u.equipamentoId).nome} ${u.codigo} volta a ficar disponível na agenda.`
								: `Descartar leva à baixa de ${u.codigo}. A unidade some do estoque e não dá para desfazer.`}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={aoFechar}>
						{falta ? "Fechar" : "Cancelar"}
					</Button>
					{falta ? (
						<Button
							onClick={() => {
								aoFechar();
								abrir("manutencao", m.id);
							}}
						>
							Decidir cobrança
						</Button>
					) : pedido.para === "liberada" ? (
						<Button
							onClick={() => {
								moverManutencao(m.id, "liberada", agora);
								aoFechar();
								toast.success(`${u.codigo} liberada para aluguel`);
							}}
						>
							Liberar para aluguel
						</Button>
					) : (
						<Button
							variant="destructive"
							onClick={() => {
								moverManutencao(m.id, "descartada", agora);
								aoFechar();
								toast.success(`${u.codigo} descartada e baixada`);
							}}
						>
							Descartar
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function MenuSituacao({ m, aoMover, grande = false, rotuloAtual = false }: { m: D.Manutencao; aoMover: (para: D.SituacaoManutencao) => void; grande?: boolean; rotuloAtual?: boolean }) {
	const { offline } = useConexao();
	const encerrada = m.situacao === "liberada" || m.situacao === "descartada";
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={grande || rotuloAtual ? "outline" : "ghost"}
					size={grande ? "default" : rotuloAtual ? "sm" : "icon-xs"}
					disabled={offline || encerrada}
					title={offline ? "Volta quando a internet voltar" : undefined}
					aria-label={`Mover a manutenção ${m.id} para…`}
					className={cn(grande && "w-full")}
				>
					{rotuloAtual ? <PontoSituacao tom={TOM_SITUACAO[m.situacao]}>{nomeSituacao(m.situacao)}</PontoSituacao> : <Icon icon={ArrowsHorizontal} data-icon={grande ? "inline-start" : undefined} />}
					{grande ? "Mover para…" : null}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-48">
				<DropdownMenuLabel>Mover para…</DropdownMenuLabel>
				{SITUACOES_MANUTENCAO.filter((s) => s.id !== m.situacao).map((s) => (
					<DropdownMenuItem key={s.id} onSelect={() => aoMover(s.id)}>
						<PontoSituacao tom={TOM_SITUACAO[s.id]}>{s.nome}</PontoSituacao>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function CartaoManutencao({ m, agora, aoMover, celular = false }: { m: D.Manutencao; agora: Date; aoMover: (para: D.SituacaoManutencao) => void; celular?: boolean }) {
	const { podeVerFinanceiro } = usePapel();
	const { abrir } = useFicha();
	const u = Q.unidade(m.unidadeId);
	const e = Q.equipamento(u.equipamentoId);
	const futura = reservaFuturaDaUnidade(u.id, agora);
	const dias = diasParada(m, agora);
	return (
		<CartaoQuadro
			rotuloAbrir={`Abrir a manutenção ${m.id} de ${e.nome} ${u.codigo}`}
			aoAbrir={() => abrir("manutencao", m.id)}
			acao={celular ? undefined : <MenuSituacao m={m} aoMover={aoMover} />}
			className={cn(celular && "p-4")}
		>
			<div className="flex items-center gap-2 pr-7">
				<FotoEquipamento nome={e.nome} tamanho={24} />
				<span className="truncate font-medium">{e.nome}</span>
			</div>
			<Codigo className="text-muted-foreground">{u.codigo}</Codigo>
			<span>
				<span className="font-medium">{TIPOS_DANO[m.tipo]}</span>
				<span className="text-muted-foreground"> · {m.problema}</span>
			</span>
			<span className="text-muted-foreground">
				{m.situacao === "liberada" || m.situacao === "descartada" ? `encerrada ${m.encerradaEm ? dataCurta(m.encerradaEm) : ""}` : `parada há ${paradaHa(m, agora)}`}
				{podeVerFinanceiro && m.custo != null ? (
					<>
						{" · "}
						<Dinheiro valor={m.custo} />
					</>
				) : null}
			</span>
			{futura || dias >= 15 || m.reservaOrigemId ? (
				<div className="pointer-events-auto flex flex-wrap items-center gap-1">
					{dias >= 15 && !m.encerradaEm ? <Selo tom="atencao">Em reparo há 15 dias</Selo> : null}
					{futura ? (
						<button
							type="button"
							onClick={() => abrir("reserva", futura.id, { aba: "itens" })}
							data-alvo
							className="inline-flex items-center rounded-full"
							aria-label={`Tem reserva em ${dataCurta(futura.retiradaEm)}. Trocar unidade na reserva ${futura.id}`}
						>
							<Selo tom="atencao">Tem reserva em {dataCurta(futura.retiradaEm)} · Trocar unidade</Selo>
						</button>
					) : null}
					{m.reservaOrigemId ? (
						<button type="button" data-alvo onClick={() => abrir("reserva", m.reservaOrigemId as number)} className="inline-flex items-center text-muted-foreground underline-offset-4 hover:underline">
							de: Res. {m.reservaOrigemId}
						</button>
					) : null}
				</div>
			) : null}
			{celular ? (
				<div className="pointer-events-auto pt-1">
					<MenuSituacao m={m} aoMover={aoMover} grande />
				</div>
			) : null}
		</CartaoQuadro>
	);
}
