"use client";
// Ficha da manutenção (7.18): régua de situação, detalhes, fotos do dano, reserva de origem e cobrança.

import CheckmarkOutline from "@carbon/icons-react/es/CheckmarkOutline";
import Image from "@carbon/icons-react/es/Image";
import Misuse from "@carbon/icons-react/es/Misuse";
import Tools from "@carbon/icons-react/es/Tools";
import { Button } from "@/componentes/ui/button";
import { Codigo, FotoEquipamento } from "@/componentes/ui/basicos";
import { CampoNoLugar } from "@/componentes/ui/campo-no-lugar";
import { AbasFicha, CabecalhoFicha, PropriedadeFicha, PropriedadesFicha, SecaoFicha, VazioFicha, useFicha } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { LinhaDoTempo, type EventoLinha } from "@/componentes/ui/linha-do-tempo";
import { PilulaUnidade, Selo } from "@/componentes/ui/marcadores";
import { Regua } from "@/componentes/ui/regua";
import { Switch } from "@/componentes/ui/switch";
import type { PropsFicha } from "@/componentes/fichas/registro";
import { MenuSituacao, nomeSituacao, useMoverManutencao } from "@/componentes/locacao/reserva-manutencao";
import { useConexao } from "@/lib/estado-prototipo";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { dataCurta, diaEHora, dinheiro } from "@/lib/formatos";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { SITUACOES_MANUTENCAO, TIPOS_DANO, avisarMudanca, decidirCobranca, paradaHa, reservaFuturaDaUnidade, useVersaoDados } from "@/prototipo/consultas-reservas";
import { useState } from "react";
import { toast } from "sonner";

const PASSOS: D.SituacaoManutencao[] = ["aberta", "na_oficina", "esperando_peca", "pronta", "liberada"];

function Cobranca({ m, agora }: { m: D.Manutencao; agora: Date }) {
	const { ehDono } = usePapel();
	const { offline } = useConexao();
	const [cobrar, setCobrar] = useState(m.cobrarCliente ?? true);
	const [valor, setValor] = useState(m.valorCobrado != null ? String(m.valorCobrado) : "");
	if (!m.reservaOrigemId) {
		return <p className="text-muted-foreground text-xs">Não veio de uma reserva: não há cobrança de cliente.</p>;
	}
	if (m.cobrancaDecididaEm) {
		return (
			<p className="flex flex-wrap items-center gap-2 text-xs">
				<Selo tom="ok">Decidida {dataCurta(m.cobrancaDecididaEm)}</Selo>
				{m.cobrarCliente ? `Cobrar do cliente ${ehDono && m.valorCobrado != null ? dinheiro(m.valorCobrado) : ""}, descontado da caução.` : "Sem cobrança ao cliente."}
			</p>
		);
	}
	if (!ehDono) {
		return (
			<p className="flex flex-wrap items-center gap-2 text-xs">
				<Selo tom="atencao">Falta decidir</Selo>A cobrança do dano é decidida pelo dono.
			</p>
		);
	}
	const numero = Number(valor.replace(",", "."));
	return (
		<div className="flex flex-col gap-3">
			<label className="flex items-center gap-2 text-xs" data-alvo>
				<Switch checked={cobrar} onCheckedChange={setCobrar} />
				Cobrar do cliente
			</label>
			{cobrar ? (
				<div className="flex max-w-60 flex-col gap-1.5">
					<Label htmlFor={`valor-dano-${m.id}`}>Valor cobrado (descontado da caução)</Label>
					<Input id={`valor-dano-${m.id}`} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
				</div>
			) : null}
			<div>
				<Button
					variant="outline"
					size="sm"
					disabled={offline || (cobrar && !(numero > 0))}
					onClick={() => {
						decidirCobranca(m.id, cobrar, cobrar ? numero : undefined, agora);
						toast.success("Cobrança decidida");
					}}
				>
					<Icon icon={CheckmarkOutline} data-icon="inline-start" />
					Decidir cobrança
				</Button>
			</div>
		</div>
	);
}

export function FichaManutencao({ id, aoVoltar, trilha }: PropsFicha) {
	useVersaoDados();
	const agora = useAgora(60_000);
	const { ehDono, podeVerFinanceiro } = usePapel();
	const { offline } = useConexao();
	const { abrir } = useFicha();
	const { pedir, janela } = useMoverManutencao(agora);
	const m = D.manutencoes.find((x) => x.id === Number(id));
	if (!m) {
		return (
			<>
				<CabecalhoFicha titulo={`Manutenção ${id}`} aoVoltar={aoVoltar} trilha={trilha} />
				<VazioFicha icone={Tools} titulo="Esta manutenção não pôde ser carregada." descricao="Confira o número ou tente de novo." />
			</>
		);
	}
	const u = Q.unidade(m.unidadeId);
	const e = Q.equipamento(u.equipamentoId);
	const futura = reservaFuturaDaUnidade(u.id, agora);
	const encerrada = m.situacao === "liberada" || m.situacao === "descartada";
	const pendente = !!m.reservaOrigemId && !m.cobrancaDecididaEm;
	const eventos: EventoLinha[] = Q.eventosDaUnidade(u.id).map((ev) => ({ id: String(ev.id), em: ev.em, texto: ev.texto, ator: ev.ator, quem: ev.quem }));

	const visao = (
		<div className="flex flex-col">
			<SecaoFicha titulo="Situação">
				<Regua passos={PASSOS} atual={m.situacao === "descartada" ? null : m.situacao} rotulo={(s) => nomeSituacao(s)} />
				{m.situacao === "descartada" ? <Selo tom="neutro">Descartada: a unidade foi baixada</Selo> : null}
			</SecaoFicha>
			<SecaoFicha titulo="Detalhes">
				<PropriedadesFicha>
					<PropriedadeFicha rotulo="Tipo">{TIPOS_DANO[m.tipo]}</PropriedadeFicha>
					<PropriedadeFicha rotulo="Aberta em">{diaEHora(m.abertaEm)}</PropriedadeFicha>
					<PropriedadeFicha rotulo="Problema" larga>
						<CampoNoLugar
							rotulo="Problema"
							valor={m.problema}
							somenteLeitura={offline || encerrada}
							aoSalvar={(v) => {
								m.problema = v;
								avisarMudanca();
							}}
						/>
					</PropriedadeFicha>
					<PropriedadeFicha rotulo="Oficina">
						<CampoNoLugar
							rotulo="Oficina"
							valor={m.oficina ?? ""}
							vazio="Sem oficina"
							somenteLeitura={offline || encerrada}
							aoSalvar={(v) => {
								m.oficina = v || undefined;
								avisarMudanca();
							}}
						/>
					</PropriedadeFicha>
					<PropriedadeFicha rotulo="Previsão de volta">{m.previsaoVolta ? dataCurta(m.previsaoVolta) : <span className="text-muted-foreground">—</span>}</PropriedadeFicha>
					{podeVerFinanceiro ? (
						<PropriedadeFicha rotulo="Custo">
							<CampoNoLugar
								rotulo="Custo"
								tipo="number"
								valor={m.custo != null ? String(m.custo) : ""}
								vazio="Sem custo"
								somenteLeitura={offline || encerrada}
								aoSalvar={(v) => {
									m.custo = v ? Number(v) : undefined;
									avisarMudanca();
								}}
							/>
						</PropriedadeFicha>
					) : null}
					<PropriedadeFicha rotulo="Parada há">{paradaHa(m, agora)}</PropriedadeFicha>
					<PropriedadeFicha rotulo="Reserva de origem">
						{m.reservaOrigemId ? (
							<button type="button" data-alvo className="inline-flex items-center text-link underline-offset-4 hover:underline" onClick={() => abrir("reserva", m.reservaOrigemId as number, { empilhar: true })}>
								Reserva {m.reservaOrigemId}
							</button>
						) : (
							<span className="text-muted-foreground">Achada na conferência</span>
						)}
					</PropriedadeFicha>
					<PropriedadeFicha rotulo="Próxima reserva">
						{futura ? (
							<button type="button" data-alvo className="inline-flex items-center rounded-full" onClick={() => abrir("reserva", futura.id, { empilhar: true, aba: "itens" })} aria-label={`Tem reserva em ${dataCurta(futura.retiradaEm)}: trocar a unidade na reserva ${futura.id}`}>
								<Selo tom="atencao">Tem reserva em {dataCurta(futura.retiradaEm)} · Trocar unidade</Selo>
							</button>
						) : (
							<span className="text-muted-foreground">Nenhuma</span>
						)}
					</PropriedadeFicha>
				</PropriedadesFicha>
			</SecaoFicha>
			<SecaoFicha titulo="Fotos do dano">
				<div className="flex flex-wrap gap-2">
					{["Foto da volta", "Detalhe", "Etiqueta"].map((f) => (
						<div key={f} className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border bg-muted text-muted-foreground text-2xs">
							<Icon icon={Image} className="size-5" />
							{f}
						</div>
					))}
				</div>
				<p className="text-muted-foreground text-xs">Fotos de exemplo. No app, as fotos tiradas no balcão aparecem aqui.</p>
			</SecaoFicha>
			<SecaoFicha titulo="Cobrança">
				<Cobranca m={m} agora={agora} />
			</SecaoFicha>
			{!encerrada ? (
				<div className="flex flex-wrap items-center gap-2 px-5 py-4">
					<Button disabled={offline || pendente} onClick={() => pedir(m.id, "liberada")} title={pendente ? "Decida a cobrança antes de liberar" : undefined}>
						<Icon icon={CheckmarkOutline} data-icon="inline-start" />
						Liberar para aluguel
					</Button>
					{ehDono ? (
						<Button variant="outline" disabled={offline} onClick={() => pedir(m.id, "descartada")}>
							<Icon icon={Misuse} data-icon="inline-start" />
							Descartar
						</Button>
					) : null}
					{pendente ? <span className="text-muted-foreground text-xs">Decida a cobrança antes de liberar.</span> : null}
				</div>
			) : null}
		</div>
	);

	return (
		<>
			<CabecalhoFicha
				aoVoltar={aoVoltar}
				trilha={trilha}
				foto={<FotoEquipamento nome={e.nome} tamanho={32} />}
				titulo={`Manutenção ${m.id}`}
				descricao={
					<>
						{e.nome} · <Codigo>{u.codigo}</Codigo>
						{u.numeroSerie ? (
							<>
								{" "}
								· nº <Codigo>{u.numeroSerie}</Codigo>
							</>
						) : null}
					</>
				}
				nota={
					<>
						<PilulaUnidade estado={u.estado === "baixada" ? "baixada" : u.estado === "em_reparo" ? "reparo" : "livre"} compacta />
						<span className="text-muted-foreground">parada há {paradaHa(m, agora)}</span>
					</>
				}
				acoes={<MenuSituacao m={m} aoMover={(para) => pedir(m.id, para)} rotuloAtual />}
			/>
			<AbasFicha
				abas={[
					{ valor: "visao", rotulo: "Visão geral", conteudo: visao },
					{
						valor: "historico",
						rotulo: "Histórico",
						conteudo: (
							<div className="px-5 py-3">
								{eventos.length ? <LinhaDoTempo eventos={eventos} /> : <p className="text-muted-foreground text-xs">Nenhum evento ainda.</p>}
							</div>
						),
					},
				]}
			/>
			{janela}
		</>
	);
}

export { SITUACOES_MANUTENCAO };
