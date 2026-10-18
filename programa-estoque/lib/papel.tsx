"use client";

// Papel de quem está usando o app. No protótipo, troca-se pelo seletor da faixa de cima.
// Na Fase 1, o papel vem do login (Better Auth com Google) e é conferido no servidor.

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Papel = "dono" | "balcao";

export type Usuario = { id: number; nome: string; papel: Papel; email: string };

export const USUARIOS: Usuario[] = [
	{ id: 1, nome: "Xerxes", papel: "dono", email: "xerxes@exemplo.com" },
	{ id: 2, nome: "Alef", papel: "dono", email: "alef@exemplo.com" },
	{ id: 3, nome: "Julia Zuqui", papel: "balcao", email: "julia@exemplo.com" },
];

type ContextoPapel = {
	papel: Papel;
	usuario: Usuario;
	podeVerFinanceiro: boolean;
	ehDono: boolean;
	definirUsuario: (id: number) => void;
};

const Contexto = createContext<ContextoPapel | null>(null);

function lerInicial(): number {
	try {
		const p = new URLSearchParams(window.location.search).get("papel");
		if (p === "balcao") return 3;
		if (p === "dono") return 2;
		const salvo = window.localStorage.getItem("monochroma:usuario");
		if (salvo && USUARIOS.some((u) => String(u.id) === salvo)) return Number(salvo);
	} catch {
		return 2;
	}
	return 2;
}

export function ProvedorPapel({ children }: { children: React.ReactNode }) {
	const [usuarioId, setUsuarioId] = useState<number>(lerInicial);
	const definirUsuario = useCallback((id: number) => {
		setUsuarioId(id);
		try {
			window.localStorage.setItem("monochroma:usuario", String(id));
		} catch {
			// sem armazenamento: segue só na memória
		}
	}, []);
	const valor = useMemo<ContextoPapel>(() => {
		const usuario = USUARIOS.find((u) => u.id === usuarioId) ?? USUARIOS[1];
		return {
			papel: usuario.papel,
			usuario,
			podeVerFinanceiro: usuario.papel === "dono",
			ehDono: usuario.papel === "dono",
			definirUsuario,
		};
	}, [usuarioId, definirUsuario]);
	return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePapel(): ContextoPapel {
	const ctx = useContext(Contexto);
	if (!ctx) throw new Error("usePapel fora do ProvedorPapel");
	return ctx;
}

export function SoDono({ children, senao = null }: { children: React.ReactNode; senao?: React.ReactNode }) {
	const { ehDono } = usePapel();
	return <>{ehDono ? children : senao}</>;
}

export function SoFinanceiro({ children, senao = null }: { children: React.ReactNode; senao?: React.ReactNode }) {
	const { podeVerFinanceiro } = usePapel();
	return <>{podeVerFinanceiro ? children : senao}</>;
}
