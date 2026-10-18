"use client";
// 7.20 Alertas: todos os alertas abertos, inclusive os que o Hoje esconde por mostrar só um por reserva.

import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import { BotaoAcaoAlerta, useAbrirAlerta } from "@/componentes/atendimento/acoes-alerta";
import { CabecalhoPagina, Codigo, EstadoErro, EstadoVazio, Pagina } from "@/componentes/ui/basicos";
import { Icon } from "@/componentes/ui/icon";
import { TabelaLista, type Coluna, type Faceta } from "@/componentes/ui/tabela-lista";
import { useEstadoTela } from "@/lib/estado-prototipo";
import { relativa } from "@/lib/formatos";
import { usePapel } from "@/lib/papel";
import { TONS, type Tom } from "@/lib/regras/situacao";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import * as Q from "@/prototipo/consultas";
import { alertasResolvidos } from "@/prototipo/consultas-atendimento";
import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

type Linha = {
	chave: string;
	numero: number;
	bloco: Q.Bloco;
	frase: string;
	acao?: string;
	tom: Tom;
	desde: Date;
	resolvidoEm?: Date;
	comoResolveu?: string;
	reservaId?: number;
	clienteId?: number;
	unidadeId?: number;
	manutencaoId?: number;
	conversaId?: number;
	tarefaId?: number;
};

const NOME_BLOCO: Record<Q.Bloco, string> = { agora: "Agora", conferir: "Conferir", organizar: "Organizar" };
const NOME_TOM: Record<Tom, string> = { erro: "Urgente", atencao: "Atenção", info: "Para organizar", ok: "Ok", neutro: "Neutro" };

function blocoDoNumero(n: number): Q.Bloco {
	if (n <= 7) return "agora";
	if (n <= 13) return "conferir";
	return "organizar";
}

function registroDe(l: Linha): string {
	if (l.reservaId) return `Reserva ${l.reservaId}`;
	if (l.unidadeId) return Q.unidade(l.unidadeId).codigo;
	if (l.clienteId) return Q.cliente(l.clienteId).nome;
	if (l.manutencaoId) return `Manutenção ${l.manutencaoId}`;
	return "—";
}

export function TelaAlertas() {
	const agora = useAgora(30_000);
	const estado = useEstadoTela();
	const { ehDono } = usePapel();
	const abrirAlerta = useAbrirAlerta();
	const ehCelular = useIsMobile();
	const [tentou, setTentou] = useState(false);

	const linhas: Linha[] = useMemo(() => {
		if (estado === "vazio") return [];
		const abertos: Linha[] = Q.alertas(agora)
			.filter((a) => ehDono || (a.balcao && !a.financeiro))
			.map((a) => ({ ...a, chave: `a-${a.chave}` }));
		const limite = agora.getTime() - 30 * 86_400_000;
		const resolvidos: Linha[] = alertasResolvidos
			.filter((r) => (ehDono || (r.balcao && !r.financeiro)) && r.resolvidoEm.getTime() >= limite)
			.map((r) => ({ ...r, bloco: blocoDoNumero(r.numero), chave: `r-${r.chave}` }));
		return [...abertos, ...resolvidos];
	}, [agora, ehDono, estado]);

	const colunas: Coluna<Linha>[] = [
		{
			id: "tipo",
			header: "Tipo",
			label: "Tipo",
			hideable: false,
			width: "w-16",
			cell: (l) => (
				<span className="flex items-center" title={NOME_TOM[l.tom]}>
					<Icon icon={l.resolvidoEm ? CheckmarkOutline : TONS[l.tom].icone} motion="none" className={cn("size-4", l.resolvidoEm ? "text-muted-foreground" : TONS[l.tom].texto)} />
					<span className="sr-only">{l.resolvidoEm ? "Resolvido" : NOME_TOM[l.tom]}</span>
				</span>
			),
		},
		{
			id: "frase",
			header: "Alerta",
			label: "Alerta",
			sortable: true,
			hideable: false,
			width: "w-[40%]",
			cell: (l) => (
				<span className="flex min-w-0 flex-col">
					<span className="truncate font-medium">{l.frase}</span>
					{l.comoResolveu ? <span className="truncate text-muted-foreground">{l.comoResolveu}</span> : null}
				</span>
			),
			exportar: (l) => l.frase,
		},
		{
			id: "registro",
			header: "Registro",
			label: "Registro",
			width: "w-[18%]",
			hideBelow: "md",
			cell: (l) => <Codigo className="font-sans">{registroDe(l)}</Codigo>,
			exportar: (l) => registroDe(l),
		},
		{
			id: "desde",
			header: "Desde",
			label: "Desde",
			sortable: true,
			width: "w-[14%]",
			hideBelow: "md",
			cell: (l) => (
				<span className="text-muted-foreground">
					{l.resolvidoEm ? `resolvido ${relativa(l.resolvidoEm, agora)}` : relativa(l.desde, agora)}
				</span>
			),
			exportar: (l) => relativa(l.desde, agora),
		},
		{
			id: "acao",
			header: "Ação",
			label: "Ação",
			hideable: false,
			align: "right",
			width: "w-[22%]",
			cell: (l) => (l.acao && !l.resolvidoEm ? <BotaoAcaoAlerta alerta={{ ...l, acao: l.acao }} tamanho="xs" /> : null),
		},
	];

	const facetas: Faceta<Linha>[] = [
		{ id: "bloco", rotulo: "Tipo", valor: (l) => l.bloco, opcoes: (Object.keys(NOME_BLOCO) as Q.Bloco[]).map((b) => ({ valor: b, rotulo: NOME_BLOCO[b] })) },
		{ id: "gravidade", rotulo: "Gravidade", valor: (l) => l.tom, opcoes: (["erro", "atencao", "info"] as Tom[]).map((t) => ({ valor: t, rotulo: NOME_TOM[t] })) },
	];

	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Alertas"
				descricao={
					ehDono
						? "Todos os alertas abertos, inclusive os que o Hoje esconde por mostrar só um por reserva. Somem sozinhos quando a causa acaba."
						: "Os alertas do balcão. Somem sozinhos quando a causa acaba."
				}
			/>
			{estado === "erro" && !tentou ? (
				<div className="rounded-lg border bg-card">
					<EstadoErro frase="Não consegui carregar os alertas." aoTentar={() => setTentou(true)} />
				</div>
			) : (
				<TabelaLista<Linha>
					nome="alertas"
					linhas={linhas}
					colunas={colunas}
					idDa={(l) => l.chave}
					carregando={estado === "carregando"}
					config={{
						texto: (l) => `${l.frase} ${registroDe(l)}`,
						ordenacoes: { frase: (l) => l.frase, desde: (l) => l.desde.getTime() },
						ordemPadrao: { coluna: "", direcao: "asc" },
						porPagina: 50,
						recortes: {
							id: "recorte",
							rotuloTodos: "Abertos e resolvidos",
							padrao: "abertos",
							opcoes: [
								{ valor: "abertos", rotulo: "Abertos", filtro: (l) => !l.resolvidoEm },
								{ valor: "resolvidos", rotulo: "Resolvidos (30 dias)", filtro: (l) => !!l.resolvidoEm },
							],
						},
					}}
					facetas={facetas}
					podeExportar={ehDono}
					placeholderBusca="Buscar alerta ou reserva…"
					aoClicar={ehCelular ? undefined : (l) => abrirAlerta(l)}
					rodape={({ total }) => `${total} ${total === 1 ? "alerta" : "alertas"}`}
					vazio={<EstadoVazio icone={CheckmarkOutline} titulo="Nenhum alerta aberto." descricao="Quando algo precisar de atenção, aparece aqui e no Hoje." />}
					vazioComFiltro="Nenhum alerta com esses filtros."
					celular={(l) => (
						<>
							<button type="button" data-alvo onClick={() => abrirAlerta(l)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
								<Icon icon={l.resolvidoEm ? CheckmarkOutline : TONS[l.tom].icone} motion="none" className={cn("mt-0.5 size-4 shrink-0", l.resolvidoEm ? "text-muted-foreground" : TONS[l.tom].texto)} />
								<span className="flex min-w-0 flex-1 flex-col gap-0.5">
									<span className="font-medium text-sm">{l.frase}</span>
									<span className="text-muted-foreground text-xs">
										{registroDe(l)} · {l.resolvidoEm ? `resolvido ${relativa(l.resolvidoEm, agora)}` : relativa(l.desde, agora)}
									</span>
								</span>
							</button>
							{l.acao && !l.resolvidoEm ? <BotaoAcaoAlerta alerta={{ ...l, acao: l.acao }} tamanho="sm" className="shrink-0" /> : null}
						</>
					)}
				/>
			)}
		</Pagina>
	);
}
