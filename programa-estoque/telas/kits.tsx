"use client";
// 7.14 Kits, pacote básico e extras.

import Add from "@carbon/icons-react/es/Add";
import Information from "@carbon/icons-react/es/Information";
import Laptop from "@carbon/icons-react/es/Laptop";
import Package from "@carbon/icons-react/es/Package";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Cartao, Dinheiro, EsqueletoLinhas, EstadoErro, EstadoVazio, FotoEquipamento, Pagina } from "@/componentes/ui/basicos";
import { CampoNoLugar } from "@/componentes/ui/campo-no-lugar";
import { Icon } from "@/componentes/ui/icon";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Selo } from "@/componentes/ui/marcadores";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/componentes/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/componentes/ui/tabs";
import { Textarea } from "@/componentes/ui/textarea";
import { TabelaLista, type Coluna } from "@/componentes/ui/tabela-lista";
import { useFicha, useRegistrarLista } from "@/componentes/ui/ficha";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { useBusca, useNavegar } from "@/lib/navegacao";
import { useAgora } from "@/lib/relogio";
import { dinheiro } from "@/lib/formatos";
import * as D from "@/prototipo/dados";
import { diariaDoKit, extras, itensDoKit, montaveisAgora, pacotesBasicos } from "@/prototipo/consultas-estoque";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Parte = "kits" | "basico" | "extras";

type LinhaKit = D.Kit & { itens: number; diaria: number; montaveis: number; falta?: string };
type LinhaBasico = { id: string; equipamento: D.Equipamento; acessorio: D.Equipamento; quantidade: number };
type LinhaExtra = { id: string; equipamento: D.Equipamento; acessorio: D.Equipamento };

function Aviso({ children }: { children: React.ReactNode }) {
	return (
		<p className="flex items-start gap-2 rounded-lg border border-info-borda bg-info-fundo px-3 py-2 text-info text-xs/5">
			<Icon icon={Information} className="mt-0.5 size-4 shrink-0" />
			<span>{children}</span>
		</p>
	);
}

function EditeNoComputador() {
	return (
		<p className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-muted-foreground text-xs">
			<Icon icon={Laptop} className="size-4 shrink-0" />
			Edite no computador. No celular, esta lista é só para consulta.
		</p>
	);
}

function NovoKit({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
	const { abrir } = useFicha();
	return (
		<Sheet open={aberto} onOpenChange={(o) => !o && aoFechar()}>
			<SheetContent side="right" size="sm" className="w-full sm:max-w-sm">
				<SheetHeader className="border-b px-5 py-4">
					<SheetTitle>Novo kit</SheetTitle>
					<SheetDescription>Junte itens que saem sempre juntos. Os componentes entram na ficha, logo depois de salvar.</SheetDescription>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-5 py-4"
					onSubmit={(e) => {
						e.preventDefault();
						toast.success("Kit criado");
						aoFechar();
						abrir("kit", 1);
					}}
				>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="kit-nome">Nome</Label>
						<Input id="kit-nome" required placeholder="Ex.: Kit entrevista" />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="kit-desc">Descrição</Label>
						<Textarea id="kit-desc" placeholder="O que o kit leva e para que serve" />
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={aoFechar}>
							Cancelar
						</Button>
						<Button type="submit">Salvar e abrir ficha</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}

export function TelaKits() {
	const agora = useAgora(60_000);
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const ehCelular = useIsMobile();
	const { abrir } = useFicha();
	const navegar = useNavegar();
	const parteBruta = useBusca().get("parte");
	const parte: Parte = parteBruta === "basico" || parteBruta === "extras" ? parteBruta : "kits";
	const [novo, setNovo] = useState(false);
	const vazio = estado === "vazio";

	const kits: LinhaKit[] = useMemo(
		() =>
			vazio
				? []
				: D.kits.map((k) => {
						const m = montaveisAgora(k.id, agora);
						return { ...k, itens: itensDoKit(k), diaria: diariaDoKit(k), montaveis: m.montaveis, falta: m.falta };
					}),
		[agora, vazio],
	);
	useRegistrarLista("kit", kits.map((k) => String(k.id)));

	const basicos: LinhaBasico[] = useMemo(
		() =>
			vazio
				? []
				: pacotesBasicos().flatMap((p) =>
						p.itens.map((i) => ({ id: `${p.equipamento.id}-${i.acessorio.id}`, equipamento: p.equipamento, acessorio: i.acessorio, quantidade: i.quantidade })),
					),
		[vazio],
	);
	const listaExtras: LinhaExtra[] = useMemo(
		() => (vazio ? [] : extras().map((x) => ({ id: `${x.equipamento.id}-${x.acessorio.id}`, equipamento: x.equipamento, acessorio: x.acessorio }))),
		[vazio],
	);

	const colunasKits: Coluna<LinhaKit>[] = [
		{
			id: "nome",
			header: "Kit",
			label: "Kit",
			sortable: true,
			hideable: false,
			width: "w-[34%]",
			cell: (k) => (
				<span className="flex min-w-0 items-center gap-2.5">
					<FotoEquipamento nome={k.nome} tamanho={32} />
					<span className="flex min-w-0 flex-col">
						<span className="truncate font-medium">{k.nome}</span>
						<span className="truncate text-muted-foreground">{k.descricao}</span>
					</span>
				</span>
			),
			exportar: (k) => k.nome,
		},
		{ id: "itens", header: "Itens", label: "Itens", sortable: true, align: "right", width: "w-[8%]", cell: (k) => <span className="tabular-nums">{k.itens}</span>, exportar: (k) => k.itens },
		{
			id: "diaria",
			header: "Diária do kit",
			label: "Diária do kit",
			sortable: true,
			align: "right",
			width: "w-[18%]",
			cell: (k) => (
				<span className="tabular-nums">
					<Dinheiro valor={k.diaria} /> <span className="text-muted-foreground">(soma)</span>
				</span>
			),
			exportar: (k) => dinheiro(k.diaria),
		},
		{
			id: "montaveis",
			header: "Montáveis",
			label: "Montáveis agora",
			sortable: true,
			width: "w-[26%]",
			cell: (k) => (k.falta ? <Selo tom="atencao">{k.falta}</Selo> : <span className="tabular-nums">{k.montaveis}</span>),
			exportar: (k) => (k.falta ? k.falta : k.montaveis),
		},
		{ id: "saidas", header: "Saídas 90 d", label: "Saídas em 90 dias", sortable: true, align: "right", width: "w-[14%]", hideBelow: "md", cell: (k) => <span className="tabular-nums">{k.saidas90d}</span>, exportar: (k) => k.saidas90d },
	];

	const colunasBasico: Coluna<LinhaBasico>[] = [
		{
			id: "equipamento",
			header: "Equipamento",
			label: "Equipamento",
			sortable: true,
			hideable: false,
			width: "w-[30%]",
			cell: (l) => (
				<button type="button" onClick={() => abrir("equipamento", l.equipamento.id)} className="truncate text-left font-medium hover:underline">
					{l.equipamento.nome}
				</button>
			),
			exportar: (l) => l.equipamento.nome,
		},
		{ id: "acessorio", header: "Acessório", label: "Acessório", sortable: true, width: "w-[34%]", cell: (l) => <span className="truncate">{l.acessorio.nome}</span>, exportar: (l) => l.acessorio.nome },
		{
			id: "quantidade",
			header: "Quantidade",
			label: "Quantidade",
			width: "w-[16%]",
			cell: (l) => <CampoNoLugar rotulo={`Quantidade de ${l.acessorio.nome} com ${l.equipamento.nome}`} valor={String(l.quantidade)} tipo="number" somenteLeitura={offline} />,
			exportar: (l) => l.quantidade,
		},
		{ id: "diaria", header: "Diária", label: "Diária", width: "w-[20%]", cell: () => <span className="text-muted-foreground">incluída no equipamento</span> },
	];

	const colunasExtras: Coluna<LinhaExtra>[] = [
		{
			id: "equipamento",
			header: "Equipamento",
			label: "Equipamento",
			sortable: true,
			hideable: false,
			width: "w-[30%]",
			cell: (l) => (
				<button type="button" onClick={() => abrir("equipamento", l.equipamento.id)} className="truncate text-left font-medium hover:underline">
					{l.equipamento.nome}
				</button>
			),
			exportar: (l) => l.equipamento.nome,
		},
		{
			id: "extra",
			header: "Extra",
			label: "Extra",
			sortable: true,
			width: "w-[40%]",
			cell: (l) => (
				<span className="flex min-w-0 items-center gap-2">
					<span className="truncate">{l.acessorio.nome} a mais</span>
					<Selo tom="info">Extra</Selo>
				</span>
			),
			exportar: (l) => `${l.acessorio.nome} a mais`,
		},
		{
			id: "diaria",
			header: "Diária própria",
			label: "Diária própria",
			sortable: true,
			width: "w-[30%]",
			cell: (l) => <CampoNoLugar rotulo={`Diária de ${l.acessorio.nome} a mais`} valor={dinheiro(l.acessorio.precoDiaria)} somenteLeitura={offline} />,
			exportar: (l) => dinheiro(l.acessorio.precoDiaria),
		},
	];

	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Kits e acessórios"
				descricao="Kits que saem juntos, o pacote básico de cada equipamento e os extras com preço próprio."
				acoes={
					parte === "kits" ? (
						<Button disabled={offline} title={offline ? "Volta quando a internet voltar" : undefined} onClick={() => setNovo(true)}>
							<Icon icon={Add} data-icon="inline-start" />
							Novo kit
						</Button>
					) : null
				}
			/>

			<Tabs value={parte} onValueChange={(v) => navegar(v === "kits" ? "/kits" : `/kits?parte=${v}`, { substituir: true })}>
				<TabsList aria-label="Parte da tela" className="w-full sm:w-fit">
					<TabsTrigger value="kits">Kits</TabsTrigger>
					<TabsTrigger value="basico">Pacote básico</TabsTrigger>
					<TabsTrigger value="extras">Extras</TabsTrigger>
				</TabsList>
				{(["kits", "basico", "extras"] as const).map((v) => (
					<TabsContent key={v} value={v} forceMount className="hidden" />
				))}
			</Tabs>

			{estado === "carregando" ? (
				<EsqueletoLinhas linhas={6} />
			) : estado === "erro" ? (
				<Cartao>
					<EstadoErro frase="Não consegui carregar os kits e acessórios." />
				</Cartao>
			) : parte === "kits" ? (
				<TabelaLista<LinhaKit>
					key="kits"
					nome="kits"
					linhas={kits}
					colunas={colunasKits}
					idDa={(k) => String(k.id)}
					placeholderBusca="Buscar kit…"
					config={{
						texto: (k) => `${k.nome} ${k.descricao}`,
						ordenacoes: { nome: (k) => k.nome, itens: (k) => k.itens, diaria: (k) => k.diaria, montaveis: (k) => k.montaveis, saidas: (k) => k.saidas90d },
						ordemPadrao: { coluna: "nome", direcao: "asc" },
						arquivada: (k) => !k.ativo,
					}}
					aoClicar={(k) => abrir("kit", k.id)}
					rodape={({ total }) => `${total} ${total === 1 ? "kit" : "kits"} · a diária do kit é a soma dos itens até haver preço de combo`}
					vazio={<EstadoVazio icone={Package} titulo="Nenhum kit" descricao="Junte itens que saem sempre juntos." acao={<Button variant="outline" size="sm" onClick={() => setNovo(true)}>Novo kit</Button>} />}
					celular={(k) => (
						<>
							<FotoEquipamento nome={k.nome} tamanho={40} />
							<span className="flex min-w-0 flex-1 flex-col items-start gap-1">
								<span className="truncate font-medium text-sm">{k.nome}</span>
								<span className="truncate text-muted-foreground text-xs">
									{k.itens} itens · <Dinheiro valor={k.diaria} /> (soma)
								</span>
								{k.falta ? <Selo tom="atencao">{k.falta}</Selo> : <span className="text-muted-foreground text-xs tabular-nums">{k.montaveis} montáveis</span>}
							</span>
						</>
					)}
				/>
			) : parte === "basico" ? (
				<div className="flex flex-col gap-3">
					<Aviso>Já incluídos no preço e cobertos pela caução. O robô e o Montador acrescentam estes itens sozinhos.</Aviso>
					{ehCelular ? <EditeNoComputador /> : null}
					<TabelaLista<LinhaBasico>
						key="basico"
						nome="pacote-basico"
						linhas={basicos}
						colunas={colunasBasico}
						idDa={(l) => l.id}
						placeholderBusca="Buscar equipamento ou acessório…"
						config={{
							texto: (l) => `${l.equipamento.nome} ${l.acessorio.nome}`,
							ordenacoes: { equipamento: (l) => l.equipamento.nome, acessorio: (l) => l.acessorio.nome },
							ordemPadrao: { coluna: "equipamento", direcao: "asc" },
						}}
						rodape={({ total }) => `${total} ${total === 1 ? "acessório" : "acessórios"} no pacote básico`}
						vazio={<EstadoVazio icone={Package} titulo="Nenhum pacote básico" descricao="Exemplo: a câmera sempre sai com 2 baterias." />}
						celular={(l) => (
							<span className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className="truncate font-medium text-sm">{l.equipamento.nome}</span>
								<span className="truncate text-muted-foreground text-xs">
									{l.quantidade} × {l.acessorio.nome} · incluído
								</span>
							</span>
						)}
					/>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					<Aviso>Cobrados à parte. O robô oferece quando faz sentido; só entram no pedido se o cliente escolher.</Aviso>
					{ehCelular ? <EditeNoComputador /> : null}
					<TabelaLista<LinhaExtra>
						key="extras"
						nome="extras"
						linhas={listaExtras}
						colunas={colunasExtras}
						idDa={(l) => l.id}
						placeholderBusca="Buscar equipamento ou extra…"
						config={{
							texto: (l) => `${l.equipamento.nome} ${l.acessorio.nome}`,
							ordenacoes: { equipamento: (l) => l.equipamento.nome, extra: (l) => l.acessorio.nome, diaria: (l) => l.acessorio.precoDiaria },
							ordemPadrao: { coluna: "equipamento", direcao: "asc" },
						}}
						rodape={({ total }) => `${total} ${total === 1 ? "extra" : "extras"} com diária própria`}
						vazio={<EstadoVazio icone={Package} titulo="Nenhum extra" descricao="Exemplo: uma bateria a mais, com diária própria." />}
						celular={(l) => (
							<>
								<span className="flex min-w-0 flex-1 flex-col gap-0.5">
									<span className="truncate font-medium text-sm">{l.equipamento.nome}</span>
									<span className="truncate text-muted-foreground text-xs">{l.acessorio.nome} a mais</span>
								</span>
								<Dinheiro valor={l.acessorio.precoDiaria} className="text-sm" />
							</>
						)}
					/>
				</div>
			)}
			<NovoKit aberto={novo} aoFechar={() => setNovo(false)} />
		</Pagina>
	);
}
