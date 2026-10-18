// Grupo "situação": ok, atenção, informação, erro e neutro (seção 8.3).
import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import CircleDash from "@carbon/icons-react/es/CircleDash";
import Information from "@carbon/icons-react/es/Information";
import Misuse from "@carbon/icons-react/es/Misuse";
import WarningAlt from "@carbon/icons-react/es/WarningAlt";
import type { CarbonIcon } from "@/componentes/ui/icon";

export type Tom = "ok" | "atencao" | "info" | "erro" | "neutro";

export const TONS: Record<Tom, { nome: string; icone: CarbonIcon; texto: string; fundo: string; borda: string; ponto: string }> = {
	ok: {
		nome: "ok",
		icone: CheckmarkOutline,
		texto: "text-ok",
		fundo: "bg-ok-fundo",
		borda: "border-ok-borda",
		ponto: "bg-ok text-ok",
	},
	atencao: {
		nome: "atenção",
		icone: WarningAlt,
		texto: "text-atencao",
		fundo: "bg-atencao-fundo",
		borda: "border-atencao-borda",
		ponto: "bg-atencao text-atencao",
	},
	info: {
		nome: "informação",
		icone: Information,
		texto: "text-info",
		fundo: "bg-info-fundo",
		borda: "border-info-borda",
		ponto: "bg-info text-info",
	},
	erro: {
		nome: "erro",
		icone: Misuse,
		texto: "text-erro",
		fundo: "bg-erro-fundo",
		borda: "border-erro-borda",
		ponto: "bg-erro text-erro",
	},
	neutro: {
		nome: "neutro",
		icone: CircleDash,
		texto: "text-neutro",
		fundo: "bg-neutro-fundo",
		borda: "border-neutro-borda",
		ponto: "bg-neutro text-neutro",
	},
};
