// Fonte única das etapas da reserva no código, espelhando o tipo status_reserva do banco (seção 6.4).

export type Etapa =
	| "orcamento"
	| "pre_reserva"
	| "confirmada"
	| "separada"
	| "retirada"
	| "devolvida"
	| "encerrada"
	| "expirada"
	| "cancelada";

export type DefinicaoEtapa = {
	nome: string;
	ordem: number;
	ponto: string;
	faixa: string;
	barra: string;
	borda: string;
	vazado?: boolean;
	noQuadro: boolean;
	recolhida?: boolean;
	seguraPeca: "nao" | "sim" | "ate-expirar" | "so-folga";
	exige?: string;
};

export const ETAPAS: Record<Etapa, DefinicaoEtapa> = {
	orcamento: {
		nome: "Orçamento",
		ordem: 1,
		ponto: "border border-etapa-orcamento bg-transparent",
		faixa: "bg-etapa-orcamento",
		barra: "border border-dashed border-etapa-orcamento",
		borda: "border-etapa-orcamento",
		vazado: true,
		noQuadro: true,
		seguraPeca: "nao",
		exige: "Não segura peça. Vira pré-reserva quando a ordem é enviada.",
	},
	pre_reserva: {
		nome: "Pré-reserva",
		ordem: 2,
		ponto: "bg-etapa-pre-reserva",
		faixa: "bg-etapa-pre-reserva",
		barra: "border border-dashed border-etapa-pre-reserva",
		borda: "border-etapa-pre-reserva",
		noQuadro: true,
		seguraPeca: "ate-expirar",
		exige: "Segura as peças por 20 minutos a partir do envio da ordem. Não renova.",
	},
	confirmada: {
		nome: "Confirmada",
		ordem: 3,
		ponto: "bg-etapa-confirmada",
		faixa: "bg-etapa-confirmada",
		barra: "bg-etapa-confirmada/15 border-l-2 border-etapa-confirmada",
		borda: "border-etapa-confirmada",
		noQuadro: true,
		seguraPeca: "sim",
		exige: "Aluguel e caução confirmados pela InfinitePay (dupla checagem).",
	},
	separada: {
		nome: "Separada",
		ordem: 4,
		ponto: "bg-etapa-separada",
		faixa: "bg-etapa-separada",
		barra: "bg-etapa-separada/15 border-l-2 border-etapa-separada",
		borda: "border-etapa-separada",
		noQuadro: true,
		seguraPeca: "sim",
		exige: "Peças separadas no depósito. Opcional.",
	},
	retirada: {
		nome: "Na rua",
		ordem: 5,
		ponto: "bg-etapa-na-rua",
		faixa: "bg-etapa-na-rua",
		barra: "bg-etapa-na-rua/15 border-l-2 border-etapa-na-rua",
		borda: "border-etapa-na-rua",
		noQuadro: true,
		seguraPeca: "sim",
		exige: "Só pelo balcão (Concluir saída): pagamento, caução, cadastro e assinaturas.",
	},
	devolvida: {
		nome: "Devolvida",
		ordem: 6,
		ponto: "bg-etapa-devolvida",
		faixa: "bg-etapa-devolvida",
		barra: "bg-etapa-devolvida/15 border-l-2 border-etapa-devolvida",
		borda: "border-etapa-devolvida",
		noQuadro: true,
		seguraPeca: "so-folga",
		exige: "Última volta no balcão. Segura só a folga de conferência.",
	},
	encerrada: {
		nome: "Encerrada",
		ordem: 7,
		ponto: "bg-etapa-encerrada",
		faixa: "bg-etapa-encerrada",
		barra: "bg-etapa-encerrada/15 border-l-2 border-etapa-encerrada",
		borda: "border-etapa-encerrada",
		noQuadro: true,
		recolhida: true,
		seguraPeca: "nao",
		exige: "Sem pendência: dano decidido e caução devolvida ou retida com motivo.",
	},
	expirada: {
		nome: "Expirada",
		ordem: 8,
		ponto: "bg-etapa-fora",
		faixa: "bg-etapa-fora",
		barra: "border border-dashed border-etapa-fora",
		borda: "border-etapa-fora",
		noQuadro: false,
		recolhida: true,
		seguraPeca: "nao",
		exige: "Os 20 minutos passaram sem pagamento. O relógio do banco expira.",
	},
	cancelada: {
		nome: "Cancelada",
		ordem: 9,
		ponto: "bg-etapa-fora",
		faixa: "bg-etapa-fora",
		barra: "border border-dashed border-etapa-fora",
		borda: "border-etapa-fora",
		noQuadro: false,
		recolhida: true,
		seguraPeca: "nao",
		exige: "Cancelada com motivo, por cancelar_reserva.",
	},
};

export const ORDEM_DAS_ETAPAS: Etapa[] = [
	"orcamento",
	"pre_reserva",
	"confirmada",
	"separada",
	"retirada",
	"devolvida",
	"encerrada",
	"expirada",
	"cancelada",
];

export const ETAPAS_DO_QUADRO: Etapa[] = ORDEM_DAS_ETAPAS.filter((e) => ETAPAS[e].noQuadro);

export const ETAPAS_DA_REGUA: Etapa[] = [
	"orcamento",
	"pre_reserva",
	"confirmada",
	"separada",
	"retirada",
	"devolvida",
	"encerrada",
];

export const ETAPAS_QUE_SEGURAM_PECA: Etapa[] = ["pre_reserva", "confirmada", "separada", "retirada"];

export const ETAPAS_ABERTAS: Etapa[] = ["orcamento", "pre_reserva", "confirmada", "separada", "retirada", "devolvida"];

export type Mudanca = { de: Etapa; para: Etapa; manual: boolean; onde?: string };

export const MUDANCAS_MANUAIS: Mudanca[] = [
	{ de: "confirmada", para: "separada", manual: true },
	{ de: "separada", para: "confirmada", manual: true },
];

export function mudancaPermitida(de: Etapa, para: Etapa): "manual" | "outra-tela" | "proibida" {
	if (MUDANCAS_MANUAIS.some((m) => m.de === de && m.para === para)) return "manual";
	if (para === "pre_reserva" && de === "orcamento") return "outra-tela";
	if (para === "confirmada") return "outra-tela";
	if (para === "retirada" && (de === "confirmada" || de === "separada")) return "outra-tela";
	if (para === "devolvida" && de === "retirada") return "outra-tela";
	if (para === "cancelada" && ETAPAS_ABERTAS.includes(de) && de !== "devolvida") return "outra-tela";
	if (para === "encerrada" && de === "devolvida") return "outra-tela";
	return "proibida";
}
