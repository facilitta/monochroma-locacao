"use client";
// Agenda de ocupação estilo Gantt (seção 7.15): barras horizontais sobre a linha do tempo,
// uma linha por equipamento e por unidade, uma coluna por dia. Desenhada do zero com os tokens do pacote.

import ChevronRight from "@carbon/icons-react/es/ChevronRight";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/componentes/ui/alert-dialog";
import { Codigo, FotoEquipamento } from "@/componentes/ui/basicos";
import { useFicha } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { Skeleton } from "@/componentes/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/componentes/ui/tooltip";
import { ProrrogarPeriodo } from "@/componentes/agenda/prorrogar";
import { DIA, diaEHora, diaSemana, duracao, mmss, mesmoDia } from "@/lib/formatos";
import { useNavegar } from "@/lib/navegacao";
import { useAgora } from "@/lib/relogio";
import { ETAPAS } from "@/lib/regras/etapas";
import { traduzir } from "@/lib/regras/respostas";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import {
	type Barra,
	barrasDaUnidade,
	diasDoPeriodo,
	ehFeriado,
	ehFimDeSemana,
	isoLocal,
	orcamentosDoEquipamento,
	podeReceber,
	trocarUnidade,
} from "@/prototipo/consultas-agenda";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const ALTURA_LINHA = 40;
const ALTURA_CABECALHO = 44;
const MOVEIS = ["pre_reserva", "confirmada", "separada"];
const PRORROGAVEIS = ["confirmada", "separada", "retirada"];

export type PropsGrade = {
	inicio: Date;
	dias: number;
	larguraDia: number;
	equipamentos: D.Equipamento[];
	agrupamento?: "equipamento" | "categoria";
	primeiraColuna?: number;
	podeArrastar: boolean;
	podeMontar: boolean;
	expandirTodos?: boolean;
	carregando?: boolean;
	semBarras?: boolean;
	className?: string;
	rotuloRegiao?: string;
};

type Criando = { equipamentoId: number; chaveLinha: string; d0: number; d1: number };
type Movendo = { barra: Barra; x0: number; y0: number; dx: number; dy: number; alvo?: { unidadeId: number; equipamentoId: number } };

function textoBarra(b: Barra, agora: Date): string {
	if (b.tipo === "reparo") return "em reparo";
	if (b.tipo === "orcamento") return `procura · ${b.cliente} ${b.reservaId}`;
	const partes = [`${b.cliente} ${b.reservaId}`];
	if (b.etapa === "pre_reserva" && b.expiraEm) partes.push(`◷ ${mmss(b.expiraEm.getTime() - agora.getTime())}`);
	if (b.atrasada) partes.push("⚠ atrasada");
	if (b.conflito) partes.push("⚠ conflito");
	return partes.join(" ");
}

function dicaBarra(b: Barra, agora: Date): string {
	if (b.tipo === "reparo") {
		const m = b.manutencaoId ? Q.manutencao(b.manutencaoId) : undefined;
		return `Em reparo${m ? ` · ${m.problema}` : ""} · desde ${diaEHora(b.inicio)}${m?.previsaoVolta ? ` · previsão de volta ${diaEHora(m.previsaoVolta)}` : ""}`;
	}
	const r = b.reservaId ? Q.reserva(b.reservaId) : undefined;
	const c = r ? Q.cliente(r.clienteId) : undefined;
	const etapa = b.etapa ? ETAPAS[b.etapa].nome : "";
	const base = `${c?.nome ?? ""} · reserva ${b.reservaId} · ${etapa} · ${diaEHora(b.inicio)} até ${diaEHora(r?.devolucaoEm ?? b.fim)}`;
	if (b.tipo === "orcamento") return `${base} · orçamento, ainda não prende unidade`;
	if (b.atrasada) return `${base} · atrasada há ${duracao(agora.getTime() - (r?.devolucaoEm ?? b.fim).getTime())}`;
	if (b.conflito === "reparo") return `${base} · conflito: a unidade está em reparo`;
	if (b.conflito === "atraso") return `${base} · conflito: o atraso ameaça a próxima reserva`;
	return base;
}

function classeBarra(b: Barra): string {
	if (b.tipo === "reparo") return "hachurado border border-unidade-reparo bg-card text-unidade-reparo";
	if (b.tipo === "orcamento") return "border border-dotted border-etapa-orcamento bg-card text-muted-foreground";
	if (b.atrasada) return "border border-erro bg-erro-fundo text-erro font-medium";
	const base = b.etapa ? ETAPAS[b.etapa].barra : "";
	return cn(base, b.etapa === "pre_reserva" && "bg-card", "text-foreground");
}

export function GradeAgenda({
	inicio,
	dias,
	larguraDia: larguraMinima,
	equipamentos,
	agrupamento = "equipamento",
	primeiraColuna = 256,
	podeArrastar,
	podeMontar,
	expandirTodos = false,
	carregando = false,
	semBarras = false,
	className,
	rotuloRegiao = "Agenda de ocupação",
}: PropsGrade) {
	const agora = useAgora(15_000);
	const { abrir } = useFicha();
	const navegar = useNavegar();
	const rolagem = useRef<HTMLDivElement>(null);
	const [versao, setVersao] = useState(0);
	const [criando, setCriando] = useState<Criando | null>(null);
	const [movendo, setMovendo] = useState<Movendo | null>(null);
	const [trocar, setTrocar] = useState<{ barra: Barra; unidadeId: number } | null>(null);
	const [prorrogar, setProrrogar] = useState<number | null>(null);
	const arrastou = useRef(false);
	const [larguraVisivel, setLarguraVisivel] = useState(0);
	useEffect(() => {
		const el = rolagem.current;
		if (!el) return;
		const medir = () => setLarguraVisivel(el.clientWidth);
		medir();
		const obs = new ResizeObserver(medir);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);
	const larguraDia = Math.max(larguraMinima, larguraVisivel ? Math.floor((larguraVisivel - primeiraColuna - 2) / dias) : larguraMinima);

	const inicioMs = inicio.getTime();
	const fim = new Date(inicioMs + dias * DIA);
	const larguraTrilha = dias * larguraDia;
	const px = (t: Date) => ((t.getTime() - inicioMs) / DIA) * larguraDia;
	const listaDias = useMemo(() => diasDoPeriodo(inicio, dias), [inicio, dias]);

	const linhas = useMemo(() => {
		void versao;
		const ordenados = [...equipamentos].sort((a, b) =>
			agrupamento === "categoria" ? a.categoria.localeCompare(b.categoria) || a.id - b.id : a.id - b.id,
		);
		return ordenados.map((e) => {
			const unidades = Q.unidadesDo(e.id);
			const porUnidade = unidades.map((u) => ({ unidade: u, barras: semBarras ? [] : barrasDaUnidade(u, inicio, fim, agora) }));
			const orcamentos = semBarras ? [] : orcamentosDoEquipamento(e.id, inicio, fim);
			const temAtividade = porUnidade.some((x) => x.barras.length > 0);
			return { e, porUnidade, orcamentos, temAtividade, livres: Q.livresAgora(e.id, agora), total: unidades.length };
		});
		// biome-ignore lint/correctness/useExhaustiveDependencies: agora muda a cada 15 s
	}, [equipamentos, agrupamento, inicio, dias, versao, semBarras, agora.getTime() - (agora.getTime() % 60_000)]);

	const [expandidos, setExpandidos] = useState<Set<number>>(
		() => new Set(expandirTodos ? equipamentos.map((e) => e.id) : linhas.filter((l) => l.temAtividade).map((l) => l.e.id)),
	);

	useEffect(() => {
		const el = rolagem.current;
		if (!el) return;
		const alvo = (Math.floor(px(agora) / larguraDia) - 1) * larguraDia;
		if (alvo > 0 && primeiraColuna + larguraTrilha > el.clientWidth) el.scrollLeft = alvo;
		// biome-ignore lint/correctness/useExhaustiveDependencies: só ao trocar o período
	}, [inicioMs, dias, larguraDia]);

	const alternar = (id: number) =>
		setExpandidos((s) => {
			const n = new Set(s);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});

	const diaDoPonto = (el: HTMLElement, clientX: number) => {
		const r = el.getBoundingClientRect();
		return Math.max(0, Math.min(dias - 1, Math.floor((clientX - r.left) / larguraDia)));
	};

	const terminarCriacao = (c: Criando) => {
		const d0 = Math.min(c.d0, c.d1);
		const d1 = Math.max(c.d0, c.d1);
		let ret = new Date(listaDias[d0].getTime() + 9 * 3_600_000);
		if (new Date(ret.getTime() - 3 * 3_600_000).getUTCDay() === 0) ret = new Date(ret.getTime() + DIA);
		let dev = new Date(listaDias[d1].getTime() + DIA + 9 * 3_600_000);
		if (new Date(dev.getTime() - 3 * 3_600_000).getUTCDay() === 0) dev = new Date(dev.getTime() + DIA);
		if (ret.getTime() < agora.getTime()) {
			toast.error("Não dá para montar pedido no passado. Escolha um dia a partir de hoje.");
			return;
		}
		navegar(`/pedido/novo?equipamento=${c.equipamentoId}&retirada=${encodeURIComponent(isoLocal(ret))}&devolucao=${encodeURIComponent(isoLocal(dev))}`);
	};

	const propsTrilhaCriar = (equipamentoId: number, chaveLinha: string) =>
		podeMontar && podeArrastar
			? {
					onPointerDown: (ev: React.PointerEvent<HTMLDivElement>) => {
						if (ev.button !== 0 || (ev.target as HTMLElement).closest("[data-barra]")) return;
						ev.currentTarget.setPointerCapture(ev.pointerId);
						const d = diaDoPonto(ev.currentTarget, ev.clientX);
						setCriando({ equipamentoId, chaveLinha, d0: d, d1: d });
					},
					onPointerMove: (ev: React.PointerEvent<HTMLDivElement>) => {
						if (!criando || criando.chaveLinha !== chaveLinha) return;
						const d = diaDoPonto(ev.currentTarget, ev.clientX);
						if (d !== criando.d1) setCriando({ ...criando, d1: d });
					},
					onPointerUp: () => {
						if (criando && criando.chaveLinha === chaveLinha) terminarCriacao(criando);
						setCriando(null);
					},
					onPointerCancel: () => setCriando(null),
				}
			: {};

	const propsBarraMover = (b: Barra) => {
		const r = b.reservaId ? Q.reserva(b.reservaId) : undefined;
		const podeMover = podeArrastar && b.tipo === "reserva" && r && (MOVEIS.includes(r.etapa) || PRORROGAVEIS.includes(r.etapa));
		if (!podeMover) return {};
		return {
			onPointerDown: (ev: React.PointerEvent<HTMLButtonElement>) => {
				if (ev.button !== 0) return;
				arrastou.current = false;
				ev.currentTarget.setPointerCapture(ev.pointerId);
				setMovendo({ barra: b, x0: ev.clientX, y0: ev.clientY, dx: 0, dy: 0 });
			},
			onPointerMove: (ev: React.PointerEvent<HTMLButtonElement>) => {
				if (!movendo || movendo.barra.chave !== b.chave) return;
				const dx = ev.clientX - movendo.x0;
				const dy = ev.clientY - movendo.y0;
				if (Math.abs(dx) > 6 || Math.abs(dy) > 6) arrastou.current = true;
				let alvo: Movendo["alvo"];
				if (Math.abs(dy) > 12) {
					const sob = document.elementsFromPoint(ev.clientX, ev.clientY).find((el) => (el as HTMLElement).dataset?.linhaUnidade) as HTMLElement | undefined;
					if (sob) alvo = { unidadeId: Number(sob.dataset.linhaUnidade), equipamentoId: Number(sob.dataset.equipamento) };
				}
				setMovendo({ ...movendo, dx, dy, alvo });
			},
			onPointerUp: () => {
				const m = movendo;
				setMovendo(null);
				if (!m || m.barra.chave !== b.chave) return;
				if (Math.abs(m.dy) > 12) {
					if (m.alvo && m.alvo.unidadeId !== b.unidadeId) {
						if (m.alvo.equipamentoId !== b.equipamentoId) {
							toast.error("Só dá para trocar por outra unidade do mesmo modelo.");
						} else if (r && MOVEIS.includes(r.etapa)) {
							setTrocar({ barra: b, unidadeId: m.alvo.unidadeId });
						} else {
							toast.error("Peça já saiu: a troca de unidade só vale antes da saída.");
						}
					}
				} else if (Math.abs(m.dx) > 24 && r && PRORROGAVEIS.includes(r.etapa)) {
					setProrrogar(r.id);
				}
			},
			onPointerCancel: () => setMovendo(null),
		};
	};

	const desenharBarra = (b: Barra) => {
		const esquerdaBruta = px(b.inicio);
		const direitaBruta = px(b.fim);
		const esquerda = Math.max(0, esquerdaBruta);
		const direita = Math.min(larguraTrilha, direitaBruta);
		const folgaDireita = b.folgaAte ? Math.min(larguraTrilha, px(b.folgaAte)) : direita;
		const cortadaEsq = esquerdaBruta < 0;
		const cortadaDir = direitaBruta > larguraTrilha;
		const sendoMovida = movendo?.barra.chave === b.chave;
		const visivel = direita > esquerda;
		return (
			<Fragment key={b.chave}>
				{visivel ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								data-barra
								aria-label={dicaBarra(b, agora)}
								onClick={() => {
									if (arrastou.current) {
										arrastou.current = false;
										return;
									}
									if (b.reservaId) abrir("reserva", b.reservaId);
									else if (b.manutencaoId) abrir("manutencao", b.manutencaoId);
								}}
								{...propsBarraMover(b)}
								className={cn(
									"absolute top-2 z-[2] flex h-6 min-w-1.5 items-center gap-1 overflow-hidden rounded-sm px-1.5 text-left text-2xs leading-none whitespace-nowrap transition-shadow",
									classeBarra(b),
									cortadaEsq && "rounded-l-none",
									cortadaDir && "rounded-r-none",
									b.conflito && "outline-2 outline-offset-1 outline-erro",
									podeArrastar && b.tipo === "reserva" && "cursor-grab touch-none active:cursor-grabbing",
									sendoMovida && "z-[6] shadow-lg",
								)}
								style={{
									left: esquerda,
									width: Math.max(6, direita - esquerda),
									transform: sendoMovida ? `translate(${Math.abs(movendo.dx) > Math.abs(movendo.dy) ? movendo.dx : 0}px, ${Math.abs(movendo.dy) >= Math.abs(movendo.dx) ? movendo.dy : 0}px)` : undefined,
								}}
							>
								<span className="truncate">{textoBarra(b, agora)}</span>
								{b.atrasada ? <span aria-hidden>▶</span> : null}
							</button>
						</TooltipTrigger>
						<TooltipContent side="top">{dicaBarra(b, agora)}</TooltipContent>
					</Tooltip>
				) : null}
				{b.folgaAte && folgaDireita > Math.max(direita, 0) && !sendoMovida ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<span
								role="img"
								aria-label={`${D.configuracoesExemplo.horasFolga} h de folga para conferência`}
								className="absolute top-2 z-[1] h-6 rounded-r-sm border border-l-0 border-border bg-accent"
								style={{ left: Math.max(direita, 0), width: folgaDireita - Math.max(direita, 0) }}
							/>
						</TooltipTrigger>
						<TooltipContent side="top">{D.configuracoesExemplo.horasFolga} h de folga (domingos e feriados contam como horas normais)</TooltipContent>
					</Tooltip>
				) : null}
			</Fragment>
		);
	};

	const desenharCriacao = (chaveLinha: string) => {
		if (!criando || criando.chaveLinha !== chaveLinha) return null;
		const d0 = Math.min(criando.d0, criando.d1);
		const d1 = Math.max(criando.d0, criando.d1);
		const n = d1 - d0 + 1;
		return (
			<span
				aria-hidden
				className="pointer-events-none absolute top-1 z-[3] flex h-8 items-center rounded-sm border border-dashed border-primary bg-primary/10 px-1.5 text-2xs text-foreground"
				style={{ left: d0 * larguraDia, width: n * larguraDia }}
			>
				<span className="truncate">Novo pedido · {n} {n === 1 ? "diária" : "diárias"}</span>
			</span>
		);
	};

	const xAgora = px(agora);
	const categorias = agrupamento === "categoria";
	let categoriaAnterior = "";

	return (
		<div
			ref={rolagem}
			role="region"
			aria-label={rotuloRegiao}
			aria-busy={carregando || undefined}
			className={cn("relative min-h-0 overflow-auto rounded-lg border bg-card", className)}
		>
			<div className="relative" style={{ width: primeiraColuna + larguraTrilha }}>
				{/* cabeçalho de dias */}
				<div className="sticky top-0 z-20 flex border-b bg-muted" style={{ height: ALTURA_CABECALHO }}>
					<div className="sticky left-0 z-30 flex shrink-0 items-center border-r bg-muted px-3 text-muted-foreground text-xs" style={{ width: primeiraColuna }}>
						{categorias ? "Categoria e equipamento" : "Equipamento"}
					</div>
					{listaDias.map((d) => {
						const hoje = mesmoDia(d, agora);
						const feriado = ehFeriado(d);
						return (
							<div
								key={d.getTime()}
								title={feriado}
								className={cn(
									"flex shrink-0 flex-col items-center justify-center border-r text-2xs leading-tight last:border-r-0",
									hoje ? "font-semibold text-foreground" : "text-muted-foreground",
								)}
								style={{ width: larguraDia }}
							>
								<span>{larguraDia >= 28 ? diaSemana(d) : diaSemana(d).slice(0, 1)}</span>
								<span className={cn("tabular-nums", hoje && "rounded-full bg-foreground px-1.5 text-background")}>{new Date(d.getTime() + 12 * 3_600_000).toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" })}</span>
							</div>
						);
					})}
				</div>

				<div className="relative">
					{/* fundo: fim de semana, divisões de dia, agora */}
					<div aria-hidden className="pointer-events-none absolute inset-y-0 z-0" style={{ left: primeiraColuna, width: larguraTrilha }}>
						{listaDias.map((d, i) =>
							ehFimDeSemana(d) || ehFeriado(d) ? (
								<span key={d.getTime()} className="absolute inset-y-0 bg-muted/40" style={{ left: i * larguraDia, width: larguraDia }} />
							) : null,
						)}
						{listaDias.map((d, i) => (i > 0 ? <span key={`l${d.getTime()}`} className="absolute inset-y-0 w-px bg-border/60" style={{ left: i * larguraDia }} /> : null))}
					</div>
					{xAgora >= 0 && xAgora <= larguraTrilha ? (
						<span aria-hidden className="pointer-events-none absolute inset-y-0 z-[5] w-0.5 bg-primary" style={{ left: primeiraColuna + xAgora - 1 }} />
					) : null}

					{carregando
						? Array.from({ length: 10 }, (_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: esqueleto
								<div key={i} className="relative flex border-b" style={{ height: ALTURA_LINHA }}>
									<div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r bg-card px-3" style={{ width: primeiraColuna }}>
										<Skeleton className="size-5" />
										<Skeleton className="h-3 w-28" />
									</div>
									<div className="relative" style={{ width: larguraTrilha }}>
										<Skeleton className="absolute top-2 h-6" style={{ left: ((i * 3) % Math.max(1, dias - 3)) * larguraDia, width: larguraDia * (2 + (i % 3)) }} />
									</div>
								</div>
							))
						: linhas.map(({ e, porUnidade, orcamentos, livres, total }) => {
								const aberto = expandidos.has(e.id);
								const cabecalhoCategoria = categorias && e.categoria !== categoriaAnterior;
								categoriaAnterior = e.categoria;
								return (
									<Fragment key={e.id}>
										{cabecalhoCategoria ? (
											<div className="relative z-[1] flex h-7 items-center border-b bg-muted/60">
												<span className="sticky left-0 px-3 font-medium text-2xs text-muted-foreground uppercase tracking-wider">{D.CATEGORIAS[e.categoria]}</span>
											</div>
										) : null}
										<div className="relative flex border-b" style={{ height: ALTURA_LINHA }}>
											<div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r bg-card pr-3 pl-1.5" style={{ width: primeiraColuna }}>
												<button
													type="button"
													onClick={() => alternar(e.id)}
													aria-expanded={aberto}
													aria-label={`${aberto ? "Recolher" : "Mostrar"} unidades de ${e.nome}`}
													className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
												>
													<Icon icon={ChevronRight} motion="none" className={cn("size-3.5 transition-transform", aberto && "rotate-90")} />
												</button>
												<FotoEquipamento nome={e.nome} tamanho={20} />
												<button type="button" onClick={() => abrir("equipamento", e.id)} className="min-w-0 flex-1 truncate text-left font-medium text-xs hover:underline">
													{e.nome}
												</button>
												<span className="shrink-0 text-muted-foreground text-2xs tabular-nums">
													{livres} de {total}
												</span>
											</div>
											<div className="relative" style={{ width: larguraTrilha }} {...propsTrilhaCriar(e.id, `e${e.id}`)}>
												{orcamentos.map(desenharBarra)}
												{desenharCriacao(`e${e.id}`)}
											</div>
										</div>
										{aberto
											? porUnidade.map(({ unidade: u, barras }) => {
													const alvoValido = movendo?.alvo?.unidadeId === u.id;
													const mesmoModelo = movendo?.barra.equipamentoId === u.equipamentoId;
													return (
														<div
															key={u.id}
															data-linha-unidade={u.id}
															data-equipamento={u.equipamentoId}
															className={cn(
																"relative flex border-b bg-muted/30",
																alvoValido && (mesmoModelo && movendo?.barra.unidadeId !== u.id ? "ring-2 ring-inset ring-primary" : "ring-2 ring-inset ring-erro"),
															)}
															style={{ height: ALTURA_LINHA }}
														>
															<div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r bg-card pr-3 pl-11" style={{ width: primeiraColuna }} title={u.numeroSerie ? `nº ${u.numeroSerie}` : undefined}>
																<button type="button" onClick={() => abrir("unidade", u.id)} className="min-w-0 truncate text-left hover:underline">
																	<Codigo>{u.codigo}</Codigo>
																</button>
																{u.numeroSerie && primeiraColuna >= 220 ? <span className="truncate font-mono text-2xs text-muted-foreground">nº {u.numeroSerie}</span> : null}
															</div>
															<div className="relative" style={{ width: larguraTrilha }} {...propsTrilhaCriar(e.id, `u${u.id}`)}>
																{barras.map(desenharBarra)}
																{desenharCriacao(`u${u.id}`)}
															</div>
														</div>
													);
												})
											: null}
									</Fragment>
								);
							})}
				</div>
			</div>

			<AlertDialog open={!!trocar} onOpenChange={(o) => !o && setTrocar(null)}>
				<AlertDialogContent>
					{trocar ? (
						<TrocarConteudo
							barra={trocar.barra}
							unidadeId={trocar.unidadeId}
							agora={agora}
							aoConfirmar={() => {
								const ok = podeReceber(trocar.unidadeId, trocar.barra.reservaId as number, agora);
								if (!ok.pode) {
									toast.error(ok.motivo ?? traduzir("INDISPONIVEL").frase);
								} else if (trocar.barra.itemId) {
									trocarUnidade(trocar.barra.itemId, trocar.unidadeId);
									setVersao((v) => v + 1);
									toast.success(`Unidade trocada na reserva ${trocar.barra.reservaId}`);
								}
								setTrocar(null);
							}}
						/>
					) : null}
				</AlertDialogContent>
			</AlertDialog>
			<ProrrogarPeriodo reservaId={prorrogar} aoFechar={() => setProrrogar(null)} />
		</div>
	);
}

function TrocarConteudo({ barra, unidadeId, agora, aoConfirmar }: { barra: Barra; unidadeId: number; agora: Date; aoConfirmar: () => void }) {
	const atual = barra.unidadeId ? Q.unidade(barra.unidadeId) : undefined;
	const nova = Q.unidade(unidadeId);
	const check = podeReceber(unidadeId, barra.reservaId as number, agora);
	return (
		<>
			<AlertDialogHeader>
				<AlertDialogTitle>Trocar a unidade da reserva {barra.reservaId}?</AlertDialogTitle>
				<AlertDialogDescription>
					{Q.equipamento(barra.equipamentoId).nome}: sai a <span className="font-mono">{atual?.codigo}</span> e entra a <span className="font-mono">{nova.codigo}</span>. A troca fica no
					histórico da reserva.
				</AlertDialogDescription>
			</AlertDialogHeader>
			{!check.pode ? <p className="text-erro text-xs">{check.motivo}</p> : null}
			<AlertDialogFooter>
				<AlertDialogCancel>Cancelar</AlertDialogCancel>
				<AlertDialogAction disabled={!check.pode} onClick={aoConfirmar}>
					Trocar unidade
				</AlertDialogAction>
			</AlertDialogFooter>
		</>
	);
}
