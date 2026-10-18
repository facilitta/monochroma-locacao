"use client";
// Etiqueta física em tamanho real (milímetros): QR só com o código, código grande em mono para digitar,
// nome curto, nº de série, o nome Monochroma e o telefone. Sempre tinta escura em fundo claro, nos dois temas.

import { QrCodigo } from "@/componentes/etiquetas/qr";
import { telefone } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";

export type TamanhoEtiqueta = "a4" | "50x25" | "62x29";

export const TAMANHOS: Record<TamanhoEtiqueta, { rotulo: string; largura: number; altura: number; nota: string; porFolha?: { colunas: number; linhas: number } }> = {
	a4: {
		rotulo: "Folha A4 adesiva",
		largura: 63.5,
		altura: 38.1,
		nota: "63,5 × 38,1 mm, 21 por folha (padrão provisório; o modelo exato da folha Pimaco está a definir)",
		porFolha: { colunas: 3, linhas: 7 },
	},
	"50x25": { rotulo: "50 × 25 mm", largura: 50, altura: 25, nota: "Fita de 50 × 25 mm para impressora de etiquetas" },
	"62x29": { rotulo: "62 × 29 mm", largura: 62, altura: 29, nota: "Fita de 62 × 29 mm para impressora de etiquetas" },
};

export function Etiqueta({ unidade, tamanho, guias = false, className }: { unidade: D.Unidade; tamanho: TamanhoEtiqueta; guias?: boolean; className?: string }) {
	const t = TAMANHOS[tamanho];
	const e = Q.equipamento(unidade.equipamentoId);
	const grande = tamanho === "a4";
	const lado = grande ? 24 : t.altura - 6;
	return (
		<div
			data-etiqueta
			className={cn(
				"flex shrink-0 items-center overflow-hidden bg-logo-fundo text-logo-tinta",
				guias ? "border border-dashed border-logo-tinta" : "rounded-sm border border-border print:rounded-none print:border-0",
				className,
			)}
			style={{ width: `${t.largura}mm`, height: `${t.altura}mm`, padding: "2mm", gap: "2mm", breakInside: "avoid" }}
		>
			<div className="shrink-0" style={{ width: `${lado}mm`, height: `${lado}mm` }}>
				<QrCodigo codigo={unidade.codigo} className="size-full" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: "0.6mm" }}>
				<span className="truncate font-mono font-semibold leading-none" style={{ fontSize: grande ? "4.4mm" : "3.4mm" }}>
					{unidade.codigo}
				</span>
				<span className="truncate leading-tight" style={{ fontSize: grande ? "2.9mm" : "2.4mm" }}>
					{e.nome}
					{unidade.numeroSerie ? ` · nº ${unidade.numeroSerie}` : ""}
				</span>
				<span className="truncate font-medium leading-tight" style={{ fontSize: grande ? "2.6mm" : "2.2mm" }}>
					Monochroma
				</span>
				<span className="truncate leading-tight tabular-nums" style={{ fontSize: grande ? "2.5mm" : "2.1mm" }}>
					{telefone(D.configuracoesExemplo.telefone)}
				</span>
			</div>
		</div>
	);
}
