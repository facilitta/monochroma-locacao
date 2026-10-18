// Consultas do protótipo: imitam as funções e visões do banco (disponibilidade, situacao_unidades,
// ocupacao, alertas_hoje, calcular_preco). Na Fase 1 cada uma vira chamada ao banco, com o mesmo formato.

import * as D from "@/prototipo/dados";
import { ETAPAS_ABERTAS, type Etapa } from "@/lib/regras/etapas";
import type { EstadoUnidade } from "@/lib/regras/unidades";
import type { Tom } from "@/lib/regras/situacao";
import { DIA, HORA, MINUTO, diaSemana, duracao, hora, inicioDoDia, mesmoDia } from "@/lib/formatos";

export const FOLGA_MS = D.configuracoesExemplo.horasFolga * HORA;
export const TOLERANCIA_MS = D.configuracoesExemplo.toleranciaMin * MINUTO;
export const PRE_RESERVA_MS = D.configuracoesExemplo.minutosPreReserva * MINUTO;

/* ---------------------------------------------------------------- busca simples */

export const equipamento = (id: number) => D.equipamentos.find((e) => e.id === id) as D.Equipamento;
export const unidade = (id: number) => D.unidades.find((u) => u.id === id) as D.Unidade;
export const unidadePorCodigo = (codigo: string) => D.unidades.find((u) => u.codigo === codigo);
export const cliente = (id: number) => D.clientes.find((c) => c.id === id) as D.Cliente;
export const reserva = (id: number) => D.reservas.find((r) => r.id === id) as D.Reserva;
export const contato = (id: number) => D.contatos.find((c) => c.id === id);
export const kit = (id: number) => D.kits.find((k) => k.id === id) as D.Kit;
export const manutencao = (id: number) => D.manutencoes.find((m) => m.id === id) as D.Manutencao;
export const conversa = (id: number) => D.conversas.find((c) => c.id === id) as D.Conversa;

export const unidadesDo = (equipamentoId: number, incluirBaixadas = false) =>
	D.unidades.filter((u) => u.equipamentoId === equipamentoId && (incluirBaixadas || u.estado !== "baixada"));
export const linhasDa = (reservaId: number) => D.linhas.filter((l) => l.reservaId === reservaId);
export const itensDa = (reservaId: number) => D.itens.filter((i) => i.reservaId === reservaId);
export const pagamentosDa = (reservaId: number) => D.pagamentos.filter((p) => p.reservaId === reservaId);
export const movimentacoesDa = (reservaId: number) => D.movimentacoes.filter((m) => m.reservaId === reservaId);
export const documentosDa = (reservaId: number) => D.documentos.filter((d) => d.reservaId === reservaId);
export const reservasDo = (clienteId: number) => D.reservas.filter((r) => r.clienteId === clienteId);
export const contatosDo = (clienteId: number) => D.contatos.filter((c) => c.clienteId === clienteId);
export const conversaDaReserva = (reservaId: number) => D.conversas.find((c) => c.reservaId === reservaId);
export const conversaDoCliente = (clienteId: number) => D.conversas.find((c) => c.clienteId === clienteId);
export const mensagensDa = (conversaId: number) =>
	D.mensagens.filter((m) => m.conversaId === conversaId).sort((a, b) => a.em.getTime() - b.em.getTime());
export const manutencoesDa = (unidadeId: number) => D.manutencoes.filter((m) => m.unidadeId === unidadeId);
export const manutencaoAberta = (unidadeId: number) =>
	D.manutencoes.find((m) => m.unidadeId === unidadeId && !["liberada", "descartada"].includes(m.situacao));

export function nomeCurtoCliente(c: D.Cliente): string {
	return c.tipo === "pj" ? c.nome.replace(/\s+(Ltda|ME)$/i, "") : c.nome.split(" ")[0];
}

/* ---------------------------------------------------------------- preço (calcular_preco) */

export function diariasCobradas(retirada: Date, devolucao: Date): number {
	const horas = (devolucao.getTime() - retirada.getTime() - TOLERANCIA_MS) / (D.configuracoesExemplo.horasPorDiaria * HORA);
	return Math.max(1, Math.ceil(horas));
}

export type LinhaPreco = {
	equipamentoId: number;
	nome: string;
	quantidade: number;
	tipo: D.Linha["tipo"];
	diaria: number;
	diarias: number;
	subtotal: number;
	kitId?: number;
};

export type Preco = {
	diarias: number;
	linhas: LinhaPreco[];
	valorAluguel: number;
	valorCaucao: number;
	regra: string;
};

export function calcularPreco(linhas: Pick<D.Linha, "equipamentoId" | "quantidade" | "tipo" | "kitId">[], retirada: Date, devolucao: Date): Preco {
	const diarias = diariasCobradas(retirada, devolucao);
	const ls: LinhaPreco[] = linhas.map((l) => {
		const e = equipamento(l.equipamentoId);
		const diaria = l.tipo === "basico" ? 0 : e.precoDiaria;
		return { equipamentoId: l.equipamentoId, nome: e.nome, quantidade: l.quantidade, tipo: l.tipo, diaria, diarias, subtotal: diaria * diarias * l.quantidade, kitId: l.kitId };
	});
	return {
		diarias,
		linhas: ls,
		valorAluguel: ls.reduce((s, l) => s + l.subtotal, 0),
		valorCaucao: D.CAUCAO_EXEMPLO,
		regra: `${diarias} ${diarias === 1 ? "diária" : "diárias"} de 24 h`,
	};
}

const cachePreco = new Map<number, Preco>();
export function precoDa(reservaId: number): Preco {
	const c = cachePreco.get(reservaId);
	if (c) return c;
	const r = reserva(reservaId);
	const p = calcularPreco(linhasDa(reservaId), r.retiradaEm, r.devolucaoEm);
	cachePreco.set(reservaId, p);
	return p;
}

// Preenche os valores de aluguel dos exemplos a partir do preço calculado (como o banco faria ao congelar).
for (const p of D.pagamentos) {
	if (p.tipo === "aluguel" && p.valor === 0) {
		p.valor = precoDa(p.reservaId).valorAluguel;
		if (p.status === "confirmado" || p.status === "a_reembolsar") p.valorRecebido = p.valor;
	}
}
for (const d of D.devolucoes) {
	if (d.tipo === "estorno" && d.valor === 0) {
		const pg = D.pagamentos.find((p) => p.id === d.pagamentoId);
		if (pg) d.valor = pg.valor;
	}
}

/* ---------------------------------------------------------------- pagamentos */

export type SituacaoCobranca = D.StatusPagamento | "sem_link";

export function situacaoPagamentos(reservaId: number) {
	const ps = pagamentosDa(reservaId);
	const aluguel = ps.find((p) => p.tipo === "aluguel");
	const caucao = ps.find((p) => p.tipo === "caucao");
	return {
		aluguel: (aluguel?.status ?? "sem_link") as SituacaoCobranca,
		caucao: (caucao?.status ?? "sem_link") as SituacaoCobranca,
		aluguelConfirmado: aluguel?.status === "confirmado",
		caucaoConfirmada: caucao?.status === "confirmado",
		pagamentoAluguel: aluguel,
		pagamentoCaucao: caucao,
		caucaoDevolvida: caucao ? D.devolucoes.find((d) => d.pagamentoId === caucao.id) : undefined,
	};
}

export const ROTULO_COBRANCA: Record<SituacaoCobranca, { texto: string; tom: Tom }> = {
	aguardando: { texto: "Aguardando", tom: "atencao" },
	confirmado: { texto: "Confirmado", tom: "ok" },
	divergente: { texto: "Valor diferente", tom: "erro" },
	a_reembolsar: { texto: "A estornar", tom: "erro" },
	estornado: { texto: "Estornado", tom: "neutro" },
	sem_link: { texto: "Sem link", tom: "neutro" },
};

/* ---------------------------------------------------------------- ocupação e estado das unidades */

const SEGURA: Etapa[] = ["pre_reserva", "confirmada", "separada", "retirada", "devolvida"];

export type Ocupacao = {
	itemId: number;
	reservaId: number;
	unidadeId: number;
	etapa: Etapa;
	inicio: Date;
	fimReservado: Date;
	fim: Date;
	folgaAte: Date;
	atrasada: boolean;
	saiu: boolean;
	voltou: boolean;
	voltaEm?: Date;
};

export function ocupacoesDaUnidade(unidadeId: number, agora: Date): Ocupacao[] {
	const lista: Ocupacao[] = [];
	for (const it of D.itens) {
		if (it.unidadeId !== unidadeId || !it.ativo) continue;
		const r = reserva(it.reservaId);
		if (!SEGURA.includes(r.etapa)) continue;
		if (r.etapa === "pre_reserva" && r.expiraEm && r.expiraEm.getTime() <= agora.getTime()) continue;
		const movs = D.movimentacoes.filter((m) => m.reservaId === r.id && m.unidadeId === unidadeId);
		const saida = movs.find((m) => m.tipo === "saida");
		const volta = movs.find((m) => m.tipo === "volta");
		let fim = r.devolucaoEm;
		let atrasada = false;
		if (volta) {
			fim = new Date(Math.min(r.devolucaoEm.getTime(), volta.em.getTime()));
		} else if (saida && r.devolucaoEm.getTime() < agora.getTime()) {
			fim = agora;
			atrasada = true;
		}
		const folgaAte = new Date((volta ? volta.em : fim).getTime() + FOLGA_MS);
		if (r.etapa === "devolvida" && volta && folgaAte.getTime() < agora.getTime() && r.devolucaoEm.getTime() < agora.getTime()) {
			lista.push({ itemId: it.id, reservaId: r.id, unidadeId, etapa: r.etapa, inicio: r.retiradaEm, fimReservado: r.devolucaoEm, fim, folgaAte, atrasada, saiu: !!saida, voltou: true, voltaEm: volta.em });
			continue;
		}
		lista.push({ itemId: it.id, reservaId: r.id, unidadeId, etapa: r.etapa, inicio: r.retiradaEm, fimReservado: r.devolucaoEm, fim, folgaAte, atrasada, saiu: !!saida, voltou: !!volta, voltaEm: volta?.em });
	}
	return lista.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

export type SituacaoUnidade = {
	estado: EstadoUnidade;
	reservaId?: number;
	detalhe?: string;
	voltaEm?: Date;
	atrasadaMs?: number;
	expiraEm?: Date;
	folgaAte?: Date;
	proximaSaida?: { reservaId: number; em: Date };
	manutencaoId?: number;
};

export function situacaoUnidade(u: D.Unidade, agora: Date): SituacaoUnidade {
	const ocup = ocupacoesDaUnidade(u.id, agora);
	const futura = ocup.find((o) => o.inicio.getTime() > agora.getTime() && !o.saiu);
	const proximaSaida = futura ? { reservaId: futura.reservaId, em: futura.inicio } : undefined;
	if (u.estado === "baixada") return { estado: "baixada", detalhe: u.motivoBaixa };
	if (u.estado === "em_reparo") {
		const m = manutencaoAberta(u.id);
		return { estado: "reparo", manutencaoId: m?.id, proximaSaida, detalhe: m ? `há ${duracao(agora.getTime() - m.abertaEm.getTime())}` : undefined };
	}
	for (const o of ocup) {
		const r = reserva(o.reservaId);
		if (r.etapa === "retirada" && o.saiu && !o.voltou) {
			const algumaVolta = D.movimentacoes.some((m) => m.reservaId === r.id && m.tipo === "volta");
			const atrasadaMs = agora.getTime() - r.devolucaoEm.getTime();
			const detalhe = atrasadaMs > 0 ? `atrasada há ${duracao(atrasadaMs)}` : `volta ${mesmoDia(r.devolucaoEm, agora) ? "hoje" : diaSemanaCurto(r.devolucaoEm)} ${hora(r.devolucaoEm)}`;
			return { estado: algumaVolta ? "pendente" : "na_rua", reservaId: r.id, voltaEm: r.devolucaoEm, atrasadaMs: atrasadaMs > 0 ? atrasadaMs : undefined, detalhe, proximaSaida };
		}
		if (o.voltou && o.voltaEm && agora.getTime() < o.folgaAte.getTime() && agora.getTime() >= o.voltaEm.getTime()) {
			return { estado: "conferencia", reservaId: r.id, folgaAte: o.folgaAte, detalhe: `até ${hora(o.folgaAte)}`, proximaSaida };
		}
		if (r.etapa === "pre_reserva" && r.expiraEm && agora.getTime() < r.expiraEm.getTime()) {
			const min = Math.ceil((r.expiraEm.getTime() - agora.getTime()) / MINUTO);
			return { estado: "pre_reservada", reservaId: r.id, expiraEm: r.expiraEm, detalhe: `${min} min`, proximaSaida };
		}
		if ((r.etapa === "confirmada" || r.etapa === "separada") && !o.saiu) {
			const ate = r.retiradaEm.getTime() - agora.getTime();
			if (ate <= DIA) return { estado: "reservada", reservaId: r.id, detalhe: `sai ${mesmoDia(r.retiradaEm, agora) ? "hoje" : diaSemanaCurto(r.retiradaEm)} ${hora(r.retiradaEm)}`, proximaSaida };
		}
	}
	return { estado: "livre", proximaSaida };
}

function diaSemanaCurto(d: Date): string {
	return diaSemana(d);
}

export function livresAgora(equipamentoId: number, agora: Date): number {
	return unidadesDo(equipamentoId).filter((u) => situacaoUnidade(u, agora).estado === "livre").length;
}

export function resumoEstados(equipamentoId: number, agora: Date): Record<EstadoUnidade, number> {
	const r: Record<EstadoUnidade, number> = { livre: 0, pre_reservada: 0, reservada: 0, na_rua: 0, pendente: 0, conferencia: 0, reparo: 0, baixada: 0 };
	for (const u of unidadesDo(equipamentoId, true)) r[situacaoUnidade(u, agora).estado]++;
	return r;
}

/** disponibilidade(): quantas unidades em estado ok estão livres no período, contando a folga. */
export function disponibilidade(equipamentoId: number, inicio: Date, fim: Date, agora: Date): number {
	const fimComFolga = fim.getTime() + FOLGA_MS;
	return unidadesDo(equipamentoId).filter((u) => {
		if (u.estado !== "ok") return false;
		return !ocupacoesDaUnidade(u.id, agora).some((o) => {
			const oFim = Math.max(o.folgaAte.getTime(), o.atrasada ? agora.getTime() + FOLGA_MS : 0);
			return o.inicio.getTime() < fimComFolga && oFim > inicio.getTime();
		});
	}).length;
}

export function dentroDoHorario(d: Date): boolean {
	const local = new Date(d.getTime() - 3 * HORA);
	const dia = local.getUTCDay();
	const minutos = local.getUTCHours() * 60 + local.getUTCMinutes();
	if (D.configuracoesExemplo.feriados.some((f) => mesmoDia(f.data, d))) return false;
	if (dia === 0) return false;
	if (dia === 6) return minutos >= 9 * 60 && minutos <= 13 * 60;
	return minutos >= 9 * 60 && minutos <= 18 * 60;
}

/** proxima_data_livre(): só horários dentro do balcão e fora de feriados (correção 11). */
export function proximaDataLivre(equipamentoId: number, aPartir: Date, duracaoMs: number, agora: Date): Date | null {
	let t = new Date(Math.ceil(aPartir.getTime() / HORA) * HORA);
	const limite = aPartir.getTime() + 60 * DIA;
	while (t.getTime() < limite) {
		if (dentroDoHorario(t) && disponibilidade(equipamentoId, t, new Date(t.getTime() + duracaoMs), agora) > 0) return t;
		t = new Date(t.getTime() + HORA);
	}
	return null;
}

/* ---------------------------------------------------------------- reserva: valores, bloqueios, atraso */

export function valoresDa(reservaId: number) {
	const p = precoDa(reservaId);
	return { aluguel: p.valorAluguel, caucao: p.valorCaucao, diarias: p.diarias, regra: p.regra };
}

export type Bloqueio = { codigo: string; frase: string; acao: string; soDono?: boolean };

export function bloqueiosSaida(reservaId: number): Bloqueio[] {
	const r = reserva(reservaId);
	const c = cliente(r.clienteId);
	const pg = situacaoPagamentos(reservaId);
	const b: Bloqueio[] = [];
	if (!pg.aluguelConfirmado) b.push({ codigo: "PAGAMENTO_NAO_VERIFICADO", frase: "Aluguel ainda não confirmado pelo sistema", acao: "Reenviar link" });
	if (!pg.caucaoConfirmada) b.push({ codigo: "PAGAMENTO_NAO_VERIFICADO", frase: "Caução ainda não confirmada pelo sistema (Pix)", acao: "Reenviar link" });
	if (c.cadastro !== "aprovado") b.push({ codigo: "CLIENTE_NAO_APROVADO", frase: "Cliente aguardando aprovação", acao: "Ver documentos" });
	if (!c.contratoGeral) b.push({ codigo: "FALTA_ASSINATURA", frase: "Falta assinar o contrato geral", acao: "Reenviar link", soDono: true });
	if (!r.ordemAssinadaEm) b.push({ codigo: "FALTA_ASSINATURA", frase: "Falta assinar a ordem", acao: "Reenviar link", soDono: true });
	return b;
}

export function atrasoDa(reservaId: number, agora: Date): { ms: number; horasCobradas: number; alemDaTolerancia: boolean } | null {
	const r = reserva(reservaId);
	if (r.etapa !== "retirada") return null;
	const ms = agora.getTime() - r.devolucaoEm.getTime();
	if (ms <= 0) return null;
	const alem = ms - TOLERANCIA_MS;
	return { ms, horasCobradas: alem > 0 ? Math.ceil(alem / HORA) : 0, alemDaTolerancia: alem > 0 };
}

export function modeloOrdemDa(reservaId: number): { modelo: D.ModeloOrdem; motivo: string; aprovacaoDaEquipe: boolean } {
	const r = reserva(reservaId);
	const diarias = diariasCobradas(r.retiradaEm, r.devolucaoEm);
	const alto = D.configuracoesExemplo.valorAltoValor;
	const soma = linhasDa(reservaId).reduce((s, l) => s + equipamento(l.equipamentoId).valorReposicao * l.quantidade, 0);
	const ehAlto = alto != null && soma > alto;
	if (ehAlto && r.foraDoRj) return { modelo: "OL-Alto valor", motivo: "Alto valor e uso fora do RJ: a equipe aprova antes do envio.", aprovacaoDaEquipe: true };
	if (ehAlto) return { modelo: "OL-Alto valor", motivo: "Soma dos equipamentos acima do limite de alto valor.", aprovacaoDaEquipe: false };
	if (r.foraDoRj) return { modelo: "OL-Viagem", motivo: `Uso fora do estado do RJ (${r.cidadeUso ?? "cidade informada no questionário"}).`, aprovacaoDaEquipe: false };
	if (diarias >= 7) return { modelo: "OL-Longo", motivo: `${diarias} diárias (7 ou mais).`, aprovacaoDaEquipe: false };
	return { modelo: "OL-Padrão", motivo: "Aluguel comum: menos de 7 diárias, no RJ, abaixo do alto valor.", aprovacaoDaEquipe: false };
}

export function ehSegundaChance(reservaId: number): boolean {
	return reserva(reservaId).reservaAnteriorId != null;
}

export function resumoItens(reservaId: number, max = 2): string {
	const ls = linhasDa(reservaId).filter((l) => l.tipo !== "basico");
	const nomes = ls.map((l) => (l.quantidade > 1 ? `${l.quantidade} × ${equipamento(l.equipamentoId).nome}` : equipamento(l.equipamentoId).nome));
	const kits = [...new Set(ls.map((l) => l.kitId).filter(Boolean))] as number[];
	if (kits.length && ls.every((l) => l.kitId)) return kits.map((k) => kit(k).nome).join(" + ");
	if (nomes.length <= max) return nomes.join(" + ");
	return `${nomes.slice(0, max).join(" + ")} +${linhasDa(reservaId).length - max}`;
}

/* ---------------------------------------------------------------- alertas (alertas_hoje) */

export type Bloco = "agora" | "conferir" | "organizar";

export type Alerta = {
	chave: string;
	numero: number;
	bloco: Bloco;
	frase: string;
	acao: string;
	desde: Date;
	balcao: boolean;
	tom: Tom;
	financeiro?: boolean;
	reservaId?: number;
	clienteId?: number;
	unidadeId?: number;
	manutencaoId?: number;
	conversaId?: number;
	tarefaId?: number;
};

const BALCAO = new Set([1, 2, 4, 5, 6, 7, 8, 10, 12, 15]);

export function alertas(agora: Date): Alerta[] {
	const a: Alerta[] = [];
	const add = (x: Omit<Alerta, "balcao" | "chave">) => a.push({ ...x, balcao: BALCAO.has(x.numero), chave: `${x.numero}-${x.reservaId ?? x.clienteId ?? x.unidadeId ?? x.manutencaoId ?? x.conversaId ?? x.tarefaId}` });
	const fimDeAmanha = new Date(inicioDoDia(agora).getTime() + 2 * DIA);

	for (const c of D.conversas) {
		const msgs = mensagensDa(c.id);
		const ultima = msgs[msgs.length - 1];
		if (c.comQuem === "equipe" && c.passadaEm && !msgs.some((m) => m.autor === "equipe" && m.em.getTime() >= (c.passadaEm as Date).getTime())) {
			add({ numero: 1, bloco: "agora", frase: "Robô passou a conversa", acao: "Responder", desde: c.passadaEm, tom: "atencao", conversaId: c.id, reservaId: c.reservaId, clienteId: c.clienteId });
		} else if (c.comQuem === "equipe" && ultima?.autor === "cliente" && agora.getTime() - ultima.em.getTime() > 15 * MINUTO) {
			add({ numero: 2, bloco: "agora", frase: `Cliente esperando há ${duracao(agora.getTime() - ultima.em.getTime())}`, acao: "Responder", desde: ultima.em, tom: "atencao", conversaId: c.id, reservaId: c.reservaId, clienteId: c.clienteId });
		}
	}
	for (const p of D.pagamentos.filter((p) => p.status === "a_reembolsar")) {
		add({ numero: 3, bloco: "agora", frase: "Reembolso pendente", acao: "Estornar na InfinitePay", desde: p.checadoEm ?? p.linkCriadoEm, tom: "erro", financeiro: true, reservaId: p.reservaId });
	}
	for (const r of D.reservas.filter((r) => r.etapa === "retirada")) {
		const at = atrasoDa(r.id, agora);
		if (at?.alemDaTolerancia) add({ numero: 4, bloco: "agora", frase: `Devolução atrasada há ${duracao(at.ms)}`, acao: "Abrir conversa", desde: r.devolucaoEm, tom: "erro", reservaId: r.id, clienteId: r.clienteId });
	}
	for (const r of D.reservas.filter((r) => ["pre_reserva", "confirmada", "separada"].includes(r.etapa))) {
		if (r.retiradaEm.getTime() > fimDeAmanha.getTime()) continue;
		const pg = situacaoPagamentos(r.id);
		if (!pg.aluguelConfirmado || !pg.caucaoConfirmada) {
			add({ numero: 6, bloco: "agora", frase: `Sai ${mesmoDia(r.retiradaEm, agora) ? "hoje" : "amanhã"} sem ${!pg.caucaoConfirmada && pg.aluguelConfirmado ? "caução confirmada" : "pagamento confirmado"}`, acao: "Reenviar link", desde: r.ordemEnviadaEm ?? r.criadaEm, tom: "atencao", reservaId: r.id, clienteId: r.clienteId });
		}
		if (r.etapa === "confirmada") add({ numero: 7, bloco: "agora", frase: `Sai ${mesmoDia(r.retiradaEm, agora) ? "hoje" : "amanhã"} e não foi separada`, acao: "Marcar separada", desde: r.criadaEm, tom: "atencao", reservaId: r.id, clienteId: r.clienteId });
	}
	for (const it of D.itens.filter((i) => i.ativo)) {
		const r = reserva(it.reservaId);
		const u = unidade(it.unidadeId);
		if (["pre_reserva", "confirmada", "separada"].includes(r.etapa) && u.estado === "em_reparo") {
			const m = manutencaoAberta(u.id);
			add({ numero: 8, bloco: "conferir", frase: `Peça em reparo com reserva em ${r.retiradaEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })}`, acao: "Trocar unidade", desde: m?.abertaEm ?? r.criadaEm, tom: "atencao", reservaId: r.id, unidadeId: u.id, manutencaoId: m?.id });
		}
	}
	for (const c of D.clientes.filter((c) => c.cadastro === "aguardando")) {
		const aberta = reservasDo(c.id).find((r) => ETAPAS_ABERTAS.includes(r.etapa));
		if (aberta) add({ numero: 9, bloco: "conferir", frase: "Cliente novo aguardando aprovação", acao: "Ver documentos", desde: c.documentos[c.documentos.length - 1]?.recebidoEm ?? c.criadoEm, tom: "atencao", reservaId: aberta.id, clienteId: c.id });
	}
	for (const r of D.reservas.filter((r) => r.etapa === "confirmada" || r.etapa === "separada")) {
		const c = cliente(r.clienteId);
		if (!r.ordemAssinadaEm || !c.contratoGeral) add({ numero: 10, bloco: "conferir", frase: "Falta assinar", acao: "Reenviar link", desde: r.ordemEnviadaEm ?? r.criadaEm, tom: "atencao", reservaId: r.id, clienteId: r.clienteId });
	}
	for (const p of D.pagamentos.filter((p) => p.status === "divergente")) {
		add({ numero: 11, bloco: "conferir", frase: "Pagamento com valor diferente", acao: "Ver pagamento", desde: p.checadoEm ?? p.linkCriadoEm, tom: "erro", financeiro: true, reservaId: p.reservaId });
	}
	for (const r of D.reservas.filter((r) => (r.etapa === "confirmada" || r.etapa === "separada") && agora.getTime() - r.retiradaEm.getTime() > HORA)) {
		add({ numero: 12, bloco: "conferir", frase: "O cliente veio retirar?", acao: "Abrir balcão", desde: new Date(r.retiradaEm.getTime() + HORA), tom: "atencao", reservaId: r.id });
	}
	for (const m of D.manutencoes.filter((m) => m.reservaOrigemId && !m.cobrancaDecididaEm)) {
		add({ numero: 13, bloco: "conferir", frase: "Voltou com dano, falta decidir cobrança", acao: "Decidir", desde: m.abertaEm, tom: "atencao", reservaId: m.reservaOrigemId, manutencaoId: m.id, unidadeId: m.unidadeId });
	}
	for (const r of D.reservas.filter((r) => r.etapa === "devolvida")) {
		const pend = D.manutencoes.some((m) => m.reservaOrigemId === r.id && !m.cobrancaDecididaEm);
		const pg = situacaoPagamentos(r.id);
		if (!pend && pg.caucaoConfirmada && !pg.caucaoDevolvida) add({ numero: 14, bloco: "organizar", frase: "Caução a devolver", acao: "Registrar devolução da caução (Pix)", desde: r.voltaEm ?? r.devolucaoEm, tom: "info", financeiro: true, reservaId: r.id, clienteId: r.clienteId });
	}
	for (const m of D.manutencoes.filter((m) => !["liberada", "descartada"].includes(m.situacao) && agora.getTime() - m.abertaEm.getTime() > 15 * DIA)) {
		add({ numero: 15, bloco: "organizar", frase: "Em reparo há 15 dias", acao: "Abrir manutenção", desde: new Date(m.abertaEm.getTime() + 15 * DIA), tom: "info", manutencaoId: m.id, unidadeId: m.unidadeId });
	}
	for (const t of D.tarefas.filter((t) => !t.feitaEm && t.venceEm.getTime() < agora.getTime())) {
		add({ numero: 16, bloco: "organizar", frase: `Tarefa vencida: ${t.titulo}`, acao: "Concluir", desde: t.venceEm, tom: "info", tarefaId: t.id, reservaId: t.reservaId, clienteId: t.clienteId });
	}
	const porCpf = new Map<string, D.Cliente[]>();
	for (const c of D.clientes) if (c.cpf) porCpf.set(c.cpf, [...(porCpf.get(c.cpf) ?? []), c]);
	for (const lista of porCpf.values()) {
		if (lista.length > 1) add({ numero: 17, bloco: "organizar", frase: "Possível cliente repetido", acao: "Ver", desde: lista[lista.length - 1].criadoEm, tom: "info", clienteId: lista[lista.length - 1].id });
	}
	return a.sort((x, y) => x.numero - y.numero || x.desde.getTime() - y.desde.getTime());
}

/** No Hoje, cada reserva mostra no máximo um alerta: o de menor número. */
export function alertasDoHoje(agora: Date, balcao: boolean): Alerta[] {
	const vistos = new Set<number>();
	return alertas(agora)
		.filter((x) => !balcao || x.balcao)
		.filter((x) => {
			if (!x.reservaId) return true;
			if (vistos.has(x.reservaId)) return false;
			vistos.add(x.reservaId);
			return true;
		});
}

/* ---------------------------------------------------------------- hoje */

export function saidasEVoltasDoDia(agora: Date, dia = agora) {
	const saidas = D.reservas.filter((r) => ["pre_reserva", "confirmada", "separada"].includes(r.etapa) && mesmoDia(r.retiradaEm, dia));
	const saiuHoje = D.reservas.filter((r) => r.etapa === "retirada" && r.saidaEm && mesmoDia(r.saidaEm, dia));
	const voltas = D.reservas.filter((r) => r.etapa === "retirada" && (mesmoDia(r.devolucaoEm, dia) || r.devolucaoEm.getTime() < agora.getTime()));
	const voltaramHoje = D.reservas.filter((r) => r.etapa === "devolvida" && r.voltaEm && mesmoDia(r.voltaEm, dia));
	return { saidas, saiuHoje, voltas, voltaramHoje };
}

export function numerosDoHoje(agora: Date) {
	const { saidas, voltas } = saidasEVoltasDoDia(agora);
	const itensSaindo = saidas.reduce((s, r) => s + itensDa(r.id).length, 0);
	const atrasadas = voltas.filter((r) => atrasoDa(r.id, agora)?.alemDaTolerancia).length;
	const aguardando = D.reservas.filter((r) => r.etapa === "pre_reserva" && (!r.expiraEm || r.expiraEm.getTime() > agora.getTime()));
	const aguardandoValor = aguardando.reduce((s, r) => s + pagamentosDa(r.id).filter((p) => p.status === "aguardando").reduce((t, p) => t + p.valor, 0), 0);
	const todas = D.unidades.filter((u) => u.estado !== "baixada");
	const naRua = todas.filter((u) => ["na_rua", "pendente"].includes(situacaoUnidade(u, agora).estado)).length;
	return { saidas: saidas.length, itensSaindo, voltas: voltas.length, atrasadas, aguardando: aguardando.length, aguardandoValor, naRua, totalUnidades: todas.length };
}

/* ---------------------------------------------------------------- clientes */

export function estatisticasCliente(clienteId: number) {
	const rs = reservasDo(clienteId);
	const alugadas = rs.filter((r) => ["retirada", "devolvida", "encerrada"].includes(r.etapa));
	const total = alugadas.reduce((s, r) => s + precoDa(r.id).valorAluguel, 0);
	const ultimo = alugadas.map((r) => r.retiradaEm).sort((a, b) => b.getTime() - a.getTime())[0];
	const abertas = rs.filter((r) => ETAPAS_ABERTAS.includes(r.etapa)).length;
	const extra: Record<number, { total: number; qtd: number; ultimo: Date }> = {
		1: { total: 2380, qtd: 3, ultimo: D.em(-40) },
		23: { total: 1460, qtd: 2, ultimo: D.em(-66) },
		24: { total: 980, qtd: 1, ultimo: D.em(-95) },
		25: { total: 6200, qtd: 4, ultimo: D.em(-30) },
		27: { total: 720, qtd: 1, ultimo: D.em(-20) },
		28: { total: 1150, qtd: 2, ultimo: D.em(-25) },
	};
	const e = extra[clienteId];
	const ultimoFinal = [ultimo, e?.ultimo].filter(Boolean).sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] as Date | undefined;
	return { reservas: rs.length + (e?.qtd ?? 0), abertas, totalAlugado: total + (e?.total ?? 0), ultimoAluguel: ultimoFinal };
}

/* ---------------------------------------------------------------- estoque: uso e retorno (exemplo) */

export function usoNoTempo(equipamentoId: number): number {
	const base = [62, 48, 35, 22, 18, 30, 41, 27, 55, 44, 12, 25, 8, 15, 37, 20, 33, 26, 19, 29, 24, 31, 9, 40, 28, 14, 11, 45, 6, 23, 50, 52, 21, 13, 10, 36, 34, 17, 16, 0];
	return base[(equipamentoId - 1) % base.length] / 100;
}

export function faturadoAcumulado(unidadeId: number): number | null {
	const u = unidade(unidadeId);
	if (!u.valorCompra) return null;
	const fator = [1.42, 0.88, 1.12, 0.64, 1.27, 0.35, 0.97, 1.55, 0.72, 1.05][unidadeId % 10];
	return Math.round(u.valorCompra * fator);
}

export function quantoJaRendeu(unidadeId: number): number | null {
	const u = unidade(unidadeId);
	const f = faturadoAcumulado(unidadeId);
	if (!u.valorCompra || f == null) return null;
	return f / u.valorCompra;
}

export function faturado12Meses(equipamentoId: number): number {
	return unidadesDo(equipamentoId, true).reduce((s, u) => s + (faturadoAcumulado(u.id) ?? 0), 0);
}

export function montaveisDoKit(kitId: number, inicio: Date, fim: Date, agora: Date): { montaveis: number; falta?: string } {
	const k = kit(kitId);
	let montaveis = Number.POSITIVE_INFINITY;
	let falta: string | undefined;
	for (const c of k.componentes) {
		const livres = disponibilidade(c.equipamentoId, inicio, fim, agora);
		const n = Math.floor(livres / c.quantidade);
		if (n < montaveis) montaveis = n;
		if (livres < c.quantidade) falta = `Falta ${c.quantidade - livres} ${equipamento(c.equipamentoId).nome.toLowerCase()}`;
	}
	return { montaveis: Number.isFinite(montaveis) ? montaveis : 0, falta };
}

/* ---------------------------------------------------------------- linha do tempo */

export function eventosDaReserva(reservaId: number) {
	const r = reserva(reservaId);
	const ev: D.Evento[] = [];
	let i = 0;
	const id = () => reservaId * 1000 + i++;
	ev.push({ id: id(), em: r.criadaEm, ator: r.origem === "robo" ? "robo" : "dono", quem: r.origem === "dono" ? "Xerxes" : undefined, texto: r.etapa === "orcamento" ? "Orçamento criado." : "Pedido criado." });
	if (r.ordemEnviadaEm) ev.push({ id: id(), em: r.ordemEnviadaEm, ator: "integracao", texto: "Ordem de locação enviada com os três links. Começaram os 20 minutos." });
	if (r.ordemAssinadaEm) ev.push({ id: id(), em: r.ordemAssinadaEm, ator: "integracao", texto: "Autentique avisou: ordem assinada." });
	for (const p of pagamentosDa(reservaId)) {
		if (p.status === "confirmado" && p.pagoEm) ev.push({ id: id(), em: p.pagoEm, ator: "integracao", texto: `InfinitePay confirmou ${p.tipo === "aluguel" ? "o aluguel" : "a caução"}. Conferido de novo pelo n8n.` });
		if (p.status === "divergente" && p.pagoEm) ev.push({ id: id(), em: p.pagoEm, ator: "integracao", texto: "Pagamento com valor diferente. Nada foi confirmado; equipe chamada." });
		if (p.status === "a_reembolsar" && p.pagoEm) ev.push({ id: id(), em: p.pagoEm, ator: "integracao", texto: "Pagou depois do prazo e a peça já estava tomada: estorno pendente." });
	}
	if (r.separadaEm) ev.push({ id: id(), em: r.separadaEm, ator: "balcao", quem: "Julia Zuqui", texto: "Marcou como separada." });
	if (r.saidaEm) ev.push({ id: id(), em: r.saidaEm, ator: "balcao", quem: "Julia Zuqui", texto: "Concluiu a saída no balcão." });
	if (r.voltaEm) ev.push({ id: id(), em: r.voltaEm, ator: "balcao", quem: "Julia Zuqui", texto: "Última volta conferida no balcão." });
	if (r.etapa === "expirada" && r.expiraEm) ev.push({ id: id(), em: r.expiraEm, ator: "automacao", texto: "Os 20 minutos passaram. O relógio do banco expirou a pré-reserva." });
	if (r.etapa === "cancelada") ev.push({ id: id(), em: new Date(r.criadaEm.getTime() + 4 * HORA), ator: "dono", quem: "Alef", texto: `Cancelada: ${r.motivoCancelamento}.` });
	if (r.encerradaEm) ev.push({ id: id(), em: r.encerradaEm, ator: "dono", quem: "Xerxes", texto: "Encerrada sem pendência." });
	ev.push(...D.eventosExtras.filter((e) => e.reservaId === reservaId));
	return ev;
}

export function eventosDoCliente(clienteId: number) {
	return [...reservasDo(clienteId).flatMap((r) => eventosDaReserva(r.id)), ...D.eventosExtras.filter((e) => e.clienteId === clienteId && !e.reservaId)];
}

export function eventosDaUnidade(unidadeId: number) {
	const movs = D.movimentacoes.filter((m) => m.unidadeId === unidadeId);
	const nomes: Record<D.Movimentacao["tipo"], string> = { saida: "Saída", volta: "Volta", envio_reparo: "Foi para reparo", volta_reparo: "Voltou do reparo", baixa: "Baixa", estorno: "Leitura desfeita" };
	return [
		...movs.map((m) => ({ id: m.id + 50000, em: m.em, ator: "balcao" as const, quem: m.feitoPor, texto: `${nomes[m.tipo]}${m.reservaId ? ` · reserva ${m.reservaId}` : ""}${m.comDano ? " · com dano" : ""}${m.observacao ? ` · ${m.observacao}` : ""}` })),
		...D.eventosExtras.filter((e) => e.unidadeId === unidadeId),
	];
}

export function janela24h(conversaId: number, agora: Date): { aberta: boolean; ate: Date } {
	const c = conversa(conversaId);
	const ate = new Date(c.ultimaMsgClienteEm.getTime() + DIA);
	return { aberta: ate.getTime() > agora.getTime(), ate };
}

export function clientesPorTelefone(telefone: string): D.Cliente[] {
	const diretos = D.clientes.filter((c) => c.telefone === telefone);
	const viaContato = D.contatos.filter((ct) => ct.telefone === telefone).map((ct) => cliente(ct.clienteId));
	return [...new Map([...diretos, ...viaContato].map((c) => [c.id, c])).values()];
}
