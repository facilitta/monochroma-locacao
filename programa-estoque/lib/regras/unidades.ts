// Estados visíveis da unidade (visão situacao_unidades, seção 6.5).
import Archive from "@carbon/icons-react/es/Archive";
import Calendar from "@carbon/icons-react/es/Calendar";
import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import Delivery from "@carbon/icons-react/es/Delivery";
import Search from "@carbon/icons-react/es/Search";
import Time from "@carbon/icons-react/es/Time";
import Tools from "@carbon/icons-react/es/Tools";
import WarningAlt from "@carbon/icons-react/es/WarningAlt";
import type { CarbonIcon } from "@/componentes/ui/icon";

export type EstadoUnidade =
	| "livre"
	| "pre_reservada"
	| "reservada"
	| "na_rua"
	| "pendente"
	| "conferencia"
	| "reparo"
	| "baixada";

export type DefinicaoEstado = {
	nome: string;
	icone: CarbonIcon;
	texto: string;
	pilula: string;
	padrao: string;
	podeReservarAgora: string;
	regra: string;
};

export const ESTADOS_UNIDADE: Record<EstadoUnidade, DefinicaoEstado> = {
	livre: {
		nome: "Livre",
		icone: CheckmarkOutline,
		texto: "text-unidade-livre",
		pilula: "border border-unidade-livre",
		padrao: "contorno cheio",
		podeReservarAgora: "sim",
		regra: "Estado ok, sem item ativo cobrindo agora.",
	},
	pre_reservada: {
		nome: "Pré-reservada",
		icone: Time,
		texto: "text-unidade-pre-reservada",
		pilula: "border border-dashed border-unidade-pre-reservada",
		padrao: "contorno tracejado",
		podeReservarAgora: "não, até expirar",
		regra: "Item ativo numa pré-reserva; mostra os minutos que faltam.",
	},
	reservada: {
		nome: "Reservada",
		icone: Calendar,
		texto: "text-unidade-reservada",
		pilula: "border border-unidade-reservada",
		padrao: "contorno cheio",
		podeReservarAgora: "não, no período",
		regra: "Reserva confirmada ou separada com retirada nas próximas 24 h.",
	},
	na_rua: {
		nome: "Na rua",
		icone: Delivery,
		texto: "text-unidade-na-rua",
		pilula: "border border-unidade-na-rua bg-unidade-na-rua-fundo",
		padrao: "fundo tingido",
		podeReservarAgora: "não",
		regra: "Saída sem volta numa reserva na rua.",
	},
	pendente: {
		nome: "Pendente com cliente",
		icone: WarningAlt,
		texto: "text-unidade-pendente",
		pilula: "border-2 border-double border-unidade-pendente",
		padrao: "contorno duplo",
		podeReservarAgora: "não",
		regra: "Saída sem volta numa reserva que já teve pelo menos uma volta.",
	},
	conferencia: {
		nome: "Em conferência",
		icone: Search,
		texto: "text-unidade-conferencia",
		pilula: "border border-unidade-conferencia",
		padrao: "contorno cheio",
		podeReservarAgora: "não, até o fim da folga",
		regra: "Voltou ok e ainda está dentro da folga.",
	},
	reparo: {
		nome: "Em reparo",
		icone: Tools,
		texto: "text-unidade-reparo",
		pilula: "border border-unidade-reparo hachurado-leve",
		padrao: "fundo hachurado",
		podeReservarAgora: "não",
		regra: "Manutenção aberta.",
	},
	baixada: {
		nome: "Baixada",
		icone: Archive,
		texto: "text-unidade-baixada line-through",
		pilula: "border border-unidade-baixada",
		padrao: "texto riscado",
		podeReservarAgora: "nunca",
		regra: "Vendida, perdida ou roubada, com motivo.",
	},
};

export const ORDEM_DOS_ESTADOS: EstadoUnidade[] = [
	"livre",
	"pre_reservada",
	"reservada",
	"na_rua",
	"pendente",
	"conferencia",
	"reparo",
	"baixada",
];
