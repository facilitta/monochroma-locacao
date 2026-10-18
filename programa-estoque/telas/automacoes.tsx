"use client";
// 7.9 Automações: ligar, desligar e conferir as automações prontas, que rodam no n8n do próprio servidor.

import Flow from "@carbon/icons-react/es/Flow";
import Information from "@carbon/icons-react/es/Information";
import { Badge } from "@/componentes/ui/badge";
import { CabecalhoPagina, EstadoErro, EstadoVazio, EsqueletoLinhas, Pagina } from "@/componentes/ui/basicos";
import { useFicha, useRegistrarLista } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { PontoSituacao } from "@/componentes/ui/marcadores";
import { CampoBusca } from "@/componentes/ui/tabela-lista";
import { Interruptor } from "@/componentes/gestao/comum";
import { NOME_RESULTADO, TOM_RESULTADO, ligarAutomacao, useAutomacoes } from "@/componentes/gestao/automacoes-estado";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { relativa, semAcento } from "@/lib/formatos";
import { useAgora } from "@/lib/relogio";
import * as D from "@/prototipo/dados";
import { mensagensAutomaticasNoMes } from "@/prototipo/consultas-gestao";
import { useState } from "react";
import { toast } from "sonner";


export function TelaAutomacoes() {
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const { abrir } = useFicha();
	const { ligadas, simuladas } = useAutomacoes();
	const [busca, setBusca] = useState("");
	const lista = (estado === "vazio" ? [] : D.automacoes).filter((a) => !busca || semAcento(`${a.nome} ${a.quando} ${a.entao}`).includes(semAcento(busca)));
	useRegistrarLista("automacao", lista.map((a) => String(a.id)));
	const enviadas = mensagensAutomaticasNoMes(agora);

	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Automações"
				descricao="Receitas prontas que rodam sozinhas no servidor da locadora. Aqui você liga, desliga e confere o que cada uma fez, sem abrir o n8n."
			/>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar automação…" />
				<p className="flex items-center gap-2 text-muted-foreground text-xs">
					<Icon icon={Information} className="size-4 shrink-0" />
					{enviadas} mensagens automáticas enviadas em outubro. Cada envio tem custo na YCloud.
				</p>
			</div>
			{estado === "erro" ? (
				<div className="rounded-lg border">
					<EstadoErro frase="Não consegui carregar as automações." />
				</div>
			) : estado === "carregando" ? (
				<EsqueletoLinhas linhas={8} />
			) : lista.length === 0 ? (
				<div className="rounded-lg border">
					<EstadoVazio icone={Flow} titulo={busca ? "Nenhuma automação com essa busca." : "Nenhuma automação ainda"} descricao="As automações prontas aparecem aqui, já configuradas para a locadora." />
				</div>
			) : (
				<ul className="flex flex-col divide-y overflow-hidden rounded-lg border bg-card">
					{lista.map((a) => {
						const ligada = ligadas[a.id];
						const ultima = [...(simuladas[a.id] ?? []), ...a.execucoes].sort((x, y) => y.em.getTime() - x.em.getTime())[0];
						return (
							<li key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50">
								<Interruptor
									ligado={ligada}
									rotulo={`${ligada ? "Desligar" : "Ligar"} ${a.nome}`}
									desligado={offline}
									aoMudar={(v) => {
										ligarAutomacao(a.id, v);
										toast.success(v ? "Automação ligada" : "Automação desligada", { description: a.nome });
									}}
									className="mt-0.5 min-h-5"
								/>
								<button type="button" onClick={() => abrir("automacao", a.id)} className="flex min-w-0 flex-1 flex-col gap-1 text-left" data-alvo>
									<span className="flex flex-wrap items-center gap-2">
										<span className="font-medium text-sm">{a.nome}</span>
										<span className="text-muted-foreground text-xs">{ligada ? "Ligada" : "Desligada"}</span>
										{a.fase > 2 ? <Badge variant="outline">entra na fase {a.fase}</Badge> : null}
									</span>
									<span className="text-xs/5">
										<span className="text-muted-foreground">Quando: </span>
										{a.quando}
										{a.se ? (
											<>
												<span className="text-muted-foreground"> · Se: </span>
												{a.se}
											</>
										) : null}
									</span>
									<span className="text-xs/5">
										<span className="text-muted-foreground">Então: </span>
										{a.entao}
										{a.modelo ? <span className="text-muted-foreground"> (mensagem “{a.modelo}”)</span> : null}
									</span>
									<span className="pt-0.5">
										{ultima ? (
											<PontoSituacao tom={TOM_RESULTADO[ultima.resultado]}>
												Última: {relativa(ultima.em, agora)} · {NOME_RESULTADO[ultima.resultado]}
												{ultima.motivo ? ` (${ultima.motivo})` : ""}
											</PontoSituacao>
										) : (
											<PontoSituacao tom="neutro">Ainda não rodou</PontoSituacao>
										)}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</Pagina>
	);
}
