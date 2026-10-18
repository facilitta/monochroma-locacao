// Consultas do estoque usadas pelas telas Catálogo, Unidades e Kits (protótipo).
// Na Fase 1 viram leituras da visão situacao_unidades e das funções disponibilidade() e ocupacao().

import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import type { EstadoUnidade } from "@/lib/regras/unidades";
import { DIA, diaSemana, duracao, hora, mesmoDia } from "@/lib/formatos";
import type { TipoFicha } from "@/componentes/ui/ficha";

export const OPCOES_CATEGORIA = (Object.keys(D.CATEGORIAS) as D.Categoria[]).map((c) => ({ valor: c, rotulo: D.CATEGORIAS[c] }));

export const ehBasico = (equipamentoId: number) => D.acessoriosObrigatorios.some((a) => a.acessorioId === equipamentoId);
export const ehExtra = (equipamentoId: number) => D.acessoriosExtras.some((a) => a.acessorioId === equipamentoId);

const NOME_CURTO: Record<EstadoUnidade, [string, string]> = {
	livre: ["livre", "livres"],
	pre_reservada: ["pré-reservada", "pré-reservadas"],
	reservada: ["reservada", "reservadas"],
	na_rua: ["na rua", "na rua"],
	pendente: ["pendente", "pendentes"],
	conferencia: ["em conferência", "em conferência"],
	reparo: ["em reparo", "em reparo"],
	baixada: ["baixada", "baixadas"],
};

const PRIORIDADE: EstadoUnidade[] = ["reparo", "pendente", "na_rua", "pre_reservada", "reservada", "conferencia"];

export function quando(d: Date, agora: Date): string {
	if (mesmoDia(d, agora)) return `hoje ${hora(d)}`;
	if (mesmoDia(d, new Date(agora.getTime() + DIA))) return `amanhã ${hora(d)}`;
	return `${diaSemana(d)} ${hora(d)}`;
}

export type LinhaCatalogo = D.Equipamento & {
	total: number;
	livres: number;
	estados: Record<EstadoUnidade, number>;
	resumo: string;
	proximaSaida?: Date;
	uso: number;
	basico: boolean;
	extra: boolean;
	unidadesLista: D.Unidade[];
	livresNoPeriodo?: number;
};

export function linhasCatalogo(agora: Date, periodo?: { inicio: Date; fim: Date }): LinhaCatalogo[] {
	return D.equipamentos.map((e) => {
		const lista = Q.unidadesDo(e.id);
		const estados = Q.resumoEstados(e.id, agora);
		const total = lista.length;
		const livres = estados.livre;
		let resumo: string;
		if (total === 0) resumo = "Sem unidades";
		else if (livres === total) resumo = "Todas livres";
		else {
			const partes = PRIORIDADE.filter((p) => estados[p] > 0)
				.slice(0, 2)
				.map((p) => `${estados[p]} ${NOME_CURTO[p][estados[p] === 1 ? 0 : 1]}`);
			resumo = livres === 0 ? `Nenhuma livre · ${partes[0]}` : partes.join(" · ");
		}
		const saidas = lista
			.map((u) => Q.situacaoUnidade(u, agora).proximaSaida?.em)
			.filter((d): d is Date => !!d)
			.sort((a, b) => a.getTime() - b.getTime());
		return {
			...e,
			total,
			livres,
			estados,
			resumo,
			proximaSaida: saidas[0],
			uso: Q.usoNoTempo(e.id),
			basico: ehBasico(e.id),
			extra: ehExtra(e.id),
			unidadesLista: lista,
			livresNoPeriodo: periodo ? Q.disponibilidade(e.id, periodo.inicio, periodo.fim, agora) : undefined,
		};
	});
}

export type Onde = { texto: string; ficha?: { tipo: TipoFicha; id: number } };

export function ondeEsta(u: D.Unidade, agora: Date): Onde {
	const s = Q.situacaoUnidade(u, agora);
	switch (s.estado) {
		case "na_rua":
		case "pendente":
		case "reservada":
		case "pre_reservada":
			return { texto: `Res. ${s.reservaId}${s.detalhe ? ` · ${s.detalhe}` : ""}`, ficha: s.reservaId ? { tipo: "reserva", id: s.reservaId } : undefined };
		case "conferencia":
			return { texto: `Na casa · em conferência ${s.detalhe ?? ""}`.trim(), ficha: s.reservaId ? { tipo: "reserva", id: s.reservaId } : undefined };
		case "reparo": {
			const m = s.manutencaoId ? Q.manutencao(s.manutencaoId) : undefined;
			const local = m?.oficina ? "Oficina" : "Na casa, em reparo";
			return { texto: `${local}${m ? ` · há ${duracao(agora.getTime() - m.abertaEm.getTime())}` : ""}`, ficha: s.manutencaoId ? { tipo: "manutencao", id: s.manutencaoId } : undefined };
		}
		case "baixada":
			return { texto: u.motivoBaixa ? `Baixada · ${u.motivoBaixa}` : "Baixada" };
		default:
			return { texto: s.proximaSaida ? `Na casa · sai ${quando(s.proximaSaida.em, agora)}` : "Na casa" };
	}
}

export function reservasDaUnidade(unidadeId: number): D.Reserva[] {
	const ids = new Set(D.itens.filter((i) => i.unidadeId === unidadeId).map((i) => i.reservaId));
	return D.reservas.filter((r) => ids.has(r.id)).sort((a, b) => b.retiradaEm.getTime() - a.retiradaEm.getTime());
}

export function diariaDoKit(kit: D.Kit): number {
	return kit.componentes.reduce((s, c) => s + Q.equipamento(c.equipamentoId).precoDiaria * c.quantidade, 0);
}

export function itensDoKit(kit: D.Kit): number {
	return kit.componentes.reduce((s, c) => s + c.quantidade, 0);
}

/** Montáveis do kit entre agora e as próximas 24 h, com a frase do que falta. */
export function montaveisAgora(kitId: number, agora: Date): { montaveis: number; falta?: string } {
	const kit = Q.kit(kitId);
	const inicio = agora;
	const fim = new Date(agora.getTime() + DIA);
	let montaveis = Number.POSITIVE_INFINITY;
	let falta: string | undefined;
	for (const c of kit.componentes) {
		const livres = Q.disponibilidade(c.equipamentoId, inicio, fim, agora);
		montaveis = Math.min(montaveis, Math.floor(livres / c.quantidade));
		if (livres < c.quantidade && !falta) falta = `Falta ${c.quantidade - livres} ${Q.equipamento(c.equipamentoId).nome}`;
	}
	return { montaveis: Number.isFinite(montaveis) ? montaveis : 0, falta };
}

export function reservasComKit(kitId: number): D.Reserva[] {
	const ids = new Set(D.linhas.filter((l) => l.kitId === kitId).map((l) => l.reservaId));
	return D.reservas.filter((r) => ids.has(r.id));
}

export function pacotesBasicos(): { equipamento: D.Equipamento; itens: { acessorio: D.Equipamento; quantidade: number }[] }[] {
	const porEq = new Map<number, { acessorio: D.Equipamento; quantidade: number }[]>();
	for (const a of D.acessoriosObrigatorios) {
		porEq.set(a.equipamentoId, [...(porEq.get(a.equipamentoId) ?? []), { acessorio: Q.equipamento(a.acessorioId), quantidade: a.quantidade }]);
	}
	return [...porEq.entries()].map(([id, itens]) => ({ equipamento: Q.equipamento(id), itens }));
}

export function extras(): { equipamento: D.Equipamento; acessorio: D.Equipamento }[] {
	return D.acessoriosExtras.map((x) => ({ equipamento: Q.equipamento(x.equipamentoId), acessorio: Q.equipamento(x.acessorioId) }));
}
