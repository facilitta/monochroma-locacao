"use client";
// Registro das fichas laterais: cada tipo de registro tem o seu componente em componentes/fichas/.

import type { TipoFicha } from "@/componentes/ui/ficha";
import { FichaAutomacao } from "@/componentes/fichas/ficha-automacao";
import { FichaCliente } from "@/componentes/fichas/ficha-cliente";
import { FichaEquipamento } from "@/componentes/fichas/ficha-equipamento";
import { FichaKit } from "@/componentes/fichas/ficha-kit";
import { FichaManutencao } from "@/componentes/fichas/ficha-manutencao";
import { FichaReserva } from "@/componentes/fichas/ficha-reserva";
import { FichaUnidade } from "@/componentes/fichas/ficha-unidade";
import * as Q from "@/prototipo/consultas";
import type { ComponentType } from "react";

export type PropsFicha = { id: string; aoVoltar?: () => void; trilha?: string };

export const FICHAS: Partial<Record<TipoFicha, ComponentType<PropsFicha>>> = {
	reserva: FichaReserva,
	cliente: FichaCliente,
	equipamento: FichaEquipamento,
	unidade: FichaUnidade,
	manutencao: FichaManutencao,
	kit: FichaKit,
	automacao: FichaAutomacao,
};

export function tituloDaFicha(tipo: TipoFicha, id: string): string {
	const n = Number(id);
	switch (tipo) {
		case "reserva":
			return `Reserva ${id}`;
		case "cliente":
			return Q.cliente(n)?.nome ?? "Cliente";
		case "equipamento":
			return Q.equipamento(n)?.nome ?? "Equipamento";
		case "unidade":
			return Q.unidade(n)?.codigo ?? "Unidade";
		case "manutencao":
			return `Manutenção ${id}`;
		case "kit":
			return Q.kit(n)?.nome ?? "Kit";
		default:
			return id;
	}
}
