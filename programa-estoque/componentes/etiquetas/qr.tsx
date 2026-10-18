"use client";
// QR em SVG só com o código da etiqueta (sem link nem dado de cliente). Pinta com a cor do texto.

import QRCode from "qrcode";
import { useMemo } from "react";

export function QrCodigo({ codigo, className }: { codigo: string; className?: string }) {
	const caminho = useMemo(() => {
		const qr = QRCode.create(codigo, { errorCorrectionLevel: "M" });
		const n = qr.modules.size;
		const partes: string[] = [];
		for (let y = 0; y < n; y++) {
			for (let x = 0; x < n; x++) {
				if (qr.modules.get(y, x)) partes.push(`M${x} ${y}h1v1h-1z`);
			}
		}
		return { d: partes.join(""), n };
	}, [codigo]);
	return (
		<svg viewBox={`-1 -1 ${caminho.n + 2} ${caminho.n + 2}`} className={className} role="img" aria-label={`QR do código ${codigo}`} shapeRendering="crispEdges">
			<path d={caminho.d} fill="currentColor" />
		</svg>
	);
}
