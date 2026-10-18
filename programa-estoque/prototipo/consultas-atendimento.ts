// Dados e consultas extras das telas de atendimento (Hoje, Conversas, Alertas, Balcão). Tudo inventado.

import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { DIA, HORA, mesmoDia } from "@/lib/formatos";
import type { Tom } from "@/lib/regras/situacao";

const em = D.em;

/* ---------------------------------------------------------------- mensagens extras */

export const mensagensExtras: D.Mensagem[] = [
	{
		id: 9001,
		conversaId: 5,
		autor: "cliente",
		texto: "[foto: comprovante de Pix]",
		em: new Date(em(16, 9, 40).getTime() + 20_000),
		anexo: { tipo: "foto", restrito: false, descricao: "comprovante de Pix" },
	},
	{
		id: 9002,
		conversaId: 8,
		autor: "equipe",
		usuario: "Alef",
		texto: "As luzes estão livres até amanhã. Já te mando o link da prorrogação.",
		em: em(16, 8, 25),
		status: "falhou",
	},
];

export function mensagensDaConversa(conversaId: number): D.Mensagem[] {
	return [...Q.mensagensDa(conversaId), ...mensagensExtras.filter((m) => m.conversaId === conversaId)].sort(
		(a, b) => a.em.getTime() - b.em.getTime(),
	);
}

/* ---------------------------------------------------------------- respostas prontas */

export const respostasProntas: { atalho: string; titulo: string; texto: string }[] = [
	{ atalho: "endereco", titulo: "Endereço e horário", texto: "A retirada e a devolução são no nosso endereço [a definir], de segunda a sexta das 9h às 18h e no sábado das 9h às 13h." },
	{ atalho: "caucao", titulo: "Caução por Pix", texto: "A caução é paga só por Pix, pelo link separado, e volta por Pix depois da conferência dos equipamentos." },
	{ atalho: "documentos", titulo: "Documentos do primeiro aluguel", texto: "No primeiro aluguel, preciso da foto do documento, de uma selfie segurando o documento e do comprovante de endereço." },
	{ atalho: "link", titulo: "Pagar pelo link", texto: "O pagamento precisa ser feito pelo link da InfinitePay, com o valor total. Assim o sistema confirma sozinho." },
	{ atalho: "obrigado", titulo: "Agradecimento", texto: "Obrigado! Qualquer coisa, é só chamar por aqui." },
];

/* ---------------------------------------------------------------- situação da conversa */

export type SituacaoConversa = {
	texto: string;
	tom: Tom;
	andamento?: boolean;
	esperandoVoce: boolean;
};

export function situacaoConversa(c: D.Conversa, agora: Date, sobrescrita?: Partial<D.Conversa>): SituacaoConversa {
	const x = { ...c, ...sobrescrita };
	if (x.comQuem === "equipe" && x.assumidaPor) return { texto: `Assumida por ${x.assumidaPor}`, tom: "info", esperandoVoce: false };
	if (x.comQuem === "equipe") return { texto: "Esperando você", tom: "atencao", esperandoVoce: true };
	if (x.roboSilenciadoAte && x.roboSilenciadoAte.getTime() > agora.getTime()) return { texto: "Robô pausado", tom: "neutro", esperandoVoce: false };
	if (x.roboRespondendo) return { texto: "Robô respondendo", tom: "neutro", andamento: true, esperandoVoce: false };
	return { texto: "Com o robô", tom: "neutro", esperandoVoce: false };
}

export function semCadastro(c: D.Conversa): boolean {
	if (!c.clienteId) return true;
	const cl = Q.cliente(c.clienteId);
	return cl.cadastro === "aguardando" && cl.documentos.length === 0;
}

/* ---------------------------------------------------------------- alertas resolvidos (exemplo) */

export type AlertaResolvido = {
	chave: string;
	numero: number;
	frase: string;
	tom: Tom;
	balcao: boolean;
	financeiro?: boolean;
	desde: Date;
	resolvidoEm: Date;
	reservaId?: number;
	clienteId?: number;
	unidadeId?: number;
	manutencaoId?: number;
	comoResolveu: string;
};

export const alertasResolvidos: AlertaResolvido[] = [
	{ chave: "r1", numero: 4, frase: "Devolução atrasada", tom: "erro", balcao: true, desde: em(10, 15), resolvidoEm: em(10, 16, 40), reservaId: 1034, comoResolveu: "A peça voltou no balcão." },
	{ chave: "r2", numero: 6, frase: "Sai até amanhã sem pagamento confirmado", tom: "atencao", balcao: true, desde: em(14, 17), resolvidoEm: em(14, 19, 11), reservaId: 1042, comoResolveu: "A InfinitePay confirmou a caução." },
	{ chave: "r3", numero: 9, frase: "Cliente novo aguardando aprovação", tom: "atencao", balcao: false, desde: em(12, 10), resolvidoEm: em(12, 11, 30), clienteId: 19, comoResolveu: "Cadastro aprovado por Alef." },
	{ chave: "r4", numero: 14, frase: "Caução a devolver", tom: "info", balcao: false, financeiro: true, desde: em(12, 14), resolvidoEm: em(13, 10), reservaId: 1033, comoResolveu: "Caução devolvida por Pix." },
	{ chave: "r5", numero: 7, frase: "Sai até amanhã e não foi separada", tom: "atencao", balcao: true, desde: em(15, 9), resolvidoEm: em(16, 8, 30), reservaId: 1042, comoResolveu: "Marcada como separada por Julia Zuqui." },
	{ chave: "r6", numero: 1, frase: "Robô passou a conversa", tom: "atencao", balcao: true, desde: em(16, 8, 15), resolvidoEm: em(16, 8, 20), reservaId: 1045, comoResolveu: "Alef respondeu pela tela Conversas." },
	{ chave: "r7", numero: 11, frase: "Pagamento com valor diferente", tom: "erro", balcao: false, financeiro: true, desde: em(3, 10, 20), resolvidoEm: em(3, 11), reservaId: 1033, comoResolveu: "Cliente pagou o valor certo pelo novo link." },
];

/* ---------------------------------------------------------------- balcão */

export type ItemBalcao = {
	itemId: number;
	unidade: D.Unidade;
	equipamento: D.Equipamento;
	basico: boolean;
	saiu: boolean;
	voltou: boolean;
	ativo: boolean;
};

export function itensDoBalcao(reservaId: number): ItemBalcao[] {
	const basicos = new Set(Q.linhasDa(reservaId).filter((l) => l.tipo === "basico").map((l) => l.equipamentoId));
	return Q.itensDa(reservaId).map((it) => {
		const u = Q.unidade(it.unidadeId);
		const movs = D.movimentacoes.filter((m) => m.reservaId === reservaId && m.unidadeId === u.id);
		return {
			itemId: it.id,
			unidade: u,
			equipamento: Q.equipamento(u.equipamentoId),
			basico: basicos.has(u.equipamentoId),
			saiu: movs.some((m) => m.tipo === "saida"),
			voltou: movs.some((m) => m.tipo === "volta"),
			ativo: it.ativo,
		};
	});
}

export function listasDoBalcao(agora: Date) {
	const saidas = D.reservas
		.filter((r) => ["pre_reserva", "confirmada", "separada"].includes(r.etapa) && mesmoDia(r.retiradaEm, agora))
		.filter((r) => r.etapa !== "pre_reserva" || !r.expiraEm || r.expiraEm.getTime() > agora.getTime() - HORA * 6)
		.sort((a, b) => a.retiradaEm.getTime() - b.retiradaEm.getTime());
	const naRua = D.reservas.filter((r) => r.etapa === "retirada");
	const atrasadas = naRua.filter((r) => r.devolucaoEm.getTime() < agora.getTime()).sort((a, b) => a.devolucaoEm.getTime() - b.devolucaoEm.getTime());
	const voltas = naRua
		.filter((r) => r.devolucaoEm.getTime() >= agora.getTime() && r.devolucaoEm.getTime() < agora.getTime() + DIA && mesmoDia(r.devolucaoEm, agora))
		.sort((a, b) => a.devolucaoEm.getTime() - b.devolucaoEm.getTime());
	return { saidas, voltas, atrasadas };
}

/** Acha a reserva do dia para uma etiqueta lida direto na entrada do balcão. */
export function reservaDoDiaPorEtiqueta(codigo: string, agora: Date): { reservaId: number; sentido: "saida" | "volta" } | null {
	const u = Q.unidadePorCodigo(codigo);
	if (!u) return null;
	const { saidas, voltas, atrasadas } = listasDoBalcao(agora);
	for (const r of [...atrasadas, ...voltas]) {
		if (itensDoBalcao(r.id).some((i) => i.unidade.id === u.id && i.saiu && !i.voltou)) return { reservaId: r.id, sentido: "volta" };
	}
	for (const r of saidas) {
		if (Q.itensDa(r.id).some((i) => i.unidadeId === u.id)) return { reservaId: r.id, sentido: "saida" };
	}
	return null;
}
