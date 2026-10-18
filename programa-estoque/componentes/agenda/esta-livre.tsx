"use client";
// "Está livre?": equipamento + datas → resposta grande. Usa disponibilidade() e proxima_data_livre(),
// que só devolve horários dentro do horário do balcão (correção 11).

import { CampoDataHora } from "@/componentes/ui/campo-data";
import ArrowRight from "@carbon/icons-react/es/ArrowRight";
import { Button } from "@/componentes/ui/button";
import { Icon } from "@/componentes/ui/icon";
import { Label } from "@/componentes/ui/label";
import { Selo } from "@/componentes/ui/marcadores";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { diaEHora, plural } from "@/lib/formatos";
import { Link } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { doCampoData, isoLocal, paraCampoData, voltaMaisCedo } from "@/prototipo/consultas-agenda";
import { useId, useMemo, useState } from "react";

export function EstaLivre({ equipamentoInicial, className }: { equipamentoInicial?: number; className?: string }) {
	const agora = useAgora(60_000);
	const { ehDono } = usePapel();
	const id = useId();
	const [equipamentoId, setEquipamentoId] = useState<number>(equipamentoInicial ?? 9);
	const [retirada, setRetirada] = useState(() => paraCampoData(D.em(17, 9)));
	const [devolucao, setDevolucao] = useState(() => paraCampoData(D.em(19, 9)));

	const ret = doCampoData(retirada);
	const dev = doCampoData(devolucao);
	const ativos = D.equipamentos.filter((e) => e.ativo && !e.arquivadoEm);
	const porCategoria = Object.entries(D.CATEGORIAS)
		.map(([cat, nome]) => ({ cat, nome, itens: ativos.filter((e) => e.categoria === cat) }))
		.filter((g) => g.itens.length);

	const resposta = useMemo(() => {
		if (!ret || !dev) return { tipo: "invalido" as const, frase: "Preencha retirada e devolução." };
		if (dev.getTime() <= ret.getTime()) return { tipo: "invalido" as const, frase: "A devolução precisa ser depois da retirada." };
		const fora = !Q.dentroDoHorario(ret) || !Q.dentroDoHorario(dev);
		const livres = Q.disponibilidade(equipamentoId, ret, dev, agora);
		if (livres > 0) return { tipo: "sim" as const, livres, fora };
		const volta = voltaMaisCedo(equipamentoId, ret, dev, agora);
		const proxima = Q.proximaDataLivre(equipamentoId, ret, dev.getTime() - ret.getTime(), agora);
		return { tipo: "nao" as const, volta, proxima, fora };
	}, [ret, dev, equipamentoId, agora]);

	const e = Q.equipamento(equipamentoId);

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
				<div className="flex min-w-0 flex-col gap-1.5">
					<Label htmlFor={`${id}-eq`}>Equipamento</Label>
					<Select value={String(equipamentoId)} onValueChange={(v) => setEquipamentoId(Number(v))}>
						<SelectTrigger id={`${id}-eq`} className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{porCategoria.map((g) => (
								<SelectGroup key={g.cat}>
									<SelectLabel>{g.nome}</SelectLabel>
									{g.itens.map((x) => (
										<SelectItem key={x.id} value={String(x.id)}>
											{x.nome}
										</SelectItem>
									))}
								</SelectGroup>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex min-w-0 flex-col gap-1.5">
					<Label htmlFor={`${id}-ret`}>Retirada</Label>
					<CampoDataHora semPassado id={`${id}-ret`} rotulo="Retirada" valor={retirada} aoMudar={setRetirada} />
				</div>
				<div className="flex min-w-0 flex-col gap-1.5">
					<Label htmlFor={`${id}-dev`}>Devolução</Label>
					<CampoDataHora semPassado id={`${id}-dev`} rotulo="Devolução" valor={devolucao} aoMudar={setDevolucao} />
				</div>
			</div>

			<div aria-live="polite" className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4">
				{resposta.tipo === "invalido" ? (
					<p className="text-muted-foreground text-sm">{resposta.frase}</p>
				) : resposta.tipo === "sim" ? (
					<>
						<Selo tom="ok" tamanho="grande">
							Sim
						</Selo>
						<p className="font-medium text-2xl tracking-tight">
							{plural(resposta.livres, "unidade livre", "unidades livres")}
						</p>
						<p className="text-muted-foreground text-xs">
							{e.nome} · {diaEHora(ret as Date)} até {diaEHora(dev as Date)} · já conta a folga de 12 h depois da devolução.
						</p>
					</>
				) : (
					<>
						<Selo tom="erro" tamanho="grande">
							Não
						</Selo>
						<p className="font-medium text-xl tracking-tight">
							{resposta.volta ? `Volta ${diaEHora(resposta.volta)}.` : "Nenhuma unidade livre nesse período."}
						</p>
						<p className="text-sm">
							{resposta.proxima ? (
								<>
									Próxima data livre: <span className="font-medium">{diaEHora(resposta.proxima)}</span>
								</>
							) : (
								"Sem data livre nos próximos 60 dias."
							)}
						</p>
					</>
				)}
				{resposta.tipo !== "invalido" && resposta.fora ? (
					<Selo tom="atencao">Fora do horário do balcão: seg a sex 9h–18h, sáb 9h–13h</Selo>
				) : null}
				{ehDono && resposta.tipo === "sim" && ret && dev ? (
					<div className="pt-1">
						<Button asChild variant="outline" size="sm">
							<Link href={`/pedido/novo?equipamento=${equipamentoId}&retirada=${encodeURIComponent(isoLocal(ret))}&devolucao=${encodeURIComponent(isoLocal(dev))}`}>
								Montar pedido com estas datas
								<Icon icon={ArrowRight} data-icon="inline-end" />
							</Link>
						</Button>
					</div>
				) : null}
			</div>
		</div>
	);
}
