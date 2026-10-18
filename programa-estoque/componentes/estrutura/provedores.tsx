"use client";

import { Toaster } from "@/componentes/ui/sonner";
import { TooltipProvider } from "@/componentes/ui/tooltip";
import { ProvedorListaAtual } from "@/componentes/ui/ficha";
import { ProvedorPapel } from "@/lib/papel";
import { ProvedorRelogio } from "@/lib/relogio";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";

const CHAVE_TEMA_ESCOLHIDO = "monochroma:tema-escolhido";
const CHAVE_TEXTO_MAIOR = "monochroma:texto-maior";

export function temaFoiEscolhido(): boolean {
	try {
		if (new URLSearchParams(window.location.search).get("tema")) return true;
		return window.localStorage.getItem(CHAVE_TEMA_ESCOLHIDO) === "sim";
	} catch {
		return false;
	}
}

export function marcarTemaEscolhido() {
	try {
		window.localStorage.setItem(CHAVE_TEMA_ESCOLHIDO, "sim");
	} catch {
		// sem armazenamento
	}
}

export function lerTextoMaior(): boolean {
	try {
		return window.localStorage.getItem(CHAVE_TEXTO_MAIOR) === "sim";
	} catch {
		return false;
	}
}

export function aplicarTextoMaior(ligado: boolean) {
	document.documentElement.dataset.textoMaior = ligado ? "sim" : "nao";
	try {
		window.localStorage.setItem(CHAVE_TEXTO_MAIOR, ligado ? "sim" : "nao");
	} catch {
		// sem armazenamento
	}
}

function TemaDaUrl() {
	const { setTheme } = useTheme();
	useEffect(() => {
		try {
			const t = new URLSearchParams(window.location.search).get("tema");
			if (t === "escuro") setTheme("dark");
			if (t === "claro") setTheme("light");
			if (!t) {
				const doVisualizador = document.documentElement.getAttribute("data-theme");
				if (doVisualizador === "dark" || doVisualizador === "light") setTheme(doVisualizador);
			}
		} catch {
			// segue o tema salvo
		}
		document.documentElement.dataset.textoMaior = lerTextoMaior() ? "sim" : "nao";
	}, [setTheme]);
	return null;
}

export function useMontado(): boolean {
	const [montado, setMontado] = useState(false);
	useEffect(() => setMontado(true), []);
	return montado;
}

export function Provedores({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
			<TemaDaUrl />
			<ProvedorRelogio>
				<ProvedorPapel>
					<TooltipProvider delayDuration={300}>
						<ProvedorListaAtual>{children}</ProvedorListaAtual>
						<Toaster />
					</TooltipProvider>
				</ProvedorPapel>
			</ProvedorRelogio>
		</ThemeProvider>
	);
}
