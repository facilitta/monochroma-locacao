"use client";

import { MolduraFicha, useFicha, useListaAtual } from "@/componentes/ui/ficha";
import { FICHAS, tituloDaFicha } from "@/componentes/fichas/registro";
import { useEffect } from "react";

export function HospedeFichas() {
	const { pilha, atual, voltar, fechar, trocar } = useFicha();
	const lista = useListaAtual();

	useEffect(() => {
		if (!atual) return;
		const aoTeclar = (e: KeyboardEvent) => {
			if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
			const alvo = e.target as HTMLElement | null;
			if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable || alvo.closest("[role=tablist],[role=menu],[role=listbox]"))) return;
			const l = lista?.current;
			if (!l || l.tipo !== atual.tipo) return;
			const i = l.ids.indexOf(atual.id);
			if (i < 0) return;
			const prox = e.key === "ArrowDown" ? l.ids[i + 1] : l.ids[i - 1];
			if (prox) {
				e.preventDefault();
				trocar(atual.tipo, prox);
			}
		};
		window.addEventListener("keydown", aoTeclar);
		return () => window.removeEventListener("keydown", aoTeclar);
	}, [atual, lista, trocar]);

	const Componente = atual ? FICHAS[atual.tipo] : undefined;
	const trilha = pilha.length > 1 ? pilha.slice(0, -1).map((p) => tituloDaFicha(p.tipo, p.id)).join(" › ") : undefined;

	return (
		<MolduraFicha aberta={!!atual && !!Componente} aoFechar={fechar}>
			{atual && Componente ? (
				<Componente key={`${atual.tipo}:${atual.id}`} id={atual.id} aoVoltar={pilha.length > 1 ? voltar : undefined} trilha={trilha} />
			) : null}
		</MolduraFicha>
	);
}
