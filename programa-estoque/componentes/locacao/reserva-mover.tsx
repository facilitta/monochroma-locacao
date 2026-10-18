"use client";
// Mudança de etapa da reserva: o único caminho manual é Confirmada ↔ Separada (mudar_etapa).
// As outras mudanças dependem de outra tela e abrem a janela "Falta isto".

import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import Misuse from "@carbon/icons-react/es/Misuse";
import Scan from "@carbon/icons-react/es/Scan";
import SendAlt from "@carbon/icons-react/es/SendAlt";
import { Button } from "@/componentes/ui/button";
import { Dinheiro } from "@/componentes/ui/basicos";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Icon } from "@/componentes/ui/icon";
import { Label } from "@/componentes/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { Textarea } from "@/componentes/ui/textarea";
import { EtapaRotulo } from "@/componentes/ui/marcadores";
import { ETAPAS, mudancaPermitida, type Etapa } from "@/lib/regras/etapas";
import { traduzir } from "@/lib/regras/respostas";
import { useConexao } from "@/lib/estado-prototipo";
import { useNavegar } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { dinheiro } from "@/lib/formatos";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { MOTIVOS_CANCELAMENTO, avisarMudanca, cancelarReserva, mudarEtapaManual, preReservar, regraCancelamento } from "@/prototipo/consultas-reservas";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

type Pedido = { reservaId: number; para: Etapa } | null;

export function destinosPossiveis(de: Etapa, ehDono: boolean): { para: Etapa; tipo: "manual" | "outra-tela" | "proibida" }[] {
	const todas: Etapa[] = ["orcamento", "pre_reserva", "confirmada", "separada", "retirada", "devolvida", "encerrada", "cancelada"];
	return todas
		.filter((e) => e !== de)
		.map((para) => {
			const tipo = mudancaPermitida(de, para);
			if (!ehDono && tipo !== "manual") return { para, tipo: "proibida" as const };
			return { para, tipo };
		});
}

function pendenciasDeEncerrar(reservaId: number) {
	const pend: string[] = [];
	const pg = Q.situacaoPagamentos(reservaId);
	if (D.manutencoes.some((m) => m.reservaOrigemId === reservaId && !m.cobrancaDecididaEm)) pend.push("Decidir a cobrança do dano na manutenção.");
	if (pg.caucaoConfirmada && !pg.caucaoDevolvida) pend.push("Devolver a caução por Pix ou registrar a retenção com motivo.");
	const comCliente = Q.itensDa(reservaId).filter((it) => {
		const movs = D.movimentacoes.filter((m) => m.reservaId === reservaId && m.unidadeId === it.unidadeId);
		return movs.some((m) => m.tipo === "saida") && !movs.some((m) => m.tipo === "volta");
	});
	if (comCliente.length) pend.push(`${comCliente.length} ${comCliente.length === 1 ? "peça ainda está" : "peças ainda estão"} com o cliente.`);
	return pend;
}

export function useMoverReserva(): { pedir: (reservaId: number, para: Etapa) => void; janela: ReactNode } {
	const [pedido, setPedido] = useState<Pedido>(null);
	const { ehDono } = usePapel();
	const { offline } = useConexao();
	const agora = useAgora(60_000);

	const pedir = (reservaId: number, para: Etapa) => {
		if (offline) {
			toast.error("Sem internet. Volta quando a internet voltar.");
			return;
		}
		const r = Q.reserva(reservaId);
		const tipo = mudancaPermitida(r.etapa, para);
		if (tipo === "manual") {
			const de = mudarEtapaManual(reservaId, para, agora);
			toast.success(`Reserva ${reservaId} ${para === "separada" ? "marcada como separada" : "voltou para confirmada"}`, {
				duration: 6000,
				action: { label: "Desfazer", onClick: () => mudarEtapaManual(reservaId, de, agora) },
			});
			return;
		}
		if (!ehDono || tipo === "proibida") {
			toast.error(`Não dá para levar de ${ETAPAS[r.etapa].nome} para ${ETAPAS[para].nome}.`);
			return;
		}
		setPedido({ reservaId, para });
	};

	return { pedir, janela: <JanelaFaltaIsto pedido={pedido} aoFechar={() => setPedido(null)} agora={agora} /> };
}

function JanelaFaltaIsto({ pedido, aoFechar, agora }: { pedido: Pedido; aoFechar: () => void; agora: Date }) {
	const navegar = useNavegar();
	const [motivo, setMotivo] = useState<string>("");
	const [comentario, setComentario] = useState("");
	if (!pedido) return <Dialog open={false} />;
	const r = Q.reserva(pedido.reservaId);
	const para = pedido.para;
	const fechar = () => {
		setMotivo("");
		setComentario("");
		aoFechar();
	};

	let titulo = "Falta isto";
	let descricao: ReactNode = null;
	let corpo: ReactNode = null;
	let rodape: ReactNode = (
		<Button variant="outline" onClick={fechar}>
			Fechar
		</Button>
	);

	if (para === "pre_reserva" && r.etapa === "orcamento") {
		titulo = "Pré-reservar e enviar ordem";
		const modelo = Q.modeloOrdemDa(r.id);
		descricao = "Trava as peças e envia, numa mensagem só, a ordem de locação com os três links: assinatura, aluguel (Pix ou cartão) e caução (só Pix).";
		corpo = (
			<ul className="flex flex-col gap-1.5 text-xs">
				<li>Começam os 20 minutos assim que a ordem sair. A pré-reserva não renova.</li>
				<li>
					Modelo de ordem pela regra do banco: <span className="font-medium">{modelo.modelo}</span>. {modelo.motivo}
				</li>
				<li>
					Aluguel <Dinheiro valor={Q.precoDa(r.id).valorAluguel} /> · caução <Dinheiro valor={Q.precoDa(r.id).valorCaucao} /> (exemplo).
				</li>
			</ul>
		);
		rodape = (
			<>
				<Button variant="outline" onClick={fechar}>
					Cancelar
				</Button>
				<Button
					onClick={() => {
						const resp = preReservar(r.id, agora);
						fechar();
						if (resp.ok) toast.success(`Reserva ${r.id} pré-reservada. Ordem enviada.`);
						else toast.error(traduzir(resp.codigo).frase, { description: traduzir(resp.codigo).acao });
					}}
				>
					<Icon icon={SendAlt} data-icon="inline-start" />
					Pré-reservar e enviar ordem
				</Button>
			</>
		);
	} else if (para === "confirmada") {
		descricao = "Isso acontece quando a InfinitePay confirma o pagamento.";
		corpo = (
			<p className="text-xs">
				A reserva vira Confirmada sozinha quando o aluguel e a caução são confirmados pelo aviso da InfinitePay, conferido de novo pelo n8n. Ninguém confirma pagamento à mão.
			</p>
		);
		rodape = (
			<>
				<Button variant="outline" onClick={fechar}>
					Fechar
				</Button>
				<Button
					onClick={() => {
						fechar();
						toast.success("Link de pagamento reenviado pelo WhatsApp");
					}}
				>
					<Icon icon={SendAlt} data-icon="inline-start" />
					Reenviar link de pagamento
				</Button>
			</>
		);
	} else if (para === "retirada" || para === "devolvida") {
		descricao = para === "retirada" ? "Isso acontece no balcão, em Concluir saída." : "Isso acontece no balcão, na última volta.";
		corpo = <p className="text-xs">Quem está no balcão lê a etiqueta de cada peça. A etapa muda sozinha quando a leitura termina.</p>;
		rodape = (
			<>
				<Button variant="outline" onClick={fechar}>
					Fechar
				</Button>
				<Button
					onClick={() => {
						fechar();
						navegar(`/balcao?reserva=${r.id}&sentido=${para === "retirada" ? "saida" : "volta"}`);
					}}
				>
					<Icon icon={Scan} data-icon="inline-start" />
					Abrir balcão
				</Button>
			</>
		);
	} else if (para === "cancelada") {
		titulo = `Cancelar a reserva ${r.id}`;
		const regra = regraCancelamento(r.id, agora);
		descricao = "Não dá para desfazer. O pagamento aceito vira reembolso pela InfinitePay, na transação original.";
		corpo = (
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="motivo-cancelamento">Motivo</Label>
					<Select value={motivo} onValueChange={setMotivo}>
						<SelectTrigger id="motivo-cancelamento" className="w-full">
							<SelectValue placeholder="Escolha o motivo" />
						</SelectTrigger>
						<SelectContent>
							{MOTIVOS_CANCELAMENTO.map((m) => (
								<SelectItem key={m} value={m}>
									{m}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="comentario-cancelamento">Comentário (opcional)</Label>
					<Textarea id="comentario-cancelamento" value={comentario} onChange={(e) => setComentario(e.target.value)} />
				</div>
				{regra.pago > 0 ? (
					<dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-md bg-muted p-3 text-xs">
						<dt className="text-muted-foreground">Aluguel pago</dt>
						<dd className="text-right tabular-nums">{dinheiro(regra.pago)}</dd>
						<dt className="text-muted-foreground">
							{regra.gratis ? `Grátis: faltam ${regra.antecedencia} para a retirada (mais de 48 h)` : "Menos de 48 h antes: o cliente paga 50%"}
						</dt>
						<dd className="text-right tabular-nums">− {dinheiro(regra.retido)}</dd>
						<dt className="font-medium">Devolver pela InfinitePay</dt>
						<dd className="text-right font-medium tabular-nums">{dinheiro(regra.devolver)}</dd>
						<dt className="text-muted-foreground">Caução volta inteira por Pix</dt>
						<dd className="text-right tabular-nums">{dinheiro(regra.caucao)}</dd>
					</dl>
				) : null}
				<p className="text-muted-foreground text-xs">Quem paga a taxa do cartão na devolução: a definir.</p>
			</div>
		);
		rodape = (
			<>
				<Button variant="outline" onClick={fechar}>
					Voltar
				</Button>
				<Button
					variant="destructive"
					disabled={!motivo}
					onClick={() => {
						cancelarReserva(r.id, motivo);
						fechar();
						toast.success(`Reserva ${r.id} cancelada`);
					}}
				>
					<Icon icon={Misuse} data-icon="inline-start" />
					Cancelar reserva
				</Button>
			</>
		);
	} else if (para === "encerrada") {
		titulo = `Encerrar a reserva ${r.id}`;
		const pend = r.etapa === "devolvida" ? pendenciasDeEncerrar(r.id) : ["A reserva precisa estar Devolvida."];
		descricao = pend.length ? "Ainda há pendências. Resolva antes de encerrar." : "Sem pendência. Não dá para desfazer.";
		corpo = pend.length ? (
			<ul className="flex flex-col gap-1.5 text-xs">
				{pend.map((p) => (
					<li key={p} className="flex items-start gap-2">
						<span aria-hidden className="mt-1.5 size-1.5 shrink-0 bg-atencao" />
						{p}
					</li>
				))}
			</ul>
		) : null;
		rodape = pend.length ? (
			<Button variant="outline" onClick={fechar}>
				Fechar
			</Button>
		) : (
			<>
				<Button variant="outline" onClick={fechar}>
					Voltar
				</Button>
				<Button
					onClick={() => {
						r.etapa = "encerrada";
						r.encerradaEm = agora;
						avisarMudanca();
						fechar();
						toast.success(`Reserva ${r.id} encerrada`);
					}}
				>
					<Icon icon={CheckmarkOutline} data-icon="inline-start" />
					Encerrar
				</Button>
			</>
		);
	}

	return (
		<Dialog open onOpenChange={(o) => !o && fechar()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{titulo}</DialogTitle>
					<DialogDescription>{descricao}</DialogDescription>
				</DialogHeader>
				<div className="flex items-center gap-2 text-xs">
					<EtapaRotulo etapa={r.etapa} />
					<span aria-hidden className="text-muted-foreground">→</span>
					<EtapaRotulo etapa={para} />
				</div>
				{corpo}
				<DialogFooter>{rodape}</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
