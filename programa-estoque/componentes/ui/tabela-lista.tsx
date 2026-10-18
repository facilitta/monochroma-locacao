"use client";

// A mesma tabela para toda lista (seção 7.0): busca, recortes, Filtros, Ordenar, Colunas,
// Atalhos de lista, Arquivados, seleção em massa, paginação e exportação para planilha.
// No protótipo, filtra e ordena na memória; na Fase 1 a mesma interface recebe {linhas, total, contagens} do banco.

import Bookmark from "@carbon/icons-react/es/Bookmark";
import Download from "@carbon/icons-react/es/Download";
import Search from "@carbon/icons-react/es/Search";
import ArchiveIcon from "@carbon/icons-react/es/Archive";
import { Button } from "@/componentes/ui/button";
import {
	DataTable,
	type DataTableColumn,
	type DataTableExpandable,
	type DataTableFacet,
	type DataTableSelection,
} from "@/componentes/ui/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import { Icon } from "@/componentes/ui/icon";
import type { TableQueryState } from "@/lib/table-query";
import { dentroDaMoldura } from "@/lib/ambiente";
import { semAcento, somenteDigitos } from "@/lib/formatos";
import { useBusca, useCaminho, useNavegar } from "@/lib/navegacao";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { TablePagination } from "@/componentes/ui/table-pagination";
import { Spinner } from "@/componentes/ui/spinner";
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState, useQueryStates } from "nuqs";
import { type ReactNode, useCallback, useMemo } from "react";
import { toast } from "sonner";

export type Coluna<T> = DataTableColumn<T> & { exportar?: (linha: T) => string | number };

export type Faceta<T> = {
	id: string;
	rotulo: string;
	valor: (linha: T) => string | string[];
	opcoes: { valor: string; rotulo: string }[];
};

export type Recortes<T> = {
	id: string;
	rotuloTodos?: string;
	opcoes: { valor: string; rotulo: string; filtro: (linha: T) => boolean }[];
	padrao?: string;
};

export type AtalhoLista = { nome: string; parametros: Record<string, string>; deFabrica?: boolean };

export type ConfigConsulta<T> = {
	texto?: (linha: T) => string;
	facetas?: Faceta<T>[];
	recortes?: Recortes<T>;
	ordenacoes?: Record<string, (linha: T) => string | number>;
	ordemPadrao?: { coluna: string; direcao: "asc" | "desc" };
	porPagina?: number;
	arquivada?: (linha: T) => boolean;
};

function confere(texto: string, termo: string): boolean {
	if (!termo) return true;
	const t = semAcento(termo).trim();
	const alvo = semAcento(texto);
	if (alvo.includes(t)) return true;
	const semEq = t.replace(/^eq-?/, "");
	if (semEq && alvo.replace(/eq-/g, "").includes(semEq)) return true;
	const digitos = somenteDigitos(termo);
	return digitos.length >= 4 && somenteDigitos(texto).includes(digitos);
}

export function useConsultaLocal<T>(linhas: T[], cfg: ConfigConsulta<T>) {
	const facetIds = (cfg.facetas ?? []).map((f) => f.id);
	const [estado, definir] = useQueryStates(
		{
			q: parseAsString.withDefault(""),
			ordem: parseAsString.withDefault(cfg.ordemPadrao?.coluna ?? ""),
			dir: parseAsStringLiteral(["asc", "desc"] as const).withDefault(cfg.ordemPadrao?.direcao ?? "asc"),
			pagina: parseAsInteger.withDefault(1),
			recorte: parseAsString.withDefault(cfg.recortes?.padrao ?? "all"),
			arquivados: parseAsString.withDefault(""),
		},
		{ history: "replace", scroll: false },
	);
	const [filtrosBrutos, definirFiltros] = useQueryState("f", parseAsArrayOf(parseAsString, ";").withDefault([]));

	const filtros = useMemo(() => {
		const r: Record<string, string[]> = {};
		for (const par of filtrosBrutos) {
			const [id, valor] = par.split(":");
			if (!id || !valor || !facetIds.includes(id)) continue;
			r[id] = [...(r[id] ?? []), valor];
		}
		return r;
	}, [filtrosBrutos, facetIds]);

	const porPagina = cfg.porPagina ?? 25;
	const mostrarArquivados = estado.arquivados === "sim";

	const baseFiltrada = useMemo(() => {
		return linhas.filter((l) => {
			if (cfg.arquivada && cfg.arquivada(l) !== mostrarArquivados) return false;
			if (cfg.texto && !confere(cfg.texto(l), estado.q)) return false;
			for (const f of cfg.facetas ?? []) {
				const sel = filtros[f.id];
				if (!sel?.length) continue;
				const v = f.valor(l);
				const vs = Array.isArray(v) ? v : [v];
				if (!vs.some((x) => sel.includes(x))) return false;
			}
			return true;
		});
	}, [linhas, cfg, estado.q, filtros, mostrarArquivados]);

	const contagens = useMemo(() => {
		const r: Record<string, Record<string, number>> = {};
		if (cfg.recortes) {
			r[cfg.recortes.id] = Object.fromEntries(
				cfg.recortes.opcoes.map((o) => [o.valor, baseFiltrada.filter(o.filtro).length]),
			);
		}
		return r;
	}, [baseFiltrada, cfg.recortes]);

	const filtradas = useMemo(() => {
		let r = baseFiltrada;
		if (cfg.recortes && estado.recorte !== "all") {
			const op = cfg.recortes.opcoes.find((o) => o.valor === estado.recorte);
			if (op) r = r.filter(op.filtro);
		}
		const chave = cfg.ordenacoes?.[estado.ordem];
		if (chave) {
			r = [...r].sort((a, b) => {
				const va = chave(a);
				const vb = chave(b);
				const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR");
				return estado.dir === "asc" ? c : -c;
			});
		}
		return r;
	}, [baseFiltrada, cfg.recortes, cfg.ordenacoes, estado.recorte, estado.ordem, estado.dir]);

	const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
	const pagina = Math.min(estado.pagina, totalPaginas);
	const linhasPagina = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

	const query: TableQueryState = {
		sort: estado.ordem,
		dir: estado.dir,
		page: pagina,
		pageSize: porPagina,
		tab: estado.recorte,
		tabId: cfg.recortes?.id,
		filters: filtros,
		toggleSort: (id) => {
			if (estado.ordem === id) void definir({ dir: estado.dir === "asc" ? "desc" : "asc", pagina: 1 });
			else void definir({ ordem: id, dir: "asc", pagina: 1 });
		},
		setSort: (id) => void definir({ ordem: id, pagina: 1 }),
		setDir: (dir) => void definir({ dir, pagina: 1 }),
		setPage: async (p) => {
			await definir({ pagina: p });
		},
		setTab: (valor) => void definir({ recorte: valor, pagina: 1 }),
		setFilter: (id, valores) => {
			const outros = filtrosBrutos.filter((par) => !par.startsWith(`${id}:`));
			const novos = [...outros, ...valores.map((v) => `${id}:${v}`)];
			void definirFiltros(novos.length ? novos : null);
			void definir({ pagina: 1 });
		},
	};

	return {
		query,
		linhasPagina,
		filtradas,
		total: filtradas.length,
		totalSemFiltro: linhas.filter((l) => !cfg.arquivada || !cfg.arquivada(l)).length,
		contagens,
		busca: estado.q,
		definirBusca: (q: string) => void definir({ q: q || null, pagina: 1 }),
		mostrarArquivados,
		alternarArquivados: () => void definir({ arquivados: mostrarArquivados ? null : "sim", pagina: 1 }),
		temFiltro: Boolean(estado.q) || Object.keys(filtros).length > 0 || (cfg.recortes ? estado.recorte !== (cfg.recortes.padrao ?? "all") : false),
	};
}

export function CampoBusca({
	valor,
	aoMudar,
	placeholder,
	className,
}: {
	valor: string;
	aoMudar: (v: string) => void;
	placeholder: string;
	className?: string;
}) {
	return (
		<label
			className={cn(
				"relative flex h-8 w-full min-w-0 items-center rounded-md border border-input bg-background shadow-campo focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 lg:max-w-80 dark:bg-muted",
				className,
			)}
		>
			<Icon icon={Search} className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
			<span className="sr-only">{placeholder}</span>
			<input
				type="search"
				value={valor}
				onChange={(e) => aoMudar(e.target.value)}
				placeholder={placeholder}
				className="h-full w-full min-w-0 bg-transparent pr-2.5 pl-8 text-xs outline-none placeholder:text-muted-foreground"
			/>
		</label>
	);
}

function baixarPlanilha<T>(nome: string, colunas: Coluna<T>[], linhas: T[]) {
	const cab = colunas.filter((c) => c.exportar).map((c) => c.label ?? c.id);
	const corpo = linhas.map((l) =>
		colunas
			.filter((c) => c.exportar)
			.map((c) => `"${String(c.exportar?.(l) ?? "").replace(/"/g, '""')}"`)
			.join(";"),
	);
	const csv = `﻿${[cab.join(";"), ...corpo].join("\n")}`;
	if (dentroDaMoldura()) {
		toast.info(`Planilha pronta: ${linhas.length} ${linhas.length === 1 ? "linha" : "linhas"}. Na página publicada o navegador não deixa baixar arquivos; no app rodando no computador, ela sai na hora.`);
		return;
	}
	try {
		const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
		const a = document.createElement("a");
		a.href = url;
		a.download = `${nome}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	} catch {
		// sem permissão de baixar arquivo neste ambiente
	}
}

export function TabelaLista<T, S = unknown>({
	nome,
	linhas,
	colunas,
	idDa,
	config,
	facetas,
	aoClicar,
	atalhos,
	podeExportar = true,
	selecao,
	expansao,
	vazio,
	vazioComFiltro = "Nada com esses filtros.",
	placeholderBusca = "Buscar…",
	rodape,
	acoesExtras,
	carregando = false,
	className,
	celular,
	rotuloArquivados = "Arquivados",
}: {
	nome: string;
	linhas: T[];
	colunas: Coluna<T>[];
	idDa: (linha: T) => string;
	config: ConfigConsulta<T>;
	facetas?: Faceta<T>[];
	aoClicar?: (linha: T) => void;
	atalhos?: AtalhoLista[];
	podeExportar?: boolean;
	selecao?: DataTableSelection<T>;
	expansao?: DataTableExpandable<T, S>;
	vazio: ReactNode;
	vazioComFiltro?: ReactNode;
	placeholderBusca?: string;
	rodape?: (info: { total: number; filtradas: T[] }) => ReactNode;
	acoesExtras?: ReactNode;
	carregando?: boolean;
	className?: string;
	/** No celular, cada linha vira este cartão (linha de 48 a 56 px). Sem ele, a tabela esconde colunas. */
	celular?: (linha: T) => ReactNode;
	rotuloArquivados?: string;
}) {
	const ehCelular = useIsMobile();
	const cfg = useMemo(() => ({ ...config, facetas: facetas ?? config.facetas }), [config, facetas]);
	const c = useConsultaLocal(linhas, cfg);
	const caminho = useCaminho();
	const navegar = useNavegar();
	const busca = useBusca();

	const aplicarAtalho = useCallback(
		(a: AtalhoLista) => {
			const p = new URLSearchParams();
			const ficha = busca.get("ficha");
			if (ficha) p.set("ficha", ficha);
			for (const [k, v] of Object.entries(a.parametros)) p.set(k, v);
			navegar(`${caminho}?${p.toString()}`, { substituir: true });
		},
		[busca, caminho, navegar],
	);

	const facetasTabela: DataTableFacet[] = (cfg.facetas ?? []).map((f) => ({
		id: f.id,
		label: f.rotulo,
		options: f.opcoes.map((o) => ({ value: o.valor, label: o.rotulo })),
	}));

	const semNada = c.totalSemFiltro === 0 && !c.mostrarArquivados;

	if (ehCelular && celular) {
		return (
			<div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
				{config.texto ? <CampoBusca valor={c.busca} aoMudar={c.definirBusca} placeholder={placeholderBusca} /> : null}
				{cfg.recortes ? (
					<div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
						{[{ valor: "all", rotulo: cfg.recortes.rotuloTodos ?? "Todos" }, ...cfg.recortes.opcoes].map((o) => (
							<Button
								key={o.valor}
								variant={c.query.tab === o.valor ? "secondary" : "outline"}
								size="sm"
								aria-pressed={c.query.tab === o.valor}
								onClick={() => c.query.setTab(o.valor)}
								className="shrink-0"
							>
								{o.rotulo}
							</Button>
						))}
					</div>
				) : null}
				{carregando ? (
					<div className="flex justify-center py-10"><Spinner /></div>
				) : c.linhasPagina.length === 0 ? (
					<div className="rounded-lg border bg-card">{semNada ? vazio : <p className="px-4 py-8 text-center text-muted-foreground text-xs">{vazioComFiltro}</p>}</div>
				) : (
					<ul className="flex flex-col divide-y overflow-hidden rounded-lg border bg-card">
						{c.linhasPagina.map((l) => (
							<li key={idDa(l)}>
								{aoClicar ? (
									<button type="button" onClick={() => aoClicar(l)} data-alvo className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted">
										{celular(l)}
									</button>
								) : (
									<div className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5">{celular(l)}</div>
								)}
							</li>
						))}
					</ul>
				)}
				<TablePagination
					page={c.query.page}
					totalPages={Math.max(1, Math.ceil(c.total / c.query.pageSize))}
					pageSize={c.query.pageSize}
					total={c.total}
					onPageChange={(p) => c.query.setPage(p)}
					meta={rodape ? rodape({ total: c.total, filtradas: c.filtradas }) : undefined}
				/>
			</div>
		);
	}

	return (
		<DataTable<T, S>
			query={c.query}
			columns={colunas}
			getRowId={idDa}
			rows={carregando ? [] : c.linhasPagina}
			total={c.total}
			loading={carregando}
			facetCounts={c.contagens}
			facets={facetasTabela}
			tabs={
				cfg.recortes
					? {
							id: cfg.recortes.id,
							allLabel: cfg.recortes.rotuloTodos ?? "Todos",
							options: cfg.recortes.opcoes.map((o) => ({ value: o.valor, label: o.rotulo })),
						}
					: undefined
			}
			onRowClick={aoClicar}
			expandable={expansao}
			selection={selecao}
			className={className}
			search={
				config.texto ? (
					<CampoBusca valor={c.busca} aoMudar={c.definirBusca} placeholder={placeholderBusca} />
				) : undefined
			}
			actions={
				<>
					{atalhos?.length ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="justify-start sm:justify-center">
									<Icon icon={Bookmark} data-icon="inline-start" />
									Atalhos de lista
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-56">
								<DropdownMenuLabel>Prontos</DropdownMenuLabel>
								{atalhos.map((a) => (
									<DropdownMenuItem key={a.nome} onSelect={() => aplicarAtalho(a)}>
										{a.nome}
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator />
								<DropdownMenuItem disabled>Salvar esta lista como atalho</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
					{config.arquivada ? (
						<Button
							variant={c.mostrarArquivados ? "secondary" : "outline"}
							size="sm"
							onClick={c.alternarArquivados}
							aria-pressed={c.mostrarArquivados}
							className="justify-start sm:justify-center"
						>
							<Icon icon={ArchiveIcon} data-icon="inline-start" />
							{rotuloArquivados}
						</Button>
					) : null}
					{podeExportar ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => baixarPlanilha(nome, colunas, c.filtradas)}
							className="justify-start sm:justify-center"
						>
							<Icon icon={Download} data-icon="inline-start" />
							Exportar
						</Button>
					) : null}
					{acoesExtras}
				</>
			}
			meta={rodape ? rodape({ total: c.total, filtradas: c.filtradas }) : undefined}
			empty={semNada ? vazio : vazioComFiltro}
		/>
	);
}
