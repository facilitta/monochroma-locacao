"use client";
// Leitor de etiqueta pela câmera do celular: API do navegador (BarcodeDetector) quando houver.
// Sem câmera ou sem leitor, a tela segue com "Digitar código".

import Camera from "@carbon/icons-react/es/Camera";
import Flash from "@carbon/icons-react/es/Flash";
import FlashOff from "@carbon/icons-react/es/FlashOff";
import Keyboard from "@carbon/icons-react/es/Keyboard";
import { Button } from "@/componentes/ui/button";
import { Icon } from "@/componentes/ui/icon";
import { Spinner } from "@/componentes/ui/spinner";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

type Detector = { detect: (fonte: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type ConstrutorDetector = new (opcoes: { formats: string[] }) => Detector;

export function LeitorCamera({
	aoLer,
	aoDigitar,
	iniciando = false,
	extra,
	digitando = false,
	className,
}: {
	aoLer: (codigo: string) => void;
	aoDigitar: () => void;
	iniciando?: boolean;
	extra?: React.ReactNode;
	digitando?: boolean;
	className?: string;
}) {
	const video = useRef<HTMLVideoElement>(null);
	const fluxo = useRef<MediaStream | null>(null);
	const ultimo = useRef<{ codigo: string; em: number }>({ codigo: "", em: 0 });
	const [situacao, setSituacao] = useState<"parada" | "abrindo" | "aberta" | "erro" | "sem_leitor">("parada");
	const [lanterna, setLanterna] = useState<"indisponivel" | "desligada" | "ligada">("indisponivel");

	const parar = useCallback(() => {
		for (const t of fluxo.current?.getTracks() ?? []) t.stop();
		fluxo.current = null;
	}, []);

	useEffect(() => parar, [parar]);

	useEffect(() => {
		if (situacao !== "aberta") return;
		const Construtor = (window as unknown as { BarcodeDetector?: ConstrutorDetector }).BarcodeDetector;
		if (!Construtor) {
			setSituacao("sem_leitor");
			return;
		}
		const detector = new Construtor({ formats: ["qr_code"] });
		const id = window.setInterval(async () => {
			if (!video.current || video.current.readyState < 2) return;
			try {
				const achados = await detector.detect(video.current);
				const codigo = achados[0]?.rawValue;
				if (!codigo) return;
				const agora = Date.now();
				if (codigo === ultimo.current.codigo && agora - ultimo.current.em < 2500) return;
				ultimo.current = { codigo, em: agora };
				aoLer(codigo);
			} catch {
				// quadro ilegível: tenta no próximo
			}
		}, 350);
		return () => window.clearInterval(id);
	}, [situacao, aoLer]);

	const abrir = async () => {
		setSituacao("abrindo");
		try {
			const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
			fluxo.current = s;
			if (video.current) {
				video.current.srcObject = s;
				await video.current.play();
			}
			const trilha = s.getVideoTracks()[0];
			const capacidades = (trilha?.getCapabilities?.() ?? {}) as { torch?: boolean };
			setLanterna(capacidades.torch ? "desligada" : "indisponivel");
			setSituacao("aberta");
		} catch {
			setSituacao("erro");
		}
	};

	const alternarLanterna = async () => {
		const trilha = fluxo.current?.getVideoTracks()[0];
		if (!trilha) return;
		const ligar = lanterna !== "ligada";
		try {
			await trilha.applyConstraints({ advanced: [{ torch: ligar } as MediaTrackConstraintSet] });
			setLanterna(ligar ? "ligada" : "desligada");
		} catch {
			setLanterna("indisponivel");
		}
	};

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="relative flex h-[30vh] max-h-64 min-h-44 items-center justify-center overflow-hidden rounded-lg border bg-muted">
				{extra ? <div className="absolute top-2 right-2 z-20">{extra}</div> : null}
				<video ref={video} playsInline muted className={cn("absolute inset-0 size-full object-cover", situacao === "aberta" || situacao === "sem_leitor" ? "block" : "hidden")} />
				<div aria-hidden className="relative z-10 -mt-8 h-24 w-40 rounded-lg border-2 border-ring" />
				<div className="absolute inset-x-3 bottom-3 z-10 flex justify-center text-center text-sm">
					{iniciando || situacao === "abrindo" ? (
						<span className="flex items-center gap-2 rounded-md bg-background px-3 py-1.5">
							<Spinner />
							Iniciando a câmera…
						</span>
					) : situacao === "parada" ? (
						<Button variant="outline" onClick={abrir}>
							<Icon icon={Camera} data-icon="inline-start" />
							Abrir câmera
						</Button>
					) : situacao === "erro" ? (
						<span role="alert" className="rounded-md bg-background px-3 py-2 text-erro">
							Não consegui abrir a câmera. Digite o código ou permita a câmera nas configurações do celular.
						</span>
					) : situacao === "sem_leitor" ? (
						<span className="rounded-md bg-background px-3 py-2">Este navegador não lê a etiqueta pela câmera. Digite o código.</span>
					) : (
						<span className="rounded-md bg-background px-3 py-1.5">Aponte para a etiqueta</span>
					)}
				</div>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<Button variant="outline" disabled={lanterna === "indisponivel"} onClick={alternarLanterna} title={lanterna === "indisponivel" ? "Lanterna disponível só com a câmera aberta, se o celular tiver" : undefined}>
					<Icon icon={lanterna === "ligada" ? FlashOff : Flash} data-icon="inline-start" />
					{lanterna === "ligada" ? "Apagar lanterna" : "Lanterna"}
				</Button>
				<Button variant={digitando ? "secondary" : "outline"} aria-pressed={digitando} onClick={aoDigitar}>
					<Icon icon={Keyboard} data-icon="inline-start" />
					Digitar código
				</Button>
			</div>
		</div>
	);
}
