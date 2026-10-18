"use client";

// Navegação do app no Next.js. A versão de arquivo único do protótipo troca este módulo
// por prototipo/vite/navegacao.tsx, com a mesma interface.

import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import type * as React from "react";

export type LinkProps = Omit<React.ComponentProps<"a">, "href"> & { href: string; substituir?: boolean };

export function Link({ href, substituir, ...props }: LinkProps) {
	return <NextLink href={href} replace={substituir} scroll={!substituir} {...props} />;
}

export function useCaminho(): string {
	return usePathname() ?? "/";
}

export function useNavegar(): (href: string, opcoes?: { substituir?: boolean }) => void {
	const router = useRouter();
	return (href, opcoes) => {
		if (opcoes?.substituir) router.replace(href, { scroll: false });
		else router.push(href);
	};
}

export function useBusca(): URLSearchParams {
	const p = useSearchParams();
	return new URLSearchParams(p?.toString() ?? "");
}

export function useParametro(nome: string): [string | null, (valor: string | null) => void] {
	const [valor, definir] = useQueryState(nome, parseAsString.withOptions({ history: "push", scroll: false }));
	return [valor, (v) => void definir(v)];
}
