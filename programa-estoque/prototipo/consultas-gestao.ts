// Consultas das telas de gestão (Pagamentos, Painéis). Mesmo formato que as funções do banco devolveriam.

import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import type { Tom } from "@/lib/regras/situacao";
import { DIA, HORA, mesmoDia } from "@/lib/formatos";

export type SituacaoLinha = "vencido" | "aguardando" | "confirmado" | "divergente" | "a_estornar" | "estornado" | "a_devolver" | "caucao_devolvida";

export const SITUACAO_LINHA: Record<SituacaoLinha, { texto: string; tom: Tom; acao?: string }> = {
	vencido: { texto: "Link vencido", tom: "neutro" },
	aguardando: { texto: "Aguardando", tom: "atencao", acao: "Reenviar link" },
	confirmado: { texto: "Confirmado", tom: "ok" },
	divergente: { texto: "Valor diferente", tom: "erro", acao: "Ver" },
	a_estornar: { texto: "A estornar", tom: "erro", acao: "Abrir" },
	estornado: { texto: "Estornado", tom: "neutro" },
	a_devolver: { texto: "A devolver", tom: "atencao", acao: "Devolver" },
	caucao_devolvida: { texto: "Caução devolvida", tom: "neutro" },
};

export type LinhaPagamento = {
	id: number;
	pagamento: D.Pagamento;
	reserva: D.Reserva;
	cliente: D.Cliente;
	quando: Date;
	situacao: SituacaoLinha;
	devolucao?: D.Devolucao;
	danoPendente: boolean;
};

export function situacaoDaLinha(p: D.Pagamento): { situacao: SituacaoLinha; devolucao?: D.Devolucao } {
	const devolucao = D.devolucoes.find((d) => d.pagamentoId === p.id);
	const r = Q.reserva(p.reservaId);
	if (p.status === "aguardando") return { situacao: ["expirada", "cancelada"].includes(r.etapa) ? "vencido" : "aguardando" };
	if (p.status === "divergente") return { situacao: "divergente" };
	if (p.status === "a_reembolsar") return { situacao: devolucao ? "estornado" : "a_estornar" };
	if (p.status === "estornado") return { situacao: "estornado", devolucao };
	if (devolucao) return { situacao: devolucao.tipo === "estorno" ? "estornado" : "caucao_devolvida", devolucao };
	if (p.tipo === "caucao" && r.etapa === "devolvida") return { situacao: "a_devolver" };
	return { situacao: "confirmado" };
}

export function linhasPagamento(): LinhaPagamento[] {
	return D.pagamentos
		.filter((p) => p.valor > 0)
		.map((p) => {
			const r = Q.reserva(p.reservaId);
			const { situacao, devolucao } = situacaoDaLinha(p);
			return {
				id: p.id,
				pagamento: p,
				reserva: r,
				cliente: Q.cliente(r.clienteId),
				quando: p.pagoEm ?? p.linkCriadoEm,
				situacao,
				devolucao,
				danoPendente: D.manutencoes.some((m) => m.reservaOrigemId === r.id && !m.cobrancaDecididaEm),
			};
		})
		.sort((a, b) => b.quando.getTime() - a.quando.getTime());
}

export function numerosPagamentos(agora: Date) {
	const linhas = linhasPagamento();
	const doMes = linhas.filter((l) => l.pagamento.tipo !== "caucao" && l.pagamento.status === "confirmado" && l.pagamento.pagoEm && l.pagamento.pagoEm.getMonth() === agora.getMonth());
	const aguardando = linhas.filter((l) => l.situacao === "aguardando" && ["pre_reserva", "confirmada", "separada"].includes(l.reserva.etapa));
	const estornar = linhas.filter((l) => l.situacao === "a_estornar");
	const devolver = linhas.filter((l) => l.situacao === "a_devolver");
	const soma = (ls: LinhaPagamento[]) => ls.reduce((s, l) => s + l.pagamento.valor, 0);
	return {
		confirmadoMes: soma(doMes),
		aguardando: { qtd: aguardando.length, valor: soma(aguardando) },
		estornar: { qtd: estornar.length, valor: soma(estornar) },
		devolver: { qtd: devolver.length, valor: soma(devolver) },
	};
}

/** Horas de atraso de uma reserva já devolvida, depois da tolerância. */
export function horasDeAtrasoNaVolta(reservaId: number): number {
	const r = Q.reserva(reservaId);
	if (!r.voltaEm) return 0;
	const alem = r.voltaEm.getTime() - r.devolucaoEm.getTime() - Q.TOLERANCIA_MS;
	return alem > 0 ? Math.ceil(alem / HORA) : 0;
}

export function cancelamentoPelaRegra(reservaId: number, quando: Date): { gratis: boolean; devolver: number; reter: number; horasAntes: number } {
	const r = Q.reserva(reservaId);
	const valor = Q.precoDa(reservaId).valorAluguel;
	const horasAntes = (r.retiradaEm.getTime() - quando.getTime()) / HORA;
	const gratis = horasAntes >= D.configuracoesExemplo.cancelamentoGratisHoras;
	const reter = gratis ? 0 : Math.round(valor * (D.configuracoesExemplo.cancelamentoRetencaoPct / 100) * 100) / 100;
	return { gratis, devolver: valor - reter, reter, horasAntes };
}

/* ---------------------------------------------------------------- painéis (exemplo) */

export type Periodo = "mes" | "trimestre" | "ano";

export function numerosPaineis(periodo: Periodo, agora: Date) {
	const meses = periodo === "mes" ? 1 : periodo === "trimestre" ? 3 : 12;
	const serie = D.faturadoPorMes;
	const atual = serie.slice(-meses).reduce((s, m) => s + m.valor, 0);
	const anterior = serie.slice(-2 * meses, -meses).reduce((s, m) => s + m.valor, 0) || serie[serie.length - 2].valor;
	const variacao = anterior ? (atual - anterior) / anterior : 0;
	const atrasos = D.reservas.filter((r) => {
		const fim = r.voltaEm ?? (r.etapa === "retirada" ? agora : undefined);
		return fim && fim.getTime() - r.devolucaoEm.getTime() > Q.TOLERANCIA_MS;
	});
	const horasAtraso = atrasos.reduce((s, r) => {
		const fim = r.voltaEm ?? agora;
		return s + Math.ceil((fim.getTime() - r.devolucaoEm.getTime() - Q.TOLERANCIA_MS) / HORA);
	}, 0);
	const custoReparo = D.manutencoes.filter((m) => agora.getTime() - m.abertaEm.getTime() < meses * 31 * DIA).reduce((s, m) => s + (m.custo ?? 0), 0);
	const usos = D.equipamentos.filter((e) => e.ativo).map((e) => Q.usoNoTempo(e.id));
	const uso = usos.reduce((s, x) => s + x, 0) / usos.length;
	return { faturado: atual, variacao, uso, usoVariacao: -0.03, atrasos: atrasos.length, horasAtraso, custoReparo };
}

export function quantoSePagouPorUnidade(limite = 8) {
	return D.unidades
		.filter((u) => u.estado !== "baixada" && u.valorCompra)
		.map((u) => ({ unidade: u, equipamento: Q.equipamento(u.equipamentoId), retorno: Q.quantoJaRendeu(u.id) ?? 0 }))
		.filter((x) => x.equipamento.categoria !== "acessorio")
		.sort((a, b) => b.retorno - a.retorno)
		.slice(0, limite);
}

export function maisAlugados(limite = 6) {
	return D.equipamentos
		.filter((e) => e.ativo && e.categoria !== "acessorio")
		.map((e) => ({ equipamento: e, uso: Q.usoNoTempo(e.id), saidas: Math.round(Q.usoNoTempo(e.id) * 40), faturado: Q.faturado12Meses(e.id) }))
		.sort((a, b) => b.uso - a.uso)
		.slice(0, limite);
}

export function parados(agora: Date) {
	return D.equipamentos
		.filter((e) => e.ativo && Q.usoNoTempo(e.id) <= 0.1)
		.map((e) => ({ equipamento: e, dias: 60 + ((e.id * 7) % 50), desde: new Date(agora.getTime() - (60 + ((e.id * 7) % 50)) * DIA) }))
		.sort((a, b) => b.dias - a.dias);
}

export const expiradasPorSemana = [
	{ semana: "21–27 set", valor: 3 },
	{ semana: "28 set–4 out", valor: 1 },
	{ semana: "5–11 out", valor: 4 },
	{ semana: "12–18 out", valor: 3 },
];

export const motivosCancelamento = [
	{ motivo: "Cliente desistiu", valor: 3 },
	{ motivo: "Pagamento não veio", valor: 2 },
	{ motivo: "Cadastro recusado", valor: 1 },
	{ motivo: "Peça quebrou sem troca", valor: 1 },
	{ motivo: "Outro", valor: 0 },
];

export function mensagensAutomaticasNoMes(agora: Date): number {
	return D.automacoes.reduce((s, a) => s + a.execucoes.filter((e) => e.resultado === "ok" && e.oQueFez.startsWith("Mand") && e.em.getMonth() === agora.getMonth()).length, 0) + 37;
}

export function eHoje(d: Date, agora: Date) {
	return mesmoDia(d, agora);
}
