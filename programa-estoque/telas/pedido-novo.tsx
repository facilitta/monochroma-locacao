"use client";
// 7.16 Montador de pedido: monta a reserva com preço calculado pelo banco (calcular_preco), vendo o que está livre.

import { CampoDataHora } from "@/componentes/ui/campo-data";
import Add from "@carbon/icons-react/es/Add";
import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import ChevronDown from "@carbon/icons-react/es/ChevronDown";
import Locked from "@carbon/icons-react/es/Locked";
import PlayFilledAlt from "@carbon/icons-react/es/PlayFilledAlt";
import Search from "@carbon/icons-react/es/Search";
import SendAlt from "@carbon/icons-react/es/SendAlt";
import Subtract from "@carbon/icons-react/es/Subtract";
import TrashCan from "@carbon/icons-react/es/TrashCan";
import WarningAlt from "@carbon/icons-react/es/WarningAlt";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, ContadorRegressivo, EstadoErro, EsqueletoLinhas, FotoCliente, FotoEquipamento, Pagina, TituloSecao } from "@/componentes/ui/basicos";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/componentes/ui/command";
import { Icon } from "@/componentes/ui/icon";
import { Label } from "@/componentes/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/componentes/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { Switch } from "@/componentes/ui/switch";
import { Selo } from "@/componentes/ui/marcadores";
import { useFicha } from "@/componentes/ui/ficha";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { useBusca } from "@/lib/navegacao";
import { useAgora } from "@/lib/relogio";
import { traduzir } from "@/lib/regras/respostas";
import { HORA, diaEHora, dinheiro, semAcento } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { criarReservaDoMontador, useVersaoDados } from "@/prototipo/consultas-reservas";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Item = { equipamentoId: number; quantidade: number; kitId?: number };

function paraCampo(d: Date): string {
	return new Date(d.getTime() - 3 * HORA).toISOString().slice(0, 16);
}
function deCampo(v: string): Date {
	return new Date(`${v}:00-03:00`);
}

const RETIRADA_PADRAO = D.em(23, 14);
const DEVOLUCAO_PADRAO = D.em(26, 10);

function somar(lista: Item[], equipamentoId: number, delta: number, kitId?: number): Item[] {
	const i = lista.findIndex((x) => x.equipamentoId === equipamentoId && x.kitId === kitId);
	if (i < 0) return delta > 0 ? [...lista, { equipamentoId, quantidade: delta, kitId }] : lista;
	const nova = [...lista];
	const q = nova[i].quantidade + delta;
	if (q <= 0) nova.splice(i, 1);
	else nova[i] = { ...nova[i], quantidade: q };
	return nova;
}

function modeloDoPedido(diarias: number, foraDoRj: boolean, somaReposicao: number) {
	const alto = D.configuracoesExemplo.valorAltoValor;
	const ehAlto = alto != null && somaReposicao > alto;
	if (ehAlto && foraDoRj) return { modelo: "OL-Alto valor", motivo: "Alto valor e viagem: a equipe aprova antes do envio.", aprovacao: true };
	if (ehAlto) return { modelo: "OL-Alto valor", motivo: "Soma acima do limite de alto valor.", aprovacao: false };
	if (foraDoRj) return { modelo: "OL-Viagem", motivo: "Uso fora do estado do RJ.", aprovacao: false };
	if (diarias >= 7) return { modelo: "OL-Longo", motivo: `${diarias} diárias (7 ou mais).`, aprovacao: false };
	return { modelo: "OL-Padrão", motivo: "Aluguel comum.", aprovacao: false };
}

/* ---------------------------------------------------------------- partes */

function Passo({ numero, titulo, children, aviso }: { numero: number; titulo: string; children: ReactNode; aviso?: ReactNode }) {
	return (
		<section className="flex flex-col gap-3 rounded-lg border bg-card p-4" aria-label={`${numero} ${titulo}`}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<TituloSecao>
					<span className="tabular-nums">{numero}</span> {titulo}
				</TituloSecao>
				{aviso}
			</div>
			{children}
		</section>
	);
}

function SeletorCliente({ clienteId, aoEscolher }: { clienteId: number | null; aoEscolher: (id: number) => void }) {
	const [aberto, setAberto] = useState(false);
	const c = clienteId ? Q.cliente(clienteId) : null;
	return (
		<Popover open={aberto} onOpenChange={setAberto}>
			<PopoverTrigger asChild>
				<Button variant="outline" className="w-full justify-between sm:w-80" aria-label="Cliente">
					<span className="flex min-w-0 items-center gap-2">
						{c ? <FotoCliente nome={c.nome} /> : null}
						<span className="truncate">{c ? c.nome : "Escolha o cliente"}</span>
					</span>
					<Icon icon={ChevronDown} className="shrink-0 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[min(360px,calc(100vw-2rem))] p-0">
				<Command>
					<CommandInput placeholder="Buscar nome ou telefone…" />
					<CommandList>
						<CommandEmpty>Nenhum cliente com esse nome.</CommandEmpty>
						<CommandGroup heading="Clientes">
							{D.clientes
								.filter((x) => x.cadastro !== "recusado" && !x.arquivadoEm)
								.map((x) => (
									<CommandItem
										key={x.id}
										value={`${x.nome} ${x.telefone}`}
										disabled={x.cadastro === "bloqueado"}
										onSelect={() => {
											aoEscolher(x.id);
											setAberto(false);
										}}
									>
										<FotoCliente nome={x.nome} />
										<span className="flex-1 truncate">{x.nome}</span>
										{x.cadastro === "aguardando" ? <span className="text-atencao text-2xs">aguardando aprovação</span> : null}
										{x.cadastro === "bloqueado" ? <span className="text-erro text-2xs">bloqueado</span> : null}
									</CommandItem>
								))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

/* ---------------------------------------------------------------- tela */

export function TelaPedidoNovo() {
	useVersaoDados();
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const ehCelular = useIsMobile();
	const busca = useBusca();
	const { abrir } = useFicha();

	const [clienteId, setClienteId] = useState<number | null>(null);
	const [contatoId, setContatoId] = useState<number | undefined>(undefined);
	const [retirada, setRetirada] = useState(paraCampo(RETIRADA_PADRAO));
	const [devolucao, setDevolucao] = useState(paraCampo(DEVOLUCAO_PADRAO));
	const [foraDoRj, setForaDoRj] = useState(false);
	const [itens, setItens] = useState<Item[]>([]);
	const [extras, setExtras] = useState<Item[]>([]);
	const [termo, setTermo] = useState("");
	const [calculando, setCalculando] = useState(false);
	const [passo, setPasso] = useState(1);
	const [feito, setFeito] = useState<{ id: number; expiraEm?: Date; orcamento: boolean } | null>(null);
	const [preenchido, setPreenchido] = useState(false);

	useEffect(() => {
		if (preenchido) return;
		setPreenchido(true);
		const conversaId = Number(busca.get("conversa"));
		const conversa = conversaId ? D.conversas.find((c) => c.id === conversaId) : undefined;
		if (conversa?.clienteId) setClienteId(conversa.clienteId);
		if (conversa?.resumoRobo?.itens) setItens(conversa.resumoRobo.itens.map((i) => ({ ...i })));
		if (conversa?.resumoRobo?.retirada) setRetirada(paraCampo(conversa.resumoRobo.retirada));
		if (conversa?.resumoRobo?.devolucao) setDevolucao(paraCampo(conversa.resumoRobo.devolucao));
		const cid = Number(busca.get("cliente"));
		if (cid && D.clientes.some((c) => c.id === cid)) setClienteId(cid);
		const eid = Number(busca.get("equipamento"));
		if (eid && D.equipamentos.some((e) => e.id === eid)) setItens((l) => (l.some((x) => x.equipamentoId === eid) ? l : [...l, { equipamentoId: eid, quantidade: 1 }]));
		const r = busca.get("retirada");
		const d = busca.get("devolucao");
		if (r && !Number.isNaN(new Date(r).getTime())) setRetirada(paraCampo(new Date(r)));
		if (d && !Number.isNaN(new Date(d).getTime())) setDevolucao(paraCampo(new Date(d)));
	}, [busca, preenchido]);

	const ret = deCampo(retirada);
	const dev = deCampo(devolucao);
	const periodoValido = !Number.isNaN(ret.getTime()) && !Number.isNaN(dev.getTime()) && dev.getTime() > ret.getTime();
	const retiradaFora = periodoValido && !Q.dentroDoHorario(ret);
	const devolucaoFora = periodoValido && !Q.dentroDoHorario(dev);
	const cliente = clienteId ? Q.cliente(clienteId) : null;
	const contatos = cliente ? Q.contatosDo(cliente.id).filter((c) => c.podeRetirar) : [];

	// Pacote básico acrescentado sozinho, a partir dos itens principais.
	const basicos = useMemo(() => {
		const m = new Map<number, { quantidade: number; de: string }>();
		for (const it of itens) {
			for (const ao of D.acessoriosObrigatorios.filter((a) => a.equipamentoId === it.equipamentoId)) {
				const atual = m.get(ao.acessorioId);
				m.set(ao.acessorioId, { quantidade: (atual?.quantidade ?? 0) + ao.quantidade * it.quantidade, de: atual ? `${atual.de}, ${Q.equipamento(it.equipamentoId).nome}` : Q.equipamento(it.equipamentoId).nome });
			}
		}
		return [...m.entries()].map(([equipamentoId, v]) => ({ equipamentoId, quantidade: v.quantidade, de: v.de }));
	}, [itens]);

	const linhas = useMemo(
		() => [
			...itens.map((i) => ({ equipamentoId: i.equipamentoId, quantidade: i.quantidade, tipo: "equipamento" as const, kitId: i.kitId })),
			...basicos.map((b) => ({ equipamentoId: b.equipamentoId, quantidade: b.quantidade, tipo: "basico" as const })),
			...extras.map((e) => ({ equipamentoId: e.equipamentoId, quantidade: e.quantidade, tipo: "extra" as const })),
		],
		[itens, basicos, extras],
	);

	const chaveCalculo = JSON.stringify([linhas, retirada, devolucao]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: recalcula quando o pedido muda
	useEffect(() => {
		setCalculando(true);
		const t = window.setTimeout(() => setCalculando(false), 350);
		return () => window.clearTimeout(t);
	}, [chaveCalculo]);

	const preco = periodoValido && linhas.length ? Q.calcularPreco(linhas, ret, dev) : null;
	const somaReposicao = linhas.reduce((s, l) => s + Q.equipamento(l.equipamentoId).valorReposicao * l.quantidade, 0);
	const modelo = modeloDoPedido(preco?.diarias ?? 1, foraDoRj, somaReposicao);

	const noPedido = (eq: number) => linhas.filter((l) => l.equipamentoId === eq).reduce((s, l) => s + l.quantidade, 0);
	const livres = (eq: number) => (periodoValido ? Q.disponibilidade(eq, ret, dev, agora) : 0);
	const faltando = periodoValido ? [...new Set(linhas.map((l) => l.equipamentoId))].filter((eq) => noPedido(eq) > livres(eq)) : [];

	const resultadosBusca = useMemo(() => {
		const t = semAcento(termo).trim();
		const eqs = D.equipamentos.filter((e) => e.ativo && e.categoria !== "acessorio" && (!t || semAcento(`${e.nome} ${e.marca} ${e.modelo}`).includes(t)));
		const ks = D.kits.filter((k) => k.ativo && (!t || semAcento(k.nome).includes(t)));
		return { eqs: eqs.slice(0, t ? 12 : 8), ks };
	}, [termo]);

	const camerasNoPedido = itens.filter((i) => Q.equipamento(i.equipamentoId).categoria === "camera").map((i) => i.equipamentoId);
	const lentesNoPedido = itens.filter((i) => Q.equipamento(i.equipamentoId).categoria === "lente").map((i) => i.equipamentoId);
	const videos = D.combinacoes.filter((c) => camerasNoPedido.includes(c.cameraId) && lentesNoPedido.includes(c.lenteId));
	const extrasPossiveis = D.acessoriosExtras.filter((x) => itens.some((i) => i.equipamentoId === x.equipamentoId));

	const podeEnviar = !!cliente && !!preco && !retiradaFora && !devolucaoFora && faltando.length === 0 && !calculando && !offline && !feito && cliente.cadastro !== "bloqueado";
	const motivoBloqueio = !cliente
		? "Escolha o cliente."
		: !periodoValido
			? "A devolução precisa ser depois da retirada."
			: retiradaFora || devolucaoFora
				? traduzir("FORA_DO_HORARIO").frase
				: linhas.length === 0
					? "Escolha pelo menos um item."
					: faltando.length
						? traduzir(`INDISPONIVEL:${faltando[0]}`).frase
						: offline
							? "Volta quando a internet voltar."
							: null;

	const enviar = (comoOrcamento: boolean) => {
		if (!cliente || !preco) return;
		const r = criarReservaDoMontador({ clienteId: cliente.id, contatoId, retirada: ret, devolucao: dev, foraDoRj, linhas }, !comoOrcamento, agora);
		if (comoOrcamento) {
			setFeito({ id: r.id, orcamento: true });
			toast.success(`Orçamento ${r.id} salvo`, { action: { label: "Abrir", onClick: () => abrir("reserva", r.id) } });
			return;
		}
		if (r.resposta && !r.resposta.ok) {
			const t = traduzir(r.resposta.codigo);
			toast.error(t.frase, { description: t.acao });
			return;
		}
		setFeito({ id: r.id, expiraEm: r.resposta && r.resposta.ok ? r.resposta.expiraEm : undefined, orcamento: false });
		toast.success(`Reserva ${r.id} pré-reservada. Ordem enviada com os três links.`);
	};

	if (estado === "carregando") {
		return (
			<Pagina>
				<CabecalhoPagina titulo="Novo pedido" descricao="Monte a reserva com o preço calculado pelo banco." />
				<EsqueletoLinhas linhas={6} />
			</Pagina>
		);
	}
	if (estado === "erro") {
		return (
			<Pagina>
				<CabecalhoPagina titulo="Novo pedido" />
				<div className="rounded-lg border bg-card">
					<EstadoErro frase="Não consegui carregar o catálogo." aoTentar={() => window.location.reload()} />
				</div>
			</Pagina>
		);
	}

	/* ---------------- blocos ---------------- */

	const blocoCliente = (
		<Passo
			numero={1}
			titulo="Cliente"
			aviso={cliente?.cadastro === "aguardando" ? <Selo tom="atencao">Cadastro aguardando aprovação</Selo> : cliente?.cadastro === "aprovado" ? <Selo tom="ok">Cadastro aprovado</Selo> : null}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				<div className="flex flex-col gap-1.5">
					<span className="font-medium text-xs">Quem aluga</span>
					<SeletorCliente
						clienteId={clienteId}
						aoEscolher={(id) => {
							setClienteId(id);
							setContatoId(undefined);
						}}
					/>
				</div>
				{contatos.length ? (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="contato">Contato que retira</Label>
						<Select value={contatoId ? String(contatoId) : undefined} onValueChange={(v) => setContatoId(Number(v))}>
							<SelectTrigger id="contato" className="w-full sm:w-56">
								<SelectValue placeholder="Escolha o contato" />
							</SelectTrigger>
							<SelectContent>
								{contatos.map((ct) => (
									<SelectItem key={ct.id} value={String(ct.id)}>
										{ct.nome} · {ct.funcao}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				) : null}
			</div>
			{cliente?.cadastro === "aguardando" ? (
				<p className="text-muted-foreground text-xs">O primeiro cadastro passa pela aprovação do dono. A peça só sai do balcão depois de aprovado.</p>
			) : null}
		</Passo>
	);

	const blocoPeriodo = (
		<Passo
			numero={2}
			titulo="Período"
			aviso={
				periodoValido && !retiradaFora && !devolucaoFora ? (
					<span className="flex items-center gap-1 text-ok text-xs">
						<Icon icon={CheckmarkOutline} className="size-3.5" />
						Horário do balcão
					</span>
				) : null
			}
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="retirada">Retirada</Label>
					<CampoDataHora semPassado id="retirada" rotulo="Retirada" valor={retirada} aoMudar={setRetirada} invalido={retiradaFora} desativado={!!feito} />
					{retiradaFora ? <p className="text-erro text-xs">Fora do horário do balcão (seg a sex 9h–18h, sáb 9h–13h).</p> : null}
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="devolucao">Devolução</Label>
					<CampoDataHora semPassado id="devolucao" rotulo="Devolução" valor={devolucao} aoMudar={setDevolucao} invalido={devolucaoFora || !periodoValido} desativado={!!feito} />
					{devolucaoFora ? <p className="text-erro text-xs">Fora do horário do balcão (seg a sex 9h–18h, sáb 9h–13h).</p> : null}
					{!periodoValido ? <p className="text-erro text-xs">A devolução precisa ser depois da retirada.</p> : null}
				</div>
			</div>
			<label className="flex items-center gap-2 text-xs" data-alvo>
				<Switch checked={foraDoRj} onCheckedChange={setForaDoRj} disabled={!!feito} />
				Uso fora do estado do Rio de Janeiro
			</label>
			<p className="text-muted-foreground text-xs">
				Exemplo: sex 14h a seg 10h = 68 h = 3 diárias. Cada dia conta, com 60 minutos de tolerância na devolução.
			</p>
		</Passo>
	);

	const blocoItens = (
		<Passo numero={3} titulo="Itens">
			{itens.length === 0 ? (
				<p className="text-muted-foreground text-xs">Escolha o período e depois os itens. Só aparece o que estiver livre.</p>
			) : (
				<ul className="flex flex-col divide-y rounded-lg border">
					{itens.map((it) => {
						const e = Q.equipamento(it.equipamentoId);
						const falta = faltando.includes(it.equipamentoId);
						return (
							<li key={`${it.equipamentoId}-${it.kitId ?? ""}`} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
								<FotoEquipamento nome={e.nome} />
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="font-medium">{e.nome}</span>
									<span className={cn("text-muted-foreground", falta && "text-erro")}>
										{it.kitId ? `${Q.kit(it.kitId).nome} · ` : ""}
										{falta ? "Não há unidades livres suficientes no período" : `${livres(it.equipamentoId)} livres no período`}
									</span>
								</span>
								<div className="flex items-center gap-1">
									<Button variant="outline" size="icon-sm" aria-label={`Tirar uma ${e.nome}`} disabled={!!feito} onClick={() => setItens((l) => somar(l, it.equipamentoId, -1, it.kitId))}>
										<Icon icon={it.quantidade > 1 ? Subtract : TrashCan} />
									</Button>
									<span className="w-6 text-center tabular-nums">{it.quantidade}</span>
									<Button
										variant="outline"
										size="icon-sm"
										aria-label={`Mais uma ${e.nome}`}
										disabled={!!feito || noPedido(it.equipamentoId) >= livres(it.equipamentoId)}
										onClick={() => setItens((l) => somar(l, it.equipamentoId, 1, it.kitId))}
									>
										<Icon icon={Add} />
									</Button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
			{!feito ? (
				<>
					<label className="relative flex h-8 items-center rounded-md border border-input bg-background shadow-campo focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 dark:bg-muted">
						<Icon icon={Search} className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
						<span className="sr-only">Buscar equipamento ou kit</span>
						<input
							type="search"
							value={termo}
							onChange={(e) => setTermo(e.target.value)}
							placeholder="Buscar equipamento ou kit…"
							className="h-full w-full bg-transparent pr-2.5 pl-8 text-xs outline-none placeholder:text-muted-foreground"
						/>
					</label>
					<ul className="flex flex-col divide-y rounded-lg border">
						{resultadosBusca.ks.map((k) => {
							const mont = periodoValido ? Q.montaveisDoKit(k.id, ret, dev, agora) : { montaveis: 0 };
							return (
								<li key={`k${k.id}`} aria-disabled={mont.montaveis === 0 || undefined} className={cn("flex items-center gap-2 px-3 py-2 text-xs", mont.montaveis === 0 && "bg-muted/60")}>
									<FotoEquipamento nome={k.nome} />
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="font-medium">{k.nome}</span>
										<span className="text-muted-foreground">{k.componentes.map((c) => `${c.quantidade} × ${Q.equipamento(c.equipamentoId).nome}`).join(", ")}</span>
									</span>
									{mont.montaveis === 0 ? (
										<span className="flex items-center gap-1 text-atencao">
											<Icon icon={WarningAlt} className="size-3.5" />
											{mont.falta ?? "Nenhum kit livre"}
										</span>
									) : (
										<span className="text-muted-foreground tabular-nums">{mont.montaveis} {mont.montaveis === 1 ? "livre" : "livres"}</span>
									)}
									<Button
										variant="outline"
										size="icon-sm"
										aria-label={`Acrescentar ${k.nome}`}
										disabled={mont.montaveis === 0}
										onClick={() => setItens((l) => k.componentes.reduce((acc, c) => somar(acc, c.equipamentoId, c.quantidade, k.id), l))}
									>
										<Icon icon={Add} />
									</Button>
								</li>
							);
						})}
						{resultadosBusca.eqs.map((e) => {
							const n = livres(e.id) - noPedido(e.id);
							const proxima = periodoValido && n <= 0 ? Q.proximaDataLivre(e.id, ret, dev.getTime() - ret.getTime(), agora) : null;
							return (
								<li key={e.id} aria-disabled={n <= 0 || undefined} className={cn("flex items-center gap-2 px-3 py-2 text-xs", n <= 0 && "bg-muted/60")}>
									<FotoEquipamento nome={e.nome} />
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="font-medium">{e.nome}</span>
										<span className="text-muted-foreground">
											{e.marca} · {e.modelo}
										</span>
									</span>
									<span className={cn("text-right", n > 0 ? "text-muted-foreground" : "text-atencao")}>
										{n > 0 ? `${n} ${n === 1 ? "livre" : "livres"} no período` : proxima ? `Ocupada · livre a partir de ${diaEHora(proxima)}` : "Ocupada"}
									</span>
									<Button variant="outline" size="icon-sm" aria-label={`Acrescentar ${e.nome}`} disabled={n <= 0} onClick={() => setItens((l) => somar(l, e.id, 1))}>
										<Icon icon={Add} />
									</Button>
								</li>
							);
						})}
					</ul>
				</>
			) : null}
			{videos.length ? (
				<div className="flex flex-wrap gap-2">
					{videos.map((v) =>
						v.videoUrl ? (
							<a key={v.id} href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted" data-alvo>
								<Icon icon={PlayFilledAlt} className="size-3.5" />
								Vídeo de teste {Q.equipamento(v.cameraId).nome} + {Q.equipamento(v.lenteId).nome}
							</a>
						) : (
							<span key={v.id} className="text-muted-foreground text-xs">
								Sem vídeo de {Q.equipamento(v.cameraId).nome} + {Q.equipamento(v.lenteId).nome}: o robô diz que não tem.
							</span>
						),
					)}
				</div>
			) : null}
			{extrasPossiveis.length ? (
				<div className="flex flex-col gap-2">
					<TituloSecao>Extras (cobrados à parte)</TituloSecao>
					<div className="flex flex-wrap gap-2">
						{extrasPossiveis.map((x) => {
							const a = Q.equipamento(x.acessorioId);
							const qtd = extras.find((e) => e.equipamentoId === x.acessorioId)?.quantidade ?? 0;
							const n = livres(a.id) - noPedido(a.id);
							return (
								<span key={`${x.equipamentoId}-${x.acessorioId}`} className="inline-flex items-center gap-1 rounded-md border pl-2.5 text-xs">
									{a.nome} a mais · {dinheiro(a.precoDiaria)} por diária
									{qtd ? <span className="tabular-nums font-medium">× {qtd}</span> : null}
									{qtd ? (
										<Button variant="ghost" size="icon-sm" aria-label={`Tirar ${a.nome} extra`} disabled={!!feito} onClick={() => setExtras((l) => somar(l, a.id, -1))}>
											<Icon icon={Subtract} />
										</Button>
									) : null}
									<Button variant="ghost" size="icon-sm" aria-label={`Acrescentar ${a.nome} extra`} disabled={!!feito || n <= 0} onClick={() => setExtras((l) => somar(l, a.id, 1))}>
										<Icon icon={Add} />
									</Button>
								</span>
							);
						})}
					</div>
				</div>
			) : null}
		</Passo>
	);

	const blocoResumo = (
		<section className="flex flex-col gap-3 rounded-lg border bg-card p-4 lg:sticky lg:top-0" aria-label="Resumo calculado no banco">
			<TituloSecao>Resumo (calculado no banco)</TituloSecao>
			{!preco ? (
				<p className="text-muted-foreground text-xs">Os valores aparecem depois de escolher o período e os itens.</p>
			) : calculando ? (
				<p className="text-muted-foreground text-xs" aria-live="polite">
					Calculando…
				</p>
			) : (
				<>
					<ul className="flex flex-col gap-1.5 text-xs">
						{preco.linhas.map((l) => (
							<li key={`${l.tipo}-${l.equipamentoId}-${l.kitId ?? ""}`} className="flex items-baseline justify-between gap-3">
								<span className={cn("flex min-w-0 items-center gap-1.5", l.tipo === "basico" && "text-muted-foreground")}>
									{l.tipo === "basico" ? <Icon icon={Locked} className="size-3.5 shrink-0" /> : null}
									<span className="truncate" title={l.tipo === "basico" ? `Sai sempre com ${basicos.find((b) => b.equipamentoId === l.equipamentoId)?.de}` : undefined}>
										{l.tipo === "extra" ? "+ " : ""}
										{l.quantidade > 1 ? `${l.quantidade} × ` : ""}
										{l.nome}
										{l.tipo === "basico" ? " (pacote básico)" : l.tipo === "extra" ? " extra" : ""}
									</span>
								</span>
								<span className="shrink-0 tabular-nums">{l.tipo === "basico" ? "incluso" : dinheiro(l.subtotal)}</span>
							</li>
						))}
					</ul>
					<dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t pt-3 text-xs">
						<dt className="text-muted-foreground">Período reservado</dt>
						<dd className="text-right tabular-nums">
							{diaEHora(ret)} → {diaEHora(dev)}
						</dd>
						<dt className="text-muted-foreground">Período cobrado</dt>
						<dd className="text-right tabular-nums">{preco.regra}</dd>
						<dt className="col-span-2 text-muted-foreground">Cada dia conta; o fim de semana não vira diária única.</dt>
					</dl>
					<dl className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1.5 border-t pt-3 text-xs">
						<dt>
							<span className="font-medium">Aluguel</span>
							<span className="block text-muted-foreground">link: Pix ou cartão</span>
						</dt>
						<dd className="text-right font-medium text-base tabular-nums">{dinheiro(preco.valorAluguel)}</dd>
						<dt>
							<span className="font-medium">Caução</span>
							<span className="block text-muted-foreground">link separado: só Pix · valor de exemplo, a definir</span>
						</dt>
						<dd className="text-right tabular-nums">{dinheiro(preco.valorCaucao)}</dd>
					</dl>
					<div className="flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
						<span className="text-muted-foreground">Modelo:</span>
						<Selo tom={modelo.aprovacao ? "atencao" : "neutro"}>{modelo.modelo}</Selo>
						<span className="text-muted-foreground">{modelo.motivo}</span>
					</div>
				</>
			)}
			{feito ? (
				<div className="flex flex-col gap-2 rounded-md bg-muted p-3 text-xs">
					{feito.orcamento ? (
						<span>Orçamento {feito.id} salvo. Ele não segura peça.</span>
					) : (
						<span className="flex flex-wrap items-center gap-2">
							Pré-reservado · expira em {feito.expiraEm ? <ContadorRegressivo expiraEm={feito.expiraEm} /> : null}
						</span>
					)}
					<Button variant="outline" size="sm" onClick={() => abrir("reserva", feito.id)}>
						Abrir a reserva {feito.id}
					</Button>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{motivoBloqueio ? <p className="text-muted-foreground text-xs">{motivoBloqueio}</p> : null}
					<Button variant="outline" disabled={!cliente || !preco || offline} onClick={() => enviar(true)}>
						Salvar orçamento
					</Button>
					<Button disabled={!podeEnviar} onClick={() => enviar(false)} className={cn(ehCelular && "h-12 text-base")}>
						<Icon icon={SendAlt} data-icon="inline-start" />
						Pré-reservar e enviar ordem
					</Button>
				</div>
			)}
		</section>
	);

	/* ---------------- celular: um passo por tela ---------------- */
	if (ehCelular) {
		const nomes = ["Cliente", "Período", "Itens", "Resumo"];
		return (
			<Pagina>
				<CabecalhoPagina titulo="Novo pedido" descricao={`Passo ${passo} de 4 · ${nomes[passo - 1]}`} />
				<ol className="flex gap-1" aria-label="Passos">
					{nomes.map((n, i) => (
						<li key={n} className={cn("h-1 flex-1 rounded-full", i < passo ? "bg-foreground" : "bg-border")} aria-current={i + 1 === passo ? "step" : undefined}>
							<span className="sr-only">{n}</span>
						</li>
					))}
				</ol>
				{passo === 1 ? blocoCliente : passo === 2 ? blocoPeriodo : passo === 3 ? blocoItens : blocoResumo}
				<div className="sticky bottom-0 -mx-4 mt-auto flex items-center gap-2 border-t bg-background px-4 py-3">
					{passo > 1 ? (
						<Button variant="outline" className="h-12" onClick={() => setPasso((p) => p - 1)}>
							Voltar
						</Button>
					) : null}
					<span className="flex-1 text-right text-xs">
						{preco && !calculando ? (
							<>
								<span className="block text-muted-foreground">Aluguel</span>
								<span className="font-medium text-sm tabular-nums">{dinheiro(preco.valorAluguel)}</span>
							</>
						) : null}
					</span>
					{passo < 4 ? (
						<Button className="h-12 text-base" onClick={() => setPasso((p) => p + 1)}>
							Continuar
						</Button>
					) : null}
				</div>
			</Pagina>
		);
	}

	return (
		<Pagina larga>
			<CabecalhoPagina titulo="Novo pedido" descricao="Monte a reserva para um cliente. O preço e o que está livre vêm do banco, na hora." />
			<div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className="flex min-w-0 flex-col gap-4">
					{blocoCliente}
					{blocoPeriodo}
					{blocoItens}
				</div>
				{blocoResumo}
			</div>
		</Pagina>
	);
}
