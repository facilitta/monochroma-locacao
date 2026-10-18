// Consultas da Agenda: imitam a função ocupacao(p_inicio, p_fim, p_equipamento) do banco (seção 6.3).
// Cada barra traz unidade, reserva, cliente, etapa, período reservado, folga, atraso, manutenção e conflito.

import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import type { Etapa } from "@/lib/regras/etapas";
import { DIA, HORA, inicioDoDia } from "@/lib/formatos";

export type Barra = {
	chave: string;
	tipo: "reserva" | "reparo" | "orcamento";
	equipamentoId: number;
	unidadeId?: number;
	reservaId?: number;
	manutencaoId?: number;
	itemId?: number;
	etapa?: Etapa;
	inicio: Date;
	fim: Date;
	folgaAte?: Date;
	atrasada?: boolean;
	conflito?: "reparo" | "atraso";
	expiraEm?: Date;
	cliente?: string;
	saiu?: boolean;
};

function sobrepoe(a0: number, a1: number, b0: number, b1: number) {
	return a0 < b1 && b0 < a1;
}

export function barrasDaUnidade(u: D.Unidade, inicio: Date, fim: Date, agora: Date): Barra[] {
	const barras: Barra[] = [];
	const ocup = Q.ocupacoesDaUnidade(u.id, agora);
	const m = Q.manutencaoAberta(u.id);
	let reparo: Barra | undefined;
	if (u.estado === "em_reparo" && m) {
		const fimReparo = m.previsaoVolta && m.previsaoVolta.getTime() > agora.getTime() ? m.previsaoVolta : new Date(Math.max(fim.getTime(), agora.getTime() + 3 * DIA));
		reparo = { chave: `m${m.id}`, tipo: "reparo", equipamentoId: u.equipamentoId, unidadeId: u.id, manutencaoId: m.id, inicio: m.abertaEm, fim: fimReparo };
	}
	for (const [i, o] of ocup.entries()) {
		const r = Q.reserva(o.reservaId);
		const c = Q.cliente(r.clienteId);
		const fimBarra = o.atrasada ? agora : o.voltou && o.voltaEm ? o.voltaEm : o.fimReservado;
		const folgaAte = o.atrasada ? new Date(agora.getTime() + Q.FOLGA_MS) : o.folgaAte;
		let conflito: Barra["conflito"];
		if (reparo && ["pre_reserva", "confirmada", "separada"].includes(r.etapa) && sobrepoe(o.inicio.getTime(), o.folgaAte.getTime(), reparo.inicio.getTime(), reparo.fim.getTime())) conflito = "reparo";
		const prox = ocup[i + 1];
		if (o.atrasada && prox && prox.inicio.getTime() < folgaAte.getTime()) conflito = "atraso";
		barras.push({
			chave: `i${o.itemId}`,
			tipo: "reserva",
			equipamentoId: u.equipamentoId,
			unidadeId: u.id,
			reservaId: r.id,
			itemId: o.itemId,
			etapa: r.etapa,
			inicio: o.inicio,
			fim: fimBarra,
			folgaAte,
			atrasada: o.atrasada,
			conflito,
			expiraEm: r.etapa === "pre_reserva" ? r.expiraEm : undefined,
			cliente: Q.nomeCurtoCliente(c),
			saiu: o.saiu,
		});
	}
	if (reparo) barras.unshift(reparo);
	return barras.filter((b) => sobrepoe(b.inicio.getTime(), (b.folgaAte ?? b.fim).getTime(), inicio.getTime(), fim.getTime()));
}

export function orcamentosDoEquipamento(equipamentoId: number, inicio: Date, fim: Date): Barra[] {
	return D.reservas
		.filter((r) => r.etapa === "orcamento" && Q.linhasDa(r.id).some((l) => l.equipamentoId === equipamentoId && l.tipo !== "basico"))
		.filter((r) => sobrepoe(r.retiradaEm.getTime(), r.devolucaoEm.getTime(), inicio.getTime(), fim.getTime()))
		.map((r) => ({
			chave: `o${r.id}-${equipamentoId}`,
			tipo: "orcamento" as const,
			equipamentoId,
			reservaId: r.id,
			etapa: "orcamento" as const,
			inicio: r.retiradaEm,
			fim: r.devolucaoEm,
			cliente: Q.nomeCurtoCliente(Q.cliente(r.clienteId)),
		}));
}

/** A unidade pode receber o item desta reserva? Mesmo modelo, estado ok e livre no período (com folga). */
export function podeReceber(unidadeId: number, reservaId: number, agora: Date): { pode: boolean; motivo?: string } {
	const u = Q.unidade(unidadeId);
	const r = Q.reserva(reservaId);
	if (u.estado !== "ok") return { pode: false, motivo: u.estado === "em_reparo" ? "Esta unidade está em reparo." : "Esta unidade foi baixada." };
	const fimComFolga = r.devolucaoEm.getTime() + Q.FOLGA_MS;
	const ocupada = Q.ocupacoesDaUnidade(unidadeId, agora).find((o) => o.reservaId !== reservaId && sobrepoe(o.inicio.getTime(), Math.max(o.folgaAte.getTime(), o.atrasada ? agora.getTime() + Q.FOLGA_MS : 0), r.retiradaEm.getTime(), fimComFolga));
	if (ocupada) return { pode: false, motivo: `Ocupada pela reserva ${ocupada.reservaId} no período.` };
	return { pode: true };
}

export function trocarUnidade(itemId: number, novaUnidadeId: number) {
	const it = D.itens.find((i) => i.id === itemId);
	if (it) it.unidadeId = novaUnidadeId;
}

/** Quem ocupa as mesmas unidades no intervalo pedido (para prorrogar ou mudar período). */
export function conflitosNoPeriodo(reservaId: number, inicio: Date, fim: Date, agora: Date): { unidadeId: number; reservaId?: number; motivo: string; desde: Date }[] {
	const r = Q.reserva(reservaId);
	const fimComFolga = fim.getTime() + Q.FOLGA_MS;
	const lista: { unidadeId: number; reservaId?: number; motivo: string; desde: Date }[] = [];
	for (const it of Q.itensDa(r.id).filter((i) => i.ativo)) {
		const u = Q.unidade(it.unidadeId);
		if (u.estado !== "ok") {
			lista.push({ unidadeId: u.id, motivo: "em reparo", desde: inicio });
			continue;
		}
		const o = Q.ocupacoesDaUnidade(u.id, agora).find((x) => x.reservaId !== r.id && sobrepoe(x.inicio.getTime(), x.folgaAte.getTime(), inicio.getTime(), fimComFolga));
		if (o) lista.push({ unidadeId: u.id, reservaId: o.reservaId, motivo: `reserva ${o.reservaId}`, desde: o.inicio });
	}
	return lista;
}

export function diasDoPeriodo(inicio: Date, dias: number): Date[] {
	const base = inicioDoDia(inicio).getTime();
	return Array.from({ length: dias }, (_, i) => new Date(base + i * DIA + 12 * HORA)).map((d) => inicioDoDia(d));
}

export function ehFimDeSemana(d: Date): boolean {
	const dia = new Date(d.getTime() - 3 * HORA).getUTCDay();
	return dia === 0 || dia === 6;
}

export function ehFeriado(d: Date): string | undefined {
	return D.configuracoesExemplo.feriados.find((f) => inicioDoDia(f.data).getTime() === inicioDoDia(d).getTime())?.descricao;
}

/** Quando a unidade ocupada mais cedo devolve, entre as que bloqueiam o período pedido. */
export function voltaMaisCedo(equipamentoId: number, inicio: Date, fim: Date, agora: Date): Date | null {
	const fimComFolga = fim.getTime() + Q.FOLGA_MS;
	let melhor: number | null = null;
	for (const u of Q.unidadesDo(equipamentoId)) {
		if (u.estado !== "ok") continue;
		for (const o of Q.ocupacoesDaUnidade(u.id, agora)) {
			const oFim = o.atrasada ? agora.getTime() : o.fimReservado.getTime();
			if (sobrepoe(o.inicio.getTime(), o.folgaAte.getTime(), inicio.getTime(), fimComFolga)) {
				if (melhor === null || oFim < melhor) melhor = oFim;
			}
		}
	}
	return melhor === null ? null : new Date(Math.max(melhor, agora.getTime()));
}

export function paraCampoData(d: Date): string {
	const local = new Date(d.getTime() - 3 * HORA);
	return local.toISOString().slice(0, 16);
}

export function doCampoData(v: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
	return new Date(`${v}:00-03:00`);
}

export function isoLocal(d: Date): string {
	return `${paraCampoData(d)}:00-03:00`;
}
