"use client";
// Estado local das automações no protótipo (liga/desliga e testes simulados), compartilhado entre a lista e a ficha.

import * as D from "@/prototipo/dados";
import { useSyncExternalStore } from "react";
import type { Tom } from "@/lib/regras/situacao";

export const TOM_RESULTADO: Record<D.Execucao["resultado"], Tom> = { ok: "ok", erro: "erro", cancelada: "neutro", simulada: "info" };
export const NOME_RESULTADO: Record<D.Execucao["resultado"], string> = { ok: "deu certo", erro: "com erro", cancelada: "cancelada", simulada: "teste simulado" };

type Estado = { ligadas: Record<number, boolean>; simuladas: Record<number, D.Execucao[]> };

let estado: Estado = {
	ligadas: Object.fromEntries(D.automacoes.map((a) => [a.id, a.ligada])),
	simuladas: {},
};
const ouvintes = new Set<() => void>();

function emitir(novo: Estado) {
	estado = novo;
	for (const o of ouvintes) o();
}

export function useAutomacoes(): Estado {
	return useSyncExternalStore(
		(cb) => {
			ouvintes.add(cb);
			return () => ouvintes.delete(cb);
		},
		() => estado,
		() => estado,
	);
}

export function ligarAutomacao(id: number, ligada: boolean) {
	emitir({ ...estado, ligadas: { ...estado.ligadas, [id]: ligada } });
}

export function simularExecucao(id: number, exec: D.Execucao) {
	emitir({ ...estado, simuladas: { ...estado.simuladas, [id]: [exec, ...(estado.simuladas[id] ?? [])] } });
}
