"use client";

// Só no protótipo: ?estado=vazio|carregando|erro mostra o estado correspondente da tela,
// e ?internet=nao simula a falta de internet. Na Fase 1 estes estados vêm da consulta real.

import { useEffect, useState } from "react";
import { horaRelogio } from "@/lib/formatos";
import { useBusca } from "@/lib/navegacao";
import { useAgora } from "@/lib/relogio";

declare global {
	interface Window {
		__buscaAtual?: () => string;
	}
}

export type EstadoTela = "normal" | "vazio" | "carregando" | "erro";

export function useEstadoTela(): EstadoTela {
	const e = useBusca().get("estado");
	return e === "vazio" || e === "carregando" || e === "erro" ? e : "normal";
}

export function useConexao(): { offline: boolean; hora: string } {
	const simular = useBusca().get("internet") === "nao";
	const [online, setOnline] = useState(true);
	useEffect(() => {
		const atualizar = () => setOnline(navigator.onLine);
		atualizar();
		window.addEventListener("online", atualizar);
		window.addEventListener("offline", atualizar);
		return () => {
			window.removeEventListener("online", atualizar);
			window.removeEventListener("offline", atualizar);
		};
	}, []);
	const offline = simular || !online;
	const agora = useAgora(60_000);
	const [hora] = useState(() => horaRelogio(agora));
	return { offline, hora: offline ? hora : "" };
}
