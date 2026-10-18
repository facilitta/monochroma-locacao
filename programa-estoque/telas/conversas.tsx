"use client";
// 7.2 Conversas: o único lugar onde uma pessoa responde ao cliente. O número da locadora vai direto para a YCloud.

import ArrowLeft from "@carbon/icons-react/es/ArrowLeft";
import Attachment from "@carbon/icons-react/es/Attachment";
import Bot from "@carbon/icons-react/es/Bot";
import Chat from "@carbon/icons-react/es/Chat";
import Checkmark from "@carbon/icons-react/es/Checkmark";
import Close from "@carbon/icons-react/es/Close";
import OverflowMenuHorizontal from "@carbon/icons-react/es/OverflowMenuHorizontal";
import SendAlt from "@carbon/icons-react/es/SendAlt";
import UserAvatar from "@carbon/icons-react/es/UserAvatar";
import WarningAlt from "@carbon/icons-react/es/WarningAlt";
import Locked from "@carbon/icons-react/es/Locked";
import { BaloesConversa, type Marcador } from "@/componentes/atendimento/conversa";
import {
	CabecalhoPagina,
	Codigo,
	Dinheiro,
	EstadoErro,
	EstadoVazio,
	FotoCliente,
	Pagina,
	TituloGrupo,
	TituloSecao,
	ValorDoRobo,
} from "@/componentes/ui/basicos";
import { Button } from "@/componentes/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import { useFicha } from "@/componentes/ui/ficha";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/componentes/ui/folha-responsiva";
import { Icon } from "@/componentes/ui/icon";
import { EtapaRotulo, PontoSituacao, Selo } from "@/componentes/ui/marcadores";
import { Skeleton } from "@/componentes/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { HORA, dataCurta, diaSemana, duracao, horaRelogio, mesmoDia, relativa, telefone } from "@/lib/formatos";
import { useNavegar, useParametro } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { CADASTRO } from "@/telas/clientes";
import {
	mensagensDaConversa,
	respostasProntas,
	semCadastro,
	situacaoConversa,
} from "@/prototipo/consultas-atendimento";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Recorte = "esperando" | "robo" | "todas" | "sem_cadastro";

type Ajuste = Partial<Pick<D.Conversa, "comQuem" | "assumidaPor" | "roboSilenciadoAte" | "silenciadoPor" | "passadaEm">> & {
	descartouResumo?: boolean;
};

const RECORTES: { id: Recorte; nome: string }[] = [
	{ id: "esperando", nome: "Esperando você" },
	{ id: "robo", nome: "Com o robô" },
	{ id: "todas", nome: "Todas" },
	{ id: "sem_cadastro", nome: "Sem cadastro" },
];

function ateQuando(d: Date, agora: Date): string {
	if (mesmoDia(d, agora)) return horaRelogio(d);
	if (mesmoDia(d, new Date(agora.getTime() + 86_400_000))) return `amanhã, ${horaRelogio(d)}`;
	return `${diaSemana(d)} ${dataCurta(d)}, ${horaRelogio(d)}`;
}

function rotuloGrupo(d: Date, agora: Date): string {
	if (mesmoDia(d, agora)) return "Hoje";
	if (mesmoDia(d, new Date(agora.getTime() - 86_400_000))) return "Ontem";
	return dataCurta(d);
}

/* ---------------------------------------------------------------- lista */

function ListaConversas({
	conversas,
	selecionada,
	aoEscolher,
	agora,
	ajustes,
}: {
	conversas: D.Conversa[];
	selecionada: number | null;
	aoEscolher: (id: number) => void;
	agora: Date;
	ajustes: Record<number, Ajuste>;
}) {
	const ordenadas = [...conversas].sort((a, b) => {
		const ua = mensagensDaConversa(a.id).at(-1)?.em.getTime() ?? 0;
		const ub = mensagensDaConversa(b.id).at(-1)?.em.getTime() ?? 0;
		return ub - ua;
	});
	const grupos: { rotulo: string; itens: D.Conversa[] }[] = [];
	for (const c of ordenadas) {
		const ultima = mensagensDaConversa(c.id).at(-1);
		const rotulo = ultima ? rotuloGrupo(ultima.em, agora) : "Sem mensagens";
		const g = grupos.find((x) => x.rotulo === rotulo);
		if (g) g.itens.push(c);
		else grupos.push({ rotulo, itens: [c] });
	}
	return (
		<nav aria-label="Conversas" className="flex flex-col">
			{grupos.map((g) => (
				<div key={g.rotulo} className="flex flex-col">
					<TituloGrupo className="px-4 pt-3 pb-1">{g.rotulo}</TituloGrupo>
					<ul className="flex flex-col">
						{g.itens.map((c) => {
							const msgs = mensagensDaConversa(c.id);
							const ultima = msgs.at(-1);
							const sit = situacaoConversa(c, agora, ajustes[c.id]);
							const sel = c.id === selecionada;
							const previa = ultima ? (ultima.anexo ? `[foto: ${ultima.anexo.descricao}]` : ultima.texto) : "";
							return (
								<li key={c.id}>
									<button
										type="button"
										data-alvo
										aria-current={sel ? "true" : undefined}
										onClick={() => aoEscolher(c.id)}
										className={cn("flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted", sel && "bg-muted")}
									>
										<FotoCliente nome={c.nomeExibido} tamanho={32} />
										<span className="flex min-w-0 flex-1 flex-col gap-0.5">
											<span className="flex items-baseline gap-2">
												<span className="min-w-0 flex-1 truncate font-medium text-sm md:text-xs">{c.clienteId ? c.nomeExibido : telefone(c.telefone)}</span>
												<span className="shrink-0 text-2xs text-muted-foreground tabular-nums">{ultima ? relativa(ultima.em, agora).replace("há ", "") : ""}</span>
											</span>
											<span className="truncate text-muted-foreground text-xs">{previa}</span>
											<span className="flex items-center gap-2">
												<PontoSituacao tom={sit.tom} andamento={sit.andamento}>
													{sit.texto}
												</PontoSituacao>
												{c.naoLidas ? (
													<span className="ml-auto rounded-full bg-muted px-1.5 text-2xs font-medium tabular-nums">{c.naoLidas}</span>
												) : null}
											</span>
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}

/* ---------------------------------------------------------------- painel do cliente */

function PainelCliente({ c, agora, ajuste, aoDescartar }: { c: D.Conversa; agora: Date; ajuste?: Ajuste; aoDescartar: () => void }) {
	const { abrir } = useFicha();
	const navegar = useNavegar();
	const { ehDono, podeVerFinanceiro } = usePapel();
	const cl = c.clienteId ? Q.cliente(c.clienteId) : undefined;
	const r = c.reservaId ? Q.reserva(c.reservaId) : undefined;
	const pg = r ? Q.situacaoPagamentos(r.id) : undefined;
	const at = r ? Q.atrasoDa(r.id, agora) : null;
	const resumo = !ajuste?.descartouResumo ? c.resumoRobo : undefined;
	const docs = cl?.documentos.length ?? 0;
	const origem = c.passadaEm ? `Preenchido pelo robô às ${horaRelogio(c.passadaEm)}` : "Preenchido pelo robô";
	return (
		<div className="flex flex-col">
			<section className="flex flex-col gap-2 border-b p-4">
				<TituloSecao>Cliente</TituloSecao>
				{cl ? (
					<>
						<div className="flex items-center justify-between gap-2">
							<span className="truncate font-medium text-sm">{cl.nome}</span>
							<Selo tom={CADASTRO[cl.cadastro].tom}>{CADASTRO[cl.cadastro].texto}</Selo>
						</div>
						<span className="text-muted-foreground text-xs tabular-nums">{telefone(cl.telefone)}</span>
					</>
				) : (
					<span className="text-muted-foreground text-xs">Sem cadastro. O robô está coletando os dados.</span>
				)}
			</section>
			{r ? (
				<section className="flex flex-col gap-2 border-b p-4">
					<TituloSecao>Reserva aberta</TituloSecao>
					<button type="button" data-alvo onClick={() => abrir("reserva", r.id)} className="flex flex-col items-start gap-1.5 rounded-md text-left hover:underline">
						<span className="flex items-center gap-2">
							<Codigo>{r.id}</Codigo>
							<EtapaRotulo etapa={r.etapa} />
						</span>
						<span className="text-muted-foreground text-xs">{Q.resumoItens(r.id, 3)}</span>
						{at ? <Selo tom={at.alemDaTolerancia ? "erro" : "atencao"}>Atrasada há {duracao(at.ms)}</Selo> : null}
					</button>
				</section>
			) : null}
			{resumo ? (
				<section className="flex flex-col gap-2 border-b p-4">
					<TituloSecao>O que o robô entendeu</TituloSecao>
					<dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-xs">
						<dt className="text-muted-foreground">Pediu</dt>
						<dd>
							<ValorDoRobo origem={origem}>{resumo.pediu}</ValorDoRobo>
						</dd>
						{resumo.datas ? (
							<>
								<dt className="text-muted-foreground">Datas</dt>
								<dd>
									<ValorDoRobo origem={origem}>{resumo.datas}</ValorDoRobo>
								</dd>
							</>
						) : null}
						{resumo.duvida ? (
							<>
								<dt className="text-muted-foreground">Dúvida</dt>
								<dd>
									<ValorDoRobo origem={origem}>{resumo.duvida}</ValorDoRobo>
								</dd>
							</>
						) : null}
						<dt className="text-muted-foreground">Já é cliente</dt>
						<dd>{resumo.jaECliente ? "Sim" : "Não"}</dd>
						<dt className="text-muted-foreground">Cadastro</dt>
						<dd>{resumo.cadastro}</dd>
					</dl>
					<div className="flex flex-wrap gap-2 pt-1">
						{ehDono ? (
							<Button variant="outline" size="sm" onClick={() => navegar(`/pedido/novo?conversa=${c.id}`)}>
								<Icon icon={Checkmark} data-icon="inline-start" />
								Confirmar e montar pedido
							</Button>
						) : null}
						<Button variant="ghost" size="sm" onClick={aoDescartar}>
							<Icon icon={Close} data-icon="inline-start" />
							Descartar
						</Button>
					</div>
				</section>
			) : null}
			{ehDono && r && pg ? (
				<section className="flex flex-col gap-2 border-b p-4">
					<TituloSecao>Links enviados</TituloSecao>
					<ul className="flex flex-col gap-2 text-xs">
						<li className="flex items-center justify-between gap-2">
							<span className="flex min-w-0 flex-col">
								<span>Assinatura</span>
								<span className="text-muted-foreground">{r.ordemAssinadaEm ? `Assinada às ${horaRelogio(r.ordemAssinadaEm)} (Autentique)` : "Aguardando assinatura"}</span>
							</span>
							{r.ordemAssinadaEm ? <Selo tom="ok">Assinada</Selo> : <Button variant="outline" size="xs" onClick={() => toast.success("Link de assinatura reenviado")}>Reenviar</Button>}
						</li>
						<li className="flex items-center justify-between gap-2">
							<span className="flex min-w-0 flex-col">
								<span>
									Aluguel {podeVerFinanceiro ? <Dinheiro valor={pg.pagamentoAluguel?.valor ?? 0} className="text-muted-foreground" /> : null}
								</span>
								<span className="text-muted-foreground">Pix ou cartão · {Q.ROTULO_COBRANCA[pg.aluguel].texto.toLowerCase()}{pg.aluguelConfirmado ? " pela InfinitePay" : ""}</span>
							</span>
							{pg.aluguelConfirmado ? <Selo tom="ok">Confirmado</Selo> : <Button variant="outline" size="xs" onClick={() => toast.success("Link do aluguel reenviado")}>Reenviar</Button>}
						</li>
						<li className="flex items-center justify-between gap-2">
							<span className="flex min-w-0 flex-col">
								<span>
									Caução {podeVerFinanceiro ? <Dinheiro valor={pg.pagamentoCaucao?.valor ?? 0} className="text-muted-foreground" /> : null}
								</span>
								<span className="text-muted-foreground">Só Pix · {Q.ROTULO_COBRANCA[pg.caucao].texto.toLowerCase()}{pg.caucaoConfirmada ? " pela InfinitePay" : ""}</span>
							</span>
							{pg.caucaoConfirmada ? <Selo tom="ok">Confirmada</Selo> : <Button variant="outline" size="xs" onClick={() => toast.success("Link da caução reenviado")}>Reenviar</Button>}
						</li>
					</ul>
				</section>
			) : null}
			{ehDono && docs > 0 && cl ? (
				<section className="flex flex-col gap-2 border-b p-4">
					<TituloSecao>Documentos</TituloSecao>
					<p className="flex items-start gap-1.5 text-muted-foreground text-xs">
						<Icon icon={Locked} className="mt-0.5 size-3.5 shrink-0" motion="none" />
						{docs} {docs === 1 ? "documento recebido" : "documentos recebidos"}. Ficam em Documentos, na ficha do cliente.
					</p>
				</section>
			) : null}
			{cl ? (
				<div className="p-4">
					<Button variant="outline" size="sm" className="w-full" onClick={() => abrir("cliente", cl.id)}>
						Abrir ficha
					</Button>
				</div>
			) : null}
		</div>
	);
}

/* ---------------------------------------------------------------- caixa de escrita */

function CaixaEscrita({ janelaAberta, ate, agora, aoEnviar, offline }: { janelaAberta: boolean; ate: Date; agora: Date; aoEnviar: (texto: string) => void; offline: boolean }) {
	const [texto, setTexto] = useState("");
	const arquivo = useRef<HTMLInputElement>(null);
	const sugestoes = texto.startsWith("/")
		? respostasProntas.filter((r) => r.atalho.startsWith(texto.slice(1).toLowerCase()) || r.titulo.toLowerCase().includes(texto.slice(1).toLowerCase()))
		: [];
	if (!janelaAberta) {
		return (
			<div className="flex flex-col gap-2 border-t p-3">
				<p className="flex items-start gap-2 text-atencao text-xs">
					<Icon icon={WarningAlt} className="mt-0.5 size-4 shrink-0" motion="none" />
					A janela de 24 horas fechou em {ateQuando(ate, agora)}. Agora só dá para mandar mensagem aprovada.
				</p>
				<ul className="flex flex-col gap-1.5">
					{D.modelosMensagem.slice(0, 4).map((m) => (
						<li key={m.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs">
							<span className="min-w-0">
								<span className="block truncate font-medium">{m.descricao}</span>
								<span className="block truncate text-muted-foreground">Aguardando o sim do Xerxes e do Alef</span>
							</span>
							<Button variant="outline" size="xs" disabled>
								Enviar
							</Button>
						</li>
					))}
				</ul>
			</div>
		);
	}
	return (
		<div className="relative flex flex-col gap-2 border-t p-3">
			<p className="flex items-center gap-2 text-atencao text-xs">
				<Icon icon={WarningAlt} className="size-4 shrink-0" motion="none" />
				Resposta livre até {ateQuando(ate, agora)}. Depois, só mensagem aprovada.
			</p>
			{sugestoes.length ? (
				<ul role="listbox" aria-label="Respostas prontas" className="absolute right-3 bottom-full left-3 z-10 mb-1 flex flex-col overflow-hidden rounded-lg border bg-popover shadow-md">
					{sugestoes.map((r) => (
						<li key={r.atalho}>
							<button type="button" data-alvo role="option" aria-selected={false} onClick={() => setTexto(r.texto)} className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted">
								<span className="font-medium text-xs">
									/{r.atalho} · {r.titulo}
								</span>
								<span className="line-clamp-1 text-muted-foreground text-xs">{r.texto}</span>
							</button>
						</li>
					))}
				</ul>
			) : null}
			<form
				className="flex items-end gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					if (!texto.trim() || offline) return;
					aoEnviar(texto.trim());
					setTexto("");
				}}
			>
				<Button type="button" variant="outline" size="icon" aria-label="Anexar arquivo" onClick={() => arquivo.current?.click()}>
					<Icon icon={Attachment} />
				</Button>
				<input
					ref={arquivo}
					type="file"
					className="sr-only"
					tabIndex={-1}
					aria-hidden
					onChange={() => toast("Anexo pronto para enviar")}
				/>
				<label className="flex min-w-0 flex-1">
					<span className="sr-only">Escreva uma mensagem</span>
					<textarea
						value={texto}
						rows={1}
						onChange={(e) => setTexto(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
							}
						}}
						placeholder="Escreva… (/ respostas prontas)"
						className="field-sizing-content max-h-32 min-h-8 w-full resize-none rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-campo outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-muted"
					/>
				</label>
				<Button type="submit" disabled={offline || !texto.trim()} title={offline ? "Volta quando a internet voltar" : undefined}>
					<Icon icon={SendAlt} data-icon="inline-start" />
					Enviar
				</Button>
			</form>
		</div>
	);
}

/* ---------------------------------------------------------------- conversa aberta */

function ConversaAberta({
	c,
	agora,
	ajuste,
	aoAjustar,
	enviadas,
	aoEnviar,
	aoVoltar,
	aoAbrirCliente,
}: {
	c: D.Conversa;
	agora: Date;
	ajuste?: Ajuste;
	aoAjustar: (a: Ajuste) => void;
	enviadas: D.Mensagem[];
	aoEnviar: (texto: string) => void;
	aoVoltar?: () => void;
	aoAbrirCliente?: () => void;
}) {
	const { ehDono, usuario } = usePapel();
	const { abrir } = useFicha();
	const { offline } = useConexao();
	const [movidas, setMovidas] = useState<number[]>([]);
	const fim = useRef<HTMLDivElement>(null);
	const x = { ...c, ...ajuste };
	const mensagens = [...mensagensDaConversa(c.id), ...enviadas];
	const ultimaCliente = [...mensagens].reverse().find((m) => m.autor === "cliente");
	const ate = new Date((ultimaCliente?.em ?? c.ultimaMsgClienteEm).getTime() + 24 * HORA);
	const janelaAberta = ate.getTime() > agora.getTime();
	const marcadores: Marcador[] = c.passadaEm
		? [{ id: "passou", em: new Date(c.passadaEm.getTime() + 1000), texto: "O robô passou a conversa para a equipe" }]
		: [];
	const pausado = x.roboSilenciadoAte && x.roboSilenciadoAte.getTime() > agora.getTime();

	useEffect(() => {
		fim.current?.scrollIntoView({ block: "end" });
	}, [mensagens.length]);

	return (
		<section aria-label={`Conversa com ${c.nomeExibido}`} className="flex min-h-0 min-w-0 flex-1 flex-col">
			<header className="flex flex-col gap-2 border-b px-3 py-2 md:px-4">
				<div className="flex items-center gap-2">
					{aoVoltar ? (
						<Button variant="ghost" size="icon" onClick={aoVoltar} aria-label="Voltar para a lista">
							<Icon icon={ArrowLeft} />
						</Button>
					) : null}
					<FotoCliente nome={c.nomeExibido} tamanho={32} />
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="truncate font-medium text-sm">{c.clienteId ? c.nomeExibido : "Sem cadastro"}</span>
						<span className="truncate text-muted-foreground text-xs tabular-nums">{telefone(c.telefone)}</span>
					</div>
					{x.comQuem === "equipe" && x.assumidaPor ? (
						<Button variant="outline" size="sm" onClick={() => aoAjustar({ comQuem: "robo", assumidaPor: undefined, roboSilenciadoAte: undefined })}>
							<Icon icon={Bot} data-icon="inline-start" />
							Devolver ao robô
						</Button>
					) : (
						<Button variant="outline" size="sm" onClick={() => aoAjustar({ comQuem: "equipe", assumidaPor: usuario.nome })}>
							<Icon icon={UserAvatar} data-icon="inline-start" />
							Assumir
						</Button>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" data-alvo aria-label="Mais ações">
								<Icon icon={OverflowMenuHorizontal} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{aoAbrirCliente ? <DropdownMenuItem onSelect={aoAbrirCliente}>Ver resumo do cliente</DropdownMenuItem> : null}
							{c.clienteId ? <DropdownMenuItem onSelect={() => abrir("cliente", c.clienteId as number)}>Abrir ficha do cliente</DropdownMenuItem> : null}
							{c.reservaId ? <DropdownMenuItem onSelect={() => abrir("reserva", c.reservaId as number)}>Abrir reserva {c.reservaId}</DropdownMenuItem> : null}
							{x.comQuem === "equipe" && !x.assumidaPor ? (
								<DropdownMenuItem onSelect={() => aoAjustar({ comQuem: "robo", passadaEm: undefined })}>Devolver ao robô</DropdownMenuItem>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{x.comQuem === "equipe" && x.assumidaPor ? (
						<Selo tom="info" icone={UserAvatar}>
							Assumida por {x.assumidaPor}: o robô não responde até alguém devolver
						</Selo>
					) : x.comQuem === "equipe" ? (
						<Selo tom="atencao">Esperando você{x.passadaEm ? ` desde ${horaRelogio(x.passadaEm)}` : ""}</Selo>
					) : pausado ? (
						<Selo tom="neutro" icone={Bot}>
							Robô pausado até {horaRelogio(x.roboSilenciadoAte as Date)} ({x.silenciadoPor} respondeu)
						</Selo>
					) : (
						<Selo tom="neutro" icone={Bot}>
							Com o robô
						</Selo>
					)}
					{aoAbrirCliente ? (
						<Button variant="ghost" size="xs" onClick={aoAbrirCliente} className="xl:hidden">
							Cliente
						</Button>
					) : null}
				</div>
			</header>
			<div tabIndex={0} aria-label="Mensagens" className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4">
				<BaloesConversa
					mensagens={mensagens}
					marcadores={marcadores}
					agora={agora}
					ehDono={ehDono}
					movidas={movidas}
					aoMover={(id) => {
						setMovidas((m) => [...m, id]);
						toast.success("Foto movida para Documentos");
					}}
					aoTentarDeNovo={() => toast.success("Mensagem reenviada")}
				/>
				<div ref={fim} />
			</div>
			<CaixaEscrita janelaAberta={janelaAberta} ate={ate} agora={agora} aoEnviar={aoEnviar} offline={offline} />
		</section>
	);
}

/* ---------------------------------------------------------------- tela */

function EsqueletoConversas() {
	return (
		<div aria-busy="true" className="flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
			<span className="sr-only">Carregando</span>
			<div className="flex w-full flex-col gap-3 p-4 md:w-80 md:border-r">
				{[0, 1, 2, 3, 4].map((i) => (
					<div key={i} className="flex gap-3">
						<Skeleton className="size-8 rounded-full" />
						<div className="flex flex-1 flex-col gap-1.5">
							<Skeleton className="h-3 w-32" />
							<Skeleton className="h-3 w-full" />
						</div>
					</div>
				))}
			</div>
			<div className="hidden flex-1 flex-col gap-3 p-4 md:flex">
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className={cn("h-10 w-2/3 rounded-lg", i % 2 ? "self-end" : "self-start")} />
				))}
			</div>
		</div>
	);
}

export function TelaConversas() {
	const agora = useAgora(30_000);
	const estado = useEstadoTela();
	const ehCelular = useIsMobile();
	const { usuario } = usePapel();
	const [recorteParam, setRecorte] = useParametro("recorte");
	const [conversaParam, setConversa] = useParametro("conversa");
	const [ajustes, setAjustes] = useState<Record<number, Ajuste>>({});
	const [enviadas, setEnviadas] = useState<Record<number, D.Mensagem[]>>({});
	const [clienteAberto, setClienteAberto] = useState(false);
	const [tentou, setTentou] = useState(false);

	const recorte = (RECORTES.some((r) => r.id === recorteParam) ? recorteParam : "esperando") as Recorte;
	const todas = estado === "vazio" ? D.conversas.filter((c) => c.comQuem === "robo") : D.conversas;
	const comAjuste = (c: D.Conversa): D.Conversa => ({ ...c, ...ajustes[c.id] });
	const filtradas = useMemo(
		() =>
			todas.filter((c0) => {
				const c = comAjuste(c0);
				if (recorte === "esperando") return c.comQuem === "equipe";
				if (recorte === "robo") return c.comQuem === "robo";
				if (recorte === "sem_cadastro") return semCadastro(c);
				return true;
			}),
		// biome-ignore lint/correctness/useExhaustiveDependencies: ajustes muda a lista
		[todas, recorte, ajustes],
	);
	const contagem = (r: Recorte) =>
		todas.filter((c0) => {
			const c = comAjuste(c0);
			if (r === "esperando") return c.comQuem === "equipe";
			if (r === "robo") return c.comQuem === "robo";
			if (r === "sem_cadastro") return semCadastro(c);
			return true;
		}).length;

	const idAberta = conversaParam ? Number(conversaParam) : !ehCelular ? (filtradas[0]?.id ?? null) : null;
	const aberta = idAberta ? D.conversas.find((c) => c.id === idAberta) : undefined;

	const enviar = (c: D.Conversa, texto: string) => {
		const m: D.Mensagem = { id: 100000 + Math.floor(agora.getTime() / 1000) + Math.random(), conversaId: c.id, autor: "equipe", usuario: usuario.nome, texto, em: agora, status: "enviado" };
		setEnviadas((e) => ({ ...e, [c.id]: [...(e[c.id] ?? []), m] }));
		const ate = new Date(agora.getTime() + 12 * HORA);
		setAjustes((a) => ({ ...a, [c.id]: { ...a[c.id], roboSilenciadoAte: ate, silenciadoPor: usuario.nome } }));
		toast.success(`Mensagem enviada. Robô pausado até ${horaRelogio(ate)}.`);
	};

	const comRobo = D.conversas.filter((c) => comAjuste(c).comQuem === "robo").length;
	const mostrarLista = !ehCelular || !aberta;
	const mostrarConversa = !!aberta && (!ehCelular || !!conversaParam);

	return (
		<Pagina contida larga className={cn("gap-4", ehCelular && aberta && "gap-0")}>
			{!(ehCelular && aberta) ? (
				<CabecalhoPagina
					titulo="Conversas"
					descricao="O robô e a equipe na mesma linha do tempo. Responder por aqui pausa o robô por 12 horas."
					acoes={
						<div role="group" aria-label="Recortes" className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
							{RECORTES.map((r) => (
								<Button
									key={r.id}
									variant={recorte === r.id ? "secondary" : "outline"}
									size="sm"
									aria-pressed={recorte === r.id}
									onClick={() => setRecorte(r.id === "esperando" ? null : r.id)}
									className="shrink-0"
								>
									{r.nome}
									{r.id === "esperando" ? <span className="tabular-nums">{contagem(r.id)}</span> : null}
								</Button>
							))}
						</div>
					}
				/>
			) : null}
			{estado === "carregando" ? (
				<EsqueletoConversas />
			) : estado === "erro" && !tentou ? (
				<div className="rounded-lg border bg-card">
					<EstadoErro frase="Não consegui carregar as conversas." aoTentar={() => setTentou(true)} />
				</div>
			) : (
				<div className={cn("flex min-h-0 flex-1 overflow-hidden bg-card", ehCelular && aberta ? "-mx-4 -mt-4 -mb-6 md:mx-0" : "rounded-lg border")}>
					{mostrarLista ? (
						<div className={cn("min-h-0 shrink-0 overflow-y-auto", ehCelular ? "w-full" : "w-80 border-r")}>
							{filtradas.length === 0 ? (
								<EstadoVazio
									icone={Chat}
									titulo={recorte === "esperando" ? "Nenhuma conversa esperando você." : "Nenhuma conversa neste recorte."}
									descricao={recorte === "esperando" ? `O robô está cuidando de ${comRobo}.` : "Troque o recorte para ver as outras conversas."}
								/>
							) : (
								<ListaConversas
									conversas={filtradas}
									selecionada={idAberta}
									aoEscolher={(id) => setConversa(String(id))}
									agora={agora}
									ajustes={ajustes}
								/>
							)}
						</div>
					) : null}
					{mostrarConversa && aberta ? (
						<>
							<ConversaAberta
								key={aberta.id}
								c={aberta}
								agora={agora}
								ajuste={ajustes[aberta.id]}
								aoAjustar={(a) => {
									setAjustes((x) => ({ ...x, [aberta.id]: { ...x[aberta.id], ...a } }));
									if (a.assumidaPor) toast.success(`Conversa assumida por ${a.assumidaPor}. O robô fica pausado até alguém devolver.`);
									if (a.comQuem === "robo") toast.success("Conversa devolvida ao robô");
								}}
								enviadas={enviadas[aberta.id] ?? []}
								aoEnviar={(t) => enviar(aberta, t)}
								aoVoltar={ehCelular ? () => setConversa(null) : undefined}
								aoAbrirCliente={() => setClienteAberto(true)}
							/>
							<aside aria-label="Resumo do cliente" className="hidden w-80 shrink-0 overflow-y-auto border-l xl:block">
								<PainelCliente
									c={aberta}
									agora={agora}
									ajuste={ajustes[aberta.id]}
									aoDescartar={() => setAjustes((x) => ({ ...x, [aberta.id]: { ...x[aberta.id], descartouResumo: true } }))}
								/>
							</aside>
							<Sheet open={clienteAberto} onOpenChange={setClienteAberto}>
								<SheetContent side="right" size="sm" className="overflow-y-auto p-0">
									<SheetHeader className="border-b px-4 py-3">
										<SheetTitle>Resumo do cliente</SheetTitle>
										<SheetDescription>{aberta.nomeExibido}</SheetDescription>
									</SheetHeader>
									<div className="min-h-0 overflow-y-auto">
										<PainelCliente
											c={aberta}
											agora={agora}
											ajuste={ajustes[aberta.id]}
											aoDescartar={() => setAjustes((x) => ({ ...x, [aberta.id]: { ...x[aberta.id], descartouResumo: true } }))}
										/>
									</div>
								</SheetContent>
							</Sheet>
						</>
					) : !ehCelular ? (
						<div className="hidden flex-1 items-center justify-center md:flex">
							<EstadoVazio icone={Chat} titulo="Escolha uma conversa" descricao="As mensagens do robô, da equipe e do cliente aparecem aqui." />
						</div>
					) : null}
				</div>
			)}
		</Pagina>
	);
}

