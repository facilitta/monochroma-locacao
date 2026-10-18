"use client";
// Mudanças feitas no protótipo (só na memória do navegador) e consultas próprias das telas de reservas e manutenção.
// Na Fase 1, cada função daqui vira uma chamada às funções do banco (mudar_etapa, cancelar_reserva, pre_reservar…).

import { useSyncExternalStore } from "react";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import type { Etapa } from "@/lib/regras/etapas";
import type { Tom } from "@/lib/regras/situacao";
import { DIA, HORA, MINUTO, duracao, periodo } from "@/lib/formatos";

let versao = 0;
const ouvintes = new Set<() => void>();

export function avisarMudanca() {
	versao++;
	for (const f of ouvintes) f();
}

/** Re-renderiza quem usa quando algo muda no protótipo (no app real: LISTEN/NOTIFY + eventos do servidor). */
export function useVersaoDados(): number {
	return useSyncExternalStore(
		(cb) => {
			ouvintes.add(cb);
			return () => ouvintes.delete(cb);
		},
		() => versao,
		() => versao,
	);
}

/* ---------------------------------------------------------------- reservas */

export function mudarEtapaManual(reservaId: number, para: Etapa, agora: Date): Etapa {
	const r = Q.reserva(reservaId);
	const de = r.etapa;
	r.etapa = para;
	if (para === "separada") r.separadaEm = agora;
	if (para === "confirmada") r.separadaEm = undefined;
	avisarMudanca();
	return de;
}

export const MOTIVOS_CANCELAMENTO = [
	"Cliente desistiu",
	"Cadastro recusado",
	"Pagamento não veio",
	"Peça quebrou sem troca",
	"Outro",
] as const;

export function cancelarReserva(reservaId: number, motivo: string) {
	const r = Q.reserva(reservaId);
	r.etapa = "cancelada";
	r.motivoCancelamento = motivo;
	for (const it of Q.itensDa(reservaId)) it.ativo = false;
	avisarMudanca();
}

/** Valor a devolver no cancelamento pela regra: grátis até 48 h antes da retirada; depois, o cliente paga 50%. */
export function regraCancelamento(reservaId: number, agora: Date) {
	const r = Q.reserva(reservaId);
	const pg = Q.situacaoPagamentos(reservaId);
	const pago = pg.aluguelConfirmado ? (pg.pagamentoAluguel?.valor ?? 0) : 0;
	const antecedenciaMs = r.retiradaEm.getTime() - agora.getTime();
	const gratis = antecedenciaMs >= D.configuracoesExemplo.cancelamentoGratisHoras * HORA;
	const retido = gratis ? 0 : (pago * D.configuracoesExemplo.cancelamentoRetencaoPct) / 100;
	return {
		pago,
		gratis,
		retido,
		devolver: pago - retido,
		caucao: pg.caucaoConfirmada ? (pg.pagamentoCaucao?.valor ?? 0) : 0,
		antecedencia: duracao(Math.max(0, antecedenciaMs)),
	};
}

/** pre_reservar(): leva o orçamento a pré-reserva, travando unidades. Responde como o banco. */
export function preReservar(reservaId: number, agora: Date): { ok: true; expiraEm: Date } | { ok: false; codigo: string } {
	const r = Q.reserva(reservaId);
	if (Q.cliente(r.clienteId).cadastro === "bloqueado") return { ok: false, codigo: "CLIENTE_BLOQUEADO" };
	if (!Q.dentroDoHorario(r.retiradaEm) || !Q.dentroDoHorario(r.devolucaoEm)) return { ok: false, codigo: "FORA_DO_HORARIO" };
	const precisa = new Map<number, number>();
	for (const l of Q.linhasDa(reservaId)) precisa.set(l.equipamentoId, (precisa.get(l.equipamentoId) ?? 0) + l.quantidade);
	for (const [eq, qtd] of precisa) {
		if (Q.disponibilidade(eq, r.retiradaEm, r.devolucaoEm, agora) < qtd) return { ok: false, codigo: `INDISPONIVEL:${eq}` };
	}
	const usadas = new Set<number>();
	let i = 0;
	for (const [eq, qtd] of precisa) {
		const livres = Q.unidadesDo(eq).filter(
			(u) =>
				u.estado === "ok" &&
				!usadas.has(u.id) &&
				!Q.ocupacoesDaUnidade(u.id, agora).some(
					(o) => o.inicio.getTime() < r.devolucaoEm.getTime() + Q.FOLGA_MS && o.folgaAte.getTime() > r.retiradaEm.getTime(),
				),
		);
		for (const u of livres.slice(0, qtd)) {
			usadas.add(u.id);
			D.itens.push({ id: reservaId * 100 + i++, reservaId, unidadeId: u.id, ativo: true });
		}
	}
	r.etapa = "pre_reserva";
	r.ordemEnviadaEm = agora;
	r.expiraEm = new Date(agora.getTime() + Q.PRE_RESERVA_MS);
	avisarMudanca();
	return { ok: true, expiraEm: r.expiraEm };
}

export function trocarUnidade(itemId: number, novaUnidadeId: number) {
	const it = D.itens.find((i) => i.id === itemId);
	if (it) it.unidadeId = novaUnidadeId;
	avisarMudanca();
}

/** Unidades do mesmo modelo, em estado ok e livres no período da reserva (para "Trocar unidade"). */
export function unidadesParaTroca(itemId: number, agora: Date): D.Unidade[] {
	const it = D.itens.find((i) => i.id === itemId);
	if (!it) return [];
	const r = Q.reserva(it.reservaId);
	const u = Q.unidade(it.unidadeId);
	return Q.unidadesDo(u.equipamentoId).filter(
		(x) =>
			x.id !== u.id &&
			x.estado === "ok" &&
			!Q.ocupacoesDaUnidade(x.id, agora).some(
				(o) => o.reservaId !== r.id && o.inicio.getTime() < r.devolucaoEm.getTime() + Q.FOLGA_MS && o.folgaAte.getTime() > r.retiradaEm.getTime(),
			),
	);
}

/* ---------------------------------------------------------------- selos do cartão */

export type SeloCartao = { texto: string; tom: Tom; financeiro?: boolean };

export function selosDaReserva(reservaId: number, agora: Date, ehDono: boolean): SeloCartao[] {
	const r = Q.reserva(reservaId);
	const c = Q.cliente(r.clienteId);
	const pg = Q.situacaoPagamentos(reservaId);
	const s: SeloCartao[] = [];
	const at = Q.atrasoDa(reservaId, agora);
	if (at) s.push({ texto: `Atrasada há ${duracao(at.ms)}`, tom: "erro" });
	if (D.manutencoes.some((m) => m.reservaOrigemId === reservaId && !m.cobrancaDecididaEm)) s.push({ texto: "Com dano", tom: "erro" });
	if (pg.aluguel === "a_reembolsar") s.push({ texto: "Reembolso pendente", tom: "erro" });
	if (pg.aluguel === "divergente") s.push({ texto: "Valor diferente", tom: "erro" });
	if (["pre_reserva", "confirmada", "separada"].includes(r.etapa)) {
		if (c.cadastro === "aguardando") s.push({ texto: "Cliente novo – aguardando aprovação", tom: "atencao" });
		if (r.etapa !== "pre_reserva" && (!r.ordemAssinadaEm || !c.contratoGeral)) s.push({ texto: "Falta assinar", tom: "atencao" });
		if (!pg.aluguelConfirmado) s.push({ texto: "Aluguel: aguardando", tom: "atencao" });
		if (!pg.caucaoConfirmada) s.push({ texto: "Caução: aguardando", tom: "atencao" });
	}
	if (r.etapa === "devolvida") {
		if (pg.caucaoDevolvida) s.push({ texto: "Caução devolvida", tom: "neutro" });
		else if (pg.caucaoConfirmada && ehDono) s.push({ texto: "Caução a devolver", tom: "info", financeiro: true });
	}
	return s;
}

export function textoPeriodo(r: D.Reserva): string {
	const diarias = Q.diariasCobradas(r.retiradaEm, r.devolucaoEm);
	return `${periodo(r.retiradaEm, r.devolucaoEm)} · ${diarias} ${diarias === 1 ? "diária" : "diárias"}`;
}

/* ---------------------------------------------------------------- manutenção */

export const SITUACOES_MANUTENCAO: { id: D.SituacaoManutencao; nome: string; recolhida?: boolean }[] = [
	{ id: "aberta", nome: "Aberta" },
	{ id: "na_oficina", nome: "Na oficina" },
	{ id: "esperando_peca", nome: "Esperando peça" },
	{ id: "pronta", nome: "Pronta" },
	{ id: "liberada", nome: "Liberada", recolhida: true },
	{ id: "descartada", nome: "Descartada", recolhida: true },
];

export const TIPOS_DANO: Record<D.TipoDano, string> = {
	arranhao: "Arranhão",
	quebrado: "Quebrado",
	falta_peca: "Falta peça",
	sujo: "Sujo",
	nao_liga: "Não liga",
	outro: "Outro",
};

export function moverManutencao(id: number, para: D.SituacaoManutencao, agora: Date) {
	const m = Q.manutencao(id);
	m.situacao = para;
	const u = Q.unidade(m.unidadeId);
	if (para === "liberada") {
		m.encerradaEm = agora;
		u.estado = "ok";
	} else if (para === "descartada") {
		m.encerradaEm = agora;
		u.estado = "baixada";
		u.motivoBaixa = "perdida";
	} else {
		u.estado = "em_reparo";
	}
	avisarMudanca();
}

export function decidirCobranca(id: number, cobrar: boolean, valor: number | undefined, agora: Date) {
	const m = Q.manutencao(id);
	m.cobrarCliente = cobrar;
	m.valorCobrado = cobrar ? valor : undefined;
	m.cobrancaDecididaEm = agora;
	avisarMudanca();
}

let proximaManutencao = 60;
export function abrirManutencao(unidadeId: number, tipo: D.TipoDano, problema: string, agora: Date): number {
	const id = proximaManutencao++;
	D.manutencoes.push({ id, unidadeId, situacao: "aberta", tipo, problema, abertaEm: agora });
	Q.unidade(unidadeId).estado = "em_reparo";
	avisarMudanca();
	return id;
}

/** Reserva futura (ou em curso) que prende esta unidade: para o selo "tem reserva em 18/10". */
export function reservaFuturaDaUnidade(unidadeId: number, agora: Date): D.Reserva | undefined {
	const it = D.itens.find((i) => {
		if (i.unidadeId !== unidadeId || !i.ativo) return false;
		const r = Q.reserva(i.reservaId);
		return ["pre_reserva", "confirmada", "separada"].includes(r.etapa) && r.retiradaEm.getTime() > agora.getTime() - DIA;
	});
	return it ? Q.reserva(it.reservaId) : undefined;
}

export function paradaHa(m: D.Manutencao, agora: Date): string {
	return duracao((m.encerradaEm ?? agora).getTime() - m.abertaEm.getTime());
}

export function diasParada(m: D.Manutencao, agora: Date): number {
	return Math.floor(((m.encerradaEm ?? agora).getTime() - m.abertaEm.getTime()) / DIA);
}

export { MINUTO };

/* ---------------------------------------------------------------- montador */

export type PedidoMontador = {
	clienteId: number;
	contatoId?: number;
	retirada: Date;
	devolucao: Date;
	foraDoRj: boolean;
	linhas: Pick<D.Linha, "equipamentoId" | "quantidade" | "tipo" | "kitId">[];
};

/** Cria a reserva do Montador: em Orçamento (sem travar) ou já pré-reservada (trava e envia a ordem). */
export function criarReservaDoMontador(p: PedidoMontador, preReservarJa: boolean, agora: Date): { id: number; resposta?: ReturnType<typeof preReservar> } {
	const id = Math.max(...D.reservas.map((r) => r.id)) + 1;
	D.reservas.push({
		id,
		clienteId: p.clienteId,
		contatoRetiraId: p.contatoId,
		etapa: "orcamento",
		retiradaEm: p.retirada,
		devolucaoEm: p.devolucao,
		criadaEm: agora,
		foraDoRj: p.foraDoRj,
		modeloOrdem: "OL-Padrão",
		origem: "dono",
	});
	for (const l of p.linhas) D.linhas.push({ reservaId: id, ...l });
	if (!preReservarJa) {
		avisarMudanca();
		return { id };
	}
	const resposta = preReservar(id, agora);
	if (!resposta.ok) {
		D.reservas.splice(D.reservas.findIndex((r) => r.id === id), 1);
		for (let i = D.linhas.length - 1; i >= 0; i--) if (D.linhas[i].reservaId === id) D.linhas.splice(i, 1);
		avisarMudanca();
	}
	return { id, resposta };
}
