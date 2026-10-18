"use client";
// Adaptado de trycompai/crm (MIT): detail-sheet.tsx, record-stack e responsive-sheet.
// Todo registro abre aqui; a lista nunca troca de página. Até 3 fichas empilhadas.

import ArrowLeft from "@carbon/icons-react/es/ArrowLeft";
import Close from "@carbon/icons-react/es/Close";
import { Button } from "@/componentes/ui/button";
import { Icon, type CarbonIcon } from "@/componentes/ui/icon";
import { Separator } from "@/componentes/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/componentes/ui/folha-responsiva";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/componentes/ui/tabs";
import { EstadoVazio } from "@/componentes/ui/basicos";
import { useBusca, useNavegar, useCaminho } from "@/lib/navegacao";
import { cn } from "@/lib/utils";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from "react";

export const MARGEM_FICHA = "px-5";
export const TITULO_SECAO = "font-medium text-muted-foreground text-xs uppercase tracking-wider";

export type TipoFicha =
	| "reserva"
	| "cliente"
	| "equipamento"
	| "unidade"
	| "manutencao"
	| "kit"
	| "automacao"
	| "pagamento"
	| "contato";

export type ItemFicha = { tipo: TipoFicha; id: string };

function lerPilha(valor: string | null): ItemFicha[] {
	if (!valor) return [];
	return valor
		.split(",")
		.map((parte) => {
			const [tipo, id] = parte.split(":");
			return tipo && id ? { tipo: tipo as TipoFicha, id } : null;
		})
		.filter((x): x is ItemFicha => x !== null)
		.slice(-3);
}

function escreverPilha(pilha: ItemFicha[]): string | null {
	return pilha.length ? pilha.map((i) => `${i.tipo}:${i.id}`).join(",") : null;
}

export function useFicha() {
	const busca = useBusca();
	const caminho = useCaminho();
	const navegar = useNavegar();
	const pilha = lerPilha(busca.get("ficha"));
	const aba = busca.get("aba");

	const ir = useCallback(
		(nova: ItemFicha[], novaAba: string | null, substituir = false) => {
			const p = new URLSearchParams(busca.toString());
			const valor = escreverPilha(nova);
			if (valor) p.set("ficha", valor);
			else p.delete("ficha");
			if (novaAba) p.set("aba", novaAba);
			else p.delete("aba");
			const qs = p.toString();
			navegar(qs ? `${caminho}?${qs}` : caminho, { substituir });
		},
		[busca, caminho, navegar],
	);

	return {
		pilha,
		atual: pilha[pilha.length - 1] ?? null,
		aba,
		abrir: (tipo: TipoFicha, id: string | number, opcoes?: { empilhar?: boolean; aba?: string }) => {
			const item = { tipo, id: String(id) };
			const nova = opcoes?.empilhar ? [...pilha, item].slice(-3) : [item];
			ir(nova, opcoes?.aba ?? null);
		},
		trocar: (tipo: TipoFicha, id: string | number) => {
			const nova = [...pilha.slice(0, -1), { tipo, id: String(id) }];
			ir(nova, aba, true);
		},
		voltar: () => ir(pilha.slice(0, -1), null),
		fechar: () => ir([], null),
		definirAba: (valor: string) => ir(pilha, valor, true),
	};
}

export function hrefFicha(caminho: string, tipo: TipoFicha, id: string | number): string {
	return `${caminho}?ficha=${tipo}:${id}`;
}

/* ---------- Moldura ---------- */

const ContextoMoldura = createContext<{ aoFechar: () => void } | null>(null);

export function MolduraFicha({
	aberta,
	aoFechar,
	children,
	className,
}: {
	aberta: boolean;
	aoFechar: () => void;
	children: ReactNode;
	className?: string;
}) {
	const conteudo = useRef<HTMLDivElement>(null);
	return (
		<Sheet open={aberta} onOpenChange={(o) => !o && aoFechar()}>
			<SheetContent
				ref={conteudo}
				side="right"
				size="2xl"
				showCloseButton={false}
				onOpenAutoFocus={(e) => {
					e.preventDefault();
					conteudo.current?.focus();
				}}
				tabIndex={-1}
				className={cn("flex flex-col gap-0 p-0 outline-none", className)}
			>
				<ContextoMoldura.Provider value={{ aoFechar }}>{children}</ContextoMoldura.Provider>
			</SheetContent>
		</Sheet>
	);
}

export function CabecalhoFicha({
	foto,
	titulo,
	descricao,
	nota,
	acoes,
	trilha,
	aoVoltar,
}: {
	foto?: ReactNode;
	titulo: ReactNode;
	descricao?: ReactNode;
	nota?: ReactNode;
	acoes?: ReactNode;
	trilha?: ReactNode;
	aoVoltar?: () => void;
}) {
	const ctx = useContext(ContextoMoldura);
	return (
		<SheetHeader className={cn("gap-1 border-b py-3", MARGEM_FICHA)}>
			{aoVoltar || trilha ? (
				<div className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
					{aoVoltar ? (
						<Button variant="ghost" size="sm" onClick={aoVoltar} className="-ml-2">
							<Icon icon={ArrowLeft} data-icon="inline-start" />
							Voltar
						</Button>
					) : null}
					{trilha ? <span className="truncate">{trilha}</span> : null}
				</div>
			) : null}
			<div className="flex items-start gap-3">
				{foto}
				<div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
					<SheetTitle size="lg" className="wrap-anywhere text-left">
						{titulo}
					</SheetTitle>
					{descricao ? <SheetDescription className="wrap-anywhere text-left">{descricao}</SheetDescription> : null}
					{nota ? <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">{nota}</div> : null}
				</div>
				<div className="flex shrink-0 items-center gap-1">
					{acoes ? <div className="hidden items-center gap-1 sm:flex">{acoes}</div> : null}
					{acoes ? <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" /> : null}
					<Button variant="ghost" size="icon-sm" onClick={ctx?.aoFechar} aria-label="Fechar">
						<Icon icon={Close} />
					</Button>
				</div>
			</div>
			{acoes ? <div className="flex flex-wrap items-center gap-2 pt-1 sm:hidden">{acoes}</div> : null}
		</SheetHeader>
	);
}

export function NumerosFicha({ children }: { children: ReactNode }) {
	return (
		<dl className="grid shrink-0 grid-cols-2 border-b bg-muted/40 sm:flex sm:divide-x [&>*]:border-border max-sm:[&>*:nth-child(odd)]:border-r max-sm:[&>*:nth-child(-n+2)]:border-b">
			{children}
		</dl>
	);
}

export function NumeroFicha({ rotulo, children }: { rotulo: ReactNode; children: ReactNode }) {
	return (
		<div className={cn("flex min-w-0 flex-1 flex-col gap-1 py-2.5", MARGEM_FICHA)}>
			<dt className="truncate text-muted-foreground text-xs/5">{rotulo}</dt>
			<dd className="min-w-0 truncate font-medium text-foreground text-sm/5 tabular-nums">{children}</dd>
		</div>
	);
}

export type AbaFicha = { valor: string; rotulo: string; contagem?: number | null; conteudo: ReactNode };

export function AbasFicha({ abas, padrao }: { abas: AbaFicha[]; padrao?: string }) {
	const { aba, definirAba } = useFicha();
	const valores = abas.map((a) => a.valor);
	const atual = aba && valores.includes(aba) ? aba : (padrao ?? valores[0]);
	const faixa = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = faixa.current?.querySelector<HTMLElement>('[data-state="active"]');
		el?.scrollIntoView({ block: "nearest", inline: "nearest" });
	}, [atual]);
	return (
		<Tabs value={atual} onValueChange={definirAba} className="flex min-h-0 flex-1 flex-col gap-0">
			<div ref={faixa} className="shrink-0 overflow-x-auto border-b">
				<TabsList variant="line" className={cn("w-max min-w-full justify-start gap-6", MARGEM_FICHA)}>
					{abas.map((a) => (
						<TabsTrigger key={a.valor} value={a.valor}>
							{a.rotulo}
							{a.contagem ? <span className="text-muted-foreground tabular-nums">{a.contagem}</span> : null}
						</TabsTrigger>
					))}
				</TabsList>
			</div>
			{abas.map((a) => (
				<TabsContent
					key={a.valor}
					value={a.valor}
					className="flex min-h-0 flex-1 flex-col overflow-y-auto outline-none data-[state=inactive]:hidden"
				>
					{a.conteudo}
				</TabsContent>
			))}
		</Tabs>
	);
}

export function SecaoFicha({
	titulo,
	acao,
	className,
	children,
}: {
	titulo?: ReactNode;
	acao?: ReactNode;
	className?: string;
	children: ReactNode;
}) {
	return (
		<section className={cn("space-y-2 border-b py-3 last:border-b-0", MARGEM_FICHA, className)}>
			{titulo || acao ? (
				<div className="flex min-h-5 items-center justify-between gap-3">
					{titulo ? <h3 className={TITULO_SECAO}>{titulo}</h3> : <span />}
					{acao}
				</div>
			) : null}
			{children}
		</section>
	);
}

export function PropriedadesFicha({ children, colunas = 2 }: { children: ReactNode; colunas?: 1 | 2 }) {
	return <div className={cn("grid gap-x-8", colunas === 2 && "sm:grid-cols-2")}>{children}</div>;
}

export function PropriedadeFicha({ rotulo, larga = false, children }: { rotulo: ReactNode; larga?: boolean; children: ReactNode }) {
	return (
		<div className={cn("grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-2", larga && "sm:col-span-2")}>
			<span className="truncate border border-transparent py-1 text-muted-foreground text-xs/5">{rotulo}</span>
			<div className="min-w-0 border border-transparent px-2 py-1 text-xs/5">{children}</div>
		</div>
	);
}

export function VazioFicha({ icone, titulo, descricao, acao }: { icone: CarbonIcon; titulo: string; descricao: string; acao?: ReactNode }) {
	return <EstadoVazio icone={icone} titulo={titulo} descricao={descricao} acao={acao} className="flex-1" />;
}

/* ---------- Registro da lista atual (para ↑ ↓ com a ficha aberta) ---------- */

type ListaAtual = { tipo: TipoFicha; ids: string[] } | null;
const ContextoLista = createContext<{ lista: React.MutableRefObject<ListaAtual> } | null>(null);

export function ProvedorListaAtual({ children }: { children: ReactNode }) {
	const lista = useRef<ListaAtual>(null);
	const valor = useMemo(() => ({ lista }), []);
	return <ContextoLista.Provider value={valor}>{children}</ContextoLista.Provider>;
}

export function useRegistrarLista(tipo: TipoFicha, ids: string[]) {
	const ctx = useContext(ContextoLista);
	if (ctx) ctx.lista.current = { tipo, ids };
}

export function useListaAtual() {
	return useContext(ContextoLista)?.lista ?? null;
}
