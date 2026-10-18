"use client";
// 7.15 Agenda de ocupação (estilo Gantt). No celular: fila de dias, listas do dia e "Está livre?".

import CalendarIcon from "@carbon/icons-react/es/Calendar";
import ChevronLeft from "@carbon/icons-react/es/ChevronLeft";
import ChevronRight from "@carbon/icons-react/es/ChevronRight";
import Search from "@carbon/icons-react/es/Search";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Cartao, EstadoErro, EstadoVazio, EsqueletoLinhas, Pagina, TituloGrupo } from "@/componentes/ui/basicos";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { useFicha } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { EtapaRotulo } from "@/componentes/ui/marcadores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { CampoBusca } from "@/componentes/ui/tabela-lista";
import { ToggleGroup, ToggleGroupItem } from "@/componentes/ui/toggle-group";
import { EstaLivre } from "@/componentes/agenda/esta-livre";
import { GradeAgenda } from "@/componentes/agenda/grade-agenda";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { DIA, dataCurta, diaSemana, hora, inicioDoDia, mesmoDia, periodo, semAcento } from "@/lib/formatos";
import { useParametro } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { barrasDaUnidade, orcamentosDoEquipamento } from "@/prototipo/consultas-agenda";
import { useMemo, useState } from "react";

type Visao = "semana" | "2semanas" | "mes";
const VISOES: Record<Visao, { rotulo: string; dias: number; largura: number }> = {
	semana: { rotulo: "Semana", dias: 7, largura: 120 },
	"2semanas": { rotulo: "2 semanas", dias: 14, largura: 64 },
	mes: { rotulo: "Mês", dias: 30, largura: 40 },
};

function paraDiaIso(d: Date): string {
	return new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
}

function doDiaIso(v: string | null): Date | null {
	if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
	return new Date(`${v}T00:00:00-03:00`);
}

function filtrarEquipamentos(busca: string, categoria: string | null) {
	const t = semAcento(busca).trim().replace(/^eq-?/, "");
	return D.equipamentos.filter((e) => {
		if (!e.ativo || e.arquivadoEm) return false;
		if (categoria && categoria !== "todas" && e.categoria !== categoria) return false;
		if (!t) return true;
		if (semAcento(`${e.nome} ${e.marca} ${e.modelo}`).includes(t)) return true;
		return Q.unidadesDo(e.id).some((u) => semAcento(u.codigo).replace("eq-", "").includes(t) || (u.numeroSerie && semAcento(u.numeroSerie).includes(t)));
	});
}

function Legenda() {
	return (
		<ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs" aria-label="Legenda da agenda">
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="h-3 w-6 rounded-sm border border-dashed border-etapa-pre-reserva" />
				Pré-reserva
			</li>
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="h-3 w-6 rounded-sm border-l-2 border-etapa-confirmada bg-etapa-confirmada/15" />
				Confirmada
			</li>
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="h-3 w-6 rounded-sm border-l-2 border-etapa-separada bg-etapa-separada/15" />
				Separada
			</li>
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="h-3 w-6 rounded-sm border-l-2 border-etapa-na-rua bg-etapa-na-rua/15" />
				Na rua
			</li>
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="h-3 w-6 rounded-sm border border-erro bg-erro-fundo" />⚠ Atrasada
			</li>
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="hachurado h-3 w-6 rounded-sm border border-unidade-reparo" />
				Em reparo
			</li>
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="h-3 w-6 rounded-r-sm border border-l-0 border-border bg-accent" />
				Folga de {D.configuracoesExemplo.horasFolga} h
			</li>
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="h-3 w-6 rounded-sm border border-dotted border-etapa-orcamento" />
				Orçamento (procura)
			</li>
			<li className="flex items-center gap-1.5">
				<span aria-hidden className="h-3 w-0.5 bg-primary" />
				Agora
			</li>
		</ul>
	);
}

/* ---------------------------------------------------------------- celular */

function AgendaCelular({ livreAberto }: { livreAberto: boolean }) {
	const agora = useAgora(30_000);
	const estado = useEstadoTela();
	const { abrir } = useFicha();
	const hoje = inicioDoDia(agora);
	const [diaSel, setDiaSel] = useState(hoje.getTime());
	const dia = new Date(diaSel);
	const fimDia = new Date(diaSel + DIA);
	const dias = Array.from({ length: 14 }, (_, i) => inicioDoDia(new Date(hoje.getTime() + i * DIA + 12 * 3_600_000)));
	const ehHoje = mesmoDia(dia, agora);
	const rotuloDia = ehHoje ? "hoje" : `${diaSemana(dia)} ${dataCurta(dia)}`;

	const saem = estado === "vazio" ? [] : D.reservas.filter((r) => ["pre_reserva", "confirmada", "separada"].includes(r.etapa) && mesmoDia(r.retiradaEm, dia)).sort((a, b) => a.retiradaEm.getTime() - b.retiradaEm.getTime());
	const voltam =
		estado === "vazio"
			? []
			: D.reservas
					.filter((r) => r.etapa === "retirada" && (mesmoDia(r.devolucaoEm, dia) || (ehHoje && r.devolucaoEm.getTime() < agora.getTime())))
					.sort((a, b) => a.devolucaoEm.getTime() - b.devolucaoEm.getTime());
	const ocupados =
		estado === "vazio"
			? []
			: D.equipamentos
					.filter((e) => e.ativo)
					.map((e) => {
						const us = Q.unidadesDo(e.id);
						const ocupadas = us.filter((u) => barrasDaUnidade(u, dia, fimDia, agora).some((b) => b.tipo === "reserva")).length;
						const reparo = us.filter((u) => u.estado === "em_reparo").length;
						return { e, ocupadas, reparo, total: us.length };
					})
					.filter((x) => x.ocupadas > 0 || x.reparo > 0)
					.sort((a, b) => b.ocupadas - a.ocupadas)
					.slice(0, 10);

	const livre = (
		<Cartao titulo="Está livre?" descricao="Escolha o equipamento e as datas." corpoClassName="p-4">
			<EstaLivre />
		</Cartao>
	);

	const linhaReserva = (r: D.Reserva, quando: Date, sentido: "sai" | "volta") => {
		const c = Q.cliente(r.clienteId);
		const at = sentido === "volta" ? Q.atrasoDa(r.id, agora) : null;
		return (
			<li key={`${sentido}${r.id}`}>
				<button type="button" data-alvo onClick={() => abrir("reserva", r.id)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left active:bg-muted">
					<span className="flex w-14 shrink-0 flex-col font-mono text-sm tabular-nums leading-tight">
						{mesmoDia(quando, dia) ? null : <span className="font-sans text-2xs text-muted-foreground">{diaSemana(quando)} {dataCurta(quando)}</span>}
						{hora(quando)}
					</span>
					<span className="flex min-w-0 flex-1 flex-col gap-0.5">
						<span className="truncate font-medium text-sm">
							{c.nome} · <span className="font-mono">{r.id}</span>
						</span>
						<span className="truncate text-muted-foreground text-xs">{Q.resumoItens(r.id)}</span>
					</span>
					{at?.alemDaTolerancia ? <span className="shrink-0 text-erro text-xs">⚠ atrasada</span> : <EtapaRotulo etapa={r.etapa} className="shrink-0" />}
				</button>
			</li>
		);
	};

	return (
		<Pagina>
			<CabecalhoPagina titulo="Agenda" descricao="O que sai, o que volta e o que está ocupado em cada dia." />
			{livreAberto ? livre : null}
			<nav aria-label="Dias" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
				{dias.map((d) => {
					const sel = d.getTime() === diaSel;
					return (
						<Button
							key={d.getTime()}
							variant={sel ? "secondary" : "outline"}
							aria-pressed={sel}
							onClick={() => setDiaSel(d.getTime())}
							className={cn("h-14 w-14 shrink-0 flex-col gap-0 px-0", sel && "border border-foreground")}
						>
							<span className="text-2xs text-muted-foreground">{mesmoDia(d, agora) ? "hoje" : diaSemana(d)}</span>
							<span className="text-base tabular-nums">{dataCurta(d).slice(0, 2)}</span>
						</Button>
					);
				})}
			</nav>
			{estado === "carregando" ? (
				<EsqueletoLinhas linhas={6} />
			) : estado === "erro" ? (
				<EstadoErro frase="Não consegui carregar a agenda." />
			) : (
				<>
					<section className="flex flex-col gap-2">
						<TituloGrupo>Sai {rotuloDia}</TituloGrupo>
						{saem.length ? (
							<ul className="divide-y overflow-hidden rounded-lg border bg-card">{saem.map((r) => linhaReserva(r, r.retiradaEm, "sai"))}</ul>
						) : (
							<p className="rounded-lg border bg-card px-4 py-4 text-muted-foreground text-xs">Nada saindo {rotuloDia}.</p>
						)}
					</section>
					<section className="flex flex-col gap-2">
						<TituloGrupo>Volta {rotuloDia}</TituloGrupo>
						{voltam.length ? (
							<ul className="divide-y overflow-hidden rounded-lg border bg-card">{voltam.map((r) => linhaReserva(r, r.devolucaoEm, "volta"))}</ul>
						) : (
							<p className="rounded-lg border bg-card px-4 py-4 text-muted-foreground text-xs">Nada voltando {rotuloDia}.</p>
						)}
					</section>
					<section className="flex flex-col gap-2">
						<TituloGrupo>Ocupados {rotuloDia}</TituloGrupo>
						{ocupados.length ? (
							<ul className="divide-y overflow-hidden rounded-lg border bg-card">
								{ocupados.map(({ e, ocupadas, reparo, total }) => (
									<li key={e.id}>
										<button type="button" data-alvo onClick={() => abrir("equipamento", e.id)} className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left active:bg-muted">
											<span className="min-w-0 flex-1 truncate font-medium text-sm">{e.nome}</span>
											<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
												{ocupadas} de {total} ocupadas{reparo ? ` · ${reparo} em reparo` : ""}
											</span>
										</button>
									</li>
								))}
							</ul>
						) : (
							<EstadoVazio icone={CalendarIcon} titulo="Nada reservado neste dia" descricao="Nada reservado neste período. Toque numa área vazia para montar um pedido." className="rounded-lg border bg-card" />
						)}
					</section>
					{livreAberto ? null : livre}
				</>
			)}
		</Pagina>
	);
}

/* ---------------------------------------------------------------- computador */

export function TelaAgenda() {
	const agora = useAgora(60_000);
	const ehCelular = useIsMobile();
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { ehDono } = usePapel();
	const [livre, setLivre] = useParametro("livre");
	const [visaoP, setVisao] = useParametro("visao");
	const [deP, setDe] = useParametro("de");
	const [busca, setBusca] = useParametro("q");
	const [categoria, setCategoria] = useParametro("categoria");
	const [agruparP, setAgrupar] = useParametro("agrupar");

	const visao: Visao = visaoP === "semana" || visaoP === "mes" ? visaoP : "2semanas";
	const conf = VISOES[visao];
	const padrao = inicioDoDia(new Date(agora.getTime() - 3 * DIA));
	const inicio = doDiaIso(deP) ?? padrao;
	const fimInclusivo = new Date(inicio.getTime() + (conf.dias - 1) * DIA);
	const agrupamento = agruparP === "categoria" ? "categoria" : "equipamento";
	const equipamentos = useMemo(() => filtrarEquipamentos(busca ?? "", categoria), [busca, categoria]);

	const semNada = useMemo(() => {
		if (estado === "vazio") return true;
		const fim = new Date(inicio.getTime() + conf.dias * DIA);
		return !equipamentos.some((e) => orcamentosDoEquipamento(e.id, inicio, fim).length || Q.unidadesDo(e.id).some((u) => barrasDaUnidade(u, inicio, fim, agora).length));
	}, [estado, equipamentos, inicio, conf.dias, agora]);

	if (ehCelular) return <AgendaCelular livreAberto={livre === "sim"} />;

	const mover = (dias: number) => setDe(paraDiaIso(new Date(inicio.getTime() + dias * DIA + 12 * 3_600_000)));

	return (
		<Pagina larga contida>
			<CabecalhoPagina
				titulo="Agenda"
				descricao="O que está ocupado, livre, em reparo ou atrasado, por equipamento e por unidade."
				acoes={
					<Button variant="outline" onClick={() => setLivre("sim")}>
						<Icon icon={Search} data-icon="inline-start" />
						Está livre?
					</Button>
				}
			/>
			<div className="flex flex-wrap items-center gap-2">
				<CampoBusca valor={busca ?? ""} aoMudar={(v) => setBusca(v || null)} placeholder="Buscar equipamento ou etiqueta…" className="lg:max-w-64" />
				<Select value={categoria ?? "todas"} onValueChange={(v) => setCategoria(v === "todas" ? null : v)}>
					<SelectTrigger className="w-44" aria-label="Categoria">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="todas">Todas as categorias</SelectItem>
						{Object.entries(D.CATEGORIAS).map(([v, n]) => (
							<SelectItem key={v} value={v}>
								{n}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={agrupamento} onValueChange={(v) => setAgrupar(v === "categoria" ? "categoria" : null)}>
					<SelectTrigger className="w-52" aria-label="Agrupar">
						<span className="text-muted-foreground">Agrupar:</span>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="equipamento">Equipamento</SelectItem>
						<SelectItem value="categoria">Categoria</SelectItem>
					</SelectContent>
				</Select>
				<span className="flex-1" />
				<ToggleGroup type="single" variant="outline" spacing={0} value={visao} onValueChange={(v) => v && setVisao(v === "2semanas" ? null : v)} aria-label="Período">
					{(Object.keys(VISOES) as Visao[]).map((v) => (
						<ToggleGroupItem key={v} value={v}>
							{VISOES[v].rotulo}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon" aria-label="Período anterior" onClick={() => mover(-7)}>
						<Icon icon={ChevronLeft} />
					</Button>
					<Button variant="outline" onClick={() => setDe(null)}>
						Hoje
					</Button>
					<Button variant="ghost" size="icon" aria-label="Próximo período" onClick={() => mover(7)}>
						<Icon icon={ChevronRight} />
					</Button>
				</div>
				<span className="min-w-28 text-right text-muted-foreground text-xs tabular-nums">{periodo(inicio, fimInclusivo)}</span>
			</div>

			{estado === "erro" ? (
				<div className="rounded-lg border bg-card">
					<EstadoErro frase="Não consegui carregar a agenda." />
				</div>
			) : (
				<>
					{semNada && estado !== "carregando" ? (
						<div role="status" className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-muted-foreground text-xs">
							<Icon icon={CalendarIcon} className="size-4" />
							Nada reservado neste período.{ehDono && !offline ? " Toque numa área vazia para montar um pedido." : ""}
						</div>
					) : null}
					{equipamentos.length === 0 && estado !== "carregando" ? (
						<div className="rounded-lg border bg-card">
							<EstadoVazio icone={Search} titulo="Nenhum equipamento com esses filtros" descricao="Mude a busca ou a categoria para ver a agenda." />
						</div>
					) : (
						<GradeAgenda
							key={`${visao}-${agrupamento}`}
							inicio={inicio}
							dias={conf.dias}
							larguraDia={conf.largura}
							equipamentos={equipamentos}
							agrupamento={agrupamento}
							podeArrastar={ehDono && !offline}
							podeMontar={ehDono && !offline}
							carregando={estado === "carregando"}
							semBarras={estado === "vazio"}
							className="flex-1"
						/>
					)}
					<div className="flex flex-wrap items-center justify-between gap-3">
						<Legenda />
						<p className="text-muted-foreground text-xs">
							{ehDono
								? offline
									? "Sem internet: arrastar fica desligado."
									: "Arraste numa área vazia para montar um pedido. Arraste uma barra para outra unidade do mesmo modelo para trocar."
								: "Só leitura: o balcão vê a agenda, mas não arrasta."}
						</p>
					</div>
				</>
			)}

			<Dialog open={livre === "sim"} onOpenChange={(o) => !o && setLivre(null)}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Está livre?</DialogTitle>
						<DialogDescription>Escolha o equipamento e as datas. A resposta vem da disponibilidade real, já com a folga.</DialogDescription>
					</DialogHeader>
					<EstaLivre />
				</DialogContent>
			</Dialog>
		</Pagina>
	);
}
