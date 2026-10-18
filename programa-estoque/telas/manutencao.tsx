"use client";
// 7.18 Manutenção: cada peça em reparo até voltar a ser alugável, com custo e cobrança.

import Add from "@carbon/icons-react/es/Add";
import ChevronDown from "@carbon/icons-react/es/ChevronDown";
import Tools from "@carbon/icons-react/es/Tools";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Codigo, Dinheiro, EstadoErro, EstadoVazio, FotoEquipamento, Pagina } from "@/componentes/ui/basicos";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Icon } from "@/componentes/ui/icon";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { PontoSituacao } from "@/componentes/ui/marcadores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { TabelaLista, type Coluna } from "@/componentes/ui/tabela-lista";
import { Textarea } from "@/componentes/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/componentes/ui/toggle-group";
import { useFicha, useRegistrarLista } from "@/componentes/ui/ficha";
import { EsqueletoQuadro, Quadro, type ColunaQuadro } from "@/componentes/quadro/quadro";
import { CartaoManutencao, TOM_SITUACAO, nomeSituacao, useMoverManutencao } from "@/componentes/locacao/reserva-manutencao";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { dataCurta, dinheiro, normalizarEtiqueta, semAcento } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { SITUACOES_MANUTENCAO, TIPOS_DANO, abrirManutencao, paradaHa, useVersaoDados } from "@/prototipo/consultas-reservas";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function AbrirManutencao({ aberta, aoFechar, agora }: { aberta: boolean; aoFechar: () => void; agora: Date }) {
	const { abrir } = useFicha();
	const [codigo, setCodigo] = useState("");
	const [tipo, setTipo] = useState<D.TipoDano | "">("");
	const [problema, setProblema] = useState("");
	if (!aberta) return null;
	const normal = codigo ? normalizarEtiqueta(codigo) : "";
	const achada = normal ? D.unidades.find((u) => u.codigo === normal || semAcento(u.numeroSerie ?? "") === semAcento(codigo)) : undefined;
	const invalida = achada && achada.estado !== "ok";
	const fechar = () => {
		setCodigo("");
		setTipo("");
		setProblema("");
		aoFechar();
	};
	return (
		<Dialog open onOpenChange={(o) => !o && fechar()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Abrir manutenção</DialogTitle>
					<DialogDescription>A unidade vai para reparo e fica bloqueada na agenda até ser liberada.</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-3"
					onSubmit={(e) => {
						e.preventDefault();
						if (!achada || invalida || !tipo || !problema) return;
						const id = abrirManutencao(achada.id, tipo, problema, agora);
						fechar();
						toast.success(`Manutenção ${id} aberta`);
						abrir("manutencao", id);
					}}
				>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="etiqueta-manutencao">Etiqueta ou nº de série</Label>
						<Input id="etiqueta-manutencao" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="EQ-1A2B3C4D ou só 1A2B3C4D" autoComplete="off" />
						{codigo && !achada ? <p className="text-erro text-xs">Não achei essa etiqueta.</p> : null}
						{achada ? (
							<p className={cn("text-xs", invalida ? "text-erro" : "text-muted-foreground")}>
								{Q.equipamento(achada.equipamentoId).nome} · <Codigo>{achada.codigo}</Codigo>
								{invalida ? " · já está em reparo ou baixada" : ""}
							</p>
						) : null}
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="tipo-manutencao">Tipo</Label>
						<Select value={tipo} onValueChange={(v) => setTipo(v as D.TipoDano)}>
							<SelectTrigger id="tipo-manutencao" className="w-full">
								<SelectValue placeholder="Escolha o tipo" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(TIPOS_DANO).map(([v, n]) => (
									<SelectItem key={v} value={v}>
										{n}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="problema-manutencao">Problema</Label>
						<Textarea id="problema-manutencao" value={problema} onChange={(e) => setProblema(e.target.value)} placeholder="O que está acontecendo com a peça" />
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={fechar}>
							Cancelar
						</Button>
						<Button type="submit" disabled={!achada || !!invalida || !tipo || !problema}>
							Abrir manutenção
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function TelaManutencao() {
	const versao = useVersaoDados();
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { podeVerFinanceiro } = usePapel();
	const ehCelular = useIsMobile();
	const { abrir } = useFicha();
	const { pedir, janela } = useMoverManutencao(agora);
	const [visao, setVisao] = useQueryState("visao", parseAsString.withDefault("quadro").withOptions({ history: "replace" }));
	const [nova, setNova] = useState(false);
	const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
	const [fechadas, setFechadas] = useState<Set<string>>(new Set(["liberada", "descartada"]));

	// biome-ignore lint/correctness/useExhaustiveDependencies: versao força a releitura dos dados do protótipo
	const todas = useMemo(() => [...D.manutencoes].sort((a, b) => a.abertaEm.getTime() - b.abertaEm.getTime()), [versao]);
	useRegistrarLista("manutencao", todas.map((m) => String(m.id)));
	const abertas = todas.filter((m) => !["liberada", "descartada"].includes(m.situacao));

	const cabecalho = (
		<CabecalhoPagina
			titulo="Manutenção"
			descricao="Cada peça em reparo, até voltar a ser alugável."
			acoes={
				<>
					{!ehCelular ? (
						<ToggleGroup type="single" variant="outline" spacing={0} value={visao} onValueChange={(v) => v && void setVisao(v === "quadro" ? null : v)} aria-label="Ver como">
							<ToggleGroupItem value="quadro" className="rounded-r-none">
								Quadro
							</ToggleGroupItem>
							<ToggleGroupItem value="tabela" className="rounded-l-none border-l-0">
								Tabela
							</ToggleGroupItem>
						</ToggleGroup>
					) : null}
					<Button onClick={() => setNova(true)} disabled={offline} title={offline ? "Volta quando a internet voltar" : undefined}>
						<Icon icon={Add} data-icon="inline-start" />
						Abrir manutenção
					</Button>
				</>
			}
		/>
	);

	const vazio = (
		<EstadoVazio
			icone={Tools}
			titulo="Nenhuma peça em reparo"
			descricao="Bom sinal. As peças que voltarem com problema aparecem aqui."
		/>
	);

	if (estado === "carregando") {
		return (
			<Pagina larga>
				{cabecalho}
				<EsqueletoQuadro colunas={4} />
			</Pagina>
		);
	}
	if (estado === "erro") {
		return (
			<Pagina>
				{cabecalho}
				<div className="rounded-lg border bg-card">
					<EstadoErro frase="Não consegui carregar as manutenções." aoTentar={() => window.location.reload()} />
				</div>
			</Pagina>
		);
	}
	const lista = estado === "vazio" ? [] : todas;
	const daSituacao = (s: string) => lista.filter((m) => m.situacao === s);

	if (estado === "vazio" || (abertas.length === 0 && visao !== "tabela")) {
		return (
			<Pagina>
				{cabecalho}
				<div className="rounded-lg border bg-card">{vazio}</div>
				<AbrirManutencao aberta={nova} aoFechar={() => setNova(false)} agora={agora} />
			</Pagina>
		);
	}

	if (ehCelular) {
		return (
			<Pagina>
				{cabecalho}
				<div className="flex flex-col gap-3">
					{SITUACOES_MANUTENCAO.map((s) => {
						const itens = daSituacao(s.id);
						const fechada = fechadas.has(s.id);
						return (
							<section key={s.id} className="flex flex-col gap-2" aria-label={`${s.nome}: ${itens.length}`}>
								<button
									type="button"
									data-alvo
									aria-expanded={!fechada}
									onClick={() =>
										setFechadas((x) => {
											const n = new Set(x);
											if (n.has(s.id)) n.delete(s.id);
											else n.add(s.id);
											return n;
										})
									}
									className="flex items-center justify-between gap-2 px-1 text-sm"
								>
									<span className="flex items-center gap-2">
										<PontoSituacao tom={TOM_SITUACAO[s.id]}>
											<span className="font-medium text-sm">{s.nome}</span>
										</PontoSituacao>
										<span className="text-muted-foreground tabular-nums">{itens.length}</span>
									</span>
									<Icon icon={ChevronDown} className={cn("size-4 text-muted-foreground transition-transform", !fechada && "rotate-180")} />
								</button>
								{!fechada
									? itens.length
										? itens.map((m) => <CartaoManutencao key={m.id} m={m} agora={agora} celular aoMover={(para) => pedir(m.id, para)} />)
										: <p className="px-1 text-muted-foreground text-xs">Nada aqui.</p>
									: null}
							</section>
						);
					})}
				</div>
				<AbrirManutencao aberta={nova} aoFechar={() => setNova(false)} agora={agora} />
				{janela}
			</Pagina>
		);
	}

	if (visao === "tabela") {
		const colunas: Coluna<D.Manutencao>[] = [
			{
				id: "unidade",
				header: "Unidade",
				label: "Unidade",
				hideable: false,
				sortable: true,
				width: "w-[22%]",
				cell: (m) => {
					const u = Q.unidade(m.unidadeId);
					return (
						<span className="flex min-w-0 items-center gap-2">
							<FotoEquipamento nome={Q.equipamento(u.equipamentoId).nome} tamanho={24} />
							<span className="flex min-w-0 flex-col">
								<span className="truncate font-medium">{Q.equipamento(u.equipamentoId).nome}</span>
								<Codigo className="text-muted-foreground">{u.codigo}</Codigo>
							</span>
						</span>
					);
				},
				exportar: (m) => Q.unidade(m.unidadeId).codigo,
			},
			{ id: "problema", header: "Problema", label: "Problema", width: "w-[24%]", cell: (m) => <span className="block truncate">{TIPOS_DANO[m.tipo]} · {m.problema}</span>, exportar: (m) => m.problema },
			{ id: "aberta", header: "Aberta em", label: "Aberta em", sortable: true, width: "w-[10%]", cell: (m) => <span className="tabular-nums">{dataCurta(m.abertaEm)}</span> },
			{ id: "situacao", header: "Situação", label: "Situação", sortable: true, width: "w-[13%]", cell: (m) => <PontoSituacao tom={TOM_SITUACAO[m.situacao]}>{nomeSituacao(m.situacao)}</PontoSituacao>, exportar: (m) => nomeSituacao(m.situacao) },
			{ id: "oficina", header: "Oficina", label: "Oficina", width: "w-[12%]", hideBelow: "lg", cell: (m) => m.oficina ?? <span className="text-muted-foreground">—</span> },
			...(podeVerFinanceiro
				? ([{ id: "custo", header: "Custo", label: "Custo", align: "right", sortable: true, width: "w-[9%]", cell: (m) => (m.custo != null ? <Dinheiro valor={m.custo} /> : <span className="text-muted-foreground">—</span>), exportar: (m) => (m.custo != null ? dinheiro(m.custo) : "") }] satisfies Coluna<D.Manutencao>[])
				: []),
			{ id: "previsao", header: "Previsão de volta", label: "Previsão de volta", width: "w-[10%]", hideBelow: "lg", cell: (m) => (m.previsaoVolta ? <span className="tabular-nums">{dataCurta(m.previsaoVolta)}</span> : <span className="text-muted-foreground">—</span>) },
		];
		return (
			<Pagina larga>
				{cabecalho}
				<TabelaLista<D.Manutencao>
					nome="manutencoes"
					linhas={lista}
					colunas={colunas}
					idDa={(m) => String(m.id)}
					placeholderBusca="Buscar etiqueta, equipamento ou problema…"
					config={{
						texto: (m) => `${Q.unidade(m.unidadeId).codigo} ${Q.equipamento(Q.unidade(m.unidadeId).equipamentoId).nome} ${m.problema} ${m.oficina ?? ""}`,
						ordenacoes: {
							unidade: (m) => Q.equipamento(Q.unidade(m.unidadeId).equipamentoId).nome,
							aberta: (m) => m.abertaEm.getTime(),
							situacao: (m) => SITUACOES_MANUTENCAO.findIndex((s) => s.id === m.situacao),
							custo: (m) => m.custo ?? 0,
						},
						ordemPadrao: { coluna: "aberta", direcao: "asc" },
						recortes: {
							id: "recorte",
							rotuloTodos: "Todas",
							padrao: "abertas",
							opcoes: [
								{ valor: "abertas", rotulo: "Abertas", filtro: (m) => !["liberada", "descartada"].includes(m.situacao) },
								{ valor: "liberadas", rotulo: "Liberadas", filtro: (m) => m.situacao === "liberada" },
								{ valor: "descartadas", rotulo: "Descartadas", filtro: (m) => m.situacao === "descartada" },
							],
						},
					}}
					aoClicar={(m) => abrir("manutencao", m.id)}
					rodape={({ total }) => `${total} ${total === 1 ? "manutenção" : "manutenções"}`}
					vazio={vazio}
					vazioComFiltro="Nenhuma manutenção com esses filtros."
				/>
				<AbrirManutencao aberta={nova} aoFechar={() => setNova(false)} agora={agora} />
				{janela}
			</Pagina>
		);
	}

	const colunas: ColunaQuadro[] = SITUACOES_MANUTENCAO.map((s) => ({
		id: s.id,
		nome: s.nome,
		titulo: s.nome,
		ponto: <span aria-hidden className={cn("inline-block size-1.5 shrink-0", s.id === "pronta" ? "bg-ok" : s.id === "na_oficina" ? "bg-info" : s.recolhida ? "bg-neutro" : "bg-atencao")} />,
		contagem: daSituacao(s.id).length,
		resumo: podeVerFinanceiro && !s.recolhida ? dinheiro(daSituacao(s.id).reduce((t, m) => t + (m.custo ?? 0), 0)) : undefined,
		recolhida: !!s.recolhida && !expandidas.has(s.id),
		vazia: "Nada aqui.",
	}));

	return (
		<Pagina larga>
			{cabecalho}
			<p className="text-muted-foreground text-xs">
				{abertas.length} {abertas.length === 1 ? "peça parada" : "peças paradas"}
				{abertas.length ? ` · a mais antiga há ${paradaHa(abertas[0], agora)}` : ""}
			</p>
			<Quadro<D.Manutencao>
				rotulo="Quadro de manutenção"
				colunas={colunas}
				itensDa={(id) => daSituacao(id)}
				idDe={(m) => String(m.id)}
				colunaDe={(m) => m.situacao}
				podeArrastar={!offline}
				aoSoltar={(m, para) => pedir(m.id, para as D.SituacaoManutencao)}
				aoExpandir={(id) =>
					setExpandidas((x) => {
						const n = new Set(x);
						n.add(id);
						return n;
					})
				}
				cartao={(m) => <CartaoManutencao m={m} agora={agora} aoMover={(para) => pedir(m.id, para)} />}
			/>
			<AbrirManutencao aberta={nova} aoFechar={() => setNova(false)} agora={agora} />
			{janela}
		</Pagina>
	);
}
