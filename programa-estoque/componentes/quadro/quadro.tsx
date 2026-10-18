"use client";
// Quadro por etapas (Reservas e Manutenção). Colunas de 288 px, 12 px entre elas, corpo cinza a 40%,
// rolagem lateral só dentro do quadro. Arrastar com dnd-kit; cancelar a janela desfaz o arraste.

import ChevronRight from "@carbon/icons-react/es/ChevronRight";
import { Icon } from "@/componentes/ui/icon";
import { Skeleton } from "@/componentes/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import type * as React from "react";
import { type ReactNode, useState } from "react";

export type ColunaQuadro = {
	id: string;
	titulo: ReactNode;
	nome: string;
	ponto?: ReactNode;
	contagem: number;
	resumo?: ReactNode;
	recolhida?: boolean;
	vazia?: ReactNode;
};

type Props<T> = {
	rotulo: string;
	colunas: ColunaQuadro[];
	itensDa: (colunaId: string) => T[];
	idDe: (item: T) => string;
	colunaDe: (item: T) => string;
	cartao: (item: T, opcoes: { arrastando: boolean }) => ReactNode;
	podeArrastar?: boolean;
	aoSoltar?: (item: T, paraColuna: string) => void;
	aoExpandir?: (colunaId: string) => void;
	className?: string;
};

function Arrastavel({ id, desligado, children }: { id: string; desligado: boolean; children: ReactNode }) {
	const { setNodeRef, listeners, isDragging } = useDraggable({ id, disabled: desligado });
	return (
		<div
			ref={setNodeRef}
			onPointerDown={listeners?.onPointerDown as React.PointerEventHandler<HTMLDivElement> | undefined}
			className={cn("touch-manipulation", isDragging && "opacity-40")}
		>
			{children}
		</div>
	);
}

function Coluna({
	coluna,
	children,
	alvo,
	aoExpandir,
}: {
	coluna: ColunaQuadro;
	children: ReactNode;
	alvo: boolean;
	aoExpandir?: () => void;
}) {
	const { setNodeRef, isOver } = useDroppable({ id: coluna.id });
	if (coluna.recolhida) {
		return (
			<section
				ref={setNodeRef}
				id={`coluna-${coluna.id}`}
				aria-label={`${coluna.nome}: ${coluna.contagem}`}
				className={cn(
					"flex w-14 shrink-0 flex-col items-center gap-2 rounded-lg border border-transparent bg-muted/40 py-3",
					isOver && alvo && "border-primary",
				)}
			>
				<button
					type="button"
					onClick={aoExpandir}
					className="flex flex-col items-center gap-2 rounded-md px-1 py-1 text-muted-foreground text-xs hover:text-foreground"
					aria-label={`Mostrar a coluna ${coluna.nome}`}
				>
					<Icon icon={ChevronRight} className="size-3.5" />
					{coluna.ponto}
					<span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{coluna.nome}</span>
					<span className="font-medium text-foreground tabular-nums">{coluna.contagem}</span>
				</button>
			</section>
		);
	}
	return (
		<section
			ref={setNodeRef}
			id={`coluna-${coluna.id}`}
			aria-label={`${coluna.nome}: ${coluna.contagem}`}
			className={cn(
				"flex w-72 shrink-0 flex-col rounded-lg border border-transparent bg-muted/40 transition-colors",
				isOver && alvo && "border-primary",
			)}
		>
			<header className="flex flex-col gap-0.5 px-3 pt-3 pb-2">
				<div className="flex items-center gap-2 text-xs">
					{coluna.ponto}
					<h2 className="truncate font-medium">{coluna.titulo}</h2>
					<span className="text-muted-foreground tabular-nums">{coluna.contagem}</span>
				</div>
				{coluna.resumo ? <div className="text-muted-foreground text-xs tabular-nums">{coluna.resumo}</div> : null}
			</header>
			<div className="flex max-h-[calc(100dvh-320px)] min-h-24 flex-col gap-2 overflow-y-auto px-2 pb-2">
				{children}
			</div>
		</section>
	);
}

export function Quadro<T>({
	rotulo,
	colunas,
	itensDa,
	idDe,
	colunaDe,
	cartao,
	podeArrastar = true,
	aoSoltar,
	aoExpandir,
	className,
}: Props<T>) {
	const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
	const [arrastado, setArrastado] = useState<T | null>(null);

	const todos = colunas.flatMap((c) => itensDa(c.id));
	const acharItem = (id: string) => todos.find((t) => idDe(t) === id) ?? null;

	const aoComecar = (e: DragStartEvent) => setArrastado(acharItem(String(e.active.id)));
	const aoTerminar = (e: DragEndEvent) => {
		const item = acharItem(String(e.active.id));
		setArrastado(null);
		if (!item || !e.over) return;
		const para = String(e.over.id);
		if (para !== colunaDe(item)) aoSoltar?.(item, para);
	};

	return (
		<DndContext sensors={sensores} onDragStart={aoComecar} onDragEnd={aoTerminar} onDragCancel={() => setArrastado(null)}>
			<div role="region" aria-label={rotulo} className={cn("-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0", className)}>
				<div className="flex w-max gap-3">
					{colunas.map((c) => (
						<Coluna key={c.id} coluna={c} alvo={!!arrastado && colunaDe(arrastado) !== c.id} aoExpandir={() => aoExpandir?.(c.id)}>
							{itensDa(c.id).length === 0 ? (
								<div className="px-2 py-6 text-center text-muted-foreground text-xs">{c.vazia ?? "Nada aqui."}</div>
							) : (
								itensDa(c.id).map((t) => (
									<Arrastavel key={idDe(t)} id={idDe(t)} desligado={!podeArrastar}>
										{cartao(t, { arrastando: false })}
									</Arrastavel>
								))
							)}
						</Coluna>
					))}
				</div>
			</div>
			<DragOverlay dropAnimation={null}>{arrastado ? <div className="rotate-1 shadow-lg">{cartao(arrastado, { arrastando: true })}</div> : null}</DragOverlay>
		</DndContext>
	);
}

export function EsqueletoQuadro({ colunas = 6 }: { colunas?: number }) {
	return (
		<div aria-busy="true" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
			<span className="sr-only">Carregando</span>
			<div className="flex w-max gap-3">
				{Array.from({ length: colunas }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: esqueleto
					<div key={i} className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-3">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-24 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
					</div>
				))}
			</div>
		</div>
	);
}

/** Cartão padrão do quadro: borda, cantos de 8 px, 12 px de recuo, texto de 12 px. O botão principal cobre o cartão. */
export function CartaoQuadro({
	rotuloAbrir,
	aoAbrir,
	children,
	acao,
	className,
}: {
	rotuloAbrir: string;
	aoAbrir: () => void;
	children: ReactNode;
	acao?: ReactNode;
	className?: string;
}) {
	return (
		<article className={cn("relative rounded-lg border bg-card p-3 text-xs transition-colors hover:border-muted-foreground/40", className)}>
			<button type="button" onClick={aoAbrir} aria-label={rotuloAbrir} className="absolute inset-0 rounded-lg" />
			<div className="pointer-events-none relative flex flex-col gap-1.5">{children}</div>
			{acao ? <div className="absolute top-2 right-2 z-10">{acao}</div> : null}
		</article>
	);
}
