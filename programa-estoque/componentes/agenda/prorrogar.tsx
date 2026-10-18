"use client";
// "Prorrogar ou mudar período" (seção 7.15). Datas de reserva confirmada não mudam por arraste:
// o banco confere a disponibilidade das mesmas unidades e calcula o valor (prorrogar_reserva / mudança de período).

import { CampoDataHora } from "@/componentes/ui/campo-data";
import { Button } from "@/componentes/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Dinheiro } from "@/componentes/ui/basicos";
import { Label } from "@/componentes/ui/label";
import { Selo } from "@/componentes/ui/marcadores";
import { ToggleGroup, ToggleGroupItem } from "@/componentes/ui/toggle-group";
import { DIA, diaEHora } from "@/lib/formatos";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import * as Q from "@/prototipo/consultas";
import { conflitosNoPeriodo, doCampoData, paraCampoData } from "@/prototipo/consultas-agenda";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

export function ProrrogarPeriodo({ reservaId, aoFechar }: { reservaId: number | null; aoFechar: () => void }) {
	return (
		<Dialog open={reservaId != null} onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent className="sm:max-w-lg">{reservaId != null ? <Conteudo reservaId={reservaId} aoFechar={aoFechar} /> : null}</DialogContent>
		</Dialog>
	);
}

function Conteudo({ reservaId, aoFechar }: { reservaId: number; aoFechar: () => void }) {
	const agora = useAgora(60_000);
	const { podeVerFinanceiro } = usePapel();
	const id = useId();
	const r = Q.reserva(reservaId);
	const c = Q.cliente(r.clienteId);
	const jaSaiu = r.etapa === "retirada";
	const [modo, setModo] = useState<"prorrogar" | "mudar">("prorrogar");
	const [novaDev, setNovaDev] = useState(paraCampoData(new Date(r.devolucaoEm.getTime() + DIA)));
	const [novaRet, setNovaRet] = useState(paraCampoData(r.retiradaEm));
	const [novaDev2, setNovaDev2] = useState(paraCampoData(r.devolucaoEm));
	useEffect(() => {
		if (jaSaiu) setModo("prorrogar");
	}, [jaSaiu]);

	const linhas = Q.linhasDa(r.id);
	const precoAtual = Q.calcularPreco(linhas, r.retiradaEm, r.devolucaoEm).valorAluguel;

	let corpo: React.ReactNode = null;
	let acao: { rotulo: string; fazer: () => void } | null = null;

	if (modo === "prorrogar") {
		const nd = doCampoData(novaDev);
		if (!nd || nd.getTime() <= r.devolucaoEm.getTime()) {
			corpo = <p className="text-muted-foreground">A nova devolução precisa ser depois de {diaEHora(r.devolucaoEm)}.</p>;
		} else {
			const conflitos = conflitosNoPeriodo(r.id, r.devolucaoEm, nd, agora);
			const extra = Q.calcularPreco(linhas, r.retiradaEm, nd).valorAluguel - precoAtual;
			const fora = !Q.dentroDoHorario(nd);
			corpo = conflitos.length ? (
				<div className="flex flex-col gap-2">
					<Selo tom="erro">Não dá para prorrogar com as mesmas peças</Selo>
					<ul className="flex flex-col gap-1">
						{conflitos.map((x) => (
							<li key={x.unidadeId}>
								<span className="font-mono">{Q.unidade(x.unidadeId).codigo}</span> · {Q.equipamento(Q.unidade(x.unidadeId).equipamentoId).nome}: ocupada ({x.motivo}) a partir de {diaEHora(x.desde)}
							</li>
						))}
					</ul>
					<p className="text-muted-foreground">O caso fica com a equipe: o Denis não oferece outra peça sozinho.</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<Selo tom="ok">As mesmas peças estão livres nos dias extras</Selo>
					{podeVerFinanceiro ? (
						<p>
							Valor só dos dias extras: <Dinheiro valor={extra} className="font-medium" />
						</p>
					) : null}
					<p className="text-muted-foreground">
						O Denis envia uma ordem curta e um novo link de pagamento só desse valor. Os dias ficam seguros por 20 minutos, e o período só se estende quando a InfinitePay
						confirmar o pagamento.
					</p>
					{fora ? <Selo tom="atencao">Fora do horário do balcão</Selo> : null}
				</div>
			);
			acao = conflitos.length
				? { rotulo: "Passar para a equipe", fazer: () => toast.success("Conversa passada para a equipe") }
				: { rotulo: "Gerar ordem curta e link", fazer: () => toast.success(`Ordem de prorrogação da reserva ${r.id} gerada`) };
		}
	} else {
		const nr = doCampoData(novaRet);
		const nd = doCampoData(novaDev2);
		if (!nr || !nd || nd.getTime() <= nr.getTime()) {
			corpo = <p className="text-muted-foreground">Escolha uma retirada e uma devolução depois dela.</p>;
		} else {
			const conflitos = conflitosNoPeriodo(r.id, nr, nd, agora);
			const novo = Q.calcularPreco(linhas, nr, nd).valorAluguel;
			const diferenca = novo - precoAtual;
			const fora = !Q.dentroDoHorario(nr) || !Q.dentroDoHorario(nd);
			corpo = conflitos.length ? (
				<div className="flex flex-col gap-2">
					<Selo tom="erro">Sem vaga no novo período</Selo>
					<ul className="flex flex-col gap-1">
						{conflitos.map((x) => (
							<li key={x.unidadeId}>
								<span className="font-mono">{Q.unidade(x.unidadeId).codigo}</span>: ocupada ({x.motivo}) a partir de {diaEHora(x.desde)}
							</li>
						))}
					</ul>
					<p className="text-muted-foreground">O caso fica com a equipe.</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<Selo tom="ok">As peças estão livres no novo período</Selo>
					<p className="text-muted-foreground">O banco troca o período, recalcula o preço e registra quem fez e quando. O pedido passa sempre pelo Denis ou pela equipe.</p>
					{podeVerFinanceiro ? (
						diferenca > 0 ? (
							<p>
								Custa mais: sai um novo link só da diferença, <Dinheiro valor={diferenca} className="font-medium" />.
							</p>
						) : diferenca < 0 ? (
							<div className="flex flex-col gap-1">
								<p>
									Custa menos: <Dinheiro valor={-diferenca} className="font-medium" /> a menos.
								</p>
								<Selo tom="atencao">A definir: devolver a diferença, virar crédito ou seguir a regra de cancelamento</Selo>
								<p className="text-muted-foreground">Até o dono decidir, o caso fica com a equipe.</p>
							</div>
						) : (
							<p>Mesmo valor: nada a cobrar nem a devolver.</p>
						)
					) : null}
					{fora ? <Selo tom="atencao">Fora do horário do balcão</Selo> : null}
				</div>
			);
			acao = conflitos.length || diferenca < 0
				? { rotulo: "Passar para a equipe", fazer: () => toast.success("Caso passado para a equipe") }
				: { rotulo: diferenca > 0 ? "Mudar período e gerar link" : "Mudar período", fazer: () => toast.success(`Período da reserva ${r.id} alterado`) };
		}
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>Prorrogar ou mudar período</DialogTitle>
				<DialogDescription>
					Reserva {r.id} · {c.nome} · período atual: {diaEHora(r.retiradaEm)} até {diaEHora(r.devolucaoEm)}
				</DialogDescription>
			</DialogHeader>
			<ToggleGroup
				type="single"
				variant="outline"
				spacing={0}
				value={modo}
				onValueChange={(v) => v && setModo(v as "prorrogar" | "mudar")}
				aria-label="O que fazer"
			>
				<ToggleGroupItem value="prorrogar">Prorrogar (mais dias)</ToggleGroupItem>
				<ToggleGroupItem value="mudar" disabled={jaSaiu}>
					Mudar período
				</ToggleGroupItem>
			</ToggleGroup>
			{modo === "prorrogar" ? (
				<div className="flex flex-col gap-1.5">
					<Label htmlFor={`${id}-nd`}>Nova devolução</Label>
					<CampoDataHora semPassado id={`${id}-nd`} rotulo="Nova devolução" valor={novaDev} aoMudar={setNovaDev} />
				</div>
			) : (
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${id}-r`}>Nova retirada</Label>
						<CampoDataHora semPassado id={`${id}-r`} rotulo="Nova retirada" valor={novaRet} aoMudar={setNovaRet} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${id}-d`}>Nova devolução</Label>
						<CampoDataHora semPassado id={`${id}-d`} rotulo="Nova devolução" valor={novaDev2} aoMudar={setNovaDev2} />
					</div>
				</div>
			)}
			<div aria-live="polite" className="rounded-lg border bg-muted/40 p-3 text-xs/5">
				{corpo}
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={aoFechar}>
					Cancelar
				</Button>
				{acao ? (
					<Button
						onClick={() => {
							acao?.fazer();
							aoFechar();
						}}
					>
						{acao.rotulo}
					</Button>
				) : null}
			</DialogFooter>
		</>
	);
}
