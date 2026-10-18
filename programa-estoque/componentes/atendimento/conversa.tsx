"use client";
// Linha do tempo de uma conversa do WhatsApp: cliente à esquerda em cinza; robô à direita em tom claro
// do destaque, com a etiqueta "Robô"; pessoa da equipe à direita no destaque cheio, com o nome.

import Bot from "@carbon/icons-react/es/Bot";
import Image from "@carbon/icons-react/es/Image";
import Locked from "@carbon/icons-react/es/Locked";
import Settings from "@carbon/icons-react/es/Settings";
import UserAvatar from "@carbon/icons-react/es/UserAvatar";
import { Button } from "@/componentes/ui/button";
import { Icon } from "@/componentes/ui/icon";
import { dataCurta, diaSemanaLongo, horaRelogio, mesmoDia } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import type * as D from "@/prototipo/dados";
import { modelosMensagem } from "@/prototipo/dados";
import type { ReactNode } from "react";

const STATUS: Record<NonNullable<D.Mensagem["status"]>, string> = {
	enviado: "Enviada",
	entregue: "Entregue",
	lido: "Lida",
	falhou: "Não enviada",
};

export type Marcador = { id: string; em: Date; texto: ReactNode };

function rotuloDia(d: Date, agora: Date): string {
	if (mesmoDia(d, agora)) return "Hoje";
	if (mesmoDia(d, new Date(agora.getTime() - 86_400_000))) return "Ontem";
	return `${diaSemanaLongo(d)}, ${dataCurta(d)}`;
}

function Anexo({ m, movida, podeMover, aoMover }: { m: D.Mensagem; movida: boolean; podeMover: boolean; aoMover?: () => void }) {
	if (!m.anexo) return null;
	if (m.anexo.restrito || movida) {
		return (
			<span className="flex items-start gap-1.5">
				<Icon icon={Locked} className="mt-0.5 size-3.5 shrink-0" motion="none" />
				<span>
					{movida ? "Conteúdo movido para Documentos." : `[foto recebida: ${m.anexo.descricao}]`}
					<span className="block text-muted-foreground">Documento pessoal: fica em Documentos, só o dono vê.</span>
				</span>
			</span>
		);
	}
	return (
		<span className="flex flex-col gap-2">
			<span className="flex h-24 w-44 max-w-full items-center justify-center gap-2 rounded-md border bg-background text-muted-foreground">
				<Icon icon={Image} className="size-4" motion="none" />
				Foto · {m.anexo.descricao}
			</span>
			<span className="text-muted-foreground">O app e o robô não leem esta foto. Pagamento só vale pelo link.</span>
			{podeMover ? (
				<Button variant="outline" size="xs" className="w-fit" onClick={aoMover}>
					Mover para Documentos
				</Button>
			) : null}
		</span>
	);
}

export function BaloesConversa({
	mensagens,
	marcadores = [],
	agora,
	ehDono,
	movidas = [],
	aoMover,
	aoTentarDeNovo,
	className,
}: {
	mensagens: D.Mensagem[];
	marcadores?: Marcador[];
	agora: Date;
	ehDono: boolean;
	movidas?: number[];
	aoMover?: (id: number) => void;
	aoTentarDeNovo?: (id: number) => void;
	className?: string;
}) {
	type Item = { tipo: "msg"; em: Date; m: D.Mensagem } | { tipo: "marca"; em: Date; k: Marcador };
	const itens: Item[] = [
		...mensagens.map((m) => ({ tipo: "msg" as const, em: m.em, m })),
		...marcadores.map((k) => ({ tipo: "marca" as const, em: k.em, k })),
	].sort((a, b) => a.em.getTime() - b.em.getTime());

	const blocos: ReactNode[] = [];
	let diaAtual = "";
	for (const it of itens) {
		const dia = rotuloDia(it.em, agora);
		if (dia !== diaAtual) {
			diaAtual = dia;
			blocos.push(
				<li key={`dia-${dia}-${it.em.getTime()}`} className="flex items-center gap-3 py-2" aria-label={dia}>
					<span className="h-px flex-1 bg-border" />
					<span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">{dia}</span>
					<span className="h-px flex-1 bg-border" />
				</li>,
			);
		}
		if (it.tipo === "marca") {
			blocos.push(
				<li key={it.k.id} className="flex justify-center py-1">
					<span className="rounded-full border px-3 py-1 text-center text-muted-foreground text-xs">
						{it.k.texto} · {horaRelogio(it.em)}
					</span>
				</li>,
			);
			continue;
		}
		const m = it.m;
		const direita = m.autor !== "cliente";
		const modelo = m.modelo ? modelosMensagem.find((x) => x.nome === m.modelo) : undefined;
		const etiqueta =
			m.autor === "robo" ? (
				<span className="flex items-center gap-1">
					<Icon icon={Bot} className="size-3.5" motion="none" />
					Robô
				</span>
			) : m.autor === "equipe" ? (
				<span className="flex items-center gap-1">
					<Icon icon={UserAvatar} className="size-3.5" motion="none" />
					{m.usuario ?? "Equipe"}
				</span>
			) : m.autor === "automacao" ? (
				<span className="flex items-center gap-1">
					<Icon icon={Settings} className="size-3.5" motion="none" />
					Mensagem pronta{modelo ? `: ${modelo.descricao.toLowerCase()}` : ""}
				</span>
			) : (
				<span>Cliente</span>
			);
		blocos.push(
			<li key={m.id} data-autor={m.autor} className={cn("flex flex-col gap-1", direita ? "items-end" : "items-start")}>
				<span className="px-1 font-medium text-2xs text-muted-foreground">{etiqueta}</span>
				<div
					className={cn(
						"max-w-[85%] whitespace-pre-line rounded-lg border px-3 py-2 text-xs/5 sm:max-w-[75%]",
						m.autor === "cliente" && "rounded-tl-sm border-transparent bg-muted text-foreground",
						m.autor === "robo" && "rounded-tr-sm border-transparent bg-destaque-claro text-foreground",
						m.autor === "equipe" && "rounded-tr-sm border-transparent bg-primary text-primary-foreground",
						m.autor === "automacao" && "rounded-tr-sm border-border border-dashed bg-card text-foreground",
					)}
				>
					{m.anexo ? <Anexo m={m} movida={movidas.includes(m.id)} podeMover={ehDono} aoMover={() => aoMover?.(m.id)} /> : m.texto}
				</div>
				<span className="flex items-center gap-2 px-1 text-2xs text-muted-foreground tabular-nums">
					{horaRelogio(m.em)}
					{direita && m.status && m.status !== "falhou" ? <span>· {STATUS[m.status]}</span> : null}
					{m.status === "falhou" ? (
						<span className="flex items-center gap-1 text-erro">
							· Não enviado
							<Button variant="link" size="xs" className="h-auto px-1 text-2xs text-erro" onClick={() => aoTentarDeNovo?.(m.id)}>
								Tentar de novo
							</Button>
						</span>
					) : null}
				</span>
			</li>,
		);
	}
	return <ol className={cn("flex flex-col gap-3", className)}>{blocos}</ol>;
}
