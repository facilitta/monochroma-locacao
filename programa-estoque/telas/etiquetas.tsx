"use client";
// 7.19 Etiquetas: gerar e imprimir em lote, no tamanho real. O QR leva só o código.

import Download from "@carbon/icons-react/es/Download";
import Printer from "@carbon/icons-react/es/Printer";
import QrCode from "@carbon/icons-react/es/QrCode";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Cartao, Codigo, EstadoErro, EstadoVazio, Pagina } from "@/componentes/ui/basicos";
import { Icon } from "@/componentes/ui/icon";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Selo } from "@/componentes/ui/marcadores";
import { Skeleton } from "@/componentes/ui/skeleton";
import { TabelaLista, type Coluna } from "@/componentes/ui/tabela-lista";
import { ToggleGroup, ToggleGroupItem } from "@/componentes/ui/toggle-group";
import { Etiqueta, TAMANHOS, type TamanhoEtiqueta } from "@/componentes/etiquetas/etiqueta";
import { useTableSelection } from "@/hooks/use-table-selection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { data } from "@/lib/formatos";
import { useBusca } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { dentroDaMoldura } from "@/lib/ambiente";

type Linha = D.Unidade & { equipamento: string };

function FolhaDeImpressao({ unidades, tamanho, copias, teste }: { unidades: D.Unidade[]; tamanho: TamanhoEtiqueta; copias: number; teste: boolean }) {
	const [alvo, setAlvo] = useState<HTMLElement | null>(null);
	useEffect(() => setAlvo(document.body), []);
	if (!alvo) return null;
	const lista = teste ? unidades.slice(0, 1) : unidades.flatMap((u) => Array.from({ length: copias }, () => u));
	const a4 = tamanho === "a4";
	return createPortal(
		<div data-folha-impressao className="hidden print:block">
			<style>{"@media print{body>*:not([data-folha-impressao]){display:none!important}@page{size:A4;margin:10mm}}"}</style>
			<div className={a4 ? "grid grid-cols-3 gap-0" : "flex flex-col"} style={a4 ? { width: "190.5mm" } : undefined}>
				{lista.map((u, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: cópias repetidas da mesma etiqueta
					<Etiqueta key={`${u.id}-${i}`} unidade={u} tamanho={tamanho} guias={teste} />
				))}
			</div>
			{teste ? <p style={{ fontSize: "3mm", marginTop: "4mm" }}>Página de teste: confira se a etiqueta caiu dentro do recorte e ajuste o deslocamento em Configurações › Etiquetas.</p> : null}
		</div>,
		alvo,
	);
}

export function TelaEtiquetas() {
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { ehDono } = usePapel();
	const ehCelular = useIsMobile();
	const busca = useBusca();
	const [versao, setVersao] = useState(0);
	const [tamanho, setTamanho] = useState<TamanhoEtiqueta>("a4");
	const [copias, setCopias] = useState(1);
	const [teste, setTeste] = useState(false);

	const pedidas = useMemo(
		() =>
			(busca.get("unidades") ?? "")
				.split(",")
				.map((x) => Number(x))
				.filter((n) => Number.isFinite(n) && n > 0),
		// biome-ignore lint/correctness/useExhaustiveDependencies: lido uma vez
		[],
	);

	const linhas: Linha[] = useMemo(() => {
		void versao;
		if (estado === "vazio") return [];
		return D.unidades.filter((u) => u.estado !== "baixada").map((u) => ({ ...u, equipamento: Q.equipamento(u.equipamentoId).nome }));
	}, [versao, estado]);

	const selecao = useTableSelection(linhas.map((l) => String(l.id)));
	const preSelecionou = useRef(false);
	useEffect(() => {
		if (preSelecionou.current || !pedidas.length || !linhas.length) return;
		preSelecionou.current = true;
		for (const id of pedidas) selecao.toggle(String(id), true);
	}, [pedidas, linhas, selecao]);

	const selecionadas = linhas.filter((l) => selecao.has(String(l.id)));
	const naoImpressas = linhas.filter((l) => !l.etiquetaImpressaEm);
	const paraImprimir = selecionadas.length ? selecionadas : ehCelular ? naoImpressas : [];
	const previa = selecionadas[0] ?? naoImpressas[0] ?? linhas[0];
	const t = TAMANHOS[tamanho];
	const total = paraImprimir.length * copias;
	const folhas = t.porFolha ? Math.ceil(total / (t.porFolha.colunas * t.porFolha.linhas)) : 0;

	const imprimir = (modoTeste = false) => {
		if (!modoTeste && paraImprimir.length === 0) {
			toast.error("Selecione as etiquetas que vão para a impressão.");
			return;
		}
		setTeste(modoTeste);
		window.setTimeout(() => {
			if (dentroDaMoldura()) {
				toast.info("Na página publicada não dá para abrir a impressão. No app rodando no computador, abre a impressão do navegador com a folha no tamanho real.");
			} else {
				try {
					window.print();
				} catch {
					// impressão bloqueada neste ambiente
				}
			}
			if (!modoTeste) {
				for (const u of paraImprimir) {
					const real = D.unidades.find((x) => x.id === u.id);
					if (real) real.etiquetaImpressaEm = agora;
				}
				setVersao((v) => v + 1);
				toast.success(`${paraImprimir.length} ${paraImprimir.length === 1 ? "etiqueta marcada" : "etiquetas marcadas"} como impressa${paraImprimir.length === 1 ? "" : "s"} em ${data(agora)}`);
			}
			setTeste(false);
		}, 50);
	};

	const colunas: Coluna<Linha>[] = [
		{ id: "codigo", header: "Etiqueta", label: "Etiqueta", sortable: true, hideable: false, width: "w-[30%]", cell: (u) => <Codigo>{u.codigo}</Codigo>, exportar: (u) => u.codigo },
		{ id: "equipamento", header: "Equipamento", label: "Equipamento", sortable: true, width: "w-[30%]", cell: (u) => <span className="truncate">{u.equipamento}</span>, exportar: (u) => u.equipamento },
		{ id: "serie", header: "Nº de série", label: "Nº de série", hideBelow: "md", width: "w-[18%]", cell: (u) => <Codigo className="text-muted-foreground">{u.numeroSerie ?? "—"}</Codigo>, exportar: (u) => u.numeroSerie ?? "" },
		{
			id: "impressa",
			header: "Impressa em",
			label: "Impressa em",
			sortable: true,
			width: "w-[22%]",
			cell: (u) => (u.etiquetaImpressaEm ? <span className="tabular-nums text-muted-foreground">{data(u.etiquetaImpressaEm)}</span> : <Selo tom="atencao">Não impressa</Selo>),
			exportar: (u) => (u.etiquetaImpressaEm ? data(u.etiquetaImpressaEm) : "não"),
		},
	];

	const lista = (
		<TabelaLista<Linha>
			nome="etiquetas"
			linhas={linhas}
			colunas={colunas}
			idDa={(u) => String(u.id)}
			carregando={estado === "carregando"}
			placeholderBusca="Buscar etiqueta, nº de série ou equipamento…"
			podeExportar={false}
			config={{
				texto: (u) => `${u.codigo} ${u.numeroSerie ?? ""} ${u.equipamento}`,
				ordenacoes: {
					codigo: (u) => u.codigo,
					equipamento: (u) => u.equipamento,
					impressa: (u) => u.etiquetaImpressaEm?.getTime() ?? 0,
				},
				ordemPadrao: { coluna: "equipamento", direcao: "asc" },
				porPagina: 100,
				recortes: {
					id: "recorte",
					rotuloTodos: "Todas",
					padrao: pedidas.length ? "all" : "nao",
					opcoes: [
						{ valor: "nao", rotulo: "Não impressas", filtro: (u) => !u.etiquetaImpressaEm },
						{ valor: "sim", rotulo: "Já impressas", filtro: (u) => !!u.etiquetaImpressaEm },
					],
				},
			}}
			selecao={
				ehCelular
					? undefined
					: {
							state: selecao,
							rowLabel: (u) => u.codigo,
							actions: (
								<Button variant="outline" size="sm" onClick={() => imprimir()} disabled={offline}>
									<Icon icon={Printer} data-icon="inline-start" />
									Imprimir {selecao.count}
								</Button>
							),
						}
			}
			rodape={({ total: n }) => `${n} ${n === 1 ? "etiqueta" : "etiquetas"}${selecionadas.length ? ` · ${selecionadas.length} ${selecionadas.length === 1 ? "selecionada" : "selecionadas"}` : ""}`}
			vazio={<EstadoVazio icone={QrCode} titulo="Nenhuma unidade" descricao="As etiquetas nascem com cada unidade cadastrada na ficha do equipamento." />}
			vazioComFiltro="Todas as etiquetas já foram impressas. Mostre todas para reimprimir."
			celular={(u) => (
				<>
					<span className="flex min-w-0 flex-1 flex-col gap-0.5">
						<Codigo className="text-sm">{u.codigo}</Codigo>
						<span className="truncate text-muted-foreground text-xs">
							{u.equipamento}
							{u.numeroSerie ? ` · nº ${u.numeroSerie}` : ""}
						</span>
					</span>
					{u.etiquetaImpressaEm ? <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{data(u.etiquetaImpressaEm)}</span> : <Selo tom="atencao">Não impressa</Selo>}
				</>
			)}
		/>
	);

	if (ehCelular) {
		return (
			<Pagina>
				<CabecalhoPagina
					titulo="Etiquetas"
					descricao="QR e código de cada peça, lidos pela câmera no balcão."
					acoes={
						<Button variant="outline" onClick={() => imprimir()} disabled={offline || estado === "erro" || paraImprimir.length === 0}>
							<Icon icon={Download} data-icon="inline-start" />
							Baixar PDF
						</Button>
					}
				/>
				<div role="note" className="rounded-lg border border-info-borda bg-info-fundo px-4 py-3 text-info text-xs">
					Imprima pelo computador: a prévia precisa do tamanho real. Aqui o PDF sai com as etiquetas ainda não impressas.
				</div>
				{estado === "erro" ? <EstadoErro frase="Não consegui gerar o PDF." /> : lista}
				<FolhaDeImpressao unidades={paraImprimir} tamanho={tamanho} copias={copias} teste={teste} />
			</Pagina>
		);
	}

	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Etiquetas"
				descricao="Gere e imprima em lote as etiquetas com QR e código legível. A câmera do celular lê no balcão."
				acoes={
					<>
						<Button variant="outline" onClick={() => imprimir()} disabled={offline || estado === "erro"}>
							<Icon icon={Download} data-icon="inline-start" />
							Baixar PDF
						</Button>
						<Button onClick={() => imprimir()} disabled={offline || estado === "erro"}>
							<Icon icon={Printer} data-icon="inline-start" />
							Imprimir
						</Button>
					</>
				}
			/>
			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
				<div className="min-w-0">{lista}</div>
				<Cartao titulo="Prévia em tamanho real" descricao={previa ? `${selecionadas.length ? `${selecionadas.length} ${selecionadas.length === 1 ? "selecionada" : "selecionadas"}` : "Nenhuma selecionada"} · mostrando ${previa.codigo}` : undefined} corpoClassName="flex flex-col gap-4 p-4">
					{estado === "carregando" ? (
						<Skeleton className="h-36 w-full" />
					) : estado === "erro" ? (
						<EstadoErro frase="Não consegui gerar o PDF." />
					) : previa ? (
						<div className="flex min-h-40 items-center justify-center overflow-x-auto rounded-md bg-muted p-4">
							<Etiqueta unidade={previa} tamanho={tamanho} />
						</div>
					) : (
						<p className="text-muted-foreground text-xs">Nada para mostrar.</p>
					)}
					<div className="flex flex-col gap-1.5">
						<span className="font-medium text-xs">Tamanho</span>
						<ToggleGroup
							type="single"
							variant="outline"
							spacing={0}
							value={tamanho}
							onValueChange={(v) => v && setTamanho(v as TamanhoEtiqueta)}
							disabled={!ehDono}
							aria-label="Tamanho da etiqueta"
							className="w-full"
						>
							{(Object.keys(TAMANHOS) as TamanhoEtiqueta[]).map((k) => (
								<ToggleGroupItem key={k} value={k} className="flex-1">
									{k === "a4" ? "Folha A4 adesiva" : TAMANHOS[k].rotulo}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
						<p className="text-muted-foreground text-2xs">{ehDono ? t.nota : "O tamanho padrão é definido pelo dono."}</p>
					</div>
					<div className="flex items-end gap-3">
						<div className="flex w-28 flex-col gap-1.5">
							<Label htmlFor="copias">Cópias por unidade</Label>
							<Input id="copias" type="number" min={1} max={10} value={copias} onChange={(e) => setCopias(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
						</div>
						<Button variant="outline" onClick={() => imprimir(true)} disabled={offline || !previa}>
							Página de teste
						</Button>
					</div>
					<p className="text-muted-foreground text-xs">
						{total ? `${total} ${total === 1 ? "etiqueta" : "etiquetas"}${folhas ? ` em ${folhas} ${folhas === 1 ? "folha" : "folhas"}` : ""}.` : "Selecione na lista as etiquetas que vão para a impressão."}
					</p>
					<div role="note" className="rounded-md border px-3 py-2 text-muted-foreground text-xs">
						Para começar: folha adesiva comum coberta com fita transparente. Depois, se quiser, etiqueta de poliéster ou laminada, que aguenta mais o uso no set.
					</div>
				</Cartao>
			</div>
			<FolhaDeImpressao unidades={paraImprimir} tamanho={tamanho} copias={copias} teste={teste && !!previa} />
		</Pagina>
	);
}
