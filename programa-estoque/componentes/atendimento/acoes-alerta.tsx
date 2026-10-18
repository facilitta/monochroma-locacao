"use client";
// Ação direta de cada alerta da tabela 7.1. Usado pelo Hoje e pela tela Alertas.

import { Button } from "@/componentes/ui/button";
import { useFicha } from "@/componentes/ui/ficha";
import { useConexao } from "@/lib/estado-prototipo";
import { useNavegar } from "@/lib/navegacao";
import type { Alerta } from "@/prototipo/consultas";
import * as Q from "@/prototipo/consultas";
import { toast } from "sonner";

export type AlvoAlerta = Pick<Alerta, "numero" | "reservaId" | "clienteId" | "unidadeId" | "manutencaoId" | "conversaId" | "tarefaId"> & { acao?: string };

/** Abre o registro do alerta (ficha ou conversa) ao clicar na linha. */
export function useAbrirAlerta() {
	const { abrir } = useFicha();
	const navegar = useNavegar();
	return (a: AlvoAlerta) => {
		if ((a.numero === 1 || a.numero === 2) && a.conversaId) return navegar(`/conversas?conversa=${a.conversaId}`);
		if (a.numero === 13 || a.numero === 15) {
			if (a.manutencaoId) return abrir("manutencao", a.manutencaoId);
		}
		if (a.numero === 9 || a.numero === 17) {
			if (a.clienteId) return abrir("cliente", a.clienteId, { aba: a.numero === 9 ? "documentos" : undefined });
		}
		if (a.reservaId) return abrir("reserva", a.reservaId);
		if (a.clienteId) return abrir("cliente", a.clienteId);
		if (a.unidadeId) return abrir("unidade", a.unidadeId);
	};
}

export function useAcaoAlerta() {
	const { abrir } = useFicha();
	const navegar = useNavegar();
	const { offline } = useConexao();
	return (a: AlvoAlerta) => {
		switch (a.numero) {
			case 1:
			case 2:
				if (a.conversaId) navegar(`/conversas?conversa=${a.conversaId}`);
				return;
			case 3:
			case 11:
			case 14:
				if (a.reservaId) abrir("reserva", a.reservaId, { aba: "pagamentos" });
				return;
			case 4: {
				const c = a.reservaId ? Q.conversaDaReserva(a.reservaId) : undefined;
				if (c) navegar(`/conversas?conversa=${c.id}`);
				else if (a.reservaId) abrir("reserva", a.reservaId);
				return;
			}
			case 5:
			case 8:
				if (a.reservaId) abrir("reserva", a.reservaId, { aba: "itens" });
				return;
			case 6:
			case 10:
				if (offline) {
					toast.error("Sem internet. O link sai quando a internet voltar.");
					return;
				}
				toast.success(`Link reenviado pelo WhatsApp · reserva ${a.reservaId}`);
				return;
			case 7:
				if (offline) {
					toast.error("Sem internet. Volta quando a internet voltar.");
					return;
				}
				toast.success(`Reserva ${a.reservaId} marcada como separada`, { duration: 6000, action: { label: "Desfazer", onClick: () => toast("Voltou para Confirmada") } });
				return;
			case 9:
				if (a.clienteId) abrir("cliente", a.clienteId, { aba: "documentos" });
				return;
			case 12:
				if (a.reservaId) navegar(`/balcao?reserva=${a.reservaId}&sentido=saida`);
				return;
			case 13:
			case 15:
				if (a.manutencaoId) abrir("manutencao", a.manutencaoId);
				return;
			case 16:
				toast.success("Tarefa concluída", { duration: 6000, action: { label: "Desfazer", onClick: () => toast("Tarefa reaberta") } });
				return;
			case 17:
				if (a.clienteId) abrir("cliente", a.clienteId);
				return;
			default:
				if (a.reservaId) abrir("reserva", a.reservaId);
		}
	};
}

export function BotaoAcaoAlerta({ alerta, tamanho = "sm", className }: { alerta: AlvoAlerta & { acao: string }; tamanho?: "sm" | "xs" | "default"; className?: string }) {
	const executar = useAcaoAlerta();
	return (
		<Button
			variant="outline"
			size={tamanho}
			className={className}
			onClick={(e) => {
				e.stopPropagation();
				executar(alerta);
			}}
		>
			{alerta.acao}
		</Button>
	);
}
