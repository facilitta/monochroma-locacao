"use client";
// 7.13 Unidades (inventário): cada peça física, onde está e em que estado, para conferir e agir em lote.

import Add from "@carbon/icons-react/es/Add";
import ChevronDown from "@carbon/icons-react/es/ChevronDown";
import Printer from "@carbon/icons-react/es/Printer";
import Scan from "@carbon/icons-react/es/Scan";
import Tag from "@carbon/icons-react/es/Tag";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Cartao, Codigo, EsqueletoLinhas, EstadoErro, EstadoVazio, Pagina } from "@/componentes/ui/basicos";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/componentes/ui/dropdown-menu";
import { Icon } from "@/componentes/ui/icon";
import { PilulaUnidade } from "@/componentes/ui/marcadores";
import { TabelaLista, type AtalhoLista, type Coluna, type Faceta } from "@/componentes/ui/tabela-lista";
import { useFicha, useRegistrarLista } from "@/componentes/ui/ficha";
import { BaixarUnidades, LerEtiqueta, MandarParaReparo, NovaUnidade } from "@/componentes/estoque/janelas";
import { useTableSelection } from "@/hooks/use-table-selection";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { Link, useNavegar } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { ESTADOS_UNIDADE, ORDEM_DOS_ESTADOS } from "@/lib/regras/unidades";
import { DIA, numero, porcento, relativa } from "@/lib/formatos";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { OPCOES_CATEGORIA, ondeEsta, type Onde } from "@/prototipo/consultas-estoque";
import { useMemo, useState } from "react";

type Linha = D.Unidade & {
	equipamento: D.Equipamento;
	situacao: Q.SituacaoUnidade;
	onde: Onde;
	rendeu: number | null;
};

export function TelaUnidades() {
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { ehDono, podeVerFinanceiro } = usePapel();
	const { abrir } = useFicha();
	const navegar = useNavegar();
	const [ler, setLer] = useState(false);
	const [nova, setNova] = useState(false);
	const [reparo, setReparo] = useState(false);
	const [baixar, setBaixar] = useState(false);

	const linhas: Linha[] = useMemo(
		() =>
			estado === "vazio"
				? []
				: D.unidades.map((u) => ({
						...u,
						equipamento: Q.equipamento(u.equipamentoId),
						situacao: Q.situacaoUnidade(u, agora),
						onde: ondeEsta(u, agora),
						rendeu: Q.quantoJaRendeu(u.id),
					})),
		[agora, estado],
	);
	const ids = useMemo(() => linhas.filter((l) => l.estado !== "baixada").map((l) => String(l.id)), [linhas]);
	useRegistrarLista("unidade", ids);
	const selecao = useTableSelection(ids);
	const noventaDias = agora.getTime() - 90 * DIA;

	const colunas: Coluna<Linha>[] = [
		{
			id: "codigo",
			header: "Etiqueta",
			label: "Etiqueta",
			sortable: true,
			hideable: false,
			width: "w-[16%]",
			cell: (u) => <Codigo className="font-medium">{u.codigo}</Codigo>,
			exportar: (u) => u.codigo,
		},
		{
			id: "equipamento",
			header: "Equipamento",
			label: "Equipamento",
			sortable: true,
			width: podeVerFinanceiro ? "w-[18%]" : "w-[22%]",
			cell: (u) => <span className="truncate">{u.equipamento.nome}</span>,
			exportar: (u) => u.equipamento.nome,
		},
		{
			id: "serie",
			header: "Nº série",
			label: "Número de série",
			sortable: true,
			hideBelow: "md",
			width: "w-[10%]",
			cell: (u) => (u.numeroSerie ? <Codigo>{u.numeroSerie}</Codigo> : <span className="text-muted-foreground">—</span>),
			exportar: (u) => u.numeroSerie ?? "",
		},
		{
			id: "estado",
			header: "Estado",
			label: "Estado",
			sortable: true,
			width: "w-[20%]",
			cell: (u) => <PilulaUnidade estado={u.situacao.estado} detalhe={u.situacao.estado === "pre_reservada" ? u.situacao.detalhe : undefined} />,
			exportar: (u) => ESTADOS_UNIDADE[u.situacao.estado].nome,
		},
		{
			id: "onde",
			header: "Onde está",
			label: "Onde está",
			hideBelow: "md",
			width: podeVerFinanceiro ? "w-[24%]" : "w-[32%]",
			cell: (u) =>
				u.onde.ficha ? (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							if (u.onde.ficha) abrir(u.onde.ficha.tipo, u.onde.ficha.id);
						}}
						className="max-w-full truncate text-left text-link underline-offset-4 hover:underline"
					>
						{u.onde.texto}
					</button>
				) : (
					<span className="truncate text-muted-foreground">{u.onde.texto}</span>
				),
			exportar: (u) => u.onde.texto,
		},
		...(podeVerFinanceiro
			? ([
					{
						id: "rendeu",
						header: "Rendeu",
						label: "Quanto já rendeu",
						sortable: true,
						align: "right",
						hideBelow: "lg",
						width: "w-[8%]",
						cell: (u) => (u.rendeu == null ? <span className="text-muted-foreground">—</span> : <span className="tabular-nums">{porcento(u.rendeu)}</span>),
						exportar: (u) => (u.rendeu == null ? "" : porcento(u.rendeu)),
					},
				] satisfies Coluna<Linha>[])
			: []),
		{
			id: "conferencia",
			header: "Última conferência",
			label: "Última conferência",
			sortable: true,
			defaultHidden: true,
			hideBelow: "lg",
			width: "w-[12%]",
			cell: (u) => <span className="text-muted-foreground">{u.ultimaConferenciaEm ? relativa(u.ultimaConferenciaEm, agora) : "nunca"}</span>,
		},
	];

	const facetas: Faceta<Linha>[] = [
		{
			id: "estado",
			rotulo: "Estado",
			valor: (u) => u.situacao.estado,
			opcoes: ORDEM_DOS_ESTADOS.filter((e) => e !== "baixada").map((e) => ({ valor: e, rotulo: ESTADOS_UNIDADE[e].nome })),
		},
		{ id: "categoria", rotulo: "Categoria", valor: (u) => u.equipamento.categoria, opcoes: OPCOES_CATEGORIA },
	];

	const atalhos: AtalhoLista[] = [
		{ nome: "Na rua", parametros: { recorte: "narua" } },
		{ nome: "Em reparo", parametros: { recorte: "reparo" } },
		{ nome: "Etiqueta não impressa", parametros: { recorte: "semetiqueta" } },
		{ nome: "Sem conferência há 90 dias", parametros: { recorte: "semconferencia" } },
	];

	const acoesEmMassa = (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" disabled={offline} title={offline ? "Volta quando a internet voltar" : undefined}>
					Ações
					<Icon icon={ChevronDown} data-icon="inline-end" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-52">
				<DropdownMenuItem onSelect={() => navegar(`/etiquetas?unidades=${selecao.ids.join(",")}`)}>Imprimir etiquetas</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => setReparo(true)}>Mandar para reparo</DropdownMenuItem>
				{ehDono ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => setBaixar(true)} className="text-erro">
							Baixar…
						</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Unidades"
				descricao="Cada peça física, onde está e em que estado."
				acoes={
					<>
						<Button asChild variant="outline">
							<Link href="/etiquetas">
								<Icon icon={Printer} data-icon="inline-start" />
								Imprimir etiquetas
							</Link>
						</Button>
						{ehDono ? (
							<Button disabled={offline} title={offline ? "Volta quando a internet voltar" : undefined} onClick={() => setNova(true)}>
								<Icon icon={Add} data-icon="inline-start" />
								Nova unidade
							</Button>
						) : null}
					</>
				}
			/>

			<Button variant="outline" size="lg" className="h-14 w-full justify-start text-base md:hidden" onClick={() => setLer(true)}>
				<Icon icon={Scan} data-icon="inline-start" className="size-5" />
				Ler etiqueta
				<span className="ml-auto font-normal text-muted-foreground text-xs">abre a unidade</span>
			</Button>

			{estado === "carregando" ? (
				<EsqueletoLinhas linhas={10} />
			) : estado === "erro" ? (
				<Cartao>
					<EstadoErro frase="Não consegui carregar as unidades." />
				</Cartao>
			) : (
				<TabelaLista<Linha>
					nome="unidades"
					linhas={linhas}
					colunas={colunas}
					idDa={(u) => String(u.id)}
					placeholderBusca="Buscar etiqueta, nº de série ou equipamento…"
					config={{
						texto: (u) => `${u.codigo} ${u.numeroSerie ?? ""} ${u.equipamento.nome} ${u.equipamento.marca} ${u.equipamento.modelo}`,
						ordenacoes: {
							codigo: (u) => u.codigo,
							equipamento: (u) => u.equipamento.nome,
							serie: (u) => u.numeroSerie ?? "",
							estado: (u) => ORDEM_DOS_ESTADOS.indexOf(u.situacao.estado),
							rendeu: (u) => u.rendeu ?? -1,
							conferencia: (u) => u.ultimaConferenciaEm?.getTime() ?? 0,
						},
						ordemPadrao: { coluna: "equipamento", direcao: "asc" },
						porPagina: 100,
						recortes: {
							id: "recorte",
							rotuloTodos: "Todas",
							opcoes: [
								{ valor: "narua", rotulo: "Na rua", filtro: (u) => u.situacao.estado === "na_rua" || u.situacao.estado === "pendente" },
								{ valor: "reparo", rotulo: "Em reparo", filtro: (u) => u.situacao.estado === "reparo" },
								{ valor: "semetiqueta", rotulo: "Etiqueta não impressa", filtro: (u) => !u.etiquetaImpressaEm },
								{ valor: "semconferencia", rotulo: "Sem conferência há 90 dias", filtro: (u) => !u.ultimaConferenciaEm || u.ultimaConferenciaEm.getTime() < noventaDias },
							],
						},
						arquivada: (u) => u.estado === "baixada",
					}}
					rotuloArquivados="Arquivados / baixadas"
					facetas={facetas}
					atalhos={atalhos}
					podeExportar={ehDono}
					selecao={{ state: selecao, actions: acoesEmMassa, rowLabel: (u) => u.codigo }}
					aoClicar={(u) => abrir("unidade", u.id)}
					rodape={({ total }) => `${numero(total)} ${total === 1 ? "unidade" : "unidades"}`}
					vazio={<EstadoVazio icone={Tag} titulo="Nenhuma unidade" descricao="Elas nascem na ficha de cada equipamento." />}
					vazioComFiltro="Nenhuma unidade com esses filtros."
					celular={(u) => (
						<>
							<span className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="flex min-w-0 items-center gap-2">
									<Codigo className="font-medium text-sm">{u.codigo}</Codigo>
									<span className="truncate text-muted-foreground text-xs">{u.equipamento.nome}</span>
								</span>
								<span className="truncate text-muted-foreground text-xs">{u.onde.texto}</span>
							</span>
							<PilulaUnidade estado={u.situacao.estado} compacta />
						</>
					)}
				/>
			)}

			<LerEtiqueta aberta={ler} aoFechar={() => setLer(false)} aoAchar={(id) => abrir("unidade", id)} />
			<NovaUnidade aberta={nova} aoFechar={() => setNova(false)} aoCriar={(id) => abrir("unidade", id)} />
			<MandarParaReparo aberta={reparo} aoFechar={() => setReparo(false)} quantidade={Math.max(1, selecao.count)} />
			<BaixarUnidades aberta={baixar} aoFechar={() => setBaixar(false)} quantidade={Math.max(1, selecao.count)} />
		</Pagina>
	);
}
