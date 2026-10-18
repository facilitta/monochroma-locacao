"use client";
// 7.7 Pagamentos: o que a InfinitePay confirmou, o que espera pagamento, estornos e cauções a devolver.
// O app nunca confirma pagamento à mão: a situação vem só do aviso da InfinitePay, conferido de novo pelo n8n.

import Copy from "@carbon/icons-react/es/Copy";
import Launch from "@carbon/icons-react/es/Launch";
import Wallet from "@carbon/icons-react/es/Wallet";
import WarningAlt from "@carbon/icons-react/es/WarningAlt";
import { Button } from "@/componentes/ui/button";
import { BlocoNumeros, CabecalhoPagina, Codigo, Dinheiro, EstadoErro, EstadoVazio, EsqueletoLinhas, Pagina } from "@/componentes/ui/basicos";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { useFicha, useRegistrarLista } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { Label } from "@/componentes/ui/label";
import { Selo } from "@/componentes/ui/marcadores";
import { TabelaLista, type AtalhoLista, type Coluna } from "@/componentes/ui/tabela-lista";
import { Textarea } from "@/componentes/ui/textarea";
import { Definir } from "@/componentes/gestao/comum";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { dataCurta, dinheiro, horaRelogio, numero } from "@/lib/formatos";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { SITUACAO_LINHA, cancelamentoPelaRegra, horasDeAtrasoNaVolta, linhasPagamento, numerosPagamentos, type LinhaPagamento, type SituacaoLinha } from "@/prototipo/consultas-gestao";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const TIPO: Record<D.Pagamento["tipo"], string> = { aluguel: "Aluguel", caucao: "Caução", prorrogacao: "Prorrogação" };

function forma(p: D.Pagamento): string {
	if (!p.forma) return "—";
	if (p.forma === "pix") return "Pix";
	return p.parcelas && p.parcelas > 1 ? `Cartão ${p.parcelas}x` : "Cartão";
}

const JANELA_CELULAR = "max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:overflow-y-auto sm:max-w-md";

function JanelaDevolucao({ linha, aoFechar, aoRegistrar }: { linha: LinhaPagamento | null; aoFechar: () => void; aoRegistrar: (l: LinhaPagamento, motivo: string) => void }) {
	const [motivo, setMotivo] = useState("");
	const { offline } = useConexao();
	if (!linha) return null;
	const horas = horasDeAtrasoNaVolta(linha.reserva.id);
	const manut = D.manutencoes.find((m) => m.reservaOrigemId === linha.reserva.id);
	const dano = manut?.valorCobrado ?? 0;
	const multaPct = D.configuracoesExemplo.multaPctHora;
	const multa = multaPct != null ? horas * (multaPct / 100) * (Q.precoDa(linha.reserva.id).valorAluguel / Q.precoDa(linha.reserva.id).diarias) : 0;
	const devolver = Math.max(0, linha.pagamento.valor - multa - dano);
	const precisaMotivo = multa + dano > 0;
	return (
		<Dialog open onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent className={JANELA_CELULAR}>
				<DialogHeader>
					<DialogTitle>Registrar devolução da caução</DialogTitle>
					<DialogDescription>
						Reserva {linha.reserva.id} · {linha.cliente.nome}. A caução volta por Pix depois da conferência da volta, já descontadas a multa de atraso e o dano.
					</DialogDescription>
				</DialogHeader>
				{linha.danoPendente ? (
					<p className="flex items-start gap-2 rounded-md border border-atencao-borda bg-atencao-fundo p-3 text-atencao text-xs">
						<Icon icon={WarningAlt} className="mt-0.5 size-4 shrink-0" />
						Falta decidir a cobrança do dano (manutenção {manut?.id}) antes de devolver a caução.
					</p>
				) : null}
				<dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-lg border p-3 text-xs">
					<dt>Caução recebida</dt>
					<dd className="text-right tabular-nums">{dinheiro(linha.pagamento.valor)}</dd>
					<dt>
						Multa de atraso{horas ? ` (${horas} h)` : ""}
						{multaPct == null && horas ? (
							<span className="block text-muted-foreground text-2xs">O percentual por hora ainda não foi decidido: o app só conta as horas.</span>
						) : null}
					</dt>
					<dd className="text-right tabular-nums">{multaPct == null && horas ? <Definir>% por hora</Definir> : `− ${dinheiro(multa)}`}</dd>
					<dt>Dano{manut ? ` (manutenção ${manut.id})` : ""}</dt>
					<dd className="text-right tabular-nums">{linha.danoPendente ? "a decidir" : `− ${dinheiro(dano)}`}</dd>
					<dt className="border-t pt-2 font-medium">A devolver por Pix</dt>
					<dd className="border-t pt-2 text-right font-medium tabular-nums">{dinheiro(devolver)}</dd>
				</dl>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="motivo-desconto">Motivo do desconto{precisaMotivo ? "" : " (só se houver desconto)"}</Label>
					<Textarea id="motivo-desconto" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: 2 horas de atraso" />
				</div>
				<p className="text-muted-foreground text-2xs">Devolva sempre para a conta de quem pagou. Registrar a devolução não se desfaz.</p>
				<DialogFooter>
					<Button variant="outline" onClick={aoFechar}>
						Cancelar
					</Button>
					<Button disabled={linha.danoPendente || offline || (precisaMotivo && !motivo.trim())} onClick={() => aoRegistrar(linha, motivo)}>
						Registrar devolução
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function JanelaEstorno({ linha, aoFechar, aoRegistrar }: { linha: LinhaPagamento | null; aoFechar: () => void; aoRegistrar: (l: LinhaPagamento) => void }) {
	const agora = useAgora(60_000);
	const { offline } = useConexao();
	if (!linha) return null;
	const cancel = cancelamentoPelaRegra(linha.reserva.id, agora);
	const ehCancelamento = linha.reserva.etapa === "cancelada";
	return (
		<Dialog open onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent className={JANELA_CELULAR}>
				<DialogHeader>
					<DialogTitle>{linha.situacao === "divergente" ? "Pagamento com valor diferente" : "Estornar pela InfinitePay"}</DialogTitle>
					<DialogDescription>
						Reserva {linha.reserva.id} · {linha.cliente.nome}
					</DialogDescription>
				</DialogHeader>
				{linha.situacao === "divergente" ? (
					<p className="text-xs/5">
						Na dupla checagem, o valor que chegou ({dinheiro(linha.pagamento.valorRecebido ?? 0)}) não bate com o valor da reserva ({dinheiro(linha.pagamento.valor)}). Nada foi confirmado e a equipe foi chamada. Fale com o cliente pela conversa e, se for o caso, estorne o valor recebido.
					</p>
				) : (
					<p className="text-xs/5">
						{ehCancelamento
							? `Cancelamento depois de pago: grátis até 48 h antes da retirada; depois, o cliente paga 50%. Pela regra, devolver ${dinheiro(cancel.devolver)}.`
							: "O cliente pagou depois dos 20 minutos e a peça já tinha sido reservada por outra pessoa. O valor volta inteiro."}
					</p>
				)}
				<p className="flex items-start gap-2 rounded-md border border-erro-borda bg-erro-fundo p-3 font-medium text-erro text-xs">
					<Icon icon={WarningAlt} className="mt-0.5 size-4 shrink-0" />
					Estorne sempre pela transação original na InfinitePay. Nunca para outra conta, mesmo que o cliente peça.
				</p>
				<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
					<dt className="text-muted-foreground">Código da transação</dt>
					<dd>
						<Codigo>{linha.pagamento.idTransacao ?? "—"}</Codigo>
					</dd>
					<dt className="text-muted-foreground">Pago em</dt>
					<dd className="tabular-nums">{linha.pagamento.pagoEm ? `${dataCurta(linha.pagamento.pagoEm)} ${horaRelogio(linha.pagamento.pagoEm)}` : "—"}</dd>
					<dt className="text-muted-foreground">Forma</dt>
					<dd>{forma(linha.pagamento)}</dd>
					<dt className="text-muted-foreground">Valor recebido</dt>
					<dd className="tabular-nums">{dinheiro(linha.pagamento.valorRecebido ?? linha.pagamento.valor)}</dd>
				</dl>
				<DialogFooter>
					<Button variant="outline" onClick={() => toast("No app real, abre a transação na InfinitePay", { description: "Protótipo: nenhuma ligação é feita." })}>
						<Icon icon={Launch} data-icon="inline-start" />
						Abrir na InfinitePay
					</Button>
					<Button disabled={offline} onClick={() => aoRegistrar(linha)}>
						Registrar estorno feito
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function TelaPagamentos() {
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { abrir } = useFicha();
	const ehCelular = useIsMobile();
	const [feitos, setFeitos] = useState<Record<number, SituacaoLinha>>({});
	const [devolver, setDevolver] = useState<LinhaPagamento | null>(null);
	const [estornar, setEstornar] = useState<LinhaPagamento | null>(null);

	const linhas = useMemo(() => (estado === "vazio" ? [] : linhasPagamento().map((l) => (feitos[l.id] ? { ...l, situacao: feitos[l.id] } : l))), [estado, feitos]);
	const n = numerosPagamentos(agora);
	useRegistrarLista("reserva", [...new Set(linhas.map((l) => String(l.reserva.id)))]);

	const acao = (l: LinhaPagamento) => {
		if (l.situacao === "aguardando") {
			toast.success("Link reenviado", { description: `${TIPO[l.pagamento.tipo]} da reserva ${l.reserva.id}, pelo WhatsApp.` });
		} else if (l.situacao === "a_devolver") setDevolver(l);
		else if (l.situacao === "a_estornar" || l.situacao === "divergente") setEstornar(l);
	};

	const colunas: Coluna<LinhaPagamento>[] = [
		{
			id: "quando",
			header: "Hora",
			label: "Hora",
			sortable: true,
			width: "w-[11%]",
			cell: (l) => (
				<span className="tabular-nums">
					{dataCurta(l.quando)} {horaRelogio(l.quando)}
				</span>
			),
			exportar: (l) => `${dataCurta(l.quando)} ${horaRelogio(l.quando)}`,
		},
		{ id: "cliente", header: "Cliente", label: "Cliente", sortable: true, width: "w-[18%]", cell: (l) => <span className="truncate font-medium">{l.cliente.nome}</span>, exportar: (l) => l.cliente.nome },
		{ id: "reserva", header: "Reserva", label: "Reserva", width: "w-[9%]", cell: (l) => <Codigo>{l.reserva.id}</Codigo>, exportar: (l) => l.reserva.id },
		{ id: "tipo", header: "Tipo", label: "Tipo", width: "w-[11%]", cell: (l) => TIPO[l.pagamento.tipo], exportar: (l) => TIPO[l.pagamento.tipo] },
		{ id: "forma", header: "Forma", label: "Forma", width: "w-[10%]", hideBelow: "lg", cell: (l) => forma(l.pagamento), exportar: (l) => forma(l.pagamento) },
		{ id: "valor", header: "Valor", label: "Valor", sortable: true, align: "right", width: "w-[12%]", cell: (l) => <Dinheiro valor={l.pagamento.valor} />, exportar: (l) => dinheiro(l.pagamento.valor) },
		{
			id: "situacao",
			header: "Situação",
			label: "Situação",
			width: "w-[29%]",
			hideable: false,
			cell: (l) => {
				const s = SITUACAO_LINHA[l.situacao];
				return (
					<span className="flex items-center gap-2">
						<Selo tom={s.tom}>{s.texto}</Selo>
						{l.devolucao?.valorRetido ? <span className="truncate text-muted-foreground text-2xs">retido {dinheiro(l.devolucao.valorRetido)}</span> : null}
						{s.acao ? (
							<Button
								variant="outline"
								size="xs"
								disabled={offline && l.situacao !== "aguardando"}
								onClick={(e) => {
									e.stopPropagation();
									acao(l);
								}}
							>
								{s.acao === "Reenviar link" ? <Icon icon={Copy} data-icon="inline-start" /> : null}
								{s.acao === "Reenviar link" ? "Link" : s.acao}
							</Button>
						) : null}
					</span>
				);
			},
			exportar: (l) => SITUACAO_LINHA[l.situacao].texto,
		},
	];

	const atalhos: AtalhoLista[] = [
		{ nome: "Aguardando pagamento", parametros: { recorte: "aguardando" } },
		{ nome: "A estornar", parametros: { recorte: "estornar" } },
		{ nome: "Cauções a devolver", parametros: { recorte: "devolver" } },
		{ nome: "Valor diferente", parametros: { recorte: "divergente" } },
	];

	return (
		<Pagina>
			<CabecalhoPagina titulo="Pagamentos" descricao="O que a InfinitePay confirmou, o que espera pagamento, estornos e cauções a devolver. Nada se confirma à mão." />
			{estado === "erro" ? (
				<div className="rounded-lg border">
					<EstadoErro frase="Não consegui carregar os pagamentos." />
				</div>
			) : estado === "carregando" ? (
				<EsqueletoLinhas linhas={9} />
			) : (
				<>
					<BlocoNumeros
						itens={[
							{ rotulo: "Confirmado no mês", valor: <Dinheiro valor={n.confirmadoMes} />, detalhe: "Só pagamento confirmado pela InfinitePay", href: "/pagamentos?recorte=confirmados" },
							{ rotulo: "Aguardando pagamento", valor: <>{n.aguardando.qtd} · <Dinheiro valor={n.aguardando.valor} /></>, href: "/pagamentos?recorte=aguardando" },
							{ rotulo: "A estornar", valor: <>{n.estornar.qtd} · <Dinheiro valor={n.estornar.valor} /></>, href: "/pagamentos?recorte=estornar" },
							{ rotulo: "Cauções a devolver", valor: <>{n.devolver.qtd} · <Dinheiro valor={n.devolver.valor} /></>, href: "/pagamentos?recorte=devolver" },
						]}
					/>
					<TabelaLista<LinhaPagamento>
						nome="pagamentos"
						linhas={linhas}
						colunas={colunas}
						idDa={(l) => String(l.id)}
						placeholderBusca="Buscar cliente, reserva ou código da transação…"
						config={{
							texto: (l) => `${l.cliente.nome} ${l.reserva.id} ${l.pagamento.idTransacao ?? ""}`,
							ordenacoes: { quando: (l) => l.quando.getTime(), cliente: (l) => l.cliente.nome, valor: (l) => l.pagamento.valor },
							ordemPadrao: { coluna: "quando", direcao: "desc" },
							recortes: {
								id: "recorte",
								rotuloTodos: "Todos",
								opcoes: [
									{ valor: "aguardando", rotulo: "Aguardando", filtro: (l) => l.situacao === "aguardando" },
									{ valor: "confirmados", rotulo: "Confirmados", filtro: (l) => l.situacao === "confirmado" },
									{ valor: "estornar", rotulo: "A estornar", filtro: (l) => l.situacao === "a_estornar" },
									{ valor: "devolver", rotulo: "Cauções a devolver", filtro: (l) => l.situacao === "a_devolver" },
									{ valor: "divergente", rotulo: "Valor diferente", filtro: (l) => l.situacao === "divergente" },
								],
							},
						}}
						facetas={[
							{ id: "tipo", rotulo: "Tipo", valor: (l) => l.pagamento.tipo, opcoes: [{ valor: "aluguel", rotulo: "Aluguel" }, { valor: "caucao", rotulo: "Caução" }, { valor: "prorrogacao", rotulo: "Prorrogação" }] },
							{ id: "forma", rotulo: "Forma", valor: (l) => l.pagamento.forma ?? "", opcoes: [{ valor: "pix", rotulo: "Pix" }, { valor: "cartao", rotulo: "Cartão" }] },
						]}
						atalhos={atalhos}
						aoClicar={(l) => {
							if (ehCelular && ["a_devolver", "a_estornar", "divergente"].includes(l.situacao)) acao(l);
							else abrir("reserva", l.reserva.id, { aba: "pagamentos" });
						}}
						rodape={({ total }) => `${numero(total)} ${total === 1 ? "pagamento" : "pagamentos"}`}
						vazio={<EstadoVazio icone={Wallet} titulo="Nenhum pagamento ainda" descricao="Eles aparecem quando o cliente paga pelo link da InfinitePay." />}
						vazioComFiltro="Nenhum pagamento com esses filtros."
						celular={(l) => {
							const s = SITUACAO_LINHA[l.situacao];
							return (
								<>
									<span className="flex min-w-0 flex-1 flex-col gap-0.5">
										<span className="truncate font-medium text-sm">{l.cliente.nome}</span>
										<span className="truncate text-muted-foreground text-xs">
											{TIPO[l.pagamento.tipo]} · {forma(l.pagamento)} · reserva {l.reserva.id} · {dataCurta(l.quando)}
										</span>
									</span>
									<span className="flex shrink-0 flex-col items-end gap-1">
										<Dinheiro valor={l.pagamento.valor} className="font-medium text-sm" />
										<Selo tom={s.tom}>{s.texto}</Selo>
									</span>
								</>
							);
						}}
					/>
					<p className={cn("text-muted-foreground text-xs")}>
						Cancelamento depois de pago: grátis até 48 h antes da retirada; depois, o cliente paga 50%. Devolução e estorno sempre pela transação original. Quem paga a taxa do cartão na devolução: <Definir />
					</p>
				</>
			)}
			<JanelaDevolucao
				linha={devolver}
				aoFechar={() => setDevolver(null)}
				aoRegistrar={(l) => {
					setFeitos((f) => ({ ...f, [l.id]: "caucao_devolvida" }));
					setDevolver(null);
					toast.success("Devolução da caução registrada", { description: `Reserva ${l.reserva.id}. O cliente é avisado pelo WhatsApp.` });
				}}
			/>
			<JanelaEstorno
				linha={estornar}
				aoFechar={() => setEstornar(null)}
				aoRegistrar={(l) => {
					setFeitos((f) => ({ ...f, [l.id]: "estornado" }));
					setEstornar(null);
					toast.success("Estorno registrado", { description: `Reserva ${l.reserva.id}, pela transação original.` });
				}}
			/>
		</Pagina>
	);
}
