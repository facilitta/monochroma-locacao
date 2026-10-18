"use client";
// 7.17 Balcão no celular: saída e volta lendo as etiquetas. Escuro por padrão, texto de 16 px, alvos de 48 px.

import ArrowDown from "@carbon/icons-react/es/ArrowDown";
import ArrowLeft from "@carbon/icons-react/es/ArrowLeft";
import ArrowUp from "@carbon/icons-react/es/ArrowUp";
import Camera from "@carbon/icons-react/es/Camera";
import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import ChevronRight from "@carbon/icons-react/es/ChevronRight";
import CircleDash from "@carbon/icons-react/es/CircleDash";
import Delivery from "@carbon/icons-react/es/Delivery";
import Misuse from "@carbon/icons-react/es/Misuse";
import WarningAlt from "@carbon/icons-react/es/WarningAlt";
import WifiOff from "@carbon/icons-react/es/WifiOff";
import { LeitorCamera } from "@/componentes/balcao/leitor-camera";
import { Codigo, EstadoErro, EstadoVazio, FotoEquipamento, TituloGrupo } from "@/componentes/ui/basicos";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/componentes/ui/alert-dialog";
import { Button } from "@/componentes/ui/button";
import { Checkbox } from "@/componentes/ui/checkbox";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/componentes/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import { useFicha } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { EtapaRotulo, Selo } from "@/componentes/ui/marcadores";
import { Skeleton } from "@/componentes/ui/skeleton";
import { Switch } from "@/componentes/ui/switch";
import { temaFoiEscolhido } from "@/componentes/estrutura/provedores";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { duracao, hora, horaRelogio, mesmoDia, normalizarEtiqueta } from "@/lib/formatos";
import { Link, useBusca, useNavegar } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { traduzir } from "@/lib/regras/respostas";
import type { Tom } from "@/lib/regras/situacao";
import { TONS } from "@/lib/regras/situacao";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { type ItemBalcao, itensDoBalcao, listasDoBalcao, reservaDoDiaPorEtiqueta } from "@/prototipo/consultas-atendimento";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/* ---------------------------------------------------------------- tema escuro por padrão */

function useEscuroNoBalcao() {
	useEffect(() => {
		if (temaFoiEscolhido()) return;
		const html = document.documentElement;
		const tinhaClaro = html.classList.contains("light");
		const tinhaEscuro = html.classList.contains("dark");
		const esquemaAntes = html.style.colorScheme;
		html.classList.remove("light");
		html.classList.add("dark");
		html.style.colorScheme = "dark";
		return () => {
			if (!tinhaEscuro) html.classList.remove("dark");
			if (tinhaClaro) html.classList.add("light");
			html.style.colorScheme = esquemaAntes;
		};
	}, []);
}

/* ---------------------------------------------------------------- faixa de leitura e vibração */

type Faixa = { tom: Tom; texto: string; chave: number };

function vibrar(padrao: number | number[], ligado: boolean) {
	if (!ligado) return;
	try {
		navigator.vibrate?.(padrao);
	} catch {
		// celular sem vibração
	}
}

function FaixaLeitura({ faixa }: { faixa: Faixa | null }) {
	return (
		<div aria-live="polite" className="pointer-events-none sticky top-0 z-20 h-0">
			{faixa ? (
				<div
					key={faixa.chave}
					className={cn(
						"flex items-center gap-2 rounded-md border px-3 py-2.5 text-base shadow-md animate-in fade-in slide-in-from-top-2",
						TONS[faixa.tom].fundo,
						TONS[faixa.tom].borda,
						TONS[faixa.tom].texto,
					)}
				>
					<Icon icon={TONS[faixa.tom].icone} motion="none" className="size-5 shrink-0" />
					<span>{faixa.texto}</span>
				</div>
			) : null}
		</div>
	);
}

/* ---------------------------------------------------------------- campo de código */

function CampoCodigo({ aoLer, foco }: { aoLer: (codigo: string) => void; foco: number }) {
	const [valor, setValor] = useState("");
	const campo = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (foco) campo.current?.focus();
	}, [foco]);
	return (
		<form
			className="flex gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				if (!valor.trim()) return;
				aoLer(valor);
				setValor("");
			}}
		>
			<label className="flex min-w-0 flex-1">
				<span className="sr-only">Código da etiqueta</span>
				<input
					ref={campo}
					value={valor}
					onChange={(e) => setValor(e.target.value)}
					autoCapitalize="characters"
					autoComplete="off"
					inputMode="text"
					placeholder="Código, com ou sem EQ-"
					className="h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 font-mono text-base shadow-campo outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-muted"
				/>
			</label>
			<Button type="submit" variant="outline" className="h-12 px-4 text-base">
				Ler
			</Button>
		</form>
	);
}

/* ---------------------------------------------------------------- entrada */

function LinhaEntrada({ r, sentido, agora }: { r: D.Reserva; sentido: "saida" | "volta"; agora: Date }) {
	const c = Q.cliente(r.clienteId);
	const itens = itensDoBalcao(r.id).filter((i) => i.ativo && (sentido === "saida" || (i.saiu && !i.voltou)));
	const at = sentido === "volta" ? Q.atrasoDa(r.id, agora) : null;
	const quando = sentido === "saida" ? r.retiradaEm : r.devolucaoEm;
	return (
		<li>
			<Link href={`/balcao?reserva=${r.id}&sentido=${sentido}`} data-alvo className="flex min-h-14 items-center gap-3 px-4 py-2 active:bg-muted">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
					<Icon icon={sentido === "saida" ? ArrowUp : ArrowDown} className="size-5" motion="none" />
				</span>
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="flex items-baseline gap-2">
						<span className="truncate font-medium">{Q.nomeCurtoCliente(c)}</span>
						<Codigo className="text-sm text-muted-foreground">{r.id}</Codigo>
					</span>
					<span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
						<span className="tabular-nums">{mesmoDia(quando, agora) ? horaRelogio(quando) : `${hora(quando)} de ${quando.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })}`}</span>
						<span>· {itens.length} {itens.length === 1 ? "peça" : "peças"}</span>
						{at ? <Selo tom={at.alemDaTolerancia ? "erro" : "atencao"}>Atrasada há {duracao(at.ms)}</Selo> : null}
						{sentido === "saida" ? <EtapaRotulo etapa={r.etapa} className="text-sm" /> : null}
					</span>
				</span>
				<Icon icon={ChevronRight} className="size-5 shrink-0 text-muted-foreground" />
			</Link>
		</li>
	);
}

function Entrada({ agora }: { agora: Date }) {
	const estado = useEstadoTela();
	const navegar = useNavegar();
	const [foco, setFoco] = useState(0);
	const [faixa, setFaixa] = useState<Faixa | null>(null);
	const [tentou, setTentou] = useState(false);
	const listas = estado === "vazio" ? { saidas: [], voltas: [], atrasadas: [] } : listasDoBalcao(agora);
	const nada = !listas.saidas.length && !listas.voltas.length && !listas.atrasadas.length;

	const mostrar = (f: Omit<Faixa, "chave">) => {
		setFaixa({ ...f, chave: Date.now() });
		window.setTimeout(() => setFaixa(null), 2500);
	};

	const lerDireto = (bruto: string) => {
		const codigo = normalizarEtiqueta(bruto);
		if (!Q.unidadePorCodigo(codigo)) return mostrar({ tom: "erro", texto: traduzir("ETIQUETA_NAO_ENCONTRADA").frase });
		const achada = reservaDoDiaPorEtiqueta(codigo, agora);
		if (!achada) return mostrar({ tom: "atencao", texto: `${codigo} não está em nenhuma saída ou volta de hoje.` });
		navegar(`/balcao?reserva=${achada.reservaId}&sentido=${achada.sentido}`);
	};

	const secao = (titulo: string, lista: D.Reserva[], sentido: "saida" | "volta") =>
		lista.length ? (
			<section className="flex flex-col gap-2">
				<TituloGrupo className="text-base">{titulo}</TituloGrupo>
				<ul className="flex flex-col divide-y overflow-hidden rounded-lg border bg-card">
					{lista.map((r) => (
						<LinhaEntrada key={`${sentido}-${r.id}`} r={r} sentido={sentido} agora={agora} />
					))}
				</ul>
			</section>
		) : null;

	return (
		<div className="flex flex-col gap-5">
			<header className="flex flex-col gap-1">
				<h1 className="font-medium text-2xl tracking-tight">Balcão</h1>
				<p className="text-muted-foreground">Toque na reserva ou leia uma etiqueta: o app acha a reserva do dia.</p>
			</header>
			<FaixaLeitura faixa={faixa} />
			<section className="flex flex-col gap-2 rounded-lg border bg-card p-3">
				<TituloGrupo className="text-base">Ler etiqueta direto</TituloGrupo>
				<CampoCodigo aoLer={lerDireto} foco={foco} />
				<Button variant="ghost" onClick={() => setFoco((f) => f + 1)} className="justify-start text-muted-foreground">
					<Icon icon={Camera} data-icon="inline-start" />
					A câmera abre dentro de cada reserva
				</Button>
			</section>
			{estado === "carregando" ? (
				<div aria-busy="true" className="flex flex-col gap-2">
					<span className="sr-only">Carregando</span>
					{[0, 1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-14 w-full rounded-lg" />
					))}
				</div>
			) : estado === "erro" && !tentou ? (
				<div className="rounded-lg border bg-card">
					<EstadoErro frase="Não consegui carregar as saídas e voltas." aoTentar={() => setTentou(true)} />
				</div>
			) : nada ? (
				<div className="rounded-lg border bg-card">
					<EstadoVazio icone={Delivery} titulo="Nada saindo nem voltando hoje." descricao="Quando houver retirada ou devolução marcada para hoje, ela aparece aqui." />
				</div>
			) : (
				<>
					{secao("Atrasadas", listas.atrasadas, "volta")}
					{secao("Saídas de hoje", listas.saidas, "saida")}
					{secao("Voltas de hoje", listas.voltas, "volta")}
				</>
			)}
		</div>
	);
}

/* ---------------------------------------------------------------- operação */

type Leitura = { unidadeId: number; em: Date; resultado: "lida" | "ok" | "problema"; guardada: boolean };
type Aviso = { chave: number; codigo: string; resposta: string; unidadeId?: number; itemId?: number };

function rotuloSituacao(item: ItemBalcao, l: Leitura | undefined, sentido: "saida" | "volta"): { tom: Tom; texto: string; icone: typeof CheckmarkOutline } {
	if (sentido === "volta" && item.voltou) return { tom: "neutro", texto: "Já voltou", icone: CheckmarkOutline };
	if (!l) return { tom: "neutro", texto: sentido === "saida" ? "Esperando" : "Não voltou ainda", icone: CircleDash };
	if (l.resultado === "problema") return { tom: "atencao", texto: "Com problema", icone: WarningAlt };
	return { tom: "ok", texto: sentido === "saida" ? "Conferido" : "Voltou ok", icone: CheckmarkOutline };
}

const TIPOS_DANO: { id: D.TipoDano; nome: string }[] = [
	{ id: "arranhao", nome: "Arranhão" },
	{ id: "quebrado", nome: "Quebrado" },
	{ id: "falta_peca", nome: "Falta peça" },
	{ id: "sujo", nome: "Sujo" },
	{ id: "nao_liga", nome: "Não liga" },
];

function GavetaVolta({
	item,
	aoFechar,
	aoConfirmar,
}: {
	item: ItemBalcao | null;
	aoFechar: () => void;
	aoConfirmar: (resultado: "ok" | "problema") => void;
}) {
	const { ehDono } = usePapel();
	const [modo, setModo] = useState<"escolha" | "problema">("escolha");
	const [tipo, setTipo] = useState<D.TipoDano | null>(null);
	const [foto, setFoto] = useState(false);
	const [cobrar, setCobrar] = useState(true);
	const foto_ = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (item) {
			setModo("escolha");
			setTipo(null);
			setFoto(false);
		}
	}, [item]);
	return (
		<Drawer open={!!item} onOpenChange={(o) => !o && aoFechar()}>
			<DrawerContent className="mx-auto max-w-[420px]" data-balcao>
				{item ? (
					<>
						<DrawerHeader className="text-left">
							<DrawerTitle className="text-lg">{item.equipamento.nome}</DrawerTitle>
							<DrawerDescription className="font-mono text-sm">{item.unidade.codigo}</DrawerDescription>
						</DrawerHeader>
						{modo === "escolha" ? (
							<div className="flex flex-col gap-3 px-4 pb-6">
								<Button className="h-12 text-base" onClick={() => aoConfirmar("ok")}>
									<Icon icon={CheckmarkOutline} data-icon="inline-start" />
									Voltou ok
								</Button>
								<Button variant="outline" className="h-12 text-base" onClick={() => setModo("problema")}>
									<Icon icon={WarningAlt} data-icon="inline-start" className="text-atencao" />
									Tem problema
								</Button>
							</div>
						) : (
							<form
								className="flex flex-col gap-4 px-4 pb-6"
								onSubmit={(e) => {
									e.preventDefault();
									if (!tipo) return;
									aoConfirmar("problema");
								}}
							>
								<div className="flex flex-col gap-2">
									<span className="font-medium text-base">Foto do problema</span>
									<input ref={foto_} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={() => setFoto(true)} />
									<Button type="button" variant="outline" className="h-12 justify-start text-base" onClick={() => foto_.current?.click()}>
										<Icon icon={Camera} data-icon="inline-start" />
										{foto ? "Foto anexada · tirar outra" : "Tirar foto"}
									</Button>
								</div>
								<fieldset className="flex flex-col gap-2">
									<legend className="mb-2 font-medium text-base">O que aconteceu</legend>
									<div className="flex flex-wrap gap-2">
										{TIPOS_DANO.map((t) => (
											<Button key={t.id} type="button" variant={tipo === t.id ? "secondary" : "outline"} aria-pressed={tipo === t.id} className="h-12 text-base" onClick={() => setTipo(t.id)}>
												{t.nome}
											</Button>
										))}
									</div>
								</fieldset>
								<label className="flex flex-col gap-2">
									<span className="font-medium text-base">Observação</span>
									<textarea rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-campo outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-muted" placeholder="O que você viu?" />
								</label>
								{ehDono ? (
									<label className="flex min-h-12 items-center justify-between gap-3">
										<span className="text-base">Cobrar do cliente</span>
										<Switch checked={cobrar} onCheckedChange={setCobrar} aria-label="Cobrar do cliente" />
									</label>
								) : (
									<p className="text-muted-foreground text-sm">A cobrança do dano é decidida pelo dono, na manutenção.</p>
								)}
								<Button type="submit" className="h-12 text-base" disabled={!tipo}>
									Salvar e abrir manutenção
								</Button>
								<Button type="button" variant="ghost" className="h-12 text-base" onClick={() => setModo("escolha")}>
									Voltar
								</Button>
							</form>
						)}
					</>
				) : null}
			</DrawerContent>
		</Drawer>
	);
}

function Operacao({ reservaId, sentido, agora }: { reservaId: number; sentido: "saida" | "volta"; agora: Date }) {
	const { ehDono, usuario } = usePapel();
	const { abrir } = useFicha();
	const { offline } = useConexao();
	const busca = useBusca();
	const r = Q.reserva(reservaId);
	const c = Q.cliente(r.clienteId);
	const demo = busca.get("demo") === "1";

	const base = useMemo(() => itensDoBalcao(reservaId).filter((i) => i.ativo), [reservaId]);
	const [trocas, setTrocas] = useState<Record<number, number>>({});
	const itens = base.map((i) => (trocas[i.itemId] ? { ...i, unidade: Q.unidade(trocas[i.itemId]) } : i));
	const esperados = sentido === "saida" ? itens : itens.filter((i) => i.saiu);

	const [leituras, setLeituras] = useState<Record<number, Leitura>>(() => {
		if (!demo) return {};
		const n = sentido === "saida" ? 3 : 2;
		const lista = sentido === "saida" ? base : base.filter((i) => i.saiu && !i.voltou);
		return Object.fromEntries(lista.slice(0, n).map((i, k) => [i.unidade.id, { unidadeId: i.unidade.id, em: new Date(agora.getTime() - (n - k) * 40_000), resultado: sentido === "saida" ? "lida" : "ok", guardada: false } as Leitura]));
	});
	const [avisos, setAvisos] = useState<Aviso[]>(() => {
		if (!demo || sentido !== "saida") return [];
		const pendente = base[base.length - 1];
		const outra = pendente ? Q.unidadesDo(pendente.equipamento.id).find((u) => u.id !== pendente.unidade.id && u.estado === "ok") : undefined;
		return outra ? [{ chave: 1, codigo: outra.codigo, resposta: `OUTRA_UNIDADE_MESMO_MODELO:${pendente.itemId}`, unidadeId: outra.id, itemId: pendente.itemId }] : [];
	});
	const [faixa, setFaixa] = useState<Faixa | null>(null);
	const [piscar, setPiscar] = useState<number | null>(null);
	const [vibracao, setVibracao] = useState(true);
	const [foco, setFoco] = useState(0);
	const [digitando, setDigitando] = useState(false);
	const [gaveta, setGaveta] = useState<ItemBalcao | null>(null);
	const [concluido, setConcluido] = useState(false);
	const [confirmar, setConfirmar] = useState(false);
	const [pendencia, setPendencia] = useState(false);
	const [naoSaem, setNaoSaem] = useState<number[]>([]);
	const [motivoNaoSai, setMotivoNaoSai] = useState("");
	const [motivoAssinatura, setMotivoAssinatura] = useState("");
	const [liberouAssinatura, setLiberouAssinatura] = useState<string | null>(null);
	const [quemRetira, setQuemRetira] = useState<string>("titular");
	const [documentoConferido, setDocumentoConferido] = useState(false);
	const temporizador = useRef<number | undefined>(undefined);

	const mostrar = useCallback((f: Omit<Faixa, "chave">) => {
		window.clearTimeout(temporizador.current);
		setFaixa({ ...f, chave: Date.now() });
		temporizador.current = window.setTimeout(() => setFaixa(null), 2000);
	}, []);

	const desfazer = (unidadeId: number) => {
		setLeituras((l) => {
			const n = { ...l };
			delete n[unidadeId];
			return n;
		});
		toast("Leitura desfeita (estorno gravado)");
	};

	const registrar = (unidadeId: number, resultado: Leitura["resultado"], nome: string, codigo: string) => {
		setLeituras((l) => ({ ...l, [unidadeId]: { unidadeId, em: new Date(), resultado, guardada: offline } }));
		setPiscar(unidadeId);
		window.setTimeout(() => setPiscar(null), 900);
		vibrar(30, vibracao);
		const resp = resultado === "problema" ? traduzir("VOLTA_COM_DANO") : traduzir(resultado === "ok" ? "VOLTA_OK" : "LIDA");
		mostrar({ tom: resp.tom, texto: resultado === "problema" ? `${nome} ${codigo}: ${resp.frase}` : `${nome} ${codigo} ${resultado === "ok" ? "voltou ok" : "conferido"}` });
		toast(`${nome} ${codigo}`, {
			duration: 6000,
			description: offline ? "Guardada no aparelho. Falta o sistema confirmar." : undefined,
			action: { label: "Desfazer última leitura", onClick: () => desfazer(unidadeId) },
		});
	};

	const erro = (codigoResposta: string, extra?: string) => {
		const resp = traduzir(codigoResposta);
		vibrar([30, 60, 30], vibracao);
		mostrar({ tom: resp.tom, texto: extra ? `${extra}: ${resp.frase}` : resp.frase });
	};

	const ler = (bruto: string) => {
		if (concluido) return;
		const codigo = normalizarEtiqueta(bruto);
		const u = Q.unidadePorCodigo(codigo);
		if (!u) return erro("ETIQUETA_NAO_ENCONTRADA", codigo);
		const e = Q.equipamento(u.equipamentoId);
		const item = itens.find((i) => i.unidade.id === u.id);
		if (sentido === "saida") {
			if (item) {
				if (leituras[u.id]) return erro("JA_CONFERIDA", `${e.nome} ${codigo}`);
				return registrar(u.id, "lida", e.nome, codigo);
			}
			const pendenteMesmoModelo = itens.find((i) => i.equipamento.id === u.equipamentoId && !leituras[i.unidade.id]);
			if (pendenteMesmoModelo && u.estado === "ok" && Q.situacaoUnidade(u, agora).estado === "livre") {
				setAvisos((a) => [...a.filter((x) => x.codigo !== codigo), { chave: Date.now(), codigo, resposta: `OUTRA_UNIDADE_MESMO_MODELO:${pendenteMesmoModelo.itemId}`, unidadeId: u.id, itemId: pendenteMesmoModelo.itemId }]);
				return erro("OUTRA_UNIDADE_MESMO_MODELO", `${e.nome} ${codigo}`);
			}
			return erro("NAO_E_DESTA_RESERVA", `${e.nome} ${codigo}`);
		}
		if (!item || !item.saiu) return erro("NAO_E_DESTA_RESERVA", `${e.nome} ${codigo}`);
		if (item.voltou || leituras[u.id]) return erro("JA_CONFERIDA", `${e.nome} ${codigo}`);
		setGaveta(item);
	};

	const simularProxima = () => {
		const proximo = (sentido === "saida" ? itens : itens.filter((i) => i.saiu && !i.voltou)).find((i) => !leituras[i.unidade.id] && !naoSaem.includes(i.itemId));
		if (proximo) ler(proximo.unidade.codigo);
		else mostrar({ tom: "info", texto: "Todas as peças já foram lidas." });
	};
	const simularOutraReserva = () => {
		const alheia = D.unidades.find((u) => u.estado === "ok" && !itens.some((i) => i.unidade.id === u.id) && !itens.some((i) => i.equipamento.id === u.equipamentoId));
		if (alheia) ler(alheia.codigo);
	};
	const simularMesmoModelo = () => {
		for (const i of itens) {
			if (leituras[i.unidade.id]) continue;
			const outra = Q.unidadesDo(i.equipamento.id).find((u) => u.id !== i.unidade.id && u.estado === "ok" && !itens.some((x) => x.unidade.id === u.id) && Q.situacaoUnidade(u, agora).estado === "livre");
			if (outra) return ler(outra.codigo);
		}
		mostrar({ tom: "info", texto: "Não há outra unidade livre do mesmo modelo para simular." });
	};
	const simularRepetida = () => {
		const ultima = Object.values(leituras).sort((a, b) => b.em.getTime() - a.em.getTime())[0];
		if (ultima) ler(Q.unidade(ultima.unidadeId).codigo);
		else mostrar({ tom: "info", texto: "Leia uma peça primeiro." });
	};

	const aceitarTroca = (a: Aviso) => {
		if (!a.itemId || !a.unidadeId) return;
		setTrocas((t) => ({ ...t, [a.itemId as number]: a.unidadeId as number }));
		setAvisos((x) => x.filter((y) => y.chave !== a.chave));
		const e = Q.equipamento(Q.unidade(a.unidadeId).equipamentoId);
		registrar(a.unidadeId, "lida", e.nome, a.codigo);
		toast.success("Unidade trocada na reserva (com evento registrado)");
	};

	const bloqueios = sentido === "saida" ? Q.bloqueiosSaida(reservaId).filter((b) => !(b.codigo === "FALTA_ASSINATURA" && liberouAssinatura)) : [];
	const bloqueiosFixos = bloqueios.filter((b) => b.codigo !== "FALTA_ASSINATURA");
	const contaveis = esperados.filter((i) => !naoSaem.includes(i.itemId) && !(sentido === "volta" && i.voltou));
	const lidas = contaveis.filter((i) => leituras[i.unidade.id]).length;
	const total = contaveis.length;
	const tudoLido = lidas === total && total > 0;
	const podeConcluirSaida = sentido === "saida" && tudoLido && bloqueios.length === 0 && !offline;
	const podeConcluirVolta = sentido === "volta" && lidas > 0 && !offline;
	const at = sentido === "volta" ? Q.atrasoDa(reservaId, agora) : null;
	const guardadas = Object.values(leituras).filter((l) => l.guardada).length;
	const contatos = Q.contatosDo(c.id).filter((x) => x.podeRetirar);

	if (concluido) {
		return (
			<div className="flex flex-col gap-4 py-6">
				<EstadoVazio
					icone={CheckmarkOutline}
					titulo={sentido === "saida" ? `Reserva ${r.id} está na rua.` : lidas === total ? `Reserva ${r.id} devolvida.` : `Volta registrada: ${lidas} de ${total} peças.`}
					descricao={
						sentido === "saida"
							? `Saída concluída por ${usuario.nome} às ${horaRelogio(new Date())}. O termo de retirada foi gerado em PDF.`
							: lidas === total
								? `O termo de devolução foi gerado em PDF e o dono recebeu a tarefa "Devolver caução".`
								: "A reserva continua na rua e as peças que faltam ficam pendentes com o cliente."
					}
					acao={
						<Button asChild variant="outline" className="h-12 text-base">
							<Link href="/balcao">Voltar ao balcão</Link>
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<header className="sticky top-0 z-30 -mx-4 flex h-14 items-center gap-2 border-b bg-background px-2">
				<Button asChild variant="ghost" size="icon" aria-label="Voltar ao balcão">
					<Link href="/balcao">
						<Icon icon={ArrowLeft} />
					</Link>
				</Button>
				<h1 className="min-w-0 flex-1 truncate font-medium text-lg">
					{sentido === "saida" ? "Saída" : "Volta"} · Reserva {r.id}
				</h1>
				<span className="shrink-0 rounded-full bg-muted px-3 py-1 font-mono text-base tabular-nums" aria-label={`${lidas} de ${total} lidas`}>
					{lidas} de {total}
				</span>
			</header>

			<FaixaLeitura faixa={faixa} />

			{offline ? (
				<div role="status" className="flex items-center gap-2 rounded-md border border-atencao-borda bg-atencao-fundo px-3 py-2 text-atencao">
					<Icon icon={WifiOff} className="size-5 shrink-0" />
					Sem internet: {guardadas} {guardadas === 1 ? "leitura guardada" : "leituras guardadas"}
				</div>
			) : null}

			<p className="text-muted-foreground">
				{Q.nomeCurtoCliente(c)} · {sentido === "saida" ? `retirada ${mesmoDia(r.retiradaEm, agora) ? "hoje" : ""} ${hora(r.retiradaEm)}` : `devolução ${hora(r.devolucaoEm)}`}
				{at ? (
					<span className={cn("ml-1", at.alemDaTolerancia ? "text-erro" : "text-atencao")}>
						· atrasada há {duracao(at.ms)}
						{at.alemDaTolerancia ? ` (${at.horasCobradas} h depois da tolerância de 60 min)` : " (dentro da tolerância)"}
					</span>
				) : null}
			</p>

			<LeitorCamera
				aoLer={ler}
				digitando={digitando}
				aoDigitar={() => {
					setDigitando((d) => !d);
					setFoco((f) => f + 1);
				}}
				extra={
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" data-alvo className="text-base">
								Simular leitura
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-64">
							<DropdownMenuLabel>Protótipo: simular a câmera</DropdownMenuLabel>
							<DropdownMenuItem onSelect={simularProxima}>Ler a próxima peça</DropdownMenuItem>
							<DropdownMenuItem onSelect={simularRepetida}>Ler de novo a última</DropdownMenuItem>
							{sentido === "saida" ? <DropdownMenuItem onSelect={simularMesmoModelo}>Ler outra unidade do mesmo modelo</DropdownMenuItem> : null}
							<DropdownMenuItem onSelect={simularOutraReserva}>Ler peça de outra reserva</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				}
			/>
			{digitando ? <CampoCodigo aoLer={ler} foco={foco} /> : null}

			<ul className="flex flex-col divide-y overflow-hidden rounded-lg border bg-card">
				{itens
					.filter((i) => sentido === "saida" || i.saiu)
					.map((i) => {
						const l = leituras[i.unidade.id];
						const naoSai = naoSaem.includes(i.itemId);
						const s = naoSai ? { tom: "neutro" as Tom, texto: "Não vai sair", icone: Misuse } : rotuloSituacao(i, l, sentido);
						return (
							<li
								key={i.itemId}
								className={cn("flex min-h-14 items-center gap-3 px-3 py-2", piscar === i.unidade.id && "animate-piscar-ok", naoSai && "opacity-60")}
							>
								<FotoEquipamento nome={i.equipamento.nome} tamanho={40} />
								<span className="flex min-w-0 flex-1 flex-col">
									<span className={cn("truncate font-medium", naoSai && "line-through")}>
										{i.equipamento.nome}
										{i.basico ? <span className="font-normal text-muted-foreground text-sm"> · pacote básico</span> : null}
									</span>
									<span className="font-mono text-muted-foreground text-sm">{i.unidade.codigo}</span>
									{l?.guardada ? <span className="text-atencao text-sm">Não entregue ainda: falta o sistema confirmar</span> : null}
								</span>
								<span className={cn("flex shrink-0 items-center gap-1.5 text-sm", TONS[s.tom].texto, s.tom === "neutro" && "text-muted-foreground")}>
									<Icon icon={s.icone} motion="none" className="size-5" />
									{s.texto}
								</span>
							</li>
						);
					})}
				{avisos.map((a) => {
					const u = a.unidadeId ? Q.unidade(a.unidadeId) : undefined;
					const e = u ? Q.equipamento(u.equipamentoId) : undefined;
					return (
						<li key={a.chave} className="flex min-h-14 flex-col gap-2 bg-atencao-fundo px-3 py-2">
							<span className="flex items-center gap-3">
								<FotoEquipamento nome={e?.nome ?? "?"} tamanho={40} />
								<span className="flex min-w-0 flex-1 flex-col text-atencao">
									<span className="font-medium">{e?.nome}</span>
									<span className="text-sm">
										Outra unidade do mesmo modelo: trocar pela <span className="font-mono">{a.codigo}</span>?
									</span>
								</span>
							</span>
							<span className="flex gap-2 pl-[52px]">
								<Button variant="outline" className="h-12 text-base" onClick={() => aceitarTroca(a)}>
									Sim, trocar
								</Button>
								<Button variant="ghost" className="h-12 text-base" onClick={() => setAvisos((x) => x.filter((y) => y.chave !== a.chave))}>
									Não
								</Button>
							</span>
						</li>
					);
				})}
			</ul>

			<label className="flex min-h-12 items-center justify-between gap-3 text-muted-foreground">
				Vibração e som ao ler
				<Switch checked={vibracao} onCheckedChange={setVibracao} aria-label="Vibração e som ao ler" />
			</label>

			{sentido === "saida" ? (
				<section className="flex flex-col gap-3 rounded-lg border bg-card p-3">
					<TituloGrupo className="text-base">Quem retira</TituloGrupo>
					<label className="flex flex-col gap-1.5">
						<span className="sr-only">Quem retira</span>
						<select
							value={quemRetira}
							onChange={(e) => setQuemRetira(e.target.value)}
							className="h-12 w-full rounded-md border border-input bg-background px-3 text-base shadow-campo outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-muted"
						>
							{c.tipo === "pf" ? <option value="titular">{c.nome} (titular)</option> : null}
							{contatos.map((x) => (
								<option key={x.id} value={String(x.id)}>
									{x.nome} ({x.funcao})
								</option>
							))}
						</select>
					</label>
					<label className="flex min-h-12 items-center gap-3">
						<Checkbox checked={documentoConferido} onCheckedChange={(v) => setDocumentoConferido(v === true)} className="size-5" />
						Documento de quem retira conferido
					</label>
					<Button variant="ghost" className="h-12 justify-start text-base" onClick={() => toast("Assinatura na tela: opcional. O termo de retirada sai em PDF.")}>
						Assinar na tela (opcional)
					</Button>
				</section>
			) : null}

			<div className="sticky bottom-0 z-20 -mx-4 flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-4">
				{bloqueios.length ? (
					<div role="alert" className="flex flex-col gap-2 rounded-md border border-erro-borda bg-erro-fundo px-3 py-2 text-erro">
						<span className="flex items-center gap-2 font-medium">
							<Icon icon={Misuse} motion="none" className="size-5 shrink-0" />
							Saída bloqueada
						</span>
						<ul className="flex flex-col gap-1.5">
							{bloqueios.map((b) => (
								<li key={b.frase} className="flex items-center justify-between gap-2 text-sm">
									<span>{b.frase}</span>
									{ehDono ? (
										<Button variant="outline" size="sm" className="shrink-0 text-foreground" onClick={() => abrir("reserva", r.id)}>
											Abrir ficha
										</Button>
									) : (
										<Button variant="outline" size="sm" className="shrink-0 text-foreground" onClick={() => toast.success("Avisamos os donos pelo app")}>
											Chame o dono
										</Button>
									)}
								</li>
							))}
						</ul>
					</div>
				) : null}
				{at && sentido === "volta" && at.alemDaTolerancia ? (
					<p className="text-sm text-muted-foreground">
						{ehDono
							? `Multa por hora: percentual a definir. Por enquanto o app só conta as ${at.horasCobradas} h de atraso e avisa você.`
							: `${at.horasCobradas} h de atraso depois da tolerância. O dono decide o desconto na caução.`}
					</p>
				) : null}
				{sentido === "saida" ? (
					<>
						<Button className="h-12 w-full text-base" disabled={!podeConcluirSaida} onClick={() => setConfirmar(true)} title={offline ? "Concluir a saída só com internet: o sistema confere tudo de novo." : undefined}>
							Concluir saída ({lidas} de {total})
						</Button>
						<Button variant="ghost" className="h-12 w-full text-base" onClick={() => setPendencia(true)}>
							Concluir com pendência
						</Button>
					</>
				) : (
					<Button className="h-12 w-full text-base" disabled={!podeConcluirVolta} onClick={() => setConfirmar(true)} title={offline ? "Volta quando a internet voltar" : undefined}>
						Concluir volta ({lidas} de {total})
					</Button>
				)}
				{offline ? <p className="text-center text-sm text-muted-foreground">Concluir só com internet: o sistema confere tudo de novo.</p> : null}
			</div>

			<GavetaVolta
				item={gaveta}
				aoFechar={() => setGaveta(null)}
				aoConfirmar={(res) => {
					if (gaveta) registrar(gaveta.unidade.id, res, gaveta.equipamento.nome, gaveta.unidade.codigo);
					if (res === "problema") toast("Manutenção aberta. A peça foi para reparo e fica bloqueada na agenda.");
					setGaveta(null);
				}}
			/>

			<AlertDialog open={confirmar} onOpenChange={setConfirmar}>
				<AlertDialogContent data-balcao>
					<AlertDialogHeader>
						<AlertDialogTitle>{sentido === "saida" ? `Concluir a saída da reserva ${r.id}?` : `Concluir a volta da reserva ${r.id}?`}</AlertDialogTitle>
						<AlertDialogDescription className="text-base">
							{sentido === "saida"
								? "A reserva passa para Na rua. Depois de concluir, não dá para desfazer as leituras."
								: lidas === total
									? "Todas as peças voltaram. A reserva passa para Devolvida e a caução fica para o dono devolver."
									: `Faltam ${total - lidas} ${total - lidas === 1 ? "peça" : "peças"}: a reserva continua na rua e elas ficam pendentes com o cliente.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="h-12 text-base">Cancelar</AlertDialogCancel>
						<Button
							className="h-12 text-base"
							onClick={() => {
								setConfirmar(false);
								setConcluido(true);
								toast.success(sentido === "saida" ? `Saída da reserva ${r.id} concluída` : `Volta da reserva ${r.id} registrada`);
							}}
						>
							{sentido === "saida" ? "Concluir saída" : "Concluir volta"}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={pendencia} onOpenChange={setPendencia}>
				<AlertDialogContent data-balcao className="max-h-[90dvh] overflow-y-auto">
					<AlertDialogHeader>
						<AlertDialogTitle>Concluir com pendência</AlertDialogTitle>
						<AlertDialogDescription className="text-base">
							Marque as peças que não vão sair, com motivo. Nenhum motivo libera aluguel ou caução sem confirmação do sistema, nem cliente não aprovado.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex flex-col gap-3">
						<ul className="flex flex-col gap-1">
							{itens
								.filter((i) => !leituras[i.unidade.id])
								.map((i) => (
									<li key={i.itemId}>
										<label className="flex min-h-12 items-center gap-3">
											<Checkbox
												className="size-5"
												checked={naoSaem.includes(i.itemId)}
												onCheckedChange={(v) => setNaoSaem((x) => (v === true ? [...x, i.itemId] : x.filter((y) => y !== i.itemId)))}
											/>
											<span className="flex flex-col">
												<span>{i.equipamento.nome} não vai sair</span>
												<span className="font-mono text-muted-foreground text-sm">{i.unidade.codigo}</span>
											</span>
										</label>
									</li>
								))}
						</ul>
						{naoSaem.length ? (
							<label className="flex flex-col gap-1.5">
								<span>Motivo</span>
								<input value={motivoNaoSai} onChange={(e) => setMotivoNaoSai(e.target.value)} className="h-12 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-muted" placeholder="Ex.: cliente não quis levar" />
							</label>
						) : null}
						{ehDono && Q.bloqueiosSaida(reservaId).some((b) => b.codigo === "FALTA_ASSINATURA") ? (
							<label className="flex flex-col gap-1.5">
								<span>Liberar a falta de assinatura (só o dono), com motivo</span>
								<input value={motivoAssinatura} onChange={(e) => setMotivoAssinatura(e.target.value)} className="h-12 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-muted" placeholder="Motivo fica registrado na reserva" />
							</label>
						) : null}
						{bloqueiosFixos.length ? (
							<p role="alert" className="rounded-md border border-erro-borda bg-erro-fundo px-3 py-2 text-erro text-sm">
								{bloqueiosFixos.map((b) => b.frase).join(" · ")}. Isso não se libera aqui.
							</p>
						) : null}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel className="h-12 text-base">Cancelar</AlertDialogCancel>
						<Button
							className="h-12 text-base"
							disabled={(naoSaem.length > 0 && !motivoNaoSai.trim()) || (naoSaem.length === 0 && !motivoAssinatura.trim())}
							onClick={() => {
								setPendencia(false);
								if (motivoAssinatura.trim()) setLiberouAssinatura(motivoAssinatura.trim());
								toast.success(
									[naoSaem.length ? `${naoSaem.length} ${naoSaem.length === 1 ? "peça marcada" : "peças marcadas"} como não sai` : null, motivoAssinatura.trim() ? "falta de assinatura liberada com motivo" : null]
										.filter(Boolean)
										.join(" · "),
								);
							}}
						>
							Aplicar
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

/* ---------------------------------------------------------------- tela */

function Aviso({ titulo, descricao, href, rotulo }: { titulo: string; descricao: string; href?: string; rotulo?: string }) {
	return (
		<div className="flex flex-col gap-4 py-6">
			<EstadoVazio
				icone={WarningAlt}
				titulo={titulo}
				descricao={descricao}
				acao={
					<div className="flex flex-col gap-2">
						{href ? (
							<Button asChild variant="outline" className="h-12 text-base">
								<Link href={href}>{rotulo}</Link>
							</Button>
						) : null}
						<Button asChild variant="ghost" className="h-12 text-base">
							<Link href="/balcao">Voltar ao balcão</Link>
						</Button>
					</div>
				}
			/>
		</div>
	);
}

export function TelaBalcao() {
	useEscuroNoBalcao();
	const agora = useAgora(30_000);
	const busca = useBusca();
	const id = Number(busca.get("reserva"));
	const sentido = busca.get("sentido") === "volta" ? "volta" : "saida";
	const r = id ? D.reservas.find((x) => x.id === id) : undefined;

	let conteudo: React.ReactNode;
	if (!id) conteudo = <Entrada agora={agora} />;
	else if (!r) conteudo = <Aviso titulo="Reserva não encontrada." descricao="Confira o número ou leia uma etiqueta na entrada do balcão." />;
	else if (sentido === "saida" && r.etapa === "retirada")
		conteudo = <Aviso titulo={`A reserva ${r.id} já está na rua.`} descricao="Para receber as peças, abra a volta." href={`/balcao?reserva=${r.id}&sentido=volta`} rotulo="Abrir volta" />;
	else if (sentido === "saida" && r.etapa === "pre_reserva" && r.expiraEm && r.expiraEm.getTime() <= agora.getTime())
		conteudo = <Aviso titulo={`A pré-reserva ${r.id} expirou.`} descricao="Os 20 minutos passaram sem pagamento e as peças foram liberadas." />;
	else if (sentido === "saida" && !["pre_reserva", "confirmada", "separada"].includes(r.etapa))
		conteudo = <Aviso titulo={`A reserva ${r.id} não tem saída para fazer.`} descricao="Só reservas confirmadas ou separadas saem pelo balcão." />;
	else if (sentido === "volta" && r.etapa !== "retirada")
		conteudo = <Aviso titulo={`A reserva ${r.id} não está na rua.`} descricao="Só reservas na rua recebem volta." />;
	else conteudo = <Operacao key={`${r.id}-${sentido}`} reservaId={r.id} sentido={sentido} agora={agora} />;

	return (
		<main id="conteudo" data-balcao className="flex min-h-0 flex-1 flex-col overflow-y-auto">
			<div className="mx-auto flex w-full max-w-[420px] flex-col px-4 pt-0 pb-6">
				<div className={cn(!id && "pt-4")}>{conteudo}</div>
			</div>
		</main>
	);
}
