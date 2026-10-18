"use client";
// 7.12 Ficha do equipamento: unidades, agenda, histórico, vídeos de teste, manutenção e quanto já rendeu.

import Add from "@carbon/icons-react/es/Add";
import Archive from "@carbon/icons-react/es/Archive";
import Launch from "@carbon/icons-react/es/Launch";
import OverflowMenuHorizontal from "@carbon/icons-react/es/OverflowMenuHorizontal";
import PlayFilledAlt from "@carbon/icons-react/es/PlayFilledAlt";
import QrCode from "@carbon/icons-react/es/QrCode";
import ShoppingCart from "@carbon/icons-react/es/ShoppingCart";
import Tag from "@carbon/icons-react/es/Tag";
import Tools from "@carbon/icons-react/es/Tools";
import VideoIcon from "@carbon/icons-react/es/Video";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { CampoNoLugar } from "@/componentes/ui/campo-no-lugar";
import { Codigo, Dinheiro, EsqueletoLinhas, EstadoErro, FotoEquipamento } from "@/componentes/ui/basicos";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/componentes/ui/dropdown-menu";
import {
	AbasFicha,
	type AbaFicha,
	CabecalhoFicha,
	NumeroFicha,
	NumerosFicha,
	PropriedadeFicha,
	PropriedadesFicha,
	SecaoFicha,
	useFicha,
	VazioFicha,
} from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { LinhaDoTempo, type EventoLinha } from "@/componentes/ui/linha-do-tempo";
import { PilulaUnidade, Selo } from "@/componentes/ui/marcadores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { SimpleTable, SimpleTableRow } from "@/componentes/ui/simple-table";
import { TableCell } from "@/componentes/ui/table";
import { GradeAgenda } from "@/componentes/agenda/grade-agenda";
import type { PropsFicha } from "@/componentes/fichas/registro";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { DIA, dataCurta, dinheiro, inicioDoDia, porcento, relativa } from "@/lib/formatos";
import { Link } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { useId, useState } from "react";
import { toast } from "sonner";

const SITUACAO_MANUTENCAO: Record<D.SituacaoManutencao, string> = {
	aberta: "Aberta",
	na_oficina: "Na oficina",
	esperando_peca: "Esperando peça",
	pronta: "Pronta",
	liberada: "Liberada",
	descartada: "Descartada",
};

function OndeEsta({ unidade, agora }: { unidade: D.Unidade; agora: Date }) {
	const s = Q.situacaoUnidade(unidade, agora);
	const { abrir } = useFicha();
	if (s.reservaId && ["na_rua", "pendente", "pre_reservada", "reservada", "conferencia"].includes(s.estado)) {
		return (
			<button type="button" onClick={(e) => { e.stopPropagation(); abrir("reserva", s.reservaId as number, { empilhar: true }); }} className="truncate text-left hover:underline">
				Reserva {s.reservaId}
				{s.detalhe ? ` · ${s.detalhe}` : ""}
			</button>
		);
	}
	if (s.estado === "reparo" && s.manutencaoId) {
		const m = Q.manutencao(s.manutencaoId);
		return (
			<button type="button" onClick={(e) => { e.stopPropagation(); abrir("manutencao", s.manutencaoId as number, { empilhar: true }); }} className="truncate text-left hover:underline">
				{m.oficina ?? "Manutenção"} · {s.detalhe}
			</button>
		);
	}
	if (s.estado === "baixada") return <span className="text-muted-foreground">Baixada{unidade.motivoBaixa ? ` · ${unidade.motivoBaixa}` : ""}</span>;
	return <span className="text-muted-foreground">Na casa{s.proximaSaida ? ` · próxima saída ${dataCurta(s.proximaSaida.em)}` : ""}</span>;
}

function NovoVideo({ aberto, aoFechar, equipamento }: { aberto: boolean; aoFechar: () => void; equipamento: D.Equipamento }) {
	const id = useId();
	const cameras = D.equipamentos.filter((e) => e.categoria === "camera" && e.ativo);
	const lentes = D.equipamentos.filter((e) => e.categoria === "lente" && e.ativo);
	const [camera, setCamera] = useState(String(equipamento.categoria === "camera" ? equipamento.id : cameras[0].id));
	const [lente, setLente] = useState(String(equipamento.categoria === "lente" ? equipamento.id : lentes[0].id));
	const [link, setLink] = useState("");
	const [erro, setErro] = useState<string | null>(null);
	return (
		<Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Novo vídeo de teste</DialogTitle>
					<DialogDescription>Grave a mesma cena com cada combinação e cole o link do YouTube. O robô só envia links cadastrados aqui.</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-3"
					onSubmit={(ev) => {
						ev.preventDefault();
						if (!/^https:\/\/(www\.)?(youtube\.com\/|youtu\.be\/)/.test(link.trim())) {
							setErro("Cole um link do YouTube (começa com https://youtu.be/ ou https://www.youtube.com/).");
							return;
						}
						toast.success(`Vídeo de teste salvo: ${Q.equipamento(Number(camera)).nome} + ${Q.equipamento(Number(lente)).nome}`);
						aoFechar();
					}}
				>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${id}-c`}>Câmera</Label>
							<Select value={camera} onValueChange={setCamera}>
								<SelectTrigger id={`${id}-c`} className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{cameras.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.nome}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${id}-l`}>Lente</Label>
							<Select value={lente} onValueChange={setLente}>
								<SelectTrigger id={`${id}-l`} className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{lentes.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.nome}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${id}-u`}>Link do vídeo</Label>
						<Input id={`${id}-u`} value={link} onChange={(e) => { setLink(e.target.value); setErro(null); }} placeholder="https://youtu.be/…" aria-invalid={!!erro} />
						{erro ? <p className="text-erro text-xs">{erro}</p> : null}
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={aoFechar}>
							Cancelar
						</Button>
						<Button type="submit">Salvar vídeo</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function VideosDeTeste({ equipamento }: { equipamento: D.Equipamento }) {
	const { ehDono } = usePapel();
	const { offline } = useConexao();
	const [novo, setNovo] = useState(false);
	const ehCamera = equipamento.categoria === "camera";
	const ehLente = equipamento.categoria === "lente";
	if (!ehCamera && !ehLente) {
		return <VazioFicha icone={VideoIcon} titulo="Sem vídeos de teste" descricao="Vídeos de teste existem só para câmeras e lentes: a mesma cena gravada com cada combinação." />;
	}
	const combos = D.combinacoes.filter((c) => (ehCamera ? c.cameraId === equipamento.id : c.lenteId === equipamento.id));
	return (
		<div className="flex flex-col gap-3 px-5 py-4">
			<div className="flex items-center justify-between gap-3">
				<p className="text-muted-foreground text-xs">{ehCamera ? "Para esta câmera, as lentes com vídeo." : "Para esta lente, as câmeras com vídeo."}</p>
				{ehDono ? (
					<Button variant="outline" size="sm" onClick={() => setNovo(true)} disabled={offline}>
						<Icon icon={Add} data-icon="inline-start" />
						Vídeo de teste
					</Button>
				) : null}
			</div>
			{combos.length === 0 ? (
				<VazioFicha icone={VideoIcon} titulo="Nenhum vídeo de teste" descricao="Grave a mesma cena com cada lente e cole o link." />
			) : (
				<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{combos.map((c) => {
						const titulo = `${Q.equipamento(c.cameraId).nome} + ${Q.equipamento(c.lenteId).nome}`;
						return (
							<li key={c.id} className="flex flex-col gap-2 rounded-lg border bg-card p-2">
								<div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
									{c.videoUrl ? <Icon icon={PlayFilledAlt} className="size-8" /> : <Icon icon={VideoIcon} className="size-6" />}
									<span className="absolute bottom-1.5 left-2 text-2xs">{titulo}</span>
								</div>
								<div className="flex min-w-0 flex-col gap-1.5 px-1 pb-1">
									<span className="truncate font-medium text-xs">{titulo}</span>
									{c.videoUrl ? (
										<div className="flex flex-wrap items-center gap-2">
											<Button asChild variant="outline" size="sm">
												<a href={c.videoUrl} target="_blank" rel="noreferrer">
													<Icon icon={Launch} data-icon="inline-start" />
													Abrir no YouTube
												</a>
											</Button>
											{c.temFoto ? <Badge variant="outline">com foto</Badge> : null}
										</div>
									) : (
										<Selo tom="atencao">Sem vídeo: o robô diz que não tem</Selo>
									)}
									{c.observacao ? <span className="text-muted-foreground text-2xs">{c.observacao}</span> : null}
								</div>
							</li>
						);
					})}
				</ul>
			)}
			<NovoVideo aberto={novo} aoFechar={() => setNovo(false)} equipamento={equipamento} />
		</div>
	);
}

export function FichaEquipamento({ id, aoVoltar, trilha }: PropsFicha) {
	const agora = useAgora(30_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { podeVerFinanceiro, ehDono } = usePapel();
	const { abrir } = useFicha();
	const e = Q.equipamento(Number(id));

	if (estado === "carregando") {
		return (
			<>
				<CabecalhoFicha titulo="Carregando…" aoVoltar={aoVoltar} trilha={trilha} />
				<div className="p-5">
					<EsqueletoLinhas linhas={6} />
				</div>
			</>
		);
	}
	if (estado === "erro" || !e) {
		return (
			<>
				<CabecalhoFicha titulo="Equipamento" aoVoltar={aoVoltar} trilha={trilha} />
				<EstadoErro frase="Este equipamento não pôde ser carregado." />
			</>
		);
	}

	const todas = Q.unidadesDo(e.id, true);
	const unidades = todas.filter((u) => u.estado !== "baixada");
	const baixadas = todas.length - unidades.length;
	const estados = Q.resumoEstados(e.id, agora);
	const livres = estados.livre;
	const naRua = estados.na_rua + estados.pendente;
	const basico = D.acessoriosObrigatorios.filter((a) => a.equipamentoId === e.id);
	const extras = D.acessoriosExtras.filter((a) => a.equipamentoId === e.id);
	const manutencoes = D.manutencoes.filter((m) => todas.some((u) => u.id === m.unidadeId)).sort((a, b) => b.abertaEm.getTime() - a.abertaEm.getTime());
	const combos = D.combinacoes.filter((c) => c.cameraId === e.id || c.lenteId === e.id);
	const idsEtiquetas = unidades.map((u) => u.id).join(",");
	const inicioAgenda = inicioDoDia(new Date(agora.getTime() - 2 * DIA));

	const eventos: EventoLinha[] = [
		...todas.flatMap((u) =>
			Q.eventosDaUnidade(u.id).map((ev) => ({
				id: `${u.id}-${ev.id}`,
				em: ev.em,
				ator: ev.ator,
				quem: ev.quem,
				texto: (
					<>
						<span className="font-mono">{u.codigo}</span> · {ev.texto}
					</>
				),
			})),
		),
		...manutencoes.map((m) => ({
			id: `m${m.id}`,
			em: m.abertaEm,
			ator: "dono" as const,
			icone: Tools,
			texto: (
				<>
					Manutenção {m.id} aberta: {m.problema}
				</>
			),
		})),
	];

	const abas: AbaFicha[] = [
		{
			valor: "geral",
			rotulo: "Visão geral",
			conteudo: (
				<>
					<SecaoFicha titulo="Fotos">
						<div className="grid max-w-64 grid-cols-3 gap-2 sm:max-w-md">
							{[0, 1, 2].map((i) => (
								<div key={i} className="flex aspect-[3/4] items-center justify-center rounded-md border bg-muted text-muted-foreground text-2xs">
									{i === 0 ? (e.temFoto ? "capa" : "sem foto") : ""}
								</div>
							))}
						</div>
					</SecaoFicha>
					<SecaoFicha titulo="Detalhes">
						<PropriedadesFicha>
							<PropriedadeFicha rotulo="Categoria">{D.CATEGORIAS[e.categoria]}</PropriedadeFicha>
							{podeVerFinanceiro ? (
								<PropriedadeFicha rotulo="Diária">
									<CampoNoLugar rotulo="Diária" valor={dinheiro(e.precoDiaria)} somenteLeitura={offline} />
								</PropriedadeFicha>
							) : null}
							<PropriedadeFicha rotulo="Marca">
								<CampoNoLugar rotulo="Marca" valor={e.marca} somenteLeitura={!ehDono || offline} />
							</PropriedadeFicha>
							{podeVerFinanceiro ? (
								<PropriedadeFicha rotulo="Reposição">
									<CampoNoLugar rotulo="Valor de reposição" valor={dinheiro(e.valorReposicao)} somenteLeitura={offline} />
								</PropriedadeFicha>
							) : null}
							<PropriedadeFicha rotulo="Modelo">
								<CampoNoLugar rotulo="Modelo" valor={e.modelo} somenteLeitura={!ehDono || offline} />
							</PropriedadeFicha>
							<PropriedadeFicha rotulo="Descrição" larga>
								<CampoNoLugar rotulo="Descrição" valor={e.descricao ?? ""} vazio="Sem descrição" somenteLeitura={!ehDono || offline} />
							</PropriedadeFicha>
						</PropriedadesFicha>
					</SecaoFicha>
					<SecaoFicha titulo="Acompanha (pacote básico)" acao={ehDono ? <Button variant="ghost" size="sm" disabled={offline}>Editar</Button> : null}>
						{basico.length ? (
							<div className="flex flex-col gap-2">
								<ul className="flex flex-wrap gap-2">
									{basico.map((a) => (
										<li key={a.acessorioId} className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
											<span className="tabular-nums">{a.quantidade} ×</span> {Q.equipamento(a.acessorioId).nome}
											<Badge variant="outline">Pacote básico</Badge>
										</li>
									))}
								</ul>
								<p className="text-muted-foreground text-xs">Já incluído na diária do equipamento e coberto pela caução. O robô e o Montador acrescentam estes itens sozinhos.</p>
							</div>
						) : (
							<p className="text-muted-foreground text-xs">Nada sai junto obrigatoriamente com este equipamento.</p>
						)}
					</SecaoFicha>
					<SecaoFicha titulo="Extras (cobrados à parte)" acao={ehDono ? <Button variant="ghost" size="sm" disabled={offline}>Editar</Button> : null}>
						{extras.length ? (
							<div className="flex flex-col gap-2">
								<ul className="flex flex-col gap-1">
									{extras.map((a) => {
										const ac = Q.equipamento(a.acessorioId);
										return (
											<li key={a.acessorioId} className="flex flex-wrap items-center gap-2 text-xs">
												<span>{ac.nome} a mais</span>
												{podeVerFinanceiro ? (
													<span className="text-muted-foreground">
														· <Dinheiro valor={ac.precoDiaria} /> por diária
													</span>
												) : null}
												<Badge variant="outline">Extra</Badge>
											</li>
										);
									})}
								</ul>
								<p className="text-muted-foreground text-xs">O robô oferece quando faz sentido; só entram no pedido se o cliente escolher.</p>
							</div>
						) : (
							<p className="text-muted-foreground text-xs">Nenhum extra cadastrado.</p>
						)}
					</SecaoFicha>
				</>
			),
		},
		{
			valor: "unidades",
			rotulo: "Unidades",
			contagem: unidades.length,
			conteudo:
				unidades.length === 0 ? (
					<VazioFicha
						icone={Tag}
						titulo="Nenhuma unidade"
						descricao="Adicione a primeira para imprimir a etiqueta."
						acao={ehDono ? <Button variant="outline" size="sm" disabled={offline}>Adicionar unidade</Button> : undefined}
					/>
				) : (
					<div className="flex flex-col gap-3 px-5 py-4">
						<div className="overflow-x-auto">
							<SimpleTable
								className="min-w-[640px]"
								columns={[
									{ id: "et", header: "Etiqueta", width: "w-32" },
									{ id: "ns", header: "Nº de série", width: "w-28" },
									{ id: "es", header: "Estado", width: "w-44" },
									{ id: "on", header: "Onde está" },
									{ id: "co", header: "Última conferência", width: "w-32" },
								]}
							>
								{unidades.map((u) => {
									const s = Q.situacaoUnidade(u, agora);
									return (
										<SimpleTableRow key={u.id} clickable tabIndex={0} onClick={() => abrir("unidade", u.id, { empilhar: true })} onKeyDown={(ev) => ev.key === "Enter" && abrir("unidade", u.id, { empilhar: true })}>
											<TableCell className="px-3 py-2.5">
												<Codigo>{u.codigo}</Codigo>
											</TableCell>
											<TableCell className="px-3 py-2.5">
												<Codigo className="text-muted-foreground">{u.numeroSerie ?? "—"}</Codigo>
											</TableCell>
											<TableCell className="px-3 py-2.5">
												<PilulaUnidade estado={s.estado} compacta />
											</TableCell>
											<TableCell className="max-w-0 truncate px-3 py-2.5">
												<OndeEsta unidade={u} agora={agora} />
											</TableCell>
											<TableCell className="px-3 py-2.5 text-muted-foreground">{u.ultimaConferenciaEm ? relativa(u.ultimaConferenciaEm, agora) : "—"}</TableCell>
										</SimpleTableRow>
									);
								})}
							</SimpleTable>
						</div>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<span className="text-muted-foreground text-xs">{baixadas ? `${baixadas} ${baixadas === 1 ? "unidade baixada aparece" : "unidades baixadas aparecem"} em Unidades › Arquivados.` : ""}</span>
							{ehDono ? (
								<Button variant="outline" size="sm" disabled={offline} onClick={() => toast.success("Unidade adicionada (exemplo). Imprima a etiqueta em Etiquetas.")}>
									<Icon icon={Add} data-icon="inline-start" />
									Adicionar unidade
								</Button>
							) : null}
						</div>
					</div>
				),
		},
		{
			valor: "agenda",
			rotulo: "Agenda",
			conteudo: (
				<div className="flex flex-col gap-2 px-5 py-4">
					<p className="text-muted-foreground text-xs">Próximos 30 dias, por unidade. Clique numa barra para abrir a reserva.</p>
					<GradeAgenda
						inicio={inicioAgenda}
						dias={30}
						larguraDia={32}
						primeiraColuna={196}
						equipamentos={[e]}
						podeArrastar={false}
						podeMontar={false}
						expandirTodos
						rotuloRegiao={`Agenda de ${e.nome}`}
						className="max-h-96"
					/>
				</div>
			),
		},
		{
			valor: "historico",
			rotulo: "Histórico",
			conteudo: eventos.length ? (
				<div className="px-5 py-4">
					<LinhaDoTempo eventos={eventos} />
				</div>
			) : (
				<VazioFicha icone={Archive} titulo="Sem histórico" descricao="Saídas, voltas, danos e manutenções aparecem aqui." />
			),
		},
		{
			valor: "videos",
			rotulo: "Vídeos de teste",
			contagem: combos.length || null,
			conteudo: <VideosDeTeste equipamento={e} />,
		},
		{
			valor: "manutencao",
			rotulo: "Manutenção",
			contagem: manutencoes.filter((m) => !["liberada", "descartada"].includes(m.situacao)).length || null,
			conteudo: (
				<div className="flex flex-col gap-3 px-5 py-4">
					{manutencoes.length ? (
						<div className="overflow-x-auto">
							<SimpleTable
								className="min-w-[560px]"
								columns={[
									{ id: "ab", header: "Aberta em", width: "w-24" },
									{ id: "un", header: "Unidade", width: "w-32" },
									{ id: "pr", header: "Problema" },
									{ id: "si", header: "Situação", width: "w-32" },
									...(podeVerFinanceiro ? [{ id: "cu", header: "Custo", width: "w-24", align: "right" as const }] : []),
								]}
							>
								{manutencoes.map((m) => {
									const aberta = !["liberada", "descartada"].includes(m.situacao);
									return (
										<SimpleTableRow key={m.id} clickable tabIndex={0} onClick={() => abrir("manutencao", m.id, { empilhar: true })} onKeyDown={(ev) => ev.key === "Enter" && abrir("manutencao", m.id, { empilhar: true })}>
											<TableCell className="px-3 py-2.5 tabular-nums">{dataCurta(m.abertaEm)}</TableCell>
											<TableCell className="px-3 py-2.5">
												<Codigo>{Q.unidade(m.unidadeId).codigo}</Codigo>
											</TableCell>
											<TableCell className="max-w-0 truncate px-3 py-2.5">{m.problema}</TableCell>
											<TableCell className="px-3 py-2.5">
												<Selo tom={aberta ? "atencao" : "neutro"}>{SITUACAO_MANUTENCAO[m.situacao]}</Selo>
											</TableCell>
											{podeVerFinanceiro ? (
												<TableCell className="px-3 py-2.5 text-right">{m.custo != null ? <Dinheiro valor={m.custo} /> : "—"}</TableCell>
											) : null}
										</SimpleTableRow>
									);
								})}
							</SimpleTable>
						</div>
					) : (
						<VazioFicha icone={Tools} titulo="Nenhuma manutenção" descricao="Peças com problema aparecem aqui até voltarem a ser alugáveis." />
					)}
					<div className="flex justify-end">
						<Button asChild variant="outline" size="sm">
							<Link href="/manutencao">
								<Icon icon={Tools} data-icon="inline-start" />
								Abrir manutenção
							</Link>
						</Button>
					</div>
				</div>
			),
		},
		...(podeVerFinanceiro
			? [
					{
						valor: "rendeu",
						rotulo: "Quanto já rendeu",
						conteudo: (
							<div className="flex flex-col gap-4 px-5 py-4">
								<p className="text-muted-foreground text-xs">
									Por unidade: faturado com pagamento confirmado pela InfinitePay ÷ valor de compra. Uso no tempo do modelo: {porcento(Q.usoNoTempo(e.id))} dos dias em que podia estar alugado.
									<span className="block">Números de exemplo.</span>
								</p>
								{unidades.length === 0 ? (
									<p className="text-muted-foreground text-xs">Sem unidades.</p>
								) : (
									<ul className="flex flex-col gap-3">
										{unidades.map((u) => {
											const fracao = Q.quantoJaRendeu(u.id);
											const fat = Q.faturadoAcumulado(u.id);
											const reparo = Q.manutencoesDa(u.id).reduce((s, m) => s + (m.custo ?? 0), 0);
											return (
												<li key={u.id} className="flex flex-col gap-1.5">
													<div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
														<Codigo>{u.codigo}</Codigo>
														{fracao == null ? (
															<span className="text-muted-foreground">Informe o valor de compra para ver</span>
														) : (
															<span className="tabular-nums">
																<span className="font-medium">{porcento(fracao)}</span>
																<span className="text-muted-foreground">
																	{" "}
																	· <Dinheiro valor={fat ?? 0} /> de <Dinheiro valor={u.valorCompra ?? 0} />
																	{reparo ? (
																		<>
																			{" "}
																			· reparo <Dinheiro valor={reparo} />
																		</>
																	) : null}
																</span>
															</span>
														)}
													</div>
													<div className="relative h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
														<span className={cn("absolute inset-y-0 left-0 rounded-full", (fracao ?? 0) >= 1 ? "bg-chart-1" : "bg-chart-2")} style={{ width: `${Math.min(100, ((fracao ?? 0) / 2) * 100)}%` }} />
														<span className="absolute inset-y-0 left-1/2 w-px bg-foreground/40" />
													</div>
												</li>
											);
										})}
									</ul>
								)}
								<p className="text-muted-foreground text-2xs">A marca no meio da barra é 100%: a unidade já se pagou.</p>
							</div>
						),
					} satisfies AbaFicha,
				]
			: []),
	];

	return (
		<>
			<CabecalhoFicha
				aoVoltar={aoVoltar}
				trilha={trilha}
				foto={<FotoEquipamento nome={e.nome} tamanho={48} />}
				titulo={e.nome}
				descricao={`${D.CATEGORIAS[e.categoria]} · ${e.marca} ${e.modelo} · ${unidades.length} ${unidades.length === 1 ? "unidade" : "unidades"} · ${livres} ${livres === 1 ? "livre" : "livres"} agora`}
				nota={e.arquivadoEm ? <Selo tom="neutro">Arquivado</Selo> : null}
				acoes={
					<>
						{ehDono && e.ativo ? (
							<Button asChild size="sm">
								<Link href={`/pedido/novo?equipamento=${e.id}`}>
									<Icon icon={ShoppingCart} data-icon="inline-start" />
									Nova reserva com este
								</Link>
							</Button>
						) : null}
						{unidades.length ? (
							<Button asChild variant="outline" size="sm">
								<Link href={`/etiquetas?unidades=${idsEtiquetas}`}>
									<Icon icon={QrCode} data-icon="inline-start" />
									Etiquetas
								</Link>
							</Button>
						) : null}
						{ehDono ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon-sm" aria-label="Mais ações">
										<Icon icon={OverflowMenuHorizontal} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										disabled={offline}
										onSelect={() => toast.success(`${e.nome} arquivado`, { duration: 6000, action: { label: "Desfazer", onClick: () => toast(`${e.nome} voltou ao catálogo`) } })}
									>
										<Icon icon={Archive} className="size-4" />
										Arquivar (dá para recuperar)
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : null}
					</>
				}
			/>
			<NumerosFicha>
				{podeVerFinanceiro ? (
					<NumeroFicha rotulo="Diária">
						<Dinheiro valor={e.precoDiaria} />
					</NumeroFicha>
				) : (
					<NumeroFicha rotulo="Unidades">{unidades.length}</NumeroFicha>
				)}
				<NumeroFicha rotulo="Livres agora">{livres}</NumeroFicha>
				<NumeroFicha rotulo="Na rua">{naRua}</NumeroFicha>
				{podeVerFinanceiro ? (
					<NumeroFicha rotulo="Rendeu em 12 meses">
						<Dinheiro valor={Q.faturado12Meses(e.id)} />
					</NumeroFicha>
				) : (
					<NumeroFicha rotulo="Em reparo">{estados.reparo}</NumeroFicha>
				)}
			</NumerosFicha>
			<AbasFicha abas={abas} />
		</>
	);
}
