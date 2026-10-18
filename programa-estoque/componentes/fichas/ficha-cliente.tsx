"use client";
// 7.6 Ficha do cliente: dados, contatos, cadastro, documentos e o histórico de aluguéis.

import Add from "@carbon/icons-react/es/Add";
import Chat from "@carbon/icons-react/es/Chat";
import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import DocumentIcon from "@carbon/icons-react/es/Document";
import Locked from "@carbon/icons-react/es/Locked";
import OverflowMenuHorizontal from "@carbon/icons-react/es/OverflowMenuHorizontal";
import Task from "@carbon/icons-react/es/Task";
import UserMultiple from "@carbon/icons-react/es/UserMultiple";
import View from "@carbon/icons-react/es/View";
import Wallet from "@carbon/icons-react/es/Wallet";
import WarningAlt from "@carbon/icons-react/es/WarningAlt";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { CampoNoLugar } from "@/componentes/ui/campo-no-lugar";
import { Codigo, Dinheiro, EstadoErro, EsqueletoLinhas, FotoCliente, ValorDoRobo } from "@/componentes/ui/basicos";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import {
	AbasFicha,
	CabecalhoFicha,
	NumeroFicha,
	NumerosFicha,
	PropriedadeFicha,
	PropriedadesFicha,
	SecaoFicha,
	VazioFicha,
	useFicha,
} from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { Label } from "@/componentes/ui/label";
import { LinhaDoTempo, type EventoLinha } from "@/componentes/ui/linha-do-tempo";
import { EtapaRotulo, Selo } from "@/componentes/ui/marcadores";
import { Regua } from "@/componentes/ui/regua";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componentes/ui/table";
import { Textarea } from "@/componentes/ui/textarea";
import type { PropsFicha } from "@/componentes/fichas/registro";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { cnpjMascarado, cpfMascarado, data, dataCurta, diaEHora, horaRelogio, periodo, relativa, telefone } from "@/lib/formatos";
import { Link } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import type { Tom } from "@/lib/regras/situacao";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { useState } from "react";
import { toast } from "sonner";

const CADASTRO: Record<D.Cliente["cadastro"], { texto: string; tom: Tom }> = {
	aguardando: { texto: "Aguardando aprovação", tom: "atencao" },
	aprovado: { texto: "Aprovado", tom: "ok" },
	recusado: { texto: "Recusado", tom: "erro" },
	bloqueado: { texto: "Bloqueado", tom: "erro" },
};

const DOCUMENTOS: { tipo: D.TipoDocumentoPessoal; nome: string }[] = [
	{ tipo: "documento_foto", nome: "Documento com foto" },
	{ tipo: "selfie_documento", nome: "Selfie segurando o documento" },
	{ tipo: "comprovante_endereco", nome: "Comprovante de endereço" },
];

const PASSOS = ["novo", "documentos", "aprovado"] as const;
type Passo = (typeof PASSOS)[number];
const NOME_PASSO: Record<Passo, string> = { novo: "Novo", documentos: "Documentos enviados", aprovado: "Aprovado" };

function origem(c: D.Cliente, campo: string): string | undefined {
	return c.origemCampos[campo] === "robo" ? "Preenchido pelo robô no WhatsApp" : undefined;
}

function Campo({ c, campo, valor, rotulo, tipo }: { c: D.Cliente; campo: string; valor?: string; rotulo: string; tipo?: "text" | "email" | "tel" }) {
	return (
		<PropriedadeFicha rotulo={rotulo}>
			<CampoNoLugar valor={valor ?? ""} rotulo={rotulo} origemRobo={origem(c, campo)} tipo={tipo} vazio="Vazio · tocar para preencher" />
		</PropriedadeFicha>
	);
}

function ConversaSomenteLeitura({ clienteId }: { clienteId: number }) {
	const conversa = Q.conversaDoCliente(clienteId);
	if (!conversa) {
		return <VazioFicha icone={Chat} titulo="Nenhuma conversa" descricao="As mensagens do WhatsApp deste cliente aparecem aqui." />;
	}
	const msgs = Q.mensagensDa(conversa.id);
	return (
		<div className="flex flex-col gap-3 px-5 py-4">
			<div className="flex items-center justify-between gap-2">
				<p className="text-muted-foreground text-xs">Somente leitura. Para responder, abra a conversa.</p>
				<Button asChild variant="outline" size="sm">
					<Link href={`/conversas?conversa=${conversa.id}`}>
						<Icon icon={Chat} data-icon="inline-start" />
						Abrir conversa
					</Link>
				</Button>
			</div>
			<ol className="flex flex-col gap-2">
				{msgs.map((m) => {
					const direita = m.autor !== "cliente";
					return (
						<li key={m.id} className={cn("flex flex-col gap-0.5", direita ? "items-end" : "items-start")}>
							<span className="text-2xs text-muted-foreground">
								{m.autor === "cliente" ? "Cliente" : m.autor === "robo" ? "Robô" : m.autor === "automacao" ? "Mensagem automática" : m.usuario}
								{" · "}
								{horaRelogio(m.em)}
							</span>
							<span
								className={cn(
									"max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-xs/5",
									m.autor === "cliente" && "bg-muted text-foreground",
									(m.autor === "robo" || m.autor === "automacao") && "bg-destaque-claro text-foreground",
									m.autor === "equipe" && "bg-primary text-primary-foreground",
								)}
							>
								{m.anexo?.restrito ? `[foto recebida: ${m.anexo.descricao}]` : m.texto}
							</span>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

function Documentos({ c }: { c: D.Cliente }) {
	const [vistos, setVistos] = useState<Set<string>>(new Set());
	const docsReserva = D.documentos.filter((d) => d.clienteId === c.id || Q.reservasDo(c.id).some((r) => r.id === d.reservaId));
	return (
		<div className="flex flex-col">
			<SecaoFicha titulo="Documentos pessoais">
				<p className="flex items-center gap-2 text-atencao text-xs">
					<Icon icon={WarningAlt} className="size-4" />
					Documento pessoal: não compartilhe. Cada visualização fica registrada.
				</p>
				{c.documentos.length === 0 ? (
					<p className="py-4 text-muted-foreground text-xs">Nenhum documento. O robô pede no primeiro aluguel.</p>
				) : null}
				<ul className="grid gap-3 sm:grid-cols-3">
					{DOCUMENTOS.map((d) => {
						const recebido = c.documentos.find((x) => x.tipo === d.tipo);
						const visto = vistos.has(d.tipo);
						return (
							<li key={d.tipo} className="flex flex-col gap-2 rounded-lg border p-3">
								<div
									aria-hidden
									className={cn(
										"flex aspect-[4/3] items-center justify-center rounded-md bg-muted text-muted-foreground",
										recebido && !visto && "blur-sm",
									)}
								>
									<Icon icon={DocumentIcon} className="size-6" />
								</div>
								<div className="flex min-w-0 flex-col gap-0.5">
									<span className="truncate font-medium text-xs">{d.nome}</span>
									<span className="text-muted-foreground text-2xs">{recebido ? `Recebido em ${data(recebido.recebidoEm)}` : "Ainda não chegou"}</span>
								</div>
								{recebido ? (
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setVistos((s) => new Set(s).add(d.tipo));
											toast("Visualização registrada", { description: `${d.nome} · ${c.nome}` });
										}}
										disabled={visto}
									>
										<Icon icon={View} data-icon="inline-start" />
										{visto ? "Mostrando" : "Ver"}
									</Button>
								) : null}
							</li>
						);
					})}
				</ul>
			</SecaoFicha>
			<SecaoFicha titulo="Contratos e ordens">
				{docsReserva.length === 0 ? (
					<p className="text-muted-foreground text-xs">Nenhum contrato ainda.</p>
				) : (
					<ul className="flex flex-col divide-y">
						{docsReserva.map((d) => (
							<li key={d.id} className="flex items-center justify-between gap-3 py-2">
								<span className="flex min-w-0 items-center gap-2">
									<Icon icon={DocumentIcon} className="size-4 text-muted-foreground" />
									<Codigo>{d.numero}</Codigo>
									<span className="truncate text-muted-foreground text-xs">{d.modelo ?? "termo"}</span>
								</span>
								{d.assinadoEm ? <Selo tom="ok">Assinado {dataCurta(d.assinadoEm)}</Selo> : <Selo tom="atencao">Falta assinar</Selo>}
							</li>
						))}
					</ul>
				)}
			</SecaoFicha>
		</div>
	);
}

function JanelaMotivo({
	aberta,
	titulo,
	descricao,
	acao,
	perigo,
	aoFechar,
	aoConfirmar,
}: {
	aberta: boolean;
	titulo: string;
	descricao: string;
	acao: string;
	perigo?: boolean;
	aoFechar: () => void;
	aoConfirmar: (motivo: string) => void;
}) {
	const [motivo, setMotivo] = useState("");
	return (
		<Dialog open={aberta} onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{titulo}</DialogTitle>
					<DialogDescription>{descricao}</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="motivo-cadastro">Motivo</Label>
					<Textarea id="motivo-cadastro" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Escreva o motivo. Fica no histórico." />
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={aoFechar}>
						Cancelar
					</Button>
					<Button
						variant={perigo ? "destructive" : "default"}
						disabled={!motivo.trim()}
						onClick={() => {
							aoConfirmar(motivo);
							setMotivo("");
						}}
					>
						{acao}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function FichaCliente({ id, aoVoltar, trilha }: PropsFicha) {
	const c0 = Q.cliente(Number(id));
	const estadoTela = useEstadoTela();
	const { ehDono, podeVerFinanceiro } = usePapel();
	const { offline } = useConexao();
	const agora = useAgora(60_000);
	const { abrir } = useFicha();
	const [cadastro, setCadastro] = useState<D.Cliente["cadastro"]>(c0?.cadastro ?? "aguardando");
	const [motivo, setMotivo] = useState(c0?.motivo);
	const [janela, setJanela] = useState<"recusar" | "bloquear" | null>(null);

	if (!c0 || estadoTela === "erro") {
		return (
			<>
				<CabecalhoFicha titulo="Cliente" aoVoltar={aoVoltar} trilha={trilha} />
				<EstadoErro frase="Este cliente não pôde ser carregado." />
			</>
		);
	}
	if (estadoTela === "carregando") {
		return (
			<>
				<CabecalhoFicha titulo={<span className="text-muted-foreground">Carregando…</span>} aoVoltar={aoVoltar} trilha={trilha} />
				<EsqueletoLinhas linhas={6} className="p-5" />
			</>
		);
	}

	const c = { ...c0, cadastro };
	const stats = Q.estatisticasCliente(c.id);
	const reservas = Q.reservasDo(c.id).sort((a, b) => b.retiradaEm.getTime() - a.retiradaEm.getTime());
	const contatos = Q.contatosDo(c.id);
	const conversa = Q.conversaDoCliente(c.id);
	const tresDocs = DOCUMENTOS.every((d) => c.documentos.some((x) => x.tipo === d.tipo));
	const faltando = DOCUMENTOS.filter((d) => !c.documentos.some((x) => x.tipo === d.tipo));
	const pendencias: string[] = [];
	if (faltando.length) pendencias.push(`falta ${faltando.map((f) => f.nome.toLowerCase()).join(", ")}`);
	if (cadastro === "aguardando" && tresDocs) pendencias.push("aprovar cadastro");
	if (!c.contratoGeral) pendencias.push("contrato geral");
	const passo: Passo = cadastro === "aprovado" ? "aprovado" : c.documentos.length ? "documentos" : "novo";
	const assina = contatos.find((ct) => ct.papel === "assina");
	const pagamentos = reservas.flatMap((r) => Q.pagamentosDa(r.id).map((p) => ({ ...p, reserva: r })));
	const eventos: EventoLinha[] = Q.eventosDoCliente(c.id).map((e) => ({ id: String(e.id), em: e.em, texto: e.texto, ator: e.ator, quem: e.quem }));

	const aprovar = () => {
		setCadastro("aprovado");
		toast.success("Cadastro aprovado", { description: "Daqui em diante, os aluguéis deste cliente seguem com aprovação automática." });
	};

	const visaoGeral = (
		<div className="flex flex-col pb-24 md:pb-0">
			<SecaoFicha titulo="Cadastro">
				<Regua passos={PASSOS} atual={passo} rotulo={(p) => NOME_PASSO[p]} />
				{cadastro === "recusado" || cadastro === "bloqueado" ? (
					<p className="text-xs">
						<Selo tom="erro">{CADASTRO[cadastro].texto}</Selo> <span className="text-muted-foreground">{motivo}</span>
					</p>
				) : null}
				{ehDono && cadastro === "aguardando" ? (
					<div className="hidden flex-wrap items-center gap-2 pt-1 md:flex">
						<Button onClick={aprovar} disabled={!tresDocs || offline}>
							<Icon icon={CheckmarkOutline} data-icon="inline-start" />
							Aprovar cadastro
						</Button>
						<Button variant="outline" onClick={() => setJanela("recusar")} disabled={offline}>
							Recusar
						</Button>
						{!tresDocs ? <span className="text-muted-foreground text-xs">Aprovar fica disponível quando os 3 documentos chegarem.</span> : null}
					</div>
				) : null}
				{cadastro === "aprovado" ? (
					<p className="text-muted-foreground text-xs">Só o primeiro cadastro passa pela aprovação. Os próximos aluguéis seguem automaticamente.</p>
				) : null}
			</SecaoFicha>

			<SecaoFicha titulo="Dados">
				{ehDono ? (
					c.tipo === "pf" ? (
						<PropriedadesFicha>
							<Campo c={c} campo="nome" valor={c.nome} rotulo="Nome completo" />
							<Campo c={c} campo="cpf" valor={c.cpf} rotulo="CPF" />
							<Campo c={c} campo="dataNascimento" valor={c.dataNascimento} rotulo="Nascimento" />
							<Campo c={c} campo="email" valor={c.email} rotulo="E-mail" tipo="email" />
							<Campo c={c} campo="endereco" valor={c.endereco} rotulo="Endereço" />
							<Campo c={c} campo="cep" valor={c.cep} rotulo="CEP" />
							<Campo c={c} campo="contatoEmergencia" valor={c.contatoEmergencia ? `${c.contatoEmergencia.nome} · ${telefone(c.contatoEmergencia.telefone)}` : undefined} rotulo="Emergência" />
							<PropriedadeFicha rotulo="WhatsApp">
								<span className="tabular-nums" title="Vem do próprio WhatsApp; não se edita">
									{telefone(c.telefone)}
								</span>
							</PropriedadeFicha>
						</PropriedadesFicha>
					) : (
						<PropriedadesFicha>
							<Campo c={c} campo="razaoSocial" valor={c.razaoSocial} rotulo="Razão social" />
							<Campo c={c} campo="cnpj" valor={c.cnpj} rotulo="CNPJ" />
							<Campo c={c} campo="endereco" valor={c.endereco} rotulo="Endereço" />
							<Campo c={c} campo="email" valor={c.email} rotulo="E-mail" tipo="email" />
							<PropriedadeFicha rotulo="Quem assina">
								{assina ? (
									<ValorDoRobo origem="Preenchido pelo robô no WhatsApp">
										{assina.nome}
										{assina.email ? ` · ${assina.email}` : ""}
									</ValorDoRobo>
								) : (
									<span className="text-muted-foreground">Falta informar</span>
								)}
							</PropriedadeFicha>
							<Campo c={c} campo="contatoEmergencia" valor={c.contatoEmergencia ? `${c.contatoEmergencia.nome} · ${telefone(c.contatoEmergencia.telefone)}` : undefined} rotulo="Emergência" />
							<PropriedadeFicha rotulo="WhatsApp">
								<span className="tabular-nums">{telefone(c.telefone)}</span>
							</PropriedadeFicha>
						</PropriedadesFicha>
					)
				) : (
					<PropriedadesFicha>
						<PropriedadeFicha rotulo="Nome">{c.nome}</PropriedadeFicha>
						<PropriedadeFicha rotulo="Tipo">{c.tipo === "pf" ? "Pessoa física" : "Produtora"}</PropriedadeFicha>
						<PropriedadeFicha rotulo="WhatsApp">
							<span className="tabular-nums">{telefone(c.telefone)}</span>
						</PropriedadeFicha>
					</PropriedadesFicha>
				)}
				{ehDono ? (
					<p className="text-muted-foreground text-2xs">
						Sublinhado pontilhado: preenchido pelo robô. O que você digitar nunca é sobrescrito por ele. Produção, cidade de uso e quem retira ficam em cada reserva.
					</p>
				) : null}
			</SecaoFicha>

			{ehDono ? (
				<SecaoFicha titulo="Contrato geral">
					{c.contratoGeral ? (
						<p className="flex flex-wrap items-center gap-2 text-xs">
							<Selo tom="ok">{c.contratoGeral.modelo}</Selo>
							<span>versão {c.contratoGeral.versao}</span>
							<span className="text-muted-foreground">assinado em {data(c.contratoGeral.assinadoEm)} pela Autentique</span>
						</p>
					) : (
						<p className="flex flex-wrap items-center gap-2 text-xs">
							<Selo tom="atencao">Falta assinar</Selo>
							<span className="text-muted-foreground">Modelo {c.tipo === "pf" ? "CG-PF" : "CG-PJ"}, enviado junto com a primeira ordem.</span>
						</p>
					)}
				</SecaoFicha>
			) : null}

			<SecaoFicha titulo={ehDono ? "Contatos" : "Quem pode retirar"}>
				<TabelaContatos contatos={ehDono ? contatos : contatos.filter((x) => x.podeRetirar)} completa={ehDono} />
			</SecaoFicha>

			{ehDono && (c.observacoes || c.comoConheceu) ? (
				<SecaoFicha titulo="Observações">
					<PropriedadesFicha colunas={1}>
						{c.comoConheceu ? <PropriedadeFicha rotulo="Como conheceu">{c.comoConheceu}</PropriedadeFicha> : null}
						{c.observacoes ? <PropriedadeFicha rotulo="Observações">{c.observacoes}</PropriedadeFicha> : null}
					</PropriedadesFicha>
				</SecaoFicha>
			) : null}

			{ehDono && cadastro === "aguardando" ? (
				<div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t bg-popover p-3 md:hidden">
					<Button size="touch" variant="outline" className="flex-1" onClick={() => setJanela("recusar")} disabled={offline}>
						Recusar
					</Button>
					<Button size="touch" className="flex-[2]" onClick={aprovar} disabled={!tresDocs || offline}>
						<Icon icon={CheckmarkOutline} data-icon="inline-start" />
						Aprovar cadastro
					</Button>
				</div>
			) : null}
		</div>
	);

	const abaReservas =
		reservas.length === 0 ? (
			<VazioFicha
				icone={Task}
				titulo="Nenhuma reserva ainda."
				descricao="As reservas deste cliente aparecem aqui."
				acao={
					ehDono ? (
						<Button asChild variant="outline" size="sm">
							<Link href={`/pedido/novo?cliente=${c.id}`}>Nova reserva</Link>
						</Button>
					) : undefined
				}
			/>
		) : (
			<ul className="flex flex-col divide-y">
				{reservas.map((r) => (
					<li key={r.id}>
						<button
							type="button"
							data-alvo
							onClick={() => abrir("reserva", r.id, { empilhar: true })}
							className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted"
						>
							<Codigo className="w-10 shrink-0">{r.id}</Codigo>
							<span className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className="truncate text-xs">{Q.resumoItens(r.id)}</span>
								<span className="text-muted-foreground text-2xs">{periodo(r.retiradaEm, r.devolucaoEm)}</span>
							</span>
							<EtapaRotulo etapa={r.etapa} className="shrink-0" />
							{podeVerFinanceiro ? <Dinheiro valor={Q.precoDa(r.id).valorAluguel} className="hidden w-24 shrink-0 text-right text-xs sm:block" /> : null}
						</button>
					</li>
				))}
			</ul>
		);

	const abaPagamentos =
		pagamentos.length === 0 ? (
			<VazioFicha icone={Wallet} titulo="Nenhum pagamento ainda." descricao="Os pagamentos aparecem quando o cliente paga pelo link da InfinitePay." />
		) : (
			<div className="px-5 py-3">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Quando</TableHead>
							<TableHead>Reserva</TableHead>
							<TableHead>Tipo</TableHead>
							<TableHead className="text-right">Valor</TableHead>
							<TableHead>Situação</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{pagamentos.map((p) => {
							const r = Q.ROTULO_COBRANCA[p.status];
							return (
								<TableRow key={p.id}>
									<TableCell className="tabular-nums">{diaEHora(p.pagoEm ?? p.linkCriadoEm)}</TableCell>
									<TableCell>
										<Codigo>{p.reservaId}</Codigo>
									</TableCell>
									<TableCell>{p.tipo === "aluguel" ? "Aluguel" : p.tipo === "caucao" ? "Caução" : "Prorrogação"}</TableCell>
									<TableCell className="text-right">
										<Dinheiro valor={p.valor} />
									</TableCell>
									<TableCell>
										<Selo tom={r.tom}>{r.texto}</Selo>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		);

	const abas = [
		{ valor: "geral", rotulo: "Visão geral", conteudo: visaoGeral },
		{
			valor: "contatos",
			rotulo: "Contatos",
			contagem: contatos.length || null,
			conteudo: (
				<div className="px-5 py-3">
					{contatos.length ? (
						<TabelaContatos contatos={ehDono ? contatos : contatos.filter((x) => x.podeRetirar)} completa={ehDono} />
					) : (
						<VazioFicha icone={UserMultiple} titulo="Nenhum contato" descricao="Contatos de produtora aparecem aqui: quem assina e quem retira." />
					)}
				</div>
			),
		},
		{ valor: "reservas", rotulo: "Reservas", contagem: reservas.length || null, conteudo: abaReservas },
		{ valor: "conversas", rotulo: "Conversas", conteudo: <ConversaSomenteLeitura clienteId={c.id} /> },
		...(podeVerFinanceiro ? [{ valor: "pagamentos", rotulo: "Pagamentos", contagem: pagamentos.length || null, conteudo: abaPagamentos }] : []),
		...(ehDono ? [{ valor: "documentos", rotulo: "Documentos", contagem: c.documentos.length || null, conteudo: <Documentos c={c} /> }] : []),
		{
			valor: "historico",
			rotulo: "Histórico",
			conteudo: eventos.length ? (
				<LinhaDoTempo eventos={eventos} className="px-5 py-4" />
			) : (
				<VazioFicha icone={Task} titulo="Sem histórico ainda" descricao="Cada mudança neste cliente aparece aqui." />
			),
		},
	];

	return (
		<>
			<CabecalhoFicha
				aoVoltar={aoVoltar}
				trilha={trilha}
				foto={<FotoCliente nome={c.nome} tamanho={40} />}
				titulo={c.nome}
				descricao={
					<span className="tabular-nums">
						{c.tipo === "pf" ? "Pessoa física" : "Produtora"}
						{ehDono ? ` · ${c.tipo === "pf" ? `CPF ${cpfMascarado()}` : `CNPJ ${cnpjMascarado(c.cnpj ?? "")}`}` : ""}
					</span>
				}
				nota={
					<>
						<Selo tom={CADASTRO[cadastro].tom}>{CADASTRO[cadastro].texto}</Selo>
						{conversa ? (
							<Link href={`/conversas?conversa=${conversa.id}`} data-alvo className="inline-flex items-center gap-1 text-link underline-offset-4 hover:underline max-md:min-h-11">
								<Icon icon={Chat} className="size-3.5" />
								Abrir conversa
							</Link>
						) : null}
					</>
				}
				acoes={
					ehDono ? (
						<>
							<Button asChild variant="outline" size="sm">
								<Link href={`/pedido/novo?cliente=${c.id}`}>
									<Icon icon={Add} data-icon="inline-start" />
									Nova reserva
								</Link>
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon-sm" aria-label="Mais ações">
										<Icon icon={OverflowMenuHorizontal} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{cadastro === "bloqueado" ? (
										<DropdownMenuItem onSelect={() => setCadastro("aprovado")}>Desbloquear</DropdownMenuItem>
									) : (
										<DropdownMenuItem onSelect={() => setJanela("bloquear")}>
											<Icon icon={Locked} className="size-4" />
											Bloquear
										</DropdownMenuItem>
									)}
									<DropdownMenuItem onSelect={() => toast("Exportação dos dados do titular preparada", { description: "Pedido do titular registrado no histórico." })}>
										Exportar dados do titular
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onSelect={() => toast("Cliente arquivado", { description: "Dá para recuperar em Arquivados." })}>
										Arquivar (dá para recuperar)
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					) : undefined
				}
			/>
			<NumerosFicha>
				{podeVerFinanceiro ? (
					<NumeroFicha rotulo="Alugado em 12 meses">
						<Dinheiro valor={stats.totalAlugado} />
					</NumeroFicha>
				) : null}
				<NumeroFicha rotulo="Reservas abertas">{stats.abertas}</NumeroFicha>
				<NumeroFicha rotulo="Pendências">
					{pendencias.length ? (
						<span title={pendencias.join("; ")}>
							{pendencias.length} ({pendencias[0]})
						</span>
					) : (
						"Nenhuma"
					)}
				</NumeroFicha>
				<NumeroFicha rotulo="Último aluguel">{stats.ultimoAluguel ? relativa(stats.ultimoAluguel, agora) : "—"}</NumeroFicha>
			</NumerosFicha>
			<AbasFicha abas={abas} />
			<JanelaMotivo
				aberta={janela === "recusar"}
				titulo="Recusar cadastro"
				descricao="O cliente não poderá retirar equipamento. O robô avisa que a equipe vai falar com ele."
				acao="Recusar cadastro"
				aoFechar={() => setJanela(null)}
				aoConfirmar={(m) => {
					setCadastro("recusado");
					setMotivo(m);
					setJanela(null);
					toast("Cadastro recusado", { description: "Motivo registrado no histórico." });
				}}
			/>
			<JanelaMotivo
				aberta={janela === "bloquear"}
				titulo="Bloquear cliente"
				descricao="Cliente bloqueado não consegue nova pré-reserva pelo robô nem pelo app."
				acao="Bloquear"
				perigo
				aoFechar={() => setJanela(null)}
				aoConfirmar={(m) => {
					setCadastro("bloqueado");
					setMotivo(m);
					setJanela(null);
					toast("Cliente bloqueado", { description: "Motivo registrado no histórico." });
				}}
			/>
		</>
	);
}

function TabelaContatos({ contatos, completa }: { contatos: D.Contato[]; completa: boolean }) {
	if (!contatos.length) return <p className="text-muted-foreground text-xs">Sem contatos além do titular.</p>;
	return (
		<ul className="flex flex-col divide-y rounded-lg border">
			{contatos.map((ct) => (
				<li key={ct.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
					<FotoCliente nome={ct.nome} />
					<span className="font-medium">{ct.nome}</span>
					{completa ? <span className="text-muted-foreground">{ct.funcao}</span> : null}
					<span className="tabular-nums text-muted-foreground">{telefone(ct.telefone)}</span>
					<span className="flex-1" />
					{ct.podeRetirar ? <Selo tom="ok">Pode retirar</Selo> : <Selo tom="neutro">Não retira</Selo>}
					{completa && ct.principal ? <Badge variant="outline">Principal</Badge> : null}
					{completa && ct.papel === "assina" ? <Badge variant="outline">Assina</Badge> : null}
				</li>
			))}
		</ul>
	);
}
