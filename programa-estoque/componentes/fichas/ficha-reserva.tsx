"use client";
// 7.4 Ficha da reserva (ordem de locação): etapa, itens com unidade, valores, pagamento, documentos e histórico.

import { CampoDataHora } from "@/componentes/ui/campo-data";
import ChevronDown from "@carbon/icons-react/es/ChevronDown";
import Copy from "@carbon/icons-react/es/Copy";
import Document from "@carbon/icons-react/es/Document";
import Misuse from "@carbon/icons-react/es/Misuse";
import OverflowMenuVertical from "@carbon/icons-react/es/OverflowMenuVertical";
import Renew from "@carbon/icons-react/es/Renew";
import Scan from "@carbon/icons-react/es/Scan";
import SendAlt from "@carbon/icons-react/es/SendAlt";
import Task from "@carbon/icons-react/es/Task";
import Time from "@carbon/icons-react/es/Time";
import Chat from "@carbon/icons-react/es/Chat";
import Locked from "@carbon/icons-react/es/Locked";
import { Button } from "@/componentes/ui/button";
import { Codigo, Dinheiro, FotoCliente, FotoEquipamento, ContadorRegressivo } from "@/componentes/ui/basicos";
import { CampoNoLugar } from "@/componentes/ui/campo-no-lugar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import {
	AbasFicha,
	CabecalhoFicha,
	NumeroFicha,
	NumerosFicha,
	PropriedadeFicha,
	PropriedadesFicha,
	SecaoFicha,
	VazioFicha,
	useFicha,
} from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { Label } from "@/componentes/ui/label";
import { LinhaDoTempo, type EventoLinha } from "@/componentes/ui/linha-do-tempo";
import { EtapaRotulo, PilulaUnidade, Selo } from "@/componentes/ui/marcadores";
import { Regua } from "@/componentes/ui/regua";
import { Textarea } from "@/componentes/ui/textarea";
import type { PropsFicha } from "@/componentes/fichas/registro";
import { destinosPossiveis, useMoverReserva } from "@/componentes/locacao/reserva-mover";
import { useConexao } from "@/lib/estado-prototipo";
import { Link, useNavegar } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { ETAPAS, ETAPAS_DA_REGUA } from "@/lib/regras/etapas";
import { dataCompleta, diaEHora, dinheiro, duracao, horaRelogio, dataCurta, mesmoDia } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { avisarMudanca, trocarUnidade, unidadesParaTroca, useVersaoDados } from "@/prototipo/consultas-reservas";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

const NOME_DOCUMENTO: Record<D.Documento["tipo"], string> = {
	contrato_geral: "Contrato geral",
	ordem_locacao: "Ordem de locação",
	termo_retirada: "Termo de retirada",
	termo_devolucao: "Termo de devolução",
	recibo_locacao: "Recibo de locação",
	recibo_caucao: "Recibo da caução",
	lista_separacao: "Lista de separação",
};

const NOME_PAGAMENTO: Record<D.Pagamento["tipo"], string> = {
	aluguel: "Aluguel",
	caucao: "Caução",
	prorrogacao: "Prorrogação",
};

function useEscrita() {
	const { offline } = useConexao();
	return {
		offline,
		dica: offline ? "Volta quando a internet voltar" : undefined,
		avisar: (texto: string) => (offline ? toast.error("Sem internet. Volta quando a internet voltar.") : toast.success(texto)),
	};
}

/* ---------------------------------------------------------------- cabeçalho */

function MenuEtapa({ reserva, aoMover }: { reserva: D.Reserva; aoMover: (para: D.Reserva["etapa"]) => void }) {
	const { ehDono } = usePapel();
	const { offline } = useConexao();
	const destinos = destinosPossiveis(reserva.etapa, ehDono).filter((d) => (ehDono ? true : d.tipo === "manual" && d.para === "separada"));
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" disabled={destinos.length === 0 || offline} title={offline ? "Volta quando a internet voltar" : undefined} aria-label={`Etapa: ${ETAPAS[reserva.etapa].nome}. Mudar etapa`}>
					<EtapaRotulo etapa={reserva.etapa} />
					<Icon icon={ChevronDown} data-icon="inline-end" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-56">
				<DropdownMenuLabel>Mover para…</DropdownMenuLabel>
				{destinos.map((d) => (
					<DropdownMenuItem key={d.para} disabled={d.tipo === "proibida"} onSelect={() => aoMover(d.para)}>
						<EtapaRotulo etapa={d.para} />
						{d.tipo === "outra-tela" ? <span className="ml-auto text-2xs text-muted-foreground">em outra tela</span> : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function podeIrAoBalcao(r: D.Reserva, agora: Date) {
	return (r.etapa === "confirmada" && mesmoDia(r.retiradaEm, agora)) || r.etapa === "separada" || r.etapa === "retirada";
}

/* ---------------------------------------------------------------- visão geral */

function QuadroBloqueio({ reserva }: { reserva: D.Reserva }) {
	const { ehDono } = usePapel();
	const { abrir } = useFicha();
	const esc = useEscrita();
	if (!["pre_reserva", "confirmada", "separada"].includes(reserva.etapa)) return null;
	const bloqueios = Q.bloqueiosSaida(reserva.id);
	if (bloqueios.length === 0) {
		return (
			<div className="flex items-start gap-2 rounded-lg border border-ok-borda bg-ok-fundo p-3 text-xs">
				<Selo tom="ok">Pode sair</Selo>
				<span>Aluguel e caução confirmados pelo sistema, cadastro aprovado e assinaturas feitas.</span>
			</div>
		);
	}
	return (
		<section aria-label="Saída bloqueada" className="flex flex-col gap-2 rounded-lg border border-erro-borda bg-erro-fundo p-3">
			<h3 className="flex items-center gap-2 font-medium text-erro text-xs uppercase tracking-wider">
				<Icon icon={Misuse} className="size-4" />
				Saída bloqueada
			</h3>
			<ul className="flex flex-col divide-y divide-erro-borda">
				{bloqueios.map((b) => (
					<li key={b.frase} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
						<span>{b.frase}</span>
						{b.acao === "Ver documentos" ? (
							ehDono ? (
								<Button variant="outline" size="sm" onClick={() => abrir("cliente", reserva.clienteId, { empilhar: true, aba: "documentos" })}>
									Ver documentos
								</Button>
							) : (
								<span className="text-foreground">Chame o dono</span>
							)
						) : (
							<Button variant="outline" size="sm" disabled={esc.offline} title={esc.dica} onClick={() => esc.avisar("Link reenviado pelo WhatsApp")}>
								<Icon icon={SendAlt} data-icon="inline-start" />
								{b.acao}
							</Button>
						)}
					</li>
				))}
			</ul>
			<p className="text-foreground text-xs">
				A saída exige aluguel e caução confirmados pela InfinitePay, cadastro aprovado e as assinaturas. Só o dono pode liberar a falta de assinatura, com motivo registrado.
			</p>
		</section>
	);
}

function SituacaoLink({ titulo, detalhe, selo, aoReenviar }: { titulo: string; detalhe: string; selo: ReactNode; aoReenviar?: () => void }) {
	const esc = useEscrita();
	return (
		<li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="font-medium text-xs">{titulo}</span>
				<span className="text-muted-foreground text-xs">{detalhe}</span>
			</div>
			{selo}
			{aoReenviar ? (
				<Button variant="ghost" size="sm" disabled={esc.offline} title={esc.dica} onClick={aoReenviar}>
					<Icon icon={SendAlt} data-icon="inline-start" />
					Reenviar
				</Button>
			) : null}
		</li>
	);
}

function VisaoGeral({ reserva, agora }: { reserva: D.Reserva; agora: Date }) {
	const { ehDono, podeVerFinanceiro } = usePapel();
	const esc = useEscrita();
	const c = Q.cliente(reserva.clienteId);
	const pg = Q.situacaoPagamentos(reserva.id);
	const preco = Q.precoDa(reserva.id);
	const modelo = Q.modeloOrdemDa(reserva.id);
	const retira = reserva.contatoRetiraId ? Q.contato(reserva.contatoRetiraId) : undefined;
	const atraso = Q.atrasoDa(reserva.id, agora);
	const fora = reserva.etapa === "expirada" || reserva.etapa === "cancelada";

	return (
		<div className="flex flex-col">
			<SecaoFicha titulo="Etapa">
				<Regua passos={ETAPAS_DA_REGUA} atual={fora ? null : reserva.etapa} rotulo={(e) => ETAPAS[e].nome} />
				{fora ? (
					<p className="flex flex-wrap items-center gap-2 pt-1 text-xs">
						<EtapaRotulo etapa={reserva.etapa} />
						<span className="text-muted-foreground">
							{reserva.etapa === "cancelada"
								? `Motivo: ${reserva.motivoCancelamento ?? "não informado"}.`
								: reserva.expiraEm
									? `Os 20 minutos acabaram às ${horaRelogio(reserva.expiraEm)} sem os pagamentos confirmados.`
									: ""}
						</span>
					</p>
				) : null}
				{reserva.etapa === "pre_reserva" && reserva.expiraEm ? (
					<div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
						<span className="text-muted-foreground">Expira em</span>
						<ContadorRegressivo expiraEm={reserva.expiraEm} />
						{Q.ehSegundaChance(reserva.id) ? <Selo tom="info">2ª chance: não será renovada</Selo> : null}
					</div>
				) : null}
			</SecaoFicha>

			{["pre_reserva", "confirmada", "separada"].includes(reserva.etapa) ? (
				<div className="border-b px-5 py-3">
					<QuadroBloqueio reserva={reserva} />
				</div>
			) : null}

			<SecaoFicha titulo="Detalhes">
				<PropriedadesFicha>
					<PropriedadeFicha rotulo="Retirada">{diaEHora(reserva.retiradaEm)}</PropriedadeFicha>
					<PropriedadeFicha rotulo="Devolução">{diaEHora(reserva.devolucaoEm)}</PropriedadeFicha>
					<PropriedadeFicha rotulo="Quem retira">{retira ? `${retira.nome} (contato · ${retira.funcao})` : c.tipo === "pj" ? "A definir" : "O próprio cliente"}</PropriedadeFicha>
					<PropriedadeFicha rotulo="Produção">{reserva.producao ?? <span className="text-muted-foreground">—</span>}</PropriedadeFicha>
					<PropriedadeFicha rotulo="Cidade de uso">
						{reserva.cidadeUso ?? <span className="text-muted-foreground">—</span>}
						{reserva.foraDoRj ? <Selo tom="info" className="ml-2">Fora do RJ</Selo> : null}
					</PropriedadeFicha>
					<PropriedadeFicha rotulo="Veio por">{reserva.origem === "robo" ? "Robô no WhatsApp" : "Montador de pedido"}</PropriedadeFicha>
					<PropriedadeFicha rotulo="Observações" larga>
						<CampoNoLugar
							rotulo="Observações"
							valor={reserva.observacoes ?? ""}
							vazio="Nenhuma observação"
							somenteLeitura={!ehDono || esc.offline}
							aoSalvar={(v) => {
								reserva.observacoes = v;
								avisarMudanca();
							}}
						/>
					</PropriedadeFicha>
				</PropriedadesFicha>
			</SecaoFicha>

			<SecaoFicha titulo="Contrato">
				<p className="text-xs">
					<span className="font-medium">
						{c.contratoGeral ? `${c.contratoGeral.modelo} já assinado` : `${c.tipo === "pj" ? "CG-PJ" : "CG-PF"} (1º aluguel)`} + {modelo.modelo}
					</span>
					<span className="text-muted-foreground"> · pela regra do banco. {modelo.motivo}</span>
				</p>
				{modelo.aprovacaoDaEquipe ? (
					<div className="flex flex-wrap items-center gap-2">
						<Selo tom="atencao">Aguardando aprovação da equipe</Selo>
						{ehDono ? (
							<Button variant="outline" size="sm" disabled={esc.offline} onClick={() => esc.avisar("Envio aprovado")}>
								Aprovar envio
							</Button>
						) : null}
					</div>
				) : null}
				<p className="flex items-center gap-1.5 text-muted-foreground text-xs">
					<Icon icon={Locked} className="size-3.5" />
					Só leitura: ninguém muda cláusula pelo app. As minutas ainda passam pelo advogado.
				</p>
			</SecaoFicha>

			<SecaoFicha titulo="Links enviados na mesma mensagem">
				{reserva.ordemEnviadaEm ? (
					<ul className="flex flex-col divide-y">
						<SituacaoLink
							titulo={c.contratoGeral ? "Assinatura da ordem" : "Assinatura da ordem e do contrato geral"}
							detalhe={reserva.ordemAssinadaEm ? `Assinada às ${horaRelogio(reserva.ordemAssinadaEm)} de ${dataCurta(reserva.ordemAssinadaEm)}, pelo aviso da Autentique` : `Enviada às ${horaRelogio(reserva.ordemEnviadaEm)} pela Autentique`}
							selo={reserva.ordemAssinadaEm && c.contratoGeral ? <Selo tom="ok">Assinada</Selo> : <Selo tom="atencao">Aguardando</Selo>}
							aoReenviar={reserva.ordemAssinadaEm && c.contratoGeral ? undefined : () => esc.avisar("Link de assinatura reenviado")}
						/>
						<SituacaoLink
							titulo="Pagamento do aluguel (Pix ou cartão)"
							detalhe={podeVerFinanceiro ? `${dinheiro(preco.valorAluguel)} · link da InfinitePay com o número da reserva` : "Link da InfinitePay com o número da reserva"}
							selo={<Selo tom={Q.ROTULO_COBRANCA[pg.aluguel].tom}>{pg.aluguelConfirmado ? "Confirmado pela InfinitePay" : Q.ROTULO_COBRANCA[pg.aluguel].texto}</Selo>}
							aoReenviar={pg.aluguel === "aguardando" ? () => esc.avisar("Link do aluguel reenviado") : undefined}
						/>
						<SituacaoLink
							titulo="Caução (link separado, só Pix)"
							detalhe={podeVerFinanceiro ? `${dinheiro(preco.valorCaucao)} (exemplo) · volta por Pix depois da conferência` : "Volta por Pix depois da conferência"}
							selo={
								pg.caucaoDevolvida ? (
									<Selo tom="neutro">Caução devolvida</Selo>
								) : (
									<Selo tom={Q.ROTULO_COBRANCA[pg.caucao].tom}>{pg.caucaoConfirmada ? "Confirmada pela InfinitePay" : Q.ROTULO_COBRANCA[pg.caucao].texto}</Selo>
								)
							}
							aoReenviar={pg.caucao === "aguardando" ? () => esc.avisar("Link da caução reenviado") : undefined}
						/>
					</ul>
				) : (
					<p className="text-muted-foreground text-xs">Os três links saem juntos quando a ordem for enviada (Pré-reservar e enviar ordem).</p>
				)}
			</SecaoFicha>

			<SecaoFicha titulo="Período">
				<PropriedadesFicha colunas={1}>
					<PropriedadeFicha rotulo="Reservado">
						{diaEHora(reserva.retiradaEm)} → {diaEHora(reserva.devolucaoEm)}
					</PropriedadeFicha>
					<PropriedadeFicha rotulo="Cobrado">
						{preco.regra} <span className="text-muted-foreground">(cada dia conta; 60 min de tolerância na devolução)</span>
					</PropriedadeFicha>
					{atraso ? (
						<PropriedadeFicha rotulo="Atraso">
							<span className="flex flex-wrap items-center gap-2">
								<Selo tom="erro">Atrasada há {duracao(atraso.ms)}</Selo>
								<span>
									{atraso.horasCobradas} {atraso.horasCobradas === 1 ? "hora" : "horas"} depois da tolerância.
									{podeVerFinanceiro ? " Multa por hora: a definir (% da diária). Até decidir, o app só conta as horas e avisa." : ""}
								</span>
							</span>
						</PropriedadeFicha>
					) : null}
				</PropriedadesFicha>
			</SecaoFicha>
		</div>
	);
}

/* ---------------------------------------------------------------- itens */

type LinhaItem = {
	chave: string;
	equipamento: D.Equipamento;
	unidade?: D.Unidade;
	item?: D.Item;
	tipo: D.Linha["tipo"];
	kitId?: number;
	quantidade: number;
};

function linhasDeItens(reserva: D.Reserva): LinhaItem[] {
	const linhas = Q.linhasDa(reserva.id);
	const itens = Q.itensDa(reserva.id);
	if (itens.length === 0) {
		return linhas.map((l, i) => ({ chave: `l${i}`, equipamento: Q.equipamento(l.equipamentoId), tipo: l.tipo, kitId: l.kitId, quantidade: l.quantidade }));
	}
	const vagas = linhas.flatMap((l) => Array.from({ length: l.quantidade }, () => ({ equipamentoId: l.equipamentoId, tipo: l.tipo, kitId: l.kitId, usada: false })));
	return itens.map((it) => {
		const u = Q.unidade(it.unidadeId);
		const vaga = vagas.find((v) => !v.usada && v.equipamentoId === u.equipamentoId);
		if (vaga) vaga.usada = true;
		return { chave: `i${it.id}`, equipamento: Q.equipamento(u.equipamentoId), unidade: u, item: it, tipo: vaga?.tipo ?? "equipamento", kitId: vaga?.kitId, quantidade: 1 };
	});
}

function TrocarUnidade({ item, aoFechar, agora }: { item: D.Item | null; aoFechar: () => void; agora: Date }) {
	if (!item) return null;
	const atual = Q.unidade(item.unidadeId);
	const opcoes = unidadesParaTroca(item.id, agora);
	return (
		<Dialog open onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Trocar unidade</DialogTitle>
					<DialogDescription>
						Só outra unidade do mesmo modelo ({Q.equipamento(atual.equipamentoId).nome}), em bom estado e livre no período. A trava do banco garante.
					</DialogDescription>
				</DialogHeader>
				{opcoes.length ? (
					<ul className="flex flex-col divide-y rounded-lg border">
						{opcoes.map((u) => (
							<li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2">
								<span className="flex flex-col">
									<Codigo>{u.codigo}</Codigo>
									<span className="text-muted-foreground text-xs">nº {u.numeroSerie ?? "—"}</span>
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										trocarUnidade(item.id, u.id);
										aoFechar();
										toast.success(`Unidade trocada para ${u.codigo}`);
									}}
								>
									Usar esta
								</Button>
							</li>
						))}
					</ul>
				) : (
					<p className="text-xs">Nenhuma outra unidade deste modelo está livre no período.</p>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={aoFechar}>
						Fechar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function AbaItens({ reserva, agora }: { reserva: D.Reserva; agora: Date }) {
	const { podeVerFinanceiro, ehDono } = usePapel();
	const esc = useEscrita();
	const [trocando, setTrocando] = useState<D.Item | null>(null);
	const linhas = linhasDeItens(reserva);
	const diarias = Q.diariasCobradas(reserva.retiradaEm, reserva.devolucaoEm);
	if (linhas.length === 0) {
		return (
			<VazioFicha
				icone={Task}
				titulo="Nenhum item"
				descricao="Adicione pelo Montador."
				acao={
					ehDono ? (
						<Button asChild variant="outline" size="sm">
							<Link href={`/pedido/novo?cliente=${reserva.clienteId}`}>Abrir no Montador</Link>
						</Button>
					) : undefined
				}
			/>
		);
	}
	const podeTrocar = ehDono && ["pre_reserva", "confirmada", "separada"].includes(reserva.etapa);
	const grupos: { kitId?: number; linhas: LinhaItem[] }[] = [];
	for (const l of linhas) {
		const g = grupos.find((x) => x.kitId === l.kitId);
		if (g) g.linhas.push(l);
		else grupos.push({ kitId: l.kitId, linhas: [l] });
	}
	return (
		<div className="flex flex-col gap-3 px-5 py-3">
			{linhas[0].unidade ? null : <p className="text-muted-foreground text-xs">Orçamento: as unidades são escolhidas ao pré-reservar.</p>}
			{grupos.map((g) => (
				<div key={g.kitId ?? "avulsos"} className="flex flex-col gap-1">
					{g.kitId ? <h4 className="font-medium text-2xs text-muted-foreground uppercase tracking-wider">{Q.kit(g.kitId).nome}</h4> : null}
					<ul className="flex flex-col divide-y rounded-lg border">
						{g.linhas.map((l) => {
							const sit = l.unidade ? Q.situacaoUnidade(l.unidade, agora) : null;
							const diaria = l.tipo === "basico" ? 0 : l.equipamento.precoDiaria;
							const naoSaiu = l.item && !l.item.ativo && l.item.naoSaiuMotivo;
							return (
								<li key={l.chave} className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-xs", naoSaiu && "text-muted-foreground line-through")}>
									<FotoEquipamento nome={l.equipamento.nome} />
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="flex flex-wrap items-center gap-1.5">
											<span className="font-medium">
												{l.quantidade > 1 ? `${l.quantidade} × ` : ""}
												{l.equipamento.nome}
											</span>
											{l.tipo === "basico" ? <Selo tom="neutro">Pacote básico</Selo> : null}
											{l.tipo === "extra" ? <Selo tom="info">Extra</Selo> : null}
										</span>
										{l.unidade ? (
											<span className="text-muted-foreground">
												<Codigo>{l.unidade.codigo}</Codigo>
												{l.unidade.numeroSerie ? <Codigo> · nº {l.unidade.numeroSerie}</Codigo> : null}
											</span>
										) : (
											<span className="text-muted-foreground">{l.equipamento.marca} · {l.equipamento.modelo}</span>
										)}
										{naoSaiu ? <span className="no-underline">Não saiu: {l.item?.naoSaiuMotivo}</span> : null}
									</div>
									{sit ? <PilulaUnidade estado={sit.estado} detalhe={sit.reservaId === reserva.id ? undefined : sit.detalhe} compacta /> : null}
									{podeVerFinanceiro ? (
										<span className="w-28 text-right tabular-nums text-muted-foreground">
											{l.tipo === "basico" ? "incluso" : `${dinheiro(diaria)} × ${diarias}`}
										</span>
									) : (
										<span className="w-16 text-right tabular-nums text-muted-foreground">
											{diarias} {diarias === 1 ? "diária" : "diárias"}
										</span>
									)}
									{podeVerFinanceiro ? <Dinheiro valor={diaria * diarias * l.quantidade} className="w-20 text-right font-medium" /> : null}
									{podeTrocar && l.item ? (
										<Button variant="ghost" size="sm" disabled={esc.offline} title={esc.dica} onClick={() => setTrocando(l.item ?? null)}>
											<Icon icon={Renew} data-icon="inline-start" />
											Trocar unidade
										</Button>
									) : null}
								</li>
							);
						})}
					</ul>
				</div>
			))}
			<TrocarUnidade item={trocando} aoFechar={() => setTrocando(null)} agora={agora} />
		</div>
	);
}

/* ---------------------------------------------------------------- pagamentos */

function DevolucaoCaucao({ reserva, aberta, aoFechar, agora }: { reserva: D.Reserva; aberta: boolean; aoFechar: () => void; agora: Date }) {
	const [motivo, setMotivo] = useState("");
	if (!aberta) return null;
	const pg = Q.situacaoPagamentos(reserva.id);
	const caucao = pg.pagamentoCaucao?.valor ?? 0;
	const dano = D.manutencoes.filter((m) => m.reservaOrigemId === reserva.id && m.cobrarCliente && m.valorCobrado).reduce((s, m) => s + (m.valorCobrado ?? 0), 0);
	const devolver = caucao - dano;
	const atrasoHoras = reserva.voltaEm && reserva.voltaEm.getTime() > reserva.devolucaoEm.getTime() + Q.TOLERANCIA_MS ? Math.ceil((reserva.voltaEm.getTime() - reserva.devolucaoEm.getTime() - Q.TOLERANCIA_MS) / 3_600_000) : 0;
	return (
		<Dialog open onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Registrar devolução da caução</DialogTitle>
					<DialogDescription>Registra o Pix devolvido depois da conferência da volta. Não dá para desfazer.</DialogDescription>
				</DialogHeader>
				<dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-xs">
					<dt className="text-muted-foreground">Caução recebida</dt>
					<dd className="text-right tabular-nums">{dinheiro(caucao)}</dd>
					<dt className="text-muted-foreground">Multa de atraso ({atrasoHoras} h)</dt>
					<dd className="text-right tabular-nums">{atrasoHoras ? "− a definir" : dinheiro(0)}</dd>
					<dt className="text-muted-foreground">Dano</dt>
					<dd className="text-right tabular-nums">− {dinheiro(dano)}</dd>
					<dt className="font-medium">A devolver por Pix</dt>
					<dd className="text-right font-medium tabular-nums">{dinheiro(devolver)}</dd>
				</dl>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="motivo-desconto">Motivo do desconto</Label>
					<Textarea id="motivo-desconto" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Só se houver desconto" />
				</div>
				<p className="text-muted-foreground text-xs">Devolva sempre para a mesma conta que pagou. Nunca para outra conta.</p>
				<DialogFooter>
					<Button variant="outline" onClick={aoFechar}>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							if (pg.pagamentoCaucao) {
								D.devolucoes.push({ id: D.devolucoes.length + 1, pagamentoId: pg.pagamentoCaucao.id, tipo: "caucao", valor: devolver, valorRetido: caucao - devolver, motivoRetencao: motivo || undefined, feitoEm: agora, feitoPor: "Alef" });
								avisarMudanca();
							}
							aoFechar();
							toast.success("Devolução da caução registrada");
						}}
					>
						Registrar devolução
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function Prorrogar({ reserva, aberta, aoFechar, agora }: { reserva: D.Reserva; aberta: boolean; aoFechar: () => void; agora: Date }) {
	const [nova, setNova] = useState(() => paraCampo(new Date(reserva.devolucaoEm.getTime() + 86_400_000)));
	if (!aberta) return null;
	const novaData = deCampo(nova);
	const valida = novaData.getTime() > reserva.devolucaoEm.getTime();
	const eqs = [...new Set(Q.itensDa(reserva.id).map((i) => Q.unidade(i.unidadeId).equipamentoId))];
	const ocupado = valida
		? eqs.filter((eq) => {
				const minhas = Q.itensDa(reserva.id).filter((i) => Q.unidade(i.unidadeId).equipamentoId === eq);
				return minhas.some((i) =>
					Q.ocupacoesDaUnidade(i.unidadeId, agora).some(
						(o) => o.reservaId !== reserva.id && o.inicio.getTime() < novaData.getTime() + Q.FOLGA_MS && o.inicio.getTime() >= reserva.devolucaoEm.getTime(),
					),
				);
			})
		: [];
	const extra = valida ? Math.max(0, Q.diariasCobradas(reserva.retiradaEm, novaData) - Q.diariasCobradas(reserva.retiradaEm, reserva.devolucaoEm)) : 0;
	const diariaTotal = Q.precoDa(reserva.id).linhas.reduce((s, l) => s + l.diaria * l.quantidade, 0);
	const foraHorario = valida && !Q.dentroDoHorario(novaData);
	return (
		<Dialog open onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Prorrogar ou mudar período</DialogTitle>
					<DialogDescription>Se as peças estiverem livres nos dias extras, sai uma nova ordem curta e um novo link de pagamento só dos dias extras.</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="nova-devolucao">Nova devolução</Label>
					<CampoDataHora semPassado id="nova-devolucao" rotulo="Nova devolução" valor={nova} aoMudar={setNova} invalido={foraHorario || !valida} />
					{foraHorario ? <p className="text-erro text-xs">{"Esse horário está fora do horário do balcão."}</p> : null}
					{!valida ? <p className="text-erro text-xs">A nova devolução precisa ser depois da atual.</p> : null}
				</div>
				{valida && !foraHorario ? (
					ocupado.length ? (
						<p className="rounded-md border border-erro-borda bg-erro-fundo p-3 text-xs">
							Ocupado nos dias extras: {ocupado.map((e) => Q.equipamento(e).nome).join(", ")}. O caso fica com a equipe.
						</p>
					) : (
						<p className="rounded-md bg-muted p-3 text-xs">
							Livre. {extra} {extra === 1 ? "diária extra" : "diárias extras"}: <Dinheiro valor={extra * diariaTotal} className="font-medium" />. Mudança para um valor menor: a definir (por enquanto fica com a equipe).
						</p>
					)
				) : null}
				<DialogFooter>
					<Button variant="outline" onClick={aoFechar}>
						Cancelar
					</Button>
					<Button
						disabled={!valida || foraHorario || ocupado.length > 0 || extra === 0}
						onClick={() => {
							aoFechar();
							toast.success("Nova ordem curta e link dos dias extras enviados");
						}}
					>
						<Icon icon={SendAlt} data-icon="inline-start" />
						Enviar ordem e link
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function paraCampo(d: Date): string {
	return new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 16);
}
function deCampo(v: string): Date {
	return new Date(`${v}:00-03:00`);
}

function AbaPagamentos({ reserva, agora, aoCancelar }: { reserva: D.Reserva; agora: Date; aoCancelar: () => void }) {
	const esc = useEscrita();
	const [devolver, setDevolver] = useState(false);
	const [prorrogar, setProrrogar] = useState(false);
	const [estorno, setEstorno] = useState<D.Pagamento | null>(null);
	const ps = Q.pagamentosDa(reserva.id);
	const pg = Q.situacaoPagamentos(reserva.id);
	const devs = D.devolucoes.filter((d) => ps.some((p) => p.id === d.pagamentoId));
	const podeDevolver = reserva.etapa === "devolvida" && pg.caucaoConfirmada && !pg.caucaoDevolvida;
	const podeProrrogar = ["confirmada", "separada", "retirada"].includes(reserva.etapa);
	const podeCancelar = ["orcamento", "pre_reserva", "confirmada", "separada"].includes(reserva.etapa);
	return (
		<div className="flex flex-col gap-3 px-5 py-3">
			{ps.length === 0 ? (
				<p className="text-muted-foreground text-xs">Nenhum link ainda. Eles saem quando a ordem for enviada.</p>
			) : (
				<ul className="flex flex-col divide-y rounded-lg border">
					{ps.map((p) => (
						<li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-xs">
							<div className="flex min-w-0 flex-1 flex-col">
								<span className="font-medium">{NOME_PAGAMENTO[p.tipo]}</span>
								<span className="text-muted-foreground">
									{p.tipo === "caucao" ? "Link separado, só Pix" : "Link: Pix ou cartão"}
									{p.forma ? ` · ${p.forma === "pix" ? "Pix" : `Cartão ${p.parcelas ?? 1}x`}` : ""}
									{p.pagoEm ? ` · pago ${dataCurta(p.pagoEm)} ${horaRelogio(p.pagoEm)}` : ` · link enviado ${horaRelogio(p.linkCriadoEm)}`}
								</span>
								{p.status === "divergente" && p.valorRecebido != null ? <span className="text-erro">Chegou {dinheiro(p.valorRecebido)}; o valor certo é {dinheiro(p.valor)}.</span> : null}
							</div>
							<Dinheiro valor={p.valor} className="w-24 text-right font-medium" />
							<Selo tom={Q.ROTULO_COBRANCA[p.status].tom}>{Q.ROTULO_COBRANCA[p.status].texto}</Selo>
							{p.status === "aguardando" ? (
								<Button variant="ghost" size="sm" disabled={esc.offline} title={esc.dica} onClick={() => esc.avisar("Link reenviado pelo WhatsApp")}>
									<Icon icon={SendAlt} data-icon="inline-start" />
									Reenviar link
								</Button>
							) : null}
							{p.status === "a_reembolsar" ? (
								<Button variant="outline" size="sm" disabled={esc.offline} title={esc.dica} onClick={() => setEstorno(p)}>
									Estornar
								</Button>
							) : null}
						</li>
					))}
				</ul>
			)}
			{devs.length ? (
				<ul className="flex flex-col gap-1 text-xs">
					{devs.map((d) => (
						<li key={d.id} className="text-muted-foreground">
							{d.tipo === "caucao" ? "Caução devolvida por Pix" : "Estorno pela InfinitePay"}: <Dinheiro valor={d.valor} className="text-foreground" />
							{d.valorRetido ? (
								<>
									{" "}
									(retido <Dinheiro valor={d.valorRetido} />: {d.motivoRetencao})
								</>
							) : null}{" "}
							· {dataCurta(d.feitoEm)} · {d.feitoPor}
						</li>
					))}
				</ul>
			) : null}
			<div className="flex flex-wrap gap-2">
				{podeDevolver ? (
					<Button variant="outline" size="sm" disabled={esc.offline} title={esc.dica} onClick={() => setDevolver(true)}>
						Registrar devolução da caução
					</Button>
				) : null}
				{podeProrrogar ? (
					<Button variant="outline" size="sm" disabled={esc.offline} title={esc.dica} onClick={() => setProrrogar(true)}>
						<Icon icon={Time} data-icon="inline-start" />
						Prorrogar
					</Button>
				) : null}
				{podeCancelar ? (
					<Button variant="outline" size="sm" disabled={esc.offline} title={esc.dica} onClick={aoCancelar}>
						Cancelar reserva
					</Button>
				) : null}
			</div>
			<p className="text-muted-foreground text-xs">
				Nenhum botão confirma pagamento à mão. A situação vem só do aviso da InfinitePay, conferido de novo pelo n8n. Estorno sempre pela transação original.
			</p>
			<DevolucaoCaucao reserva={reserva} aberta={devolver} aoFechar={() => setDevolver(false)} agora={agora} />
			<Prorrogar reserva={reserva} aberta={prorrogar} aoFechar={() => setProrrogar(false)} agora={agora} />
			{estorno ? (
				<Dialog open onOpenChange={(o) => !o && setEstorno(null)}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Estornar pela InfinitePay</DialogTitle>
							<DialogDescription>Estorne sempre pela transação original na InfinitePay. Nunca para outra conta, mesmo que o cliente peça.</DialogDescription>
						</DialogHeader>
						<p className="text-xs">
							Valor: <Dinheiro valor={estorno.valor} className="font-medium" /> · código da transação <Codigo>{estorno.idTransacao}</Codigo>
						</p>
						<DialogFooter>
							<Button variant="outline" onClick={() => setEstorno(null)}>
								Fechar
							</Button>
							<Button
								onClick={() => {
									estorno.status = "estornado";
									avisarMudanca();
									setEstorno(null);
									toast.success("Estorno registrado");
								}}
							>
								Já estornei na InfinitePay
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</div>
	);
}

/* ---------------------------------------------------------------- documentos, conversas, histórico */

function AbaDocumentos({ reserva }: { reserva: D.Reserva }) {
	const esc = useEscrita();
	const c = Q.cliente(reserva.clienteId);
	const docs = Q.documentosDa(reserva.id);
	const temGeral = docs.some((d) => d.tipo === "contrato_geral");
	if (docs.length === 0 && !c.contratoGeral) {
		return <VazioFicha icone={Document} titulo="Nenhum documento ainda" descricao="A ordem de locação é gerada ao pré-reservar, no modelo escolhido pela regra do banco." />;
	}
	return (
		<div className="flex flex-col gap-3 px-5 py-3">
			<ul className="flex flex-col divide-y rounded-lg border">
				{docs.map((d) => (
					<li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-xs">
						<Icon icon={Document} className="size-4 text-muted-foreground" />
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="font-medium">
								{NOME_DOCUMENTO[d.tipo]} <Codigo className="text-muted-foreground">{d.numero}</Codigo>
							</span>
							<span className="text-muted-foreground">
								{d.modelo ? `${d.modelo} · ` : ""}versão {d.versaoModelo}
								{d.enviadoEm ? ` · enviado ${dataCurta(d.enviadoEm)} ${horaRelogio(d.enviadoEm)}` : ""}
							</span>
						</div>
						{["contrato_geral", "ordem_locacao"].includes(d.tipo) ? (
							d.assinadoEm ? (
								<Selo tom="ok" title={`Assinado ${dataCompleta(d.assinadoEm)}, pelo aviso da Autentique`}>
									Assinado {horaRelogio(d.assinadoEm)}
								</Selo>
							) : (
								<Selo tom="atencao">Aguardando assinatura</Selo>
							)
						) : null}
						<Button variant="ghost" size="sm" disabled={esc.offline} title={esc.dica} onClick={() => esc.avisar("Documento gerado de novo com número novo")}>
							Gerar de novo
						</Button>
						{!d.assinadoEm && ["contrato_geral", "ordem_locacao"].includes(d.tipo) ? (
							<Button variant="ghost" size="sm" disabled={esc.offline} title={esc.dica} onClick={() => esc.avisar("Link reenviado no WhatsApp")}>
								<Icon icon={SendAlt} data-icon="inline-start" />
								Reenviar link no WhatsApp
							</Button>
						) : null}
					</li>
				))}
				{c.contratoGeral && !temGeral ? (
					<li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-xs">
						<Icon icon={Document} className="size-4 text-muted-foreground" />
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="font-medium">Contrato geral do cliente</span>
							<span className="text-muted-foreground">
								{c.contratoGeral.modelo} · versão {c.contratoGeral.versao}
							</span>
						</div>
						<Selo tom="ok">Assinado {dataCurta(c.contratoGeral.assinadoEm)}</Selo>
					</li>
				) : null}
			</ul>
			<p className="text-muted-foreground text-xs">A data de assinatura só é gravada pelo aviso da Autentique. Gerar de novo cria um número novo; nada se apaga.</p>
		</div>
	);
}

function AbaConversas({ reserva }: { reserva: D.Reserva }) {
	const conversa = Q.conversaDaReserva(reserva.id);
	if (!conversa) return <VazioFicha icone={Chat} titulo="Nenhuma conversa" descricao="Nenhuma conversa do WhatsApp está ligada a esta reserva." />;
	const msgs = Q.mensagensDa(conversa.id);
	return (
		<div className="flex flex-col gap-3 px-5 py-3">
			<div className="flex items-center justify-between gap-2">
				<span className="text-muted-foreground text-xs">Somente leitura. Para responder, abra em Conversas.</span>
				<Button asChild variant="outline" size="sm">
					<Link href={`/conversas?conversa=${conversa.id}`}>
						<Icon icon={Chat} data-icon="inline-start" />
						Abrir em Conversas
					</Link>
				</Button>
			</div>
			<ol className="flex flex-col gap-2">
				{msgs.map((m) => {
					const direita = m.autor !== "cliente";
					return (
						<li key={m.id} className={cn("flex flex-col gap-0.5", direita ? "items-end" : "items-start")}>
							<span className="text-2xs text-muted-foreground">
								{m.autor === "cliente" ? conversa.nomeExibido : m.autor === "robo" ? "Robô" : m.autor === "automacao" ? "Mensagem automática" : m.usuario}
								{" · "}
								{horaRelogio(m.em)}
							</span>
							<p
								className={cn(
									"max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-xs",
									m.autor === "cliente" && "bg-muted",
									(m.autor === "robo" || m.autor === "automacao") && "bg-destaque-claro",
									m.autor === "equipe" && "bg-primary text-primary-foreground",
								)}
							>
								{m.texto}
							</p>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

function AbaHistorico({ reserva }: { reserva: D.Reserva }) {
	const eventos: EventoLinha[] = Q.eventosDaReserva(reserva.id).map((e) => ({ id: String(e.id), em: e.em, texto: e.texto, ator: e.ator, quem: e.quem }));
	return (
		<div className="px-5 py-3">
			<LinhaDoTempo eventos={eventos} />
		</div>
	);
}

/* ---------------------------------------------------------------- ficha */

export function FichaReserva({ id, aoVoltar, trilha }: PropsFicha) {
	useVersaoDados();
	const agora = useAgora(30_000);
	const { ehDono, podeVerFinanceiro } = usePapel();
	const { offline } = useConexao();
	const navegar = useNavegar();
	const { pedir, janela } = useMoverReserva();
	const r = D.reservas.find((x) => x.id === Number(id));

	if (!r) {
		return (
			<>
				<CabecalhoFicha titulo={`Reserva ${id}`} aoVoltar={aoVoltar} trilha={trilha} />
				<VazioFicha icone={Task} titulo="Esta reserva não pôde ser carregada." descricao="Confira o número ou tente de novo." />
			</>
		);
	}

	const c = Q.cliente(r.clienteId);
	const preco = Q.precoDa(r.id);
	const pg = Q.situacaoPagamentos(r.id);
	const docs = Q.documentosDa(r.id);
	const balcaoOk = podeIrAoBalcao(r, agora);
	const sentido = r.etapa === "retirada" ? "volta" : "saida";
	const selosNota = [
		Q.atrasoDa(r.id, agora) ? <Selo key="atraso" tom="erro">Atrasada</Selo> : null,
		Q.ehSegundaChance(r.id) && r.etapa === "pre_reserva" ? <Selo key="chance" tom="info">2ª chance</Selo> : null,
		c.cadastro === "aguardando" ? <Selo key="novo" tom="atencao">Cliente novo – aguardando aprovação</Selo> : null,
	].filter(Boolean);

	const abas = [
		{ valor: "visao", rotulo: "Visão geral", conteudo: <VisaoGeral reserva={r} agora={agora} /> },
		{ valor: "itens", rotulo: "Itens", contagem: Q.itensDa(r.id).length || Q.linhasDa(r.id).length, conteudo: <AbaItens reserva={r} agora={agora} /> },
		...(podeVerFinanceiro
			? [{ valor: "pagamentos", rotulo: "Pagamentos", contagem: Q.pagamentosDa(r.id).length, conteudo: <AbaPagamentos reserva={r} agora={agora} aoCancelar={() => pedir(r.id, "cancelada")} /> }]
			: []),
		{ valor: "documentos", rotulo: "Documentos", contagem: docs.length, conteudo: <AbaDocumentos reserva={r} /> },
		{ valor: "conversas", rotulo: "Conversas", conteudo: <AbaConversas reserva={r} /> },
		{ valor: "historico", rotulo: "Histórico", conteudo: <AbaHistorico reserva={r} /> },
	];

	return (
		<>
			<CabecalhoFicha
				aoVoltar={aoVoltar}
				trilha={trilha}
				foto={<FotoCliente nome={c.nome} tamanho={32} />}
				titulo={`Reserva ${r.id}`}
				descricao={`${c.nome} · Retirada ${diaEHora(r.retiradaEm)} · Devolução ${diaEHora(r.devolucaoEm)}`}
				nota={selosNota.length ? selosNota : undefined}
				acoes={
					<>
						<MenuEtapa reserva={r} aoMover={(para) => pedir(r.id, para)} />
						{balcaoOk ? (
							<Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => navegar(`/balcao?reserva=${r.id}&sentido=${sentido}`)}>
								<Icon icon={Scan} data-icon="inline-start" />
								Abrir no balcão
							</Button>
						) : null}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon-sm" aria-label="Mais ações">
									<Icon icon={OverflowMenuVertical} />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-56">
								<DropdownMenuItem
									onSelect={() => {
										try {
											void navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?ficha=reserva:${r.id}`);
										} catch {
											// sem área de transferência
										}
										toast.success("Link da ficha copiado");
									}}
								>
									<Icon icon={Copy} className="size-4" />
									Copiar link desta ficha
								</DropdownMenuItem>
								{ehDono ? (
									<DropdownMenuItem disabled={offline} onSelect={() => toast.success("Ordem gerada de novo com número novo")}>
										<Icon icon={Document} className="size-4" />
										Gerar a ordem de novo
									</DropdownMenuItem>
								) : null}
								{ehDono && ["orcamento", "pre_reserva", "confirmada", "separada"].includes(r.etapa) ? (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem disabled={offline} onSelect={() => pedir(r.id, "cancelada")}>
											<Icon icon={Misuse} className="size-4" />
											Cancelar reserva
										</DropdownMenuItem>
									</>
								) : null}
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				}
			/>
			<NumerosFicha>
				<NumeroFicha rotulo="Diárias cobradas">{preco.diarias}</NumeroFicha>
				{podeVerFinanceiro ? (
					<NumeroFicha rotulo="Total">{dinheiro(preco.valorAluguel)}</NumeroFicha>
				) : (
					<NumeroFicha rotulo="Itens">{Q.itensDa(r.id).length || Q.linhasDa(r.id).length}</NumeroFicha>
				)}
				<NumeroFicha rotulo={podeVerFinanceiro ? "Pagamento" : "Aluguel"}>
					{pg.aluguel === "sem_link" ? (
						<span className="text-muted-foreground">Sem link</span>
					) : (
						<Selo tom={Q.ROTULO_COBRANCA[pg.aluguel].tom}>{pg.aluguelConfirmado ? "Confirmado" : Q.ROTULO_COBRANCA[pg.aluguel].texto}</Selo>
					)}
				</NumeroFicha>
				<NumeroFicha rotulo="Caução">
					<span className="flex flex-wrap items-center gap-2">
						{podeVerFinanceiro ? <span>{dinheiro(preco.valorCaucao)}</span> : null}
						{pg.caucaoDevolvida ? (
							<Selo tom="neutro">Devolvida</Selo>
						) : pg.caucao === "sem_link" ? (
							<span className="text-muted-foreground">{podeVerFinanceiro ? "" : "Sem link"}</span>
						) : (
							<Selo tom={Q.ROTULO_COBRANCA[pg.caucao].tom}>{pg.caucaoConfirmada ? "Confirmada" : Q.ROTULO_COBRANCA[pg.caucao].texto}</Selo>
						)}
					</span>
				</NumeroFicha>
			</NumerosFicha>
			<AbasFicha abas={abas} />
			{balcaoOk ? (
				<div className="shrink-0 border-t bg-popover p-3 md:hidden">
					<Button className="h-12 w-full text-base" onClick={() => navegar(`/balcao?reserva=${r.id}&sentido=${sentido}`)}>
						<Icon icon={Scan} data-icon="inline-start" />
						Abrir no balcão
					</Button>
				</div>
			) : null}
			{janela}
		</>
	);
}

export { mesmoDia };
