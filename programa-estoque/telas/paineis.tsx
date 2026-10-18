"use client";
// 7.8 Painéis: se o estoque está rendendo. Todo número e toda barra abre a lista que o compõe.

import { toast } from "sonner";
import ChartColumn from "@carbon/icons-react/es/ChartColumn";
import Download from "@carbon/icons-react/es/Download";
import { Button } from "@/componentes/ui/button";
import { BlocoNumeros, CabecalhoPagina, Cartao, EstadoErro, EstadoVazio, FotoEquipamento, Pagina } from "@/componentes/ui/basicos";
import { Skeleton } from "@/componentes/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { Icon } from "@/componentes/ui/icon";
import { useEstadoTela } from "@/lib/estado-prototipo";
import { dinheiro, numero, porcento } from "@/lib/formatos";
import { Link, useNavegar, useParametro } from "@/lib/navegacao";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import * as D from "@/prototipo/dados";
import { expiradasPorSemana, maisAlugados, motivosCancelamento, numerosPaineis, parados, quantoSePagouPorUnidade, type Periodo } from "@/prototipo/consultas-gestao";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type * as React from "react";

const EIXO = { fill: "var(--muted-foreground)", fontSize: 11 };

function Dica({ active, payload, label, formatar }: { active?: boolean; payload?: { value: number }[]; label?: string; formatar: (v: number) => string }) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-md bg-foreground px-2.5 py-1.5 text-background text-xs shadow-md">
			<p className="font-medium">{label}</p>
			<p className="tabular-nums">{formatar(payload[0].value)}</p>
		</div>
	);
}

function Regra({ children }: { children: React.ReactNode }) {
	return <p className="px-4 pt-3 text-muted-foreground text-xs">{children}</p>;
}

function Rolagem({ barras, celular, children, altura = 220 }: { barras: number; celular: boolean; children: React.ReactElement; altura?: number }) {
	const largura = celular && barras > 6 ? barras * 52 : undefined;
	return (
		<div className="overflow-x-auto px-2 pb-3">
			<div style={{ width: largura ?? "100%", height: altura, minWidth: largura }}>
				<ResponsiveContainer width="100%" height="100%">
					{children}
				</ResponsiveContainer>
			</div>
		</div>
	);
}

export function TelaPaineis() {
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const celular = useIsMobile();
	const navegar = useNavegar();
	const [periodoP, definirPeriodo] = useParametro("periodo");
	const [categoria, definirCategoria] = useParametro("categoria");
	const periodo = (periodoP ?? "mes") as Periodo;
	const n = numerosPaineis(periodo, agora);
	const meses = D.faturadoPorMes;
	const ultimo = meses[meses.length - 1];
	const penultimo = meses[meses.length - 2];
	const variacaoMes = (ultimo.valor - penultimo.valor) / penultimo.valor;
	const filtraCategoria = <T extends { equipamento: D.Equipamento }>(lista: T[]) => (categoria && categoria !== "todas" ? lista.filter((x) => x.equipamento.categoria === categoria) : lista);
	const retorno = filtraCategoria(quantoSePagouPorUnidade(12)).slice(0, 8).map((x) => ({ nome: `${x.equipamento.nome.replace(/^(Lente|Microfone|Refletor|Estabilizador) /, "")} · ${(x.unidade.numeroSerie ?? x.unidade.codigo).slice(-4)}`, valor: Math.round(x.retorno * 100), id: x.unidade.id }));
	const topo = filtraCategoria(maisAlugados(12)).slice(0, 6);
	const semUso = filtraCategoria(parados(agora));

	const filtros = (
		<div className="flex flex-wrap items-center gap-2">
			<Select value={periodo} onValueChange={(v) => definirPeriodo(v === "mes" ? null : v)}>
				<SelectTrigger className="w-full border border-input bg-background px-2.5 sm:w-44 dark:bg-muted" aria-label="Período">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="mes">Período: este mês</SelectItem>
					<SelectItem value="trimestre">Período: últimos 3 meses</SelectItem>
					<SelectItem value="ano">Período: últimos 12 meses</SelectItem>
				</SelectContent>
			</Select>
			<Select value={categoria ?? "todas"} onValueChange={(v) => definirCategoria(v === "todas" ? null : v)}>
				<SelectTrigger className="w-full border border-input bg-background px-2.5 sm:w-44 dark:bg-muted" aria-label="Categoria">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="todas">Todas as categorias</SelectItem>
					{Object.entries(D.CATEGORIAS).map(([v, r]) => (
						<SelectItem key={v} value={v}>
							{r}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button variant="outline" size="sm" onClick={() => toast("Exportação dos painéis", { description: "Planilha com faturamento por peça, peças paradas, atrasos e custo de reparo. Entra na Fase 4, com os números do banco." })}>
				<Icon icon={Download} data-icon="inline-start" />
				Exportar
			</Button>
		</div>
	);

	if (estado === "erro" || estado === "carregando" || estado === "vazio") {
		return (
			<Pagina>
				<CabecalhoPagina titulo="Painéis" descricao="Se o estoque está rendendo: o que fatura, o que já se pagou, o que fica parado e quanto custa o reparo." acoes={filtros} />
				{estado === "erro" ? (
					<div className="rounded-lg border">
						<EstadoErro frase="Não consegui carregar os painéis." />
					</div>
				) : estado === "vazio" ? (
					<div className="rounded-lg border">
						<EstadoVazio icone={ChartColumn} titulo="Ainda sem números" descricao="Os números aparecem depois da primeira reserva encerrada." />
					</div>
				) : (
					<div aria-busy="true" className="grid gap-6 lg:grid-cols-2">
						<Skeleton className="h-24 rounded-lg lg:col-span-2" />
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-64 rounded-lg" />
						))}
					</div>
				)}
			</Pagina>
		);
	}

	return (
		<Pagina>
			<CabecalhoPagina titulo="Painéis" descricao="Se o estoque está rendendo: o que fatura, o que já se pagou, o que fica parado e quanto custa o reparo." acoes={filtros} />
			<BlocoNumeros
				itens={[
					{
						rotulo: "Faturado (confirmado)",
						valor: dinheiro(n.faturado),
						variacao: { texto: porcento(Math.abs(n.variacao)), direcao: n.variacao >= 0 ? "sobe" : "desce" },
						detalhe: "contra o período anterior",
						href: "/pagamentos?recorte=confirmados",
					},
					{
						rotulo: "Uso no tempo",
						valor: porcento(n.uso),
						variacao: { texto: `${Math.abs(Math.round(n.usoVariacao * 100))} p.p.`, direcao: n.usoVariacao >= 0 ? "sobe" : "desce" },
						detalhe: "dias alugados ÷ dias disponíveis",
						href: "/catalogo",
					},
					{ rotulo: "Atrasos", valor: `${n.atrasos} · ${numero(n.horasAtraso)} h no total`, detalhe: "depois dos 60 min de tolerância", href: "/reservas?visao=tabela&recorte=atrasadas" },
					{ rotulo: "Custo de reparo", valor: dinheiro(n.custoReparo), detalhe: "manutenções do período", href: "/manutencao" },
				]}
			/>
			<div className="grid gap-6 lg:grid-cols-2">
				<Cartao titulo="Faturado por mês" descricao={`${variacaoMes >= 0 ? "↑" : "↓"} ${porcento(Math.abs(variacaoMes))} em outubro contra setembro`}>
					<Regra>Conta só aluguel com pagamento confirmado pela InfinitePay, pela data de retirada. Caução não conta.</Regra>
					<Rolagem barras={meses.length} celular={celular}>
						<BarChart data={meses} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
							<CartesianGrid vertical={false} stroke="var(--border)" />
							<XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
							<YAxis tick={EIXO} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000} mil` : String(v))} />
							<Tooltip cursor={{ fill: "var(--muted)" }} content={<Dica formatar={dinheiro} />} />
							<Bar dataKey="valor" radius={[4, 4, 0, 0]} cursor="pointer" onClick={() => navegar("/pagamentos?recorte=confirmados")}>
								{meses.map((m, i) => (
									<Cell key={m.mes} fill={i === meses.length - 1 ? "var(--chart-1)" : "var(--chart-2)"} />
								))}
							</Bar>
						</BarChart>
					</Rolagem>
				</Cartao>

				<Cartao titulo="Quanto já se pagou" descricao="por unidade, faturado acumulado ÷ valor de compra">
					<Regra>A linha marca 100%: a unidade já pagou o que custou. Toque numa barra para abrir a unidade.</Regra>
					<Rolagem barras={0} celular={celular} altura={Math.max(200, retorno.length * 30 + 30)}>
						<BarChart data={retorno} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
							<CartesianGrid horizontal={false} stroke="var(--border)" />
							<XAxis type="number" tick={EIXO} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
							<YAxis type="category" dataKey="nome" tick={EIXO} axisLine={false} tickLine={false} width={celular ? 100 : 130} />
							<Tooltip cursor={{ fill: "var(--muted)" }} content={<Dica formatar={(v) => `${v}%`} />} />
							<ReferenceLine x={100} stroke="var(--muted-foreground)" strokeDasharray="4 3" />
							<Bar dataKey="valor" fill="var(--chart-2)" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d: { payload?: { id: number } }) => d.payload && navegar(`/unidades?ficha=unidade:${d.payload.id}`)} />
						</BarChart>
					</Rolagem>
				</Cartao>

				<Cartao titulo="Mais alugados" descricao="uso nos últimos 90 dias">
					<ul className="flex flex-col divide-y">
						{topo.map((x) => (
							<li key={x.equipamento.id}>
								<Link href={`/catalogo?ficha=equipamento:${x.equipamento.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted">
									<FotoEquipamento nome={x.equipamento.nome} tamanho={24} />
									<span className="min-w-0 flex-1 truncate text-xs">{x.equipamento.nome}</span>
									<span aria-hidden className="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted">
										<span className="absolute inset-y-0 left-0 bg-chart-1" style={{ width: `${Math.round(x.uso * 100)}%` }} />
									</span>
									<span className="w-10 text-right text-xs tabular-nums">{porcento(x.uso)}</span>
									<span className="hidden w-24 text-right text-muted-foreground text-xs tabular-nums sm:block">{dinheiro(x.faturado)}</span>
								</Link>
							</li>
						))}
					</ul>
				</Cartao>

				<Cartao titulo="Parados há mais de 60 dias" descricao="sugestão: vender ou anunciar">
					{semUso.length === 0 ? (
						<p className="px-4 py-6 text-center text-muted-foreground text-xs">Nenhum equipamento parado há mais de 60 dias.</p>
					) : (
						<ul className="flex flex-col divide-y">
							{semUso.slice(0, 6).map((x) => (
								<li key={x.equipamento.id}>
									<Link href={`/catalogo?ficha=equipamento:${x.equipamento.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted">
										<FotoEquipamento nome={x.equipamento.nome} tamanho={24} />
										<span className="min-w-0 flex-1 truncate text-xs">{x.equipamento.nome}</span>
										<span className="text-muted-foreground text-xs tabular-nums">{x.dias} dias</span>
										<span className="hidden text-xs sm:block">vender ou anunciar</span>
									</Link>
								</li>
							))}
						</ul>
					)}
				</Cartao>

				<Cartao titulo="Pré-reservas que expiraram" descricao="por semana; a última semana teve 1 a menos que a anterior">
					<Regra>Conta as pré-reservas em que os 20 minutos passaram sem pagamento.</Regra>
					<Rolagem barras={expiradasPorSemana.length} celular={celular} altura={180}>
						<BarChart data={expiradasPorSemana} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
							<CartesianGrid vertical={false} stroke="var(--border)" />
							<XAxis dataKey="semana" tick={EIXO} axisLine={false} tickLine={false} />
							<YAxis tick={EIXO} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
							<Tooltip cursor={{ fill: "var(--muted)" }} content={<Dica formatar={(v) => `${v} expiradas`} />} />
							<Bar dataKey="valor" fill="var(--chart-4)" radius={[4, 4, 0, 0]} cursor="pointer" onClick={() => navegar("/reservas?visao=tabela&recorte=expiradas")} />
						</BarChart>
					</Rolagem>
				</Cartao>

				<Cartao titulo="Motivos de cancelamento" descricao="no período, contra 5 no período anterior">
					<Regra>Cada cancelamento tem um motivo de lista fechada.</Regra>
					<Rolagem barras={0} celular={celular} altura={190}>
						<BarChart data={motivosCancelamento} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
							<CartesianGrid horizontal={false} stroke="var(--border)" />
							<XAxis type="number" tick={EIXO} axisLine={false} tickLine={false} allowDecimals={false} />
							<YAxis type="category" dataKey="motivo" tick={EIXO} axisLine={false} tickLine={false} width={celular ? 110 : 140} />
							<Tooltip cursor={{ fill: "var(--muted)" }} content={<Dica formatar={(v) => `${v} ${v === 1 ? "reserva" : "reservas"}`} />} />
							<Bar dataKey="valor" fill="var(--chart-3)" radius={[0, 4, 4, 0]} cursor="pointer" onClick={() => navegar("/reservas?visao=tabela&recorte=canceladas")} />
						</BarChart>
					</Rolagem>
				</Cartao>
			</div>
			<p className={cn("text-muted-foreground text-xs")}>Números de exemplo. Painéis completos e exportação para o contador entram na Fase 4.</p>
		</Pagina>
	);
}
