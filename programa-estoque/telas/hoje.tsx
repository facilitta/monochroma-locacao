"use client";
// 7.1 Hoje: o que sai, o que volta e o que precisa do dono agora.

import Add from "@carbon/icons-react/es/Add";
import ArrowDown from "@carbon/icons-react/es/ArrowDown";
import ArrowUp from "@carbon/icons-react/es/ArrowUp";
import Chat from "@carbon/icons-react/es/Chat";
import Delivery from "@carbon/icons-react/es/Delivery";
import Tools from "@carbon/icons-react/es/Tools";
import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import Time from "@carbon/icons-react/es/Time";
import { BotaoAcaoAlerta, useAbrirAlerta } from "@/componentes/atendimento/acoes-alerta";
import {
	BlocoNumeros,
	CabecalhoPagina,
	Cartao,
	Codigo,
	ContadorRegressivo,
	EstadoErro,
	EstadoVazio,
	FotoCliente,
	Pagina,
	TituloGrupo,
	type Numero,
} from "@/componentes/ui/basicos";
import { Button } from "@/componentes/ui/button";
import { useFicha } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { EtapaRotulo, Selo } from "@/componentes/ui/marcadores";
import { Skeleton } from "@/componentes/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/componentes/ui/toggle-group";
import { useEstadoTela } from "@/lib/estado-prototipo";
import {
	DIA,
	dataCurta,
	diaSemana,
	diaSemanaLongo,
	dinheiro,
	duracao,
	hora,
	horaRelogio,
	mesmoDia,
	relativa,
} from "@/lib/formatos";
import { Link } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { TONS } from "@/lib/regras/situacao";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { mensagensDaConversa } from "@/prototipo/consultas-atendimento";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Periodo = "hoje" | "amanha" | "semana";

type Movimento = {
	chave: string;
	em: Date;
	tipo: "saida" | "volta";
	feito: boolean;
	reserva: D.Reserva;
};

function movimentosDoDia(dia: Date, agora: Date, incluirAtrasadas: boolean): Movimento[] {
	const lista: Movimento[] = [];
	for (const r of D.reservas) {
		if (["pre_reserva", "confirmada", "separada"].includes(r.etapa) && mesmoDia(r.retiradaEm, dia)) {
			if (r.etapa === "pre_reserva" && r.expiraEm && r.expiraEm.getTime() <= agora.getTime()) continue;
			lista.push({ chave: `s${r.id}`, em: r.retiradaEm, tipo: "saida", feito: false, reserva: r });
		}
		if (r.saidaEm && mesmoDia(r.saidaEm, dia)) lista.push({ chave: `sf${r.id}`, em: r.saidaEm, tipo: "saida", feito: true, reserva: r });
		if (r.etapa === "retirada" && (mesmoDia(r.devolucaoEm, dia) || (incluirAtrasadas && r.devolucaoEm.getTime() < agora.getTime())))
			lista.push({ chave: `v${r.id}`, em: r.devolucaoEm, tipo: "volta", feito: false, reserva: r });
		if (r.etapa === "devolvida" && r.voltaEm && mesmoDia(r.voltaEm, dia)) lista.push({ chave: `vf${r.id}`, em: r.voltaEm, tipo: "volta", feito: true, reserva: r });
	}
	return lista.sort((a, b) => a.em.getTime() - b.em.getTime());
}

function SituacaoMovimento({ m, agora }: { m: Movimento; agora: Date }) {
	const r = m.reserva;
	if (m.tipo === "saida" && m.feito) return <Selo tom="ok">Saiu às {horaRelogio(m.em)}</Selo>;
	if (m.tipo === "volta" && m.feito) return <Selo tom="ok">Voltou às {horaRelogio(m.em)}</Selo>;
	if (m.tipo === "volta") {
		const at = Q.atrasoDa(r.id, agora);
		const pendentes = D.movimentacoes.some((x) => x.reservaId === r.id && x.tipo === "volta");
		return (
			<span className="flex flex-wrap items-center gap-1.5">
				<EtapaRotulo etapa={r.etapa} />
				{at ? <Selo tom={at.alemDaTolerancia ? "erro" : "atencao"}>Atrasada há {duracao(at.ms)}</Selo> : null}
				{pendentes ? <Selo tom="atencao">Peças pendentes</Selo> : null}
			</span>
		);
	}
	const b = Q.bloqueiosSaida(r.id);
	const pg = Q.situacaoPagamentos(r.id);
	return (
		<span className="flex flex-wrap items-center gap-1.5">
			<EtapaRotulo etapa={r.etapa} />
			{!pg.aluguelConfirmado ? <Selo tom="atencao">Falta pagamento</Selo> : !pg.caucaoConfirmada ? <Selo tom="atencao">Falta caução</Selo> : null}
			{b.some((x) => x.codigo === "CLIENTE_NAO_APROVADO") ? <Selo tom="atencao">Cliente novo</Selo> : null}
			{b.some((x) => x.codigo === "FALTA_ASSINATURA") ? <Selo tom="atencao">Falta assinar</Selo> : null}
		</span>
	);
}

function LinhaMovimento({ m, agora, mostrarDia }: { m: Movimento; agora: Date; mostrarDia: boolean }) {
	const { abrir } = useFicha();
	const r = m.reserva;
	const c = Q.cliente(r.clienteId);
	const balcao = !m.feito && mesmoDia(m.em, agora) ? `/balcao?reserva=${r.id}&sentido=${m.tipo}` : !m.feito && m.tipo === "volta" ? `/balcao?reserva=${r.id}&sentido=volta` : null;
	return (
		<li className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-3 md:py-2.5">
			<button
				type="button"
				data-alvo
				onClick={() => abrir("reserva", r.id)}
				className="flex min-w-0 flex-1 items-start gap-3 text-left md:items-center"
			>
				<span className="w-16 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
					{mostrarDia ? <span className="block text-2xs">{diaSemana(m.em)} {dataCurta(m.em)}</span> : null}
					{mesmoDia(m.em, agora) || mostrarDia
						? horaRelogio(m.em)
						: mesmoDia(m.em, new Date(agora.getTime() - DIA))
							? `ontem ${hora(m.em)}`
							: `${diaSemana(m.em)} ${hora(m.em)}`}
				</span>
				<span
					aria-label={m.tipo === "saida" ? "saída" : "volta"}
					className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted md:mt-0", m.feito ? "text-muted-foreground" : "text-foreground")}
				>
					<Icon icon={m.tipo === "saida" ? ArrowUp : ArrowDown} className="size-3.5" motion="none" />
				</span>
				<span className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-3">
					<span className="flex min-w-0 items-baseline gap-2">
						<span className="truncate font-medium text-sm md:text-xs">{Q.nomeCurtoCliente(c)}</span>
						<Codigo className="text-muted-foreground">{r.id}</Codigo>
						<span className="hidden truncate text-muted-foreground text-xs lg:inline">{Q.resumoItens(r.id)}</span>
					</span>
					<SituacaoMovimento m={m} agora={agora} />
				</span>
			</button>
			{balcao ? (
				<Button asChild variant="outline" size="sm" className="w-full shrink-0 md:w-auto">
					<Link href={balcao}>Abrir balcão</Link>
				</Button>
			) : null}
		</li>
	);
}

function SaidasEVoltas({ periodo, agora, erro }: { periodo: Periodo; agora: Date; erro: boolean }) {
	const [tentativa, setTentativa] = useState(0);
	const dias = periodo === "hoje" ? [agora] : periodo === "amanha" ? [new Date(agora.getTime() + DIA)] : Array.from({ length: 7 }, (_, i) => new Date(agora.getTime() + i * DIA));
	const grupos = dias.map((d, i) => ({ dia: d, lista: movimentosDoDia(d, agora, periodo === "hoje" || (periodo === "semana" && i === 0)) })).filter((g) => g.lista.length);
	const titulo = periodo === "hoje" ? "Saídas e voltas de hoje" : periodo === "amanha" ? "Saídas e voltas de amanhã" : "Saídas e voltas dos próximos 7 dias";
	const proxima = D.reservas
		.filter((r) => ["confirmada", "separada"].includes(r.etapa) && r.retiradaEm.getTime() > agora.getTime())
		.sort((a, b) => a.retiradaEm.getTime() - b.retiradaEm.getTime())[0];
	return (
		<Cartao titulo={titulo} className="order-2 lg:order-none lg:col-span-2">
			{erro && tentativa === 0 ? (
				<EstadoErro frase="Não consegui carregar as saídas e voltas." aoTentar={() => setTentativa(1)} />
			) : grupos.length === 0 ? (
				<EstadoVazio
					icone={Delivery}
					titulo={periodo === "hoje" ? "Nada saindo nem voltando hoje." : "Nada saindo nem voltando neste período."}
					descricao={
						proxima
							? `Próxima saída: ${diaSemanaLongo(proxima.retiradaEm)}, ${hora(proxima.retiradaEm)}, ${Q.cliente(proxima.clienteId).nome}.`
							: "Quando houver reserva confirmada, ela aparece aqui."
					}
				/>
			) : (
				<div className="flex flex-col">
					{grupos.map((g) => (
						<div key={g.dia.toISOString()} className="flex flex-col">
							{periodo === "semana" ? (
								<TituloGrupo className="border-b bg-muted/40 px-4 py-1.5">
									{mesmoDia(g.dia, agora) ? "Hoje" : `${diaSemanaLongo(g.dia)}, ${dataCurta(g.dia)}`}
								</TituloGrupo>
							) : null}
							<ul className="flex flex-col divide-y">
								{g.lista.map((m) => (
									<LinhaMovimento key={m.chave} m={m} agora={agora} mostrarDia={false} />
								))}
							</ul>
						</div>
					))}
				</div>
			)}
		</Cartao>
	);
}

const BLOCOS: { id: Q.Bloco; nome: string }[] = [
	{ id: "agora", nome: "Agora" },
	{ id: "conferir", nome: "Conferir" },
	{ id: "organizar", nome: "Organizar" },
];

function PrecisaDeVoce({ agora, balcao, erro, vazio }: { agora: Date; balcao: boolean; erro: boolean; vazio: boolean }) {
	const abrirAlerta = useAbrirAlerta();
	const [tentativa, setTentativa] = useState(0);
	const lista = vazio ? [] : Q.alertasDoHoje(agora, balcao);
	return (
		<Cartao
			titulo={balcao ? `Alertas do balcão (${lista.length})` : `Precisa de você (${lista.length})`}
			acao={
				<Button asChild variant="ghost" size="sm">
					<Link href="/alertas">Ver todos</Link>
				</Button>
			}
			className="order-1 lg:order-none"
		>
			{erro && tentativa === 0 ? (
				<EstadoErro frase="Não consegui carregar os alertas." aoTentar={() => setTentativa(1)} />
			) : lista.length === 0 ? (
				<EstadoVazio icone={CheckmarkOutline} titulo="Tudo em dia." descricao="Quando algo precisar de você, aparece aqui." />
			) : (
				<div className="flex flex-col py-1">
					{BLOCOS.map((b) => {
						const itens = lista.filter((a) => a.bloco === b.id);
						if (!itens.length) return null;
						return (
							<div key={b.id} className="flex flex-col">
								<TituloGrupo className="px-4 pt-2.5 pb-1">{b.nome}</TituloGrupo>
								<ul className="flex flex-col">
									{itens.map((a) => {
										const r = a.reservaId ? Q.reserva(a.reservaId) : undefined;
										const nome = r ? Q.nomeCurtoCliente(Q.cliente(r.clienteId)) : a.clienteId ? Q.nomeCurtoCliente(Q.cliente(a.clienteId)) : a.unidadeId ? Q.unidade(a.unidadeId).codigo : undefined;
										return (
											<li key={a.chave} className="flex items-start gap-2 px-4 py-2 hover:bg-muted/60">
												<button type="button" data-alvo onClick={() => abrirAlerta(a)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
													<Icon icon={TONS[a.tom].icone} motion="none" className={cn("mt-0.5 size-4 shrink-0", TONS[a.tom].texto)} />
													<span className="flex min-w-0 flex-1 flex-col">
														<span className="text-xs/5">{a.frase}</span>
														<span className="text-muted-foreground text-xs">
															{[a.reservaId ? `Reserva ${a.reservaId}` : null, nome].filter(Boolean).join(" · ")}
															{" · "}
															{relativa(a.desde, agora)}
														</span>
													</span>
												</button>
												<BotaoAcaoAlerta alerta={a} tamanho="xs" className="mt-0.5 shrink-0" />
											</li>
										);
									})}
								</ul>
							</div>
						);
					})}
				</div>
			)}
		</Cartao>
	);
}

function PreReservas({ agora }: { agora: Date }) {
	const { abrir } = useFicha();
	const [expiradas, setExpiradas] = useState<number[]>([]);
	const lista = D.reservas.filter(
		(r) => r.etapa === "pre_reserva" && r.expiraEm && r.expiraEm.getTime() > agora.getTime() && !expiradas.includes(r.id),
	);
	return (
		<Cartao titulo="Pré-reservas correndo" descricao="Os 20 minutos contam do envio da ordem e não renovam." className="order-3 lg:order-none lg:col-span-2">
			{lista.length === 0 ? (
				<EstadoVazio icone={Time} titulo="Nenhuma pré-reserva correndo." descricao="Quando o robô ou você enviar uma ordem, o contador aparece aqui." />
			) : (
				<ul className="flex flex-col divide-y">
					{lista.map((r) => {
						const pg = Q.situacaoPagamentos(r.id);
						return (
							<li key={r.id}>
								<button type="button" data-alvo onClick={() => abrir("reserva", r.id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-left hover:bg-muted/60">
									<Codigo>{r.id}</Codigo>
									<span className="font-medium text-xs">{Q.nomeCurtoCliente(Q.cliente(r.clienteId))}</span>
									<span className="text-muted-foreground text-xs">expira em</span>
									<ContadorRegressivo
										expiraEm={r.expiraEm as Date}
										aoExpirar={() => {
											setExpiradas((x) => [...x, r.id]);
											toast(`Reserva ${r.id} expirou`);
										}}
									/>
									{Q.ehSegundaChance(r.id) ? <Selo tom="info">2ª chance</Selo> : null}
									<span className="flex flex-wrap gap-1.5 md:ml-auto">
										<Selo tom={pg.aluguelConfirmado ? "ok" : "atencao"}>{pg.aluguelConfirmado ? "Aluguel confirmado" : "Aluguel: aguardando"}</Selo>
										<Selo tom={pg.caucaoConfirmada ? "ok" : "atencao"}>{pg.caucaoConfirmada ? "Caução confirmada" : "Caução: aguardando"}</Selo>
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</Cartao>
	);
}

function ConversasEsperando({ agora }: { agora: Date }) {
	const lista = D.conversas
		.filter((c) => c.comQuem === "equipe")
		.map((c) => {
			const msgs = mensagensDaConversa(c.id);
			const ultimaCliente = [...msgs].reverse().find((m) => m.autor === "cliente");
			return { c, ultimaCliente };
		})
		.sort((a, b) => (a.ultimaCliente?.em.getTime() ?? 0) - (b.ultimaCliente?.em.getTime() ?? 0));
	const comRobo = D.conversas.filter((c) => c.comQuem === "robo").length;
	return (
		<Cartao
			titulo="Conversas esperando você"
			acao={
				<Button asChild variant="ghost" size="sm">
					<Link href="/conversas">Abrir conversas</Link>
				</Button>
			}
			className="order-4 lg:order-none"
		>
			{lista.length === 0 ? (
				<EstadoVazio icone={Chat} titulo="Nenhuma conversa esperando você." descricao={`O robô está cuidando de ${comRobo}.`} />
			) : (
				<ul className="flex flex-col divide-y">
					{lista.map(({ c, ultimaCliente }) => (
						<li key={c.id}>
							<Link href={`/conversas?conversa=${c.id}`} data-alvo className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60">
								<FotoCliente nome={c.nomeExibido} tamanho={24} />
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate font-medium text-xs">
										{Q.nomeCurtoCliente(c.clienteId ? Q.cliente(c.clienteId) : ({ tipo: "pf", nome: c.nomeExibido } as D.Cliente))}
										{c.assumidaPor ? <span className="font-normal text-muted-foreground"> · assumida por {c.assumidaPor}</span> : null}
									</span>
									<span className="truncate text-muted-foreground text-xs">"{ultimaCliente?.texto ?? "…"}"</span>
								</span>
								<span className="shrink-0 text-muted-foreground text-xs">{ultimaCliente ? relativa(ultimaCliente.em, agora).replace("há ", "") : ""}</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</Cartao>
	);
}

const SITUACAO_MANUTENCAO: Record<D.SituacaoManutencao, string> = {
	aberta: "aberta",
	na_oficina: "na oficina",
	esperando_peca: "esperando peça",
	pronta: "pronta",
	liberada: "liberada",
	descartada: "descartada",
};

function EmManutencao({ agora, vazio }: { agora: Date; vazio: boolean }) {
	const { abrir } = useFicha();
	const abertas = vazio ? [] : D.manutencoes.filter((m) => !["liberada", "descartada"].includes(m.situacao));
	const comReserva = new Set(Q.alertas(agora).filter((a) => a.numero === 8).map((a) => a.unidadeId));
	return (
		<Cartao titulo="Em manutenção" className="order-5 lg:order-none lg:col-span-3">
			{abertas.length === 0 ? (
				<EstadoVazio icone={Tools} titulo="Nenhuma peça em reparo. Bom sinal." descricao="Peça que volta com problema entra aqui e fica bloqueada na agenda." />
			) : (
				<ul className="flex flex-col divide-y">
					{abertas.map((m) => {
						const u = Q.unidade(m.unidadeId);
						const e = Q.equipamento(u.equipamentoId);
						return (
							<li key={m.id}>
								<button type="button" data-alvo onClick={() => abrir("manutencao", m.id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left hover:bg-muted/60">
									<Codigo>{u.codigo}</Codigo>
									<span className="font-medium text-xs">{e.nome}</span>
									<span className="text-muted-foreground text-xs">
										{SITUACAO_MANUTENCAO[m.situacao]} · parada há {duracao(agora.getTime() - m.abertaEm.getTime())}
									</span>
									<span className="flex gap-1.5 md:ml-auto">
										{comReserva.has(u.id) ? <Selo tom="atencao">Tem reserva</Selo> : null}
										{agora.getTime() - m.abertaEm.getTime() > 15 * DIA ? <Selo tom="info">Há mais de 15 dias</Selo> : null}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</Cartao>
	);
}

function Esqueleto() {
	return (
		<div aria-busy="true" className="flex flex-col gap-6">
			<span className="sr-only">Carregando</span>
			<div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border lg:grid-cols-4">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="flex flex-col gap-2 p-4">
						<Skeleton className="h-3 w-24" />
						<Skeleton className="h-6 w-16" />
					</div>
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-3">
				<Skeleton className="h-72 rounded-lg lg:col-span-2" />
				<Skeleton className="h-72 rounded-lg" />
			</div>
		</div>
	);
}

function saudacao(d: Date): string {
	const h = Number(horaRelogio(d).slice(0, 2));
	return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export function TelaHoje() {
	const agora = useAgora(30_000);
	const estado = useEstadoTela();
	const { ehDono, podeVerFinanceiro } = usePapel();
	const [periodo, setPeriodo] = useState<Periodo>("hoje");
	const vazio = estado === "vazio";

	const numeros = useMemo<Numero[]>(() => {
		if (vazio) {
			return [
				{ rotulo: "Saídas hoje", valor: "0", href: "/balcao" },
				{ rotulo: "Voltas hoje", valor: "0", href: "/balcao" },
				podeVerFinanceiro ? { rotulo: "Aguardando pagamento", valor: "0", href: "/pagamentos" } : { rotulo: "Em manutenção", valor: "0", href: "/manutencao" },
				{ rotulo: "Na rua agora", valor: "0", href: "/unidades" },
			];
		}
		const n = Q.numerosDoHoje(agora);
		const manut = D.manutencoes.filter((m) => !["liberada", "descartada"].includes(m.situacao)).length;
		return [
			{ rotulo: "Saídas hoje", valor: `${n.saidas}`, detalhe: `${n.itensSaindo} itens`, href: "/balcao" },
			{ rotulo: "Voltas hoje", valor: `${n.voltas}`, detalhe: n.atrasadas ? `${n.atrasadas} ${n.atrasadas === 1 ? "atrasada" : "atrasadas"}` : "nenhuma atrasada", href: "/balcao" },
			podeVerFinanceiro
				? { rotulo: "Aguardando pagamento", valor: `${n.aguardando}`, detalhe: dinheiro(n.aguardandoValor), href: "/pagamentos" }
				: { rotulo: "Em manutenção", valor: `${manut}`, detalhe: manut === 1 ? "peça" : "peças", href: "/manutencao" },
			{ rotulo: "Na rua agora", valor: `${n.naRua}`, detalhe: `de ${n.totalUnidades} unidades`, href: "/unidades" },
		];
	}, [agora, podeVerFinanceiro, vazio]);

	return (
		<Pagina>
			<CabecalhoPagina
				titulo={saudacao(agora)}
				descricao={`${diaSemanaLongo(agora)}, ${dataCurta(agora)} · ${horaRelogio(agora)}`}
				acoes={
					<>
						<ToggleGroup
							type="single"
							variant="outline"
							spacing={0}
							value={periodo}
							onValueChange={(v) => v && setPeriodo(v as Periodo)}
							aria-label="Período"
						>
							<ToggleGroupItem value="hoje">Hoje</ToggleGroupItem>
							<ToggleGroupItem value="amanha">Amanhã</ToggleGroupItem>
							<ToggleGroupItem value="semana">7 dias</ToggleGroupItem>
						</ToggleGroup>
						{ehDono ? (
							<Button asChild>
								<Link href="/pedido/novo">
									<Icon icon={Add} data-icon="inline-start" />
									Nova reserva
								</Link>
							</Button>
						) : null}
					</>
				}
			/>
			{estado === "carregando" ? (
				<Esqueleto />
			) : (
				<>
					<BlocoNumeros itens={numeros} />
					<div className="grid gap-6 lg:grid-cols-3">
						{vazio ? (
							<Cartao titulo="Saídas e voltas de hoje" className="order-2 lg:order-none lg:col-span-2">
								<EstadoVazio
									icone={Delivery}
									titulo="Nada saindo nem voltando hoje."
									descricao="Próxima saída: terça, 9h, Produtora Exemplo Ltda."
								/>
							</Cartao>
						) : (
							<SaidasEVoltas periodo={periodo} agora={agora} erro={estado === "erro"} />
						)}
						<PrecisaDeVoce agora={agora} balcao={!ehDono} erro={estado === "erro"} vazio={vazio} />
						{ehDono && !vazio ? <PreReservas agora={agora} /> : null}
						{ehDono && !vazio ? <ConversasEsperando agora={agora} /> : null}
						<EmManutencao agora={agora} vazio={vazio} />
					</div>
				</>
			)}
		</Pagina>
	);
}


