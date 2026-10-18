"use client";
// Ficha da automação: QUANDO · SE · ENTÃO em frases, mensagem usada, tempos editáveis, teste simulado e histórico.

import Flow from "@carbon/icons-react/es/Flow";
import PlayFilledAlt from "@carbon/icons-react/es/PlayFilledAlt";
import { Button } from "@/componentes/ui/button";
import { CampoNoLugar } from "@/componentes/ui/campo-no-lugar";
import { Codigo, EstadoErro } from "@/componentes/ui/basicos";
import { AbasFicha, CabecalhoFicha, PropriedadeFicha, PropriedadesFicha, SecaoFicha, VazioFicha, useFicha } from "@/componentes/ui/ficha";
import { Icon } from "@/componentes/ui/icon";
import { PontoSituacao, Selo } from "@/componentes/ui/marcadores";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componentes/ui/table";
import { Interruptor } from "@/componentes/gestao/comum";
import { NOME_RESULTADO, TOM_RESULTADO, ligarAutomacao, simularExecucao, useAutomacoes } from "@/componentes/gestao/automacoes-estado";
import type { PropsFicha } from "@/componentes/fichas/registro";
import { useConexao } from "@/lib/estado-prototipo";
import { dataCurta, horaRelogio } from "@/lib/formatos";
import { useAgora } from "@/lib/relogio";
import * as D from "@/prototipo/dados";
import { toast } from "sonner";

const SITUACAO_MODELO: Record<D.ModeloMensagem["situacao"], { texto: string; tom: "neutro" | "atencao" | "info" | "ok" }> = {
	rascunho: { texto: "Rascunho", tom: "neutro" },
	aguardando_donos: { texto: "Aguardando o sim do Xerxes e do Alef", tom: "atencao" },
	em_analise_ycloud: { texto: "Em análise na YCloud", tom: "info" },
	aprovado: { texto: "Aprovada", tom: "ok" },
};

export function FichaAutomacao({ id, aoVoltar, trilha }: PropsFicha) {
	const a = D.automacoes.find((x) => x.id === Number(id));
	const agora = useAgora(60_000);
	const { offline } = useConexao();
	const { abrir } = useFicha();
	const { ligadas, simuladas } = useAutomacoes();
	if (!a) {
		return (
			<>
				<CabecalhoFicha titulo="Automação" aoVoltar={aoVoltar} trilha={trilha} />
				<EstadoErro frase="Esta automação não pôde ser carregada." />
			</>
		);
	}
	const ligada = ligadas[a.id];
	const modelo = D.modelosMensagem.find((m) => m.nome === a.modelo);
	const execucoes = [...(simuladas[a.id] ?? []), ...a.execucoes].sort((x, y) => y.em.getTime() - x.em.getTime());

	const testar = () => {
		const reserva = D.reservas.find((r) => r.etapa === "retirada") ?? D.reservas[0];
		simularExecucao(a.id, {
			id: Date.now(),
			em: agora,
			reservaId: reserva.id,
			oQueFez: `Teste com a reserva de exemplo ${reserva.id}: ${a.modelo ? `montaria a mensagem “${a.modelo}”` : "faria a ação"}. Nada foi enviado.`,
			resultado: "simulada",
		});
		toast("Teste simulado", { description: "Nada foi enviado ao cliente." });
	};

	const geral = (
		<div className="flex flex-col">
			<SecaoFicha titulo="Quando">
				<p className="text-sm">{a.quando}</p>
			</SecaoFicha>
			{a.se ? (
				<SecaoFicha titulo="Se">
					<p className="text-sm">{a.se}</p>
				</SecaoFicha>
			) : null}
			<SecaoFicha titulo="Então">
				<p className="text-sm">{a.entao}</p>
				<p className="text-muted-foreground text-xs">
					A ação pendente se cancela sozinha quando o motivo deixa de existir: a reserva mudou de etapa, foi cancelada ou encerrada, ou o cliente pediu para não receber mensagens.
				</p>
			</SecaoFicha>
			{modelo ? (
				<SecaoFicha titulo="Mensagem usada">
					<div className="flex flex-wrap items-center gap-2">
						<Codigo>{modelo.nome}</Codigo>
						<Selo tom={SITUACAO_MODELO[modelo.situacao].tom}>{SITUACAO_MODELO[modelo.situacao].texto}</Selo>
					</div>
					<p className="rounded-lg bg-destaque-claro px-3 py-2 text-xs/5">{modelo.texto}</p>
					<p className="text-muted-foreground text-xs">
						Fora da janela de 24 horas, só sai mensagem aprovada na YCloud. O texto só vai para a YCloud com o sim do Xerxes e do Alef.
					</p>
				</SecaoFicha>
			) : null}
			{a.tempos?.length ? (
				<SecaoFicha titulo="Tempos">
					<PropriedadesFicha colunas={1}>
						{a.tempos.map((t) => (
							<PropriedadeFicha key={t.rotulo} rotulo={t.rotulo}>
								<CampoNoLugar valor={t.valor} rotulo={t.rotulo} somenteLeitura={offline} />
							</PropriedadeFicha>
						))}
					</PropriedadesFicha>
					<p className="text-muted-foreground text-2xs">Padrão provisório: o dono confirma.</p>
				</SecaoFicha>
			) : null}
			<SecaoFicha titulo="Testar">
				<Button variant="outline" onClick={testar}>
					<Icon icon={PlayFilledAlt} data-icon="inline-start" />
					Testar com uma reserva de exemplo
				</Button>
				<p className="text-muted-foreground text-xs">Simula a automação e mostra no histórico o que ela faria. Não manda nada ao cliente.</p>
			</SecaoFicha>
		</div>
	);

	const historico =
		execucoes.length === 0 ? (
			<VazioFicha icone={Flow} titulo="Esta automação ainda não rodou." descricao="Cada execução aparece aqui: o que leu, o que decidiu e o que fez." />
		) : (
			<div className="px-5 py-3">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-24">Quando</TableHead>
							<TableHead className="w-20">Reserva</TableHead>
							<TableHead>O que fez</TableHead>
							<TableHead className="w-40">Resultado</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{execucoes.map((e) => (
							<TableRow key={e.id}>
								<TableCell className="align-top tabular-nums">
									{dataCurta(e.em)} {horaRelogio(e.em)}
								</TableCell>
								<TableCell className="align-top">
									{e.reservaId ? (
										<button type="button" className="font-mono text-link underline-offset-4 hover:underline" onClick={() => abrir("reserva", e.reservaId as number, { empilhar: true })}>
											{e.reservaId}
										</button>
									) : (
										"—"
									)}
								</TableCell>
								<TableCell className="whitespace-normal align-top">{e.oQueFez}</TableCell>
								<TableCell className="whitespace-normal align-top">
									<PontoSituacao tom={TOM_RESULTADO[e.resultado]}>
										{NOME_RESULTADO[e.resultado]}
										{e.motivo ? `: ${e.motivo}` : ""}
									</PontoSituacao>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		);

	return (
		<>
			<CabecalhoFicha
				aoVoltar={aoVoltar}
				trilha={trilha}
				titulo={a.nome}
				descricao={`Automação ${a.numero} · roda no n8n do servidor da locadora`}
				acoes={
					<span className="flex items-center gap-2 text-xs">
						{ligada ? "Ligada" : "Desligada"}
						<Interruptor
							ligado={ligada}
							rotulo={ligada ? "Desligar automação" : "Ligar automação"}
							desligado={offline}
							aoMudar={(v) => {
								ligarAutomacao(a.id, v);
								toast.success(v ? "Automação ligada" : "Automação desligada");
							}}
						/>
					</span>
				}
			/>
			<AbasFicha
				abas={[
					{ valor: "geral", rotulo: "Visão geral", conteudo: geral },
					{ valor: "historico", rotulo: "Histórico", contagem: execucoes.length || null, conteudo: historico },
				]}
			/>
		</>
	);
}
