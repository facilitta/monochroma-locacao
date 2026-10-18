"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const AGORA_DO_PROTOTIPO = new Date("2026-10-16T10:00:00-03:00");

const RelogioContexto = createContext<{ parado: boolean; inicio: number }>({ parado: false, inicio: 0 });

export function ProvedorRelogio({ children }: { children: React.ReactNode }) {
	const [valor] = useState(() => {
		let parado = false;
		try {
			parado = new URLSearchParams(window.location.search).get("relogio") === "parado";
		} catch {
			parado = false;
		}
		return { parado, inicio: Date.now() };
	});
	return <RelogioContexto.Provider value={valor}>{children}</RelogioContexto.Provider>;
}

function calcular(parado: boolean, inicio: number): Date {
	if (parado || inicio === 0) return AGORA_DO_PROTOTIPO;
	return new Date(AGORA_DO_PROTOTIPO.getTime() + (Date.now() - inicio));
}

export function useAgora(intervaloMs = 1000): Date {
	const { parado, inicio } = useContext(RelogioContexto);
	const [agora, setAgora] = useState(() => calcular(parado, inicio));
	useEffect(() => {
		if (parado) return;
		const id = window.setInterval(() => setAgora(calcular(parado, inicio)), intervaloMs);
		return () => window.clearInterval(id);
	}, [parado, inicio, intervaloMs]);
	return agora;
}
