"use client";
// Ficha do kit: componentes em lista reordenável, agenda dos componentes e histórico.

import Calendar from "@carbon/icons-react/es/Calendar";
import RecentlyViewed from "@carbon/icons-react/es/RecentlyViewed";
import ShoppingCart from "@carbon/icons-react/es/ShoppingCart";
import { Button } from "@/componentes/ui/button";
import { Dinheiro, EstadoErro, FotoEquipamento } from "@/componentes/ui/basicos";
import { CampoNoLugar } from "@/componentes/ui/campo-no-lugar";
import { AbasFicha, CabecalhoFicha, NumeroFicha, NumerosFicha, SecaoFicha, VazioFicha, useFicha } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { LinhaDoTempo, type EventoLinha } from "@/componentes/ui/linha-do-tempo";
import { EtapaRotulo, Selo } from "@/componentes/ui/marcadores";
import { SortableItem, SortableList } from "@/componentes/ui/sortable-list";
import { Switch } from "@/componentes/ui/switch";
import type { PropsFicha } from "@/componentes/fichas/registro";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConexao } from "@/lib/estado-prototipo";
import { Link } from "@/lib/navegacao";
import { useAgora } from "@/lib/relogio";
import { periodo } from "@/lib/formatos";
import * as Q from "@/prototipo/consultas";
import { diariaDoKit, itensDoKit, montaveisAgora, reservasComKit } from "@/prototipo/consultas-estoque";
import { useState } from "react";
import { toast } from "sonner";

export function FichaKit({ id, aoVoltar, trilha }: PropsFicha) {
	const agora = useAgora(60_000);
	const { offline } = useConexao();
	const ehCelular = useIsMobile();
	const { abrir } = useFicha();
	const kit = Q.kit(Number(id));
	const [ordem, setOrdem] = useState<string[]>(() => (kit ? kit.componentes.map((c) => String(c.equipamentoId)) : []));
	const [obrigatorios, setObrigatorios] = useState<Set<string>>(() => new Set(ordem));

	if (!kit) {
		return (
			<>
				<CabecalhoFicha titulo="Kit" aoVoltar={aoVoltar} trilha={trilha} />
				<EstadoErro frase="Este kit não pôde ser carregado." />
			</>
		);
	}

	const m = montaveisAgora(kit.id, agora);
	const reservas = reservasComKit(kit.id);
	const eventos: EventoLinha[] = [
		...reservas.map((r) => ({ id: `r${r.id}`, em: r.criadaEm, ator: "robo" as const, texto: `Kit entrou na reserva ${r.id} (${Q.cliente(r.clienteId).nome}).` })),
		{ id: "criado", em: new Date(agora.getTime() - 120 * 86_400_000), ator: "dono", quem: "Xerxes", texto: "Kit criado." },
	];

	return (
		<>
			<CabecalhoFicha
				foto={<FotoEquipamento nome={kit.nome} tamanho={40} />}
				titulo={kit.nome}
				descricao={kit.descricao}
				aoVoltar={aoVoltar}
				trilha={trilha}
				nota={
					m.falta ? (
						<Selo tom="atencao">{m.falta}</Selo>
					) : (
						<Selo tom="ok">{m.montaveis === 1 ? "1 montável agora" : `${m.montaveis} montáveis agora`}</Selo>
					)
				}
				acoes={
					<Button asChild variant="outline" size="sm">
						<Link href={`/pedido/novo?kit=${kit.id}`}>
							<Icon icon={ShoppingCart} data-icon="inline-start" />
							Nova reserva com este kit
						</Link>
					</Button>
				}
			/>
			<NumerosFicha>
				<NumeroFicha rotulo="Diária do kit (soma)">
					<Dinheiro valor={diariaDoKit(kit)} />
				</NumeroFicha>
				<NumeroFicha rotulo="Itens">{itensDoKit(kit)}</NumeroFicha>
				<NumeroFicha rotulo="Montáveis agora">{m.montaveis}</NumeroFicha>
				<NumeroFicha rotulo="Saídas em 90 dias">{kit.saidas90d}</NumeroFicha>
			</NumerosFicha>
			<AbasFicha
				abas={[
					{
						valor: "componentes",
						rotulo: "Componentes",
						contagem: kit.componentes.length,
						conteudo: (
							<>
								<SecaoFicha titulo="Componentes">
									{ehCelular ? <p className="text-muted-foreground text-xs">Edite no computador. No celular, a lista é só para consulta.</p> : null}
									<SortableList ids={ordem} onReorder={(novos) => (offline || ehCelular ? null : setOrdem(novos))}>
										<div className="flex flex-col divide-y rounded-lg border">
											{ordem.map((eid) => {
												const c = kit.componentes.find((x) => String(x.equipamentoId) === eid);
												if (!c) return null;
												const e = Q.equipamento(c.equipamentoId);
												return (
													<SortableItem key={eid} id={eid} label={e.nome} className="px-2 py-1.5">
														<FotoEquipamento nome={e.nome} tamanho={24} />
														<button type="button" onClick={() => abrir("equipamento", e.id, { empilhar: true })} className="min-w-0 flex-1 truncate text-left text-xs hover:underline">
															{e.nome}
														</button>
														<span className="w-14 text-xs">
															<CampoNoLugar rotulo={`Quantidade de ${e.nome}`} valor={String(c.quantidade)} tipo="number" somenteLeitura={offline || ehCelular} />
														</span>
														<label className="flex items-center gap-2 text-muted-foreground text-xs" data-alvo>
															<Switch
																size="sm"
																checked={obrigatorios.has(eid)}
																disabled={offline || ehCelular}
																onCheckedChange={(v) => {
																	setObrigatorios((s) => {
																		const n = new Set(s);
																		if (v) n.add(eid);
																		else n.delete(eid);
																		return n;
																	});
																	toast.success(v ? "Agora é obrigatório no kit" : "Agora é opcional no kit");
																}}
															/>
															Obrigatório
														</label>
													</SortableItem>
												);
											})}
										</div>
									</SortableList>
									<p className="text-muted-foreground text-xs">
										Ao reservar, o kit vira as unidades destes equipamentos. Os montáveis são o menor número livre entre os componentes.
									</p>
								</SecaoFicha>
								<SecaoFicha titulo="Preço">
									<p className="text-muted-foreground text-xs/5">
										A diária do kit é a soma das diárias dos itens, calculada pelo banco. Preço de combo e promoção ainda não foi definido; quando houver, a economia aparece sempre ao lado da soma avulsa.
									</p>
								</SecaoFicha>
							</>
						),
					},
					{
						valor: "agenda",
						rotulo: "Agenda",
						conteudo: reservas.length ? (
							<div className="flex flex-col">
								<ul className="flex flex-col divide-y">
									{reservas.map((r) => (
										<li key={r.id}>
											<button type="button" onClick={() => abrir("reserva", r.id, { empilhar: true })} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted">
												<span className="flex min-w-0 flex-1 flex-col gap-0.5">
													<span className="truncate text-xs">
														<span className="font-mono">{r.id}</span> · {Q.cliente(r.clienteId).nome}
													</span>
													<span className="text-muted-foreground text-xs">{periodo(r.retiradaEm, r.devolucaoEm)}</span>
												</span>
												<EtapaRotulo etapa={r.etapa} />
											</button>
										</li>
									))}
								</ul>
								<div className="px-5 py-3">
									<Button asChild variant="outline" size="sm">
										<Link href="/agenda">
											<Icon icon={Calendar} data-icon="inline-start" />
											Ver componentes na agenda
										</Link>
									</Button>
								</div>
							</div>
						) : (
							<VazioFicha icone={Calendar} titulo="Nenhuma reserva com este kit" descricao="Quando o kit entrar numa reserva, o período aparece aqui." />
						),
					},
					{
						valor: "historico",
						rotulo: "Histórico",
						conteudo: eventos.length ? (
							<div className="px-5 py-3">
								<LinhaDoTempo eventos={eventos} />
							</div>
						) : (
							<VazioFicha icone={RecentlyViewed} titulo="Sem histórico" descricao="Mudanças no kit aparecem aqui." />
						),
					},
				]}
			/>
		</>
	);
}
