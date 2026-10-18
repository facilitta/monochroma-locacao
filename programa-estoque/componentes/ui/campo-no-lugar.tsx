"use client";
// Edição no lugar (inspirado em trycompai/crm inline-field, MIT): clicar no valor vira campo.
// Enter salva, Esc desfaz, sair do campo salva. Aviso "Salvo · Desfazer" por 6 segundos.

import { ValorDoRobo } from "@/componentes/ui/basicos";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function CampoNoLugar({
	valor,
	aoSalvar,
	rotulo,
	vazio = "—",
	origemRobo,
	somenteLeitura = false,
	tipo = "text",
	className,
}: {
	valor: string;
	aoSalvar?: (novo: string) => void;
	rotulo: string;
	vazio?: string;
	origemRobo?: string;
	somenteLeitura?: boolean;
	tipo?: "text" | "email" | "tel" | "number";
	className?: string;
}) {
	const [editando, setEditando] = useState(false);
	const [atual, setAtual] = useState(valor);
	const [rascunho, setRascunho] = useState(valor);
	const campo = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setAtual(valor);
	}, [valor]);

	useEffect(() => {
		if (editando) campo.current?.select();
	}, [editando]);

	const salvar = () => {
		setEditando(false);
		if (rascunho === atual) return;
		const anterior = atual;
		setAtual(rascunho);
		aoSalvar?.(rascunho);
		toast.success("Salvo", {
			duration: 6000,
			action: {
				label: "Desfazer",
				onClick: () => {
					setAtual(anterior);
					aoSalvar?.(anterior);
				},
			},
		});
	};

	if (somenteLeitura) {
		return <span className={cn("block min-h-5 truncate", className)}>{atual || vazio}</span>;
	}

	if (editando) {
		return (
			<input
				ref={campo}
				type={tipo}
				aria-label={rotulo}
				value={rascunho}
				onChange={(e) => setRascunho(e.target.value)}
				onBlur={salvar}
				onKeyDown={(e) => {
					if (e.key === "Enter") salvar();
					if (e.key === "Escape") {
						setRascunho(atual);
						setEditando(false);
					}
				}}
				className="-mx-2 -my-1 h-7 w-[calc(100%+1rem)] rounded-md border border-ring bg-background px-2 text-xs outline-none ring-2 ring-ring/30 dark:bg-muted"
			/>
		);
	}

	const texto = atual ? (origemRobo ? <ValorDoRobo origem={origemRobo}>{atual}</ValorDoRobo> : atual) : (
		<span className="text-muted-foreground">{vazio}</span>
	);

	return (
		<button
			type="button"
			data-alvo
			aria-label={`${rotulo}: ${atual || "vazio"}. Editar`}
			onClick={() => {
				setRascunho(atual);
				setEditando(true);
			}}
			className={cn(
				"-mx-2 -my-1 block w-[calc(100%+1rem)] truncate rounded-md border border-transparent px-2 py-1 text-left hover:border-border max-md:border-border",
				className,
			)}
		>
			{texto}
		</button>
	);
}
