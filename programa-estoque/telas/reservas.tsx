"use client";
// 7.3 Reservas: quadro por etapa e tabela. As mudanças seguem as regras do banco (componentes/locacao/reserva-mover).

import Add from "@carbon/icons-react/es/Add";
import Bookmark from "@carbon/icons-react/es/Bookmark";
import ChevronDown from "@carbon/icons-react/es/ChevronDown";
import Filter from "@carbon/icons-react/es/Filter";
import Task from "@carbon/icons-react/es/Task";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Codigo, Dinheiro, EstadoErro, EstadoVazio, Pagina } from "@/componentes/ui/basicos";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import { Icon } from "@/componentes/ui/icon";
import { EtapaRotulo, PontoEtapa, Selo } from "@/componentes/ui/marcadores";
import { CampoBusca, TabelaLista, type AtalhoLista, type Coluna } from "@/componentes/ui/tabela-lista";
import { ToggleGroup, ToggleGroupItem } from "@/componentes/ui/toggle-group";
import { useFicha, useRegistrarLista } from "@/componentes/ui/ficha";
import { EsqueletoQuadro, Quadro, type ColunaQuadro } from "@/componentes/quadro/quadro";
import { CartaoReserva, MenuMoverPara } from "@/componentes/locacao/reserva-cartao";
import { useMoverReserva } from "@/componentes/locacao/reserva-mover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { Link, useCaminho, useNavegar } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { ETAPAS, ETAPAS_ABERTAS, ETAPAS_DO_QUADRO, type Etapa } from "@/lib/regras/etapas";
import { DIA, dataCurta, dinheiro, diaEHora, inicioDoDia, mesmoDia, semAcento } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { useVersaoDados } from "@/prototipo/consultas-reservas";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";

const ROTULO_COBRANCA = Q.ROTULO_COBRANCA;

function textoBusca(r: D.Reserva): string {
	const c = Q.cliente(r.clienteId);
	return `${r.id} ${c.nome} ${c.telefone} ${Q.resumoItens(r.id, 9)} ${r.producao ?? ""}`;
}

function confere(r: D.Reserva, termo: string): boolean {
	if (!termo) return true;
	return semAcento(textoBusca(r)).includes(semAcento(termo).trim());
}

export function TelaReservas() {
	const versao = useVersaoDados();
	const agora = useAgora(30_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { ehDono, podeVerFinanceiro } = usePapel();
	const ehCelular = useIsMobile();
	const { abrir } = useFicha();
	const { pedir, janela } = useMoverReserva();
	const navegar = useNavegar();
	const caminho = useCaminho();
	const [visao, setVisao] = useQueryState("visao", parseAsString.withDefault("quadro").withOptions({ history: "replace" }));
	const [busca, setBusca] = useQueryState("q", parseAsString.withDefault("").withOptions({ history: "replace" }));
	const [foras, setForas] = useQueryState("foras", parseAsString.withDefault("").withOptions({ history: "replace" }));
	const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
	const [fechadasCelular, setFechadasCelular] = useState<Set<string>>(new Set(["encerrada", "expirada", "cancelada"]));

	// biome-ignore lint/correctness/useExhaustiveDependencies: versao força a releitura dos dados do protótipo
	const todas = useMemo(() => [...D.reservas].sort((a, b) => a.retiradaEm.getTime() - b.retiradaEm.getTime()), [versao]);
	useRegistrarLista("reserva", todas.map((r) => String(r.id)));

	const mostrarForas = foras === "sim";
	const filtradas = todas.filter((r) => confere(r, busca));
	const inicioMes = new Date("2026-10-01T00:00:00-03:00");

	const colunasEtapa: Etapa[] = [...ETAPAS_DO_QUADRO, ...(mostrarForas ? (["expirada", "cancelada"] as Etapa[]) : [])];
	const daEtapa = (e: Etapa) => filtradas.filter((r) => r.etapa === e);

	const colunas: ColunaQuadro[] = colunasEtapa.map((e) => {
		const lista = daEtapa(e);
		const recolhida = !!ETAPAS[e].recolhida && !expandidas.has(e);
		const doMes = e === "encerrada" ? lista.filter((r) => (r.encerradaEm ?? r.devolucaoEm).getTime() >= inicioMes.getTime()).length : lista.length;
		const total = lista.reduce((s, r) => s + Q.precoDa(r.id).valorAluguel, 0);
		return {
			id: e,
			nome: ETAPAS[e].nome,
			titulo: ETAPAS[e].nome,
			ponto: <PontoEtapa etapa={e} />,
			contagem: recolhida ? doMes : lista.length,
			resumo: podeVerFinanceiro && !recolhida ? dinheiro(total) : undefined,
			recolhida,
			vazia: busca ? "Nenhuma reserva com esses filtros." : "Nenhuma reserva nesta etapa.",
		};
	});

	const atalhos: AtalhoLista[] = [
		{ nome: "Saem amanhã", parametros: { visao: "tabela", recorte: "saem-amanha" } },
		{ nome: "Atrasadas", parametros: { visao: "tabela", recorte: "atrasadas" } },
		{ nome: "Aguardando pagamento", parametros: { visao: "tabela", recorte: "aguardando-pagamento" } },
		{ nome: "Falta assinar", parametros: { visao: "tabela", recorte: "falta-assinar" } },
	];

	const contagemEtapas = ETAPAS_DO_QUADRO.filter((e) => e !== "encerrada").map((e) => ({ e, n: daEtapa(e).length }));
	const totalBarra = contagemEtapas.reduce((s, x) => s + x.n, 0);

	const cabecalho = (
		<CabecalhoPagina
			titulo="Reservas"
			descricao="Todas as reservas por etapa. A etapa muda só pelas regras do banco."
			acoes={
				<>
					{!ehCelular ? (
						<ToggleGroup
							type="single"
							variant="outline"
							spacing={0}
							value={visao}
							onValueChange={(v) => v && void setVisao(v === "quadro" ? null : v)}
							aria-label="Ver como"
						>
							<ToggleGroupItem value="quadro" className="rounded-r-none">
								Quadro
							</ToggleGroupItem>
							<ToggleGroupItem value="tabela" className="rounded-l-none border-l-0">
								Tabela
							</ToggleGroupItem>
						</ToggleGroup>
					) : null}
					{ehDono ? (
						<Button asChild disabled={offline}>
							<Link href="/pedido/novo">
								<Icon icon={Add} data-icon="inline-start" />
								Nova reserva
							</Link>
						</Button>
					) : null}
				</>
			}
		/>
	);

	if (estado === "carregando") {
		return (
			<Pagina larga>
				{cabecalho}
				<EsqueletoQuadro />
			</Pagina>
		);
	}
	if (estado === "erro") {
		return (
			<Pagina>
				{cabecalho}
				<div className="rounded-lg border bg-card">
					<EstadoErro frase="Não consegui carregar as reservas." aoTentar={() => window.location.reload()} />
				</div>
			</Pagina>
		);
	}
	if (estado === "vazio") {
		return (
			<Pagina>
				{cabecalho}
				<div className="rounded-lg border bg-card">
					<EstadoVazio
						icone={Task}
						titulo="Nenhuma reserva ainda"
						descricao="Elas aparecem quando o robô ou você monta um pedido."
						acao={
							ehDono ? (
								<Button asChild variant="outline" size="sm">
									<Link href="/pedido/novo">Montar pedido</Link>
								</Button>
							) : undefined
						}
					/>
				</div>
			</Pagina>
		);
	}

	/* ---------------- celular: lista agrupada por etapa ---------------- */
	if (ehCelular) {
		return (
			<Pagina>
				{cabecalho}
				<CampoBusca valor={busca} aoMudar={(v) => void setBusca(v || null)} placeholder="Buscar cliente, código ou item…" />
				<Button variant="outline" size="sm" onClick={() => void setForas(mostrarForas ? null : "sim")} aria-pressed={mostrarForas} className="w-full justify-between">
					<span className="flex items-center gap-2">
						<Icon icon={Filter} />
						{mostrarForas ? "Escondendo expiradas e canceladas" : "Mostrar expiradas e canceladas"}
					</span>
				</Button>
				<div className="flex flex-col gap-3">
					{colunasEtapa.map((e) => {
						const lista = daEtapa(e);
						const fechada = fechadasCelular.has(e);
						return (
							<section key={e} className="flex flex-col gap-2" aria-label={`${ETAPAS[e].nome}: ${lista.length}`}>
								<button
									type="button"
									data-alvo
									aria-expanded={!fechada}
									onClick={() =>
										setFechadasCelular((s) => {
											const n = new Set(s);
											if (n.has(e)) n.delete(e);
											else n.add(e);
											return n;
										})
									}
									className="flex items-center justify-between gap-2 rounded-md px-1 text-sm"
								>
									<span className="flex items-center gap-2">
										<PontoEtapa etapa={e} />
										<span className="font-medium">{ETAPAS[e].nome}</span>
										<span className="text-muted-foreground tabular-nums">{lista.length}</span>
									</span>
									<Icon icon={ChevronDown} className={cn("size-4 text-muted-foreground transition-transform", !fechada && "rotate-180")} />
								</button>
								{!fechada ? (
									lista.length ? (
										lista.map((r) => (
											<CartaoReserva
												key={r.id}
												reserva={r}
												agora={agora}
												celular
												desligado={offline}
												aoAbrir={() => abrir("reserva", r.id)}
												aoMover={(para) => pedir(r.id, para)}
											/>
										))
									) : (
										<p className="px-1 text-muted-foreground text-xs">{busca ? "Nenhuma reserva com esses filtros." : "Nenhuma reserva nesta etapa."}</p>
									)
								) : null}
							</section>
						);
					})}
				</div>
				{janela}
			</Pagina>
		);
	}

	/* ---------------- tabela ---------------- */
	if (visao === "tabela") {
		const fimAmanha = new Date(inicioDoDia(agora).getTime() + 2 * DIA);
		const amanha = new Date(inicioDoDia(agora).getTime() + DIA);
		const colunasTabela: Coluna<D.Reserva>[] = [
			{
				id: "reserva",
				header: "Reserva",
				label: "Reserva",
				sortable: true,
				hideable: false,
				width: "w-[17%]",
				cell: (r) => (
					<span className="flex min-w-0 items-center gap-2">
						<Codigo className="text-muted-foreground">{r.id}</Codigo>
						<span className="truncate font-medium">{Q.cliente(r.clienteId).nome}</span>
					</span>
				),
				exportar: (r) => `${r.id} ${Q.cliente(r.clienteId).nome}`,
			},
			{
				id: "etapa",
				header: "Etapa",
				label: "Etapa",
				sortable: true,
				width: "w-[12%]",
				cell: (r) => (
					// biome-ignore lint/a11y/noStaticElementInteractions: só impede que o clique abra a ficha
					<div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex items-center gap-1">
						<EtapaRotulo etapa={r.etapa} />
						<MenuMoverPara reserva={r} aoMover={(para) => pedir(r.id, para)} desligado={offline} />
					</div>
				),
				exportar: (r) => ETAPAS[r.etapa].nome,
			},
			{ id: "retirada", header: "Retirada", label: "Retirada", sortable: true, width: "w-[10%]", cell: (r) => <span className="tabular-nums">{diaEHora(r.retiradaEm)}</span>, exportar: (r) => diaEHora(r.retiradaEm) },
			{ id: "devolucao", header: "Devolução", label: "Devolução", sortable: true, width: "w-[10%]", cell: (r) => <span className="tabular-nums">{diaEHora(r.devolucaoEm)}</span>, exportar: (r) => diaEHora(r.devolucaoEm) },
			{ id: "itens", header: "Itens", label: "Itens", width: "w-[13%]", hideBelow: "lg", cell: (r) => <span className="block truncate">{Q.resumoItens(r.id)}</span>, exportar: (r) => Q.resumoItens(r.id, 9) },
			...(podeVerFinanceiro
				? ([
						{ id: "valor", header: "Valor", label: "Valor", sortable: true, align: "right", width: "w-[8%]", cell: (r) => <Dinheiro valor={Q.precoDa(r.id).valorAluguel} />, exportar: (r) => dinheiro(Q.precoDa(r.id).valorAluguel) },
					] satisfies Coluna<D.Reserva>[])
				: []),
			{
				id: "pagamento",
				header: "Pagamento",
				label: "Pagamento",
				width: "w-[10%]",
				cell: (r) => {
					const s = Q.situacaoPagamentos(r.id).aluguel;
					return s === "sem_link" ? <span className="text-muted-foreground">—</span> : <Selo tom={ROTULO_COBRANCA[s].tom}>{s === "confirmado" ? "Pago" : ROTULO_COBRANCA[s].texto}</Selo>;
				},
			},
			{
				id: "caucao",
				header: "Caução",
				label: "Caução",
				width: "w-[10%]",
				hideBelow: "lg",
				cell: (r) => {
					const pg = Q.situacaoPagamentos(r.id);
					if (pg.caucaoDevolvida) return <Selo tom="neutro">Devolvida</Selo>;
					return pg.caucao === "sem_link" ? <span className="text-muted-foreground">—</span> : <Selo tom={ROTULO_COBRANCA[pg.caucao].tom}>{pg.caucao === "confirmado" ? "Paga" : ROTULO_COBRANCA[pg.caucao].texto}</Selo>;
				},
			},
			{
				id: "assinatura",
				header: "Assinatura",
				label: "Assinatura",
				width: "w-[11%]",
				hideBelow: "lg",
				cell: (r) =>
					r.etapa === "orcamento" ? (
						<span className="text-muted-foreground">—</span>
					) : r.ordemAssinadaEm && Q.cliente(r.clienteId).contratoGeral ? (
						<Selo tom="ok">Assinada</Selo>
					) : (
						<Selo tom="atencao">Falta assinar</Selo>
					),
			},
			{ id: "criada", header: "Criada em", label: "Criada em", sortable: true, defaultHidden: true, width: "w-[10%]", cell: (r) => <span className="text-muted-foreground">{dataCurta(r.criadaEm)}</span> },
		];
		return (
			<Pagina larga>
				{cabecalho}
				<TabelaLista<D.Reserva>
					nome="reservas"
					linhas={todas}
					colunas={colunasTabela}
					idDa={(r) => String(r.id)}
					placeholderBusca="Buscar cliente, código ou item…"
					config={{
						texto: textoBusca,
						ordenacoes: {
							reserva: (r) => r.id,
							etapa: (r) => ETAPAS[r.etapa].ordem,
							retirada: (r) => r.retiradaEm.getTime(),
							devolucao: (r) => r.devolucaoEm.getTime(),
							valor: (r) => Q.precoDa(r.id).valorAluguel,
							criada: (r) => r.criadaEm.getTime(),
						},
						ordemPadrao: { coluna: "retirada", direcao: "asc" },
						recortes: {
							id: "recorte",
							rotuloTodos: "Todas",
							padrao: "abertas",
							opcoes: [
								{ valor: "abertas", rotulo: "Abertas", filtro: (r) => ETAPAS_ABERTAS.includes(r.etapa) },
								{
									valor: "hoje-amanha",
									rotulo: "Hoje e amanhã",
									filtro: (r) =>
										ETAPAS_ABERTAS.includes(r.etapa) &&
										((r.retiradaEm.getTime() >= inicioDoDia(agora).getTime() && r.retiradaEm.getTime() < fimAmanha.getTime()) ||
											(r.devolucaoEm.getTime() >= inicioDoDia(agora).getTime() && r.devolucaoEm.getTime() < fimAmanha.getTime())),
								},
								{ valor: "atrasadas", rotulo: "Atrasadas", filtro: (r) => !!Q.atrasoDa(r.id, agora)?.alemDaTolerancia },
								{ valor: "saem-amanha", rotulo: "Saem amanhã", filtro: (r) => ["pre_reserva", "confirmada", "separada"].includes(r.etapa) && mesmoDia(r.retiradaEm, amanha) },
								{
									valor: "aguardando-pagamento",
									rotulo: "Aguardando pagamento",
									filtro: (r) => ["pre_reserva", "confirmada", "separada"].includes(r.etapa) && (!Q.situacaoPagamentos(r.id).aluguelConfirmado || !Q.situacaoPagamentos(r.id).caucaoConfirmada),
								},
								{ valor: "falta-assinar", rotulo: "Falta assinar", filtro: (r) => ["confirmada", "separada"].includes(r.etapa) && (!r.ordemAssinadaEm || !Q.cliente(r.clienteId).contratoGeral) },
								{ valor: "encerradas", rotulo: "Encerradas", filtro: (r) => r.etapa === "encerrada" },
								{ valor: "expiradas", rotulo: "Expiradas", filtro: (r) => r.etapa === "expirada" },
								{ valor: "canceladas", rotulo: "Canceladas", filtro: (r) => r.etapa === "cancelada" },
							],
						},
					}}
					facetas={[
						{
							id: "etapa",
							rotulo: "Etapa",
							valor: (r) => r.etapa,
							opcoes: (["orcamento", "pre_reserva", "confirmada", "separada", "retirada", "devolvida", "encerrada", "expirada", "cancelada"] as Etapa[]).map((e) => ({ valor: e, rotulo: ETAPAS[e].nome })),
						},
					]}
					atalhos={atalhos}
					podeExportar={ehDono}
					aoClicar={(r) => abrir("reserva", r.id)}
					rodape={({ total, filtradas: f }) => {
						const aberto = f.filter((r) => ETAPAS_ABERTAS.includes(r.etapa)).reduce((s, r) => s + Q.precoDa(r.id).valorAluguel, 0);
						return podeVerFinanceiro ? `${total} ${total === 1 ? "reserva" : "reservas"} · ${dinheiro(aberto)} em aberto` : `${total} ${total === 1 ? "reserva" : "reservas"}`;
					}}
					vazio={
						<EstadoVazio
							icone={Task}
							titulo="Nenhuma reserva ainda"
							descricao="Elas aparecem quando o robô ou você monta um pedido."
						/>
					}
					vazioComFiltro="Nenhuma reserva com esses filtros."
				/>
				{janela}
			</Pagina>
		);
	}

	/* ---------------- quadro ---------------- */
	return (
		<Pagina larga>
			{cabecalho}
			<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
				<CampoBusca valor={busca} aoMudar={(v) => void setBusca(v || null)} placeholder="Buscar cliente, código ou item…" />
				<div className="flex flex-wrap items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<Icon icon={Filter} data-icon="inline-start" />
								Filtros
								{mostrarForas ? <span className="tabular-nums opacity-60">(1)</span> : null}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-60">
							<DropdownMenuLabel>Colunas fora do quadro</DropdownMenuLabel>
							<DropdownMenuCheckboxItem checked={mostrarForas} onCheckedChange={(v) => void setForas(v ? "sim" : null)}>
								Mostrar expiradas e canceladas
							</DropdownMenuCheckboxItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<Icon icon={Bookmark} data-icon="inline-start" />
								Atalhos de lista
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-56">
							<DropdownMenuLabel>Prontos</DropdownMenuLabel>
							{atalhos.map((a) => (
								<DropdownMenuItem key={a.nome} onSelect={() => navegar(`${caminho}?${new URLSearchParams(a.parametros).toString()}`)}>
									{a.nome}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			{totalBarra > 0 ? (
				<div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" role="group" aria-label="Distribuição por etapa">
					{contagemEtapas
						.filter((x) => x.n > 0)
						.map((x) => (
							<button
								key={x.e}
								type="button"
								title={`${ETAPAS[x.e].nome}: ${x.n}`}
								aria-label={`Ir para ${ETAPAS[x.e].nome}: ${x.n}`}
								onClick={() => document.getElementById(`coluna-${x.e}`)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })}
								className={cn("h-full transition-opacity hover:opacity-80", ETAPAS[x.e].faixa, x.e === "orcamento" && "opacity-60")}
								style={{ flexGrow: x.n }}
							/>
						))}
				</div>
			) : null}
			<Quadro<D.Reserva>
				rotulo="Quadro de reservas"
				colunas={colunas}
				itensDa={(id) => daEtapa(id as Etapa)}
				idDe={(r) => String(r.id)}
				colunaDe={(r) => r.etapa}
				podeArrastar={ehDono && !offline}
				aoSoltar={(r, para) => pedir(r.id, para as Etapa)}
				aoExpandir={(id) =>
					setExpandidas((s) => {
						const n = new Set(s);
						n.add(id);
						return n;
					})
				}
				cartao={(r) => (
					<CartaoReserva reserva={r} agora={agora} desligado={offline} aoAbrir={() => abrir("reserva", r.id)} aoMover={(para) => pedir(r.id, para)} />
				)}
			/>
			{janela}
		</Pagina>
	);
}
