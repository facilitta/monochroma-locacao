"use client";
// 7.11 Catálogo de equipamentos: cada modelo com as unidades livres, o preço e o uso.

import Add from "@carbon/icons-react/es/Add";
import Calendar from "@carbon/icons-react/es/Calendar";
import Camera from "@carbon/icons-react/es/Camera";
import DocumentImport from "@carbon/icons-react/es/DocumentImport";
import QrCode from "@carbon/icons-react/es/QrCode";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Cartao, Codigo, Dinheiro, EsqueletoLinhas, EstadoErro, EstadoVazio, Pagina } from "@/componentes/ui/basicos";
import { Icon } from "@/componentes/ui/icon";
import { PilulaUnidade } from "@/componentes/ui/marcadores";
import { TabelaLista, type AtalhoLista, type Coluna, type Faceta } from "@/componentes/ui/tabela-lista";
import { useFicha, useRegistrarLista } from "@/componentes/ui/ficha";
import { BarraUso, CelulaEquipamento, FiltroLivreEntre, SelosAcessorio, dataLocal } from "@/componentes/estoque/pecas";
import { ImportarPlanilha, NovoEquipamento } from "@/componentes/estoque/janelas";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { Link, useParametro } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { dinheiro, numero } from "@/lib/formatos";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { linhasCatalogo, OPCOES_CATEGORIA, quando, type LinhaCatalogo } from "@/prototipo/consultas-estoque";
import { useMemo, useState } from "react";

export function TelaCatalogo() {
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { ehDono, podeVerFinanceiro } = usePapel();
	const { abrir } = useFicha();
	const [importar, setImportar] = useState(false);
	const [novo, setNovo] = useState(false);
	const [livreDe, setLivreDe] = useParametro("livreDe");
	const [livreAte, setLivreAte] = useParametro("livreAte");

	const periodo = useMemo(() => {
		const inicio = livreDe ? dataLocal(livreDe, "09:00") : null;
		const fim = livreAte ? dataLocal(livreAte, "18:00") : null;
		return inicio && fim && fim > inicio ? { inicio, fim } : undefined;
	}, [livreDe, livreAte]);

	const todas = useMemo(() => linhasCatalogo(agora, periodo), [agora, periodo]);
	const linhas = useMemo(() => {
		if (estado === "vazio") return [];
		return periodo ? todas.filter((l) => (l.livresNoPeriodo ?? 0) > 0) : todas;
	}, [todas, periodo, estado]);
	useRegistrarLista("equipamento", linhas.map((l) => String(l.id)));

	const totalUnidades = estado === "vazio" ? 0 : D.unidades.filter((u) => u.estado !== "baixada").length;

	const colunas: Coluna<LinhaCatalogo>[] = [
		{
			id: "nome",
			header: "Equipamento",
			label: "Equipamento",
			sortable: true,
			hideable: false,
			width: podeVerFinanceiro ? "w-[62%] md:w-[30%]" : "w-[62%] md:w-[42%]",
			cell: (e) => (
				<CelulaEquipamento
					nome={e.nome}
					detalhe={`${e.marca} · ${e.modelo}`}
					aoAbrir={() => abrir("equipamento", e.id)}
					extra={<SelosAcessorio basico={e.basico} extra={e.extra} />}
				/>
			),
			exportar: (e) => `${e.nome} (${e.marca} ${e.modelo})`,
		},
		{
			id: "categoria",
			header: "Categoria",
			label: "Categoria",
			sortable: true,
			hideBelow: "md",
			width: "w-[10%]",
			cell: (e) => <Badge variant="outline">{D.CATEGORIAS[e.categoria]}</Badge>,
			exportar: (e) => D.CATEGORIAS[e.categoria],
		},
		{
			id: "livres",
			header: "Livres",
			label: "Livres",
			sortable: true,
			align: "right",
			width: "w-[38%] md:w-[9%]",
			cell: (e) =>
				periodo ? (
					<span className="tabular-nums">
						{e.livresNoPeriodo} de {e.total}
					</span>
				) : (
					<span className="tabular-nums">
						{e.livres} de {e.total}
					</span>
				),
			exportar: (e) => `${periodo ? e.livresNoPeriodo : e.livres} de ${e.total}`,
		},
		{
			id: "estado",
			header: "Estado",
			label: "Estado",
			hideBelow: "md",
			width: "w-[17%]",
			cell: (e) => <span className={e.livres === 0 ? "text-foreground" : "text-muted-foreground"}>{e.resumo}</span>,
			exportar: (e) => e.resumo,
		},
		...(podeVerFinanceiro
			? ([
					{
						id: "diaria",
						header: "Diária",
						label: "Diária",
						sortable: true,
						align: "right",
						hideBelow: "md",
						width: "w-[10%]",
						cell: (e) =>
							e.basico && !e.extra ? (
								<span className="text-muted-foreground">incluída</span>
							) : (
								<Dinheiro valor={e.precoDiaria} />
							),
						exportar: (e) => (e.basico && !e.extra ? "incluída" : dinheiro(e.precoDiaria)),
					},
				] satisfies Coluna<LinhaCatalogo>[])
			: []),
		{
			id: "proxima",
			header: "Próx. saída",
			label: "Próxima saída",
			sortable: true,
			hideBelow: "lg",
			width: "w-[10%]",
			cell: (e) => (e.proximaSaida ? <span>{quando(e.proximaSaida, agora)}</span> : <span className="text-muted-foreground">—</span>),
		},
		{
			id: "uso",
			header: "Uso 90 d",
			label: "Uso em 90 dias",
			sortable: true,
			hideBelow: "lg",
			width: "w-[12%]",
			cell: (e) => <BarraUso fracao={e.uso} />,
			exportar: (e) => `${Math.round(e.uso * 100)}%`,
		},
		...(podeVerFinanceiro
			? ([
					{
						id: "reposicao",
						header: "Reposição",
						label: "Valor de reposição",
						sortable: true,
						align: "right",
						defaultHidden: true,
						hideBelow: "lg",
						width: "w-[10%]",
						cell: (e) => <Dinheiro valor={e.valorReposicao} />,
						exportar: (e) => dinheiro(e.valorReposicao),
					},
				] satisfies Coluna<LinhaCatalogo>[])
			: []),
	];

	const facetas: Faceta<LinhaCatalogo>[] = [{ id: "categoria", rotulo: "Categoria", valor: (e) => e.categoria, opcoes: OPCOES_CATEGORIA }];

	const atalhos: AtalhoLista[] = [
		{ nome: "Livres agora", parametros: { recorte: "livres" } },
		{ nome: "Na rua", parametros: { recorte: "narua" } },
		{ nome: "Em reparo", parametros: { recorte: "reparo" } },
		{ nome: "Sem foto", parametros: { recorte: "semfoto" } },
	];

	const vazio = (
		<EstadoVazio
			icone={Camera}
			titulo="Nenhum equipamento ainda"
			descricao="Cadastre o primeiro ou importe a planilha."
			acao={
				ehDono ? (
					<div className="flex flex-wrap justify-center gap-2">
						<Button variant="outline" size="sm" onClick={() => setNovo(true)}>
							Novo equipamento
						</Button>
						<Button variant="outline" size="sm" onClick={() => setImportar(true)}>
							Importar planilha
						</Button>
					</div>
				) : undefined
			}
		/>
	);

	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Catálogo"
				descricao="Cada modelo, quantas unidades estão livres, quanto custa e quanto é usado."
				acoes={
					<>
						{ehDono ? (
							<Button variant="outline" disabled={offline} title={offline ? "Volta quando a internet voltar" : undefined} onClick={() => setImportar(true)}>
								<Icon icon={DocumentImport} data-icon="inline-start" />
								Importar planilha
							</Button>
						) : null}
						<Button asChild variant="outline">
							<Link href="/etiquetas">
								<Icon icon={QrCode} data-icon="inline-start" />
								Etiquetas
							</Link>
						</Button>
						{ehDono ? (
							<Button disabled={offline} title={offline ? "Volta quando a internet voltar" : undefined} onClick={() => setNovo(true)}>
								<Icon icon={Add} data-icon="inline-start" />
								Novo equipamento
							</Button>
						) : null}
					</>
				}
			/>

			<Button asChild variant="outline" size="lg" className="h-14 w-full justify-start text-base md:hidden">
				<Link href="/agenda?livre=sim">
					<Icon icon={Calendar} data-icon="inline-start" className="size-5" />
					Está livre?
					<span className="ml-auto font-normal text-muted-foreground text-xs">equipamento + datas</span>
				</Link>
			</Button>

			{estado === "carregando" ? (
				<EsqueletoLinhas linhas={10} />
			) : estado === "erro" ? (
				<Cartao>
					<EstadoErro frase="Não consegui carregar o catálogo." />
				</Cartao>
			) : (
				<TabelaLista<LinhaCatalogo, D.Unidade>
					nome="catalogo"
					linhas={linhas}
					colunas={colunas}
					idDa={(e) => String(e.id)}
					placeholderBusca="Buscar equipamento, marca ou modelo…"
					config={{
						texto: (e) => `${e.nome} ${e.marca} ${e.modelo} ${e.unidadesLista.map((u) => `${u.codigo} ${u.numeroSerie ?? ""}`).join(" ")}`,
						ordenacoes: {
							nome: (e) => e.nome,
							categoria: (e) => D.CATEGORIAS[e.categoria],
							livres: (e) => (periodo ? (e.livresNoPeriodo ?? 0) : e.livres),
							diaria: (e) => e.precoDiaria,
							proxima: (e) => e.proximaSaida?.getTime() ?? Number.MAX_SAFE_INTEGER,
							uso: (e) => e.uso,
							reposicao: (e) => e.valorReposicao,
						},
						ordemPadrao: { coluna: "nome", direcao: "asc" },
						porPagina: 50,
						recortes: {
							id: "recorte",
							rotuloTodos: "Todos",
							opcoes: [
								{ valor: "livres", rotulo: "Livres agora", filtro: (e) => e.livres > 0 },
								{ valor: "narua", rotulo: "Na rua", filtro: (e) => e.estados.na_rua + e.estados.pendente > 0 },
								{ valor: "reparo", rotulo: "Em reparo", filtro: (e) => e.estados.reparo > 0 },
								{ valor: "semfoto", rotulo: "Sem foto", filtro: (e) => !e.temFoto },
							],
						},
						arquivada: (e) => !!e.arquivadoEm || !e.ativo,
					}}
					facetas={facetas}
					atalhos={atalhos}
					podeExportar={ehDono}
					acoesExtras={
						<FiltroLivreEntre
							de={livreDe}
							ate={livreAte}
							desligado={offline}
							aoAplicar={(de, ate) => {
								setLivreDe(de);
								setLivreAte(ate);
							}}
						/>
					}
					expansao={{
						isExpandable: (e) => e.unidadesLista.length > 0,
						getSubRows: (e) => e.unidadesLista,
						getSubRowId: (u) => `u${u.id}`,
						onSubRowClick: (u) => abrir("unidade", u.id),
						renderSubCell: (u, coluna) => {
							const s = Q.situacaoUnidade(u, agora);
							if (coluna === "nome")
								return (
									<span className="flex min-w-0 items-center gap-2 pl-2 text-muted-foreground">
										<span aria-hidden>└</span>
										<Codigo className="text-foreground">{u.codigo}</Codigo>
										{u.numeroSerie ? <span className="truncate">nº {u.numeroSerie}</span> : null}
									</span>
								);
							if (coluna === "estado")
								return (
									<PilulaUnidade
										estado={s.estado}
										detalhe={s.estado === "livre" ? undefined : s.estado === "pre_reservada" ? s.detalhe : s.reservaId ? `${s.reservaId}` : s.detalhe}
										compacta
									/>
								);
							if (coluna === "proxima") return s.proximaSaida ? <span className="text-muted-foreground">{quando(s.proximaSaida.em, agora)}</span> : null;
							return null;
						},
					}}
					rodape={({ total }) => `${numero(total)} ${total === 1 ? "equipamento" : "equipamentos"} · ${numero(totalUnidades)} unidades`}
					vazio={vazio}
					vazioComFiltro={periodo ? "Nada livre nesse período com esses filtros." : "Nenhum equipamento com esses filtros."}
					celular={(e) => (
						<>
							<CelulaEquipamento nome={e.nome} detalhe={`${e.livres} de ${e.total} livres`} tamanho={48} />
							<span className="ml-auto flex shrink-0 flex-col items-end gap-0.5">
								{podeVerFinanceiro && !(e.basico && !e.extra) ? <Dinheiro valor={e.precoDiaria} className="text-sm" /> : null}
								<span className="text-muted-foreground text-xs">{D.CATEGORIAS[e.categoria]}</span>
							</span>
						</>
					)}
					aoClicar={(e) => abrir("equipamento", e.id, { aba: "unidades" })}
				/>
			)}

			<ImportarPlanilha aberta={importar} aoFechar={() => setImportar(false)} />
			<NovoEquipamento aberto={novo} aoFechar={() => setNovo(false)} aoCriar={(id) => abrir("equipamento", id)} />
		</Pagina>
	);
}
