"use client";
// Navegação da versão de arquivo único: a rota vai no parâmetro "tela", guardado em memória
// (prototipo/vite/endereco.ts), para a página funcionar inteira dentro de um único arquivo HTML.

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useSyncExternalStore } from "react";
import type * as React from "react";
import { assinarBusca, irPara, lerBusca } from "./endereco";

export function paraEnderecoLocal(href: string): string {
	const [caminho, qs = ""] = href.split("?");
	const p = new URLSearchParams(qs);
	const tela = caminho.replace(/^\//, "") || "hoje";
	const final = new URLSearchParams();
	final.set("tela", tela);
	for (const [k, v] of p) final.set(k, v);
	return `?${final.toString()}`;
}

function subirAoTopo() {
	document.getElementById("conteudo")?.scrollTo?.({ top: 0 });
}

export type LinkProps = Omit<React.ComponentProps<"a">, "href"> & { href: string; substituir?: boolean };

export function Link({ href, substituir, onClick, ...props }: LinkProps) {
	const destino = paraEnderecoLocal(href);
	return (
		<a
			href={destino}
			onClick={(e) => {
				onClick?.(e);
				if (e.defaultPrevented) return;
				e.preventDefault();
				irPara(destino, substituir);
				if (!substituir) subirAoTopo();
			}}
			{...props}
		/>
	);
}

export function useCaminho(): string {
	const busca = useSyncExternalStore(assinarBusca, lerBusca, lerBusca);
	const tela = new URLSearchParams(busca).get("tela");
	return `/${tela || "hoje"}`;
}

export function useNavegar(): (href: string, opcoes?: { substituir?: boolean }) => void {
	return useCallback((href, opcoes) => {
		irPara(paraEnderecoLocal(href), opcoes?.substituir);
		if (!opcoes?.substituir) subirAoTopo();
	}, []);
}

export function useBusca(): URLSearchParams {
	const busca = useSyncExternalStore(assinarBusca, lerBusca, lerBusca);
	const p = new URLSearchParams(busca);
	p.delete("tela");
	return p;
}

export function useParametro(nome: string): [string | null, (valor: string | null) => void] {
	const [valor, definir] = useQueryState(nome, parseAsString.withOptions({ history: "push", scroll: false }));
	return [valor, (v) => void definir(v)];
}
