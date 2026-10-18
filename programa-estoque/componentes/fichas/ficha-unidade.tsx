"use client";
// Ficha da unidade (peça física): estado, onde está, histórico, manutenção e reservas.

import Printer from "@carbon/icons-react/es/Printer";
import OverflowMenuHorizontal from "@carbon/icons-react/es/OverflowMenuHorizontal";
import Tools from "@carbon/icons-react/es/Tools";
import Task from "@carbon/icons-react/es/Task";
import RecentlyViewed from "@carbon/icons-react/es/RecentlyViewed";
import { Button } from "@/componentes/ui/button";
import { Codigo, Dinheiro, EstadoErro, EsqueletoLinhas, FotoEquipamento } from "@/componentes/ui/basicos";
import { CampoNoLugar } from "@/componentes/ui/campo-no-lugar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/componentes/ui/dropdown-menu";
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
import { LinhaDoTempo } from "@/componentes/ui/linha-do-tempo";
import { EtapaRotulo, PilulaUnidade, Selo } from "@/componentes/ui/marcadores";
import type { PropsFicha } from "@/componentes/fichas/registro";
import { BaixarUnidades, MandarParaReparo } from "@/componentes/estoque/janelas";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { Link } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { data, periodo, porcento, relativa } from "@/lib/formatos";
import * as Q from "@/prototipo/consultas";
import { ondeEsta, reservasDaUnidade } from "@/prototipo/consultas-estoque";
import { useState } from "react";

const SITUACAO_MANUTENCAO: Record<string, string> = {
	aberta: "Aberta",
	na_oficina: "Na oficina",
	esperando_peca: "Esperando peça",
	pronta: "Pronta",
	liberada: "Liberada",
	descartada: "Descartada",
};

export function FichaUnidade({ id, aoVoltar, trilha }: PropsFicha) {
	const agora = useAgora(60_000);
	const estadoTela = useEstadoTela();
	const { offline } = useConexao();
	const { ehDono, podeVerFinanceiro } = usePapel();
	const { abrir } = useFicha();
	const [reparo, setReparo] = useState(false);
	const [baixar, setBaixar] = useState(false);
	const u = Q.unidade(Number(id));

	if (!u) {
		return (
			<>
				<CabecalhoFicha titulo="Unidade" aoVoltar={aoVoltar} trilha={trilha} />
				<EstadoErro frase="Esta unidade não pôde ser carregada." />
			</>
		);
	}

	const e = Q.equipamento(u.equipamentoId);
	const s = Q.situacaoUnidade(u, agora);
	const onde = ondeEsta(u, agora);
	const manutencoes = Q.manutencoesDa(u.id);
	const reservas = reservasDaUnidade(u.id);
	const rendeu = Q.quantoJaRendeu(u.id);
	const eventos = Q.eventosDaUnidade(u.id).map((ev) => ({ ...ev, id: String(ev.id) }));

	if (estadoTela === "carregando") {
		return (
			<>
				<CabecalhoFicha titulo={<Codigo className="text-lg">{u.codigo}</Codigo>} aoVoltar={aoVoltar} trilha={trilha} />
				<div className="p-5">
					<EsqueletoLinhas linhas={4} />
				</div>
			</>
		);
	}

	return (
		<>
			<CabecalhoFicha
				foto={<FotoEquipamento nome={e.nome} tamanho={40} />}
				titulo={<span className="font-mono">{u.codigo}</span>}
				descricao={`${e.nome} · ${e.marca} ${e.modelo}${u.numeroSerie ? ` · nº ${u.numeroSerie}` : ""}`}
				aoVoltar={aoVoltar}
				trilha={trilha}
				nota={
					<>
						<PilulaUnidade estado={s.estado} detalhe={s.estado === "livre" ? undefined : s.detalhe} />
						{onde.ficha ? (
							<button type="button" onClick={() => onde.ficha && abrir(onde.ficha.tipo, onde.ficha.id, { empilhar: true })} className="text-link underline-offset-4 hover:underline">
								{onde.ficha.tipo === "reserva" ? `Abrir reserva ${onde.ficha.id}` : `Abrir manutenção ${onde.ficha.id}`}
							</button>
						) : (
							<span className="text-muted-foreground">{onde.texto}</span>
						)}
					</>
				}
				acoes={
					<>
						<Button asChild variant="outline" size="sm">
							<Link href={`/etiquetas?unidades=${u.id}`}>
								<Icon icon={Printer} data-icon="inline-start" />
								Imprimir etiqueta
							</Link>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon-sm" aria-label="Mais ações" disabled={offline}>
									<Icon icon={OverflowMenuHorizontal} />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-48">
								<DropdownMenuItem disabled={u.estado !== "ok"} onSelect={() => setReparo(true)}>
									Mandar para reparo
								</DropdownMenuItem>
								{ehDono ? (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem disabled={u.estado === "baixada"} onSelect={() => setBaixar(true)} className="text-erro">
											Baixar…
										</DropdownMenuItem>
									</>
								) : null}
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				}
			/>
			<NumerosFicha>
				<NumeroFicha rotulo="Próxima saída">{s.proximaSaida ? relativa(s.proximaSaida.em, agora) : "—"}</NumeroFicha>
				<NumeroFicha rotulo="Última conferência">{u.ultimaConferenciaEm ? relativa(u.ultimaConferenciaEm, agora) : "nunca"}</NumeroFicha>
				{podeVerFinanceiro ? (
					<>
						<NumeroFicha rotulo="Valor de compra">{u.valorCompra ? <Dinheiro valor={u.valorCompra} /> : "—"}</NumeroFicha>
						<NumeroFicha rotulo="Quanto já rendeu">{rendeu == null ? "Informe o valor de compra" : porcento(rendeu)}</NumeroFicha>
					</>
				) : (
					<NumeroFicha rotulo="Reparos na vida">{manutencoes.length}</NumeroFicha>
				)}
			</NumerosFicha>
			<AbasFicha
				abas={[
					{
						valor: "geral",
						rotulo: "Visão geral",
						conteudo: (
							<>
								<SecaoFicha titulo="Detalhes">
									<PropriedadesFicha>
										<PropriedadeFicha rotulo="Equipamento">
											<button type="button" onClick={() => abrir("equipamento", e.id, { empilhar: true })} className="text-link underline-offset-4 hover:underline">
												{e.nome}
											</button>
										</PropriedadeFicha>
										<PropriedadeFicha rotulo="Nº de série">{u.numeroSerie ? <Codigo>{u.numeroSerie}</Codigo> : "—"}</PropriedadeFicha>
										<PropriedadeFicha rotulo="Etiqueta">
											<Codigo>{u.codigo}</Codigo>
										</PropriedadeFicha>
										<PropriedadeFicha rotulo="Impressa em">{u.etiquetaImpressaEm ? data(u.etiquetaImpressaEm) : <Selo tom="atencao">Não impressa</Selo>}</PropriedadeFicha>
										<PropriedadeFicha rotulo="Comprada em">{u.compradaEm ? data(u.compradaEm) : "—"}</PropriedadeFicha>
										{u.motivoBaixa ? <PropriedadeFicha rotulo="Motivo da baixa">{u.motivoBaixa}</PropriedadeFicha> : null}
										<PropriedadeFicha rotulo="Observações" larga>
											<CampoNoLugar rotulo="Observações" valor={u.observacoes ?? ""} vazio="Sem observações" somenteLeitura={offline} />
										</PropriedadeFicha>
									</PropriedadesFicha>
								</SecaoFicha>
								<SecaoFicha titulo="Estado agora">
									<p className="text-muted-foreground text-xs/5">
										{s.estado === "livre"
											? "Pode entrar em reserva nova agora."
											: s.estado === "baixada"
												? "Baixada: não entra em reserva nenhuma."
												: "Não pode entrar em reserva nova agora."}{" "}
										É o mesmo estado mostrado em todas as telas.
									</p>
									{s.estado === "reparo" && s.proximaSaida ? (
										<button type="button" onClick={() => s.proximaSaida && abrir("reserva", s.proximaSaida.reservaId, { empilhar: true })} className="w-fit">
											<Selo tom="atencao">
												Tem reserva {relativa(s.proximaSaida.em, agora)} (reserva {s.proximaSaida.reservaId}): troque a unidade
											</Selo>
										</button>
									) : null}
								</SecaoFicha>
							</>
						),
					},
					{
						valor: "historico",
						rotulo: "Histórico",
						contagem: eventos.length,
						conteudo: eventos.length ? (
							<div className="px-5 py-3">
								<LinhaDoTempo eventos={eventos} />
							</div>
						) : (
							<VazioFicha icone={RecentlyViewed} titulo="Sem histórico ainda" descricao="Saídas, voltas e reparos desta peça aparecem aqui." />
						),
					},
					{
						valor: "manutencao",
						rotulo: "Manutenção",
						contagem: manutencoes.length,
						conteudo: manutencoes.length ? (
							<ul className="flex flex-col divide-y">
								{manutencoes.map((m) => (
									<li key={m.id}>
										<button type="button" onClick={() => abrir("manutencao", m.id, { empilhar: true })} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-muted">
											<span className="flex min-w-0 flex-1 flex-col gap-0.5">
												<span className="truncate font-medium text-xs">{m.problema}</span>
												<span className="text-muted-foreground text-xs">
													Manutenção {m.id} · aberta em {data(m.abertaEm)}
													{m.oficina ? ` · ${m.oficina}` : ""}
												</span>
											</span>
											<span className="flex shrink-0 flex-col items-end gap-1">
												<Selo tom={["liberada", "descartada"].includes(m.situacao) ? "neutro" : "atencao"}>{SITUACAO_MANUTENCAO[m.situacao]}</Selo>
												{podeVerFinanceiro && m.custo != null ? <Dinheiro valor={m.custo} className="text-muted-foreground text-xs" /> : null}
											</span>
										</button>
									</li>
								))}
							</ul>
						) : (
							<VazioFicha icone={Tools} titulo="Nenhum reparo" descricao="Quando esta peça for para reparo, a manutenção aparece aqui." />
						),
					},
					{
						valor: "reservas",
						rotulo: "Reservas",
						contagem: reservas.length,
						conteudo: reservas.length ? (
							<ul className="flex flex-col divide-y">
								{reservas.map((r) => (
									<li key={r.id}>
										<button type="button" onClick={() => abrir("reserva", r.id, { empilhar: true })} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted">
											<span className="flex min-w-0 flex-1 flex-col gap-0.5">
												<span className="truncate text-xs">
													<span className="font-mono">{r.id}</span> · {Q.cliente(r.clienteId).nome}
												</span>
												<span className="text-muted-foreground text-xs">{periodo(r.retiradaEm, r.devolucaoEm)}</span>
											</span>
											<EtapaRotulo etapa={r.etapa} />
										</button>
									</li>
								))}
							</ul>
						) : (
							<VazioFicha icone={Task} titulo="Nenhuma reserva" descricao="As reservas que prenderam esta peça aparecem aqui." />
						),
					},
				]}
			/>
			<MandarParaReparo aberta={reparo} aoFechar={() => setReparo(false)} quantidade={1} />
			<BaixarUnidades aberta={baixar} aoFechar={() => setBaixar(false)} quantidade={1} />
		</>
	);
}
