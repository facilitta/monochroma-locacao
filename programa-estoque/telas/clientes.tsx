"use client";
// 7.5 Clientes. Serve de referência do padrão de lista: TabelaLista + ficha lateral + painel de criação.

import Add from "@carbon/icons-react/es/Add";
import UserMultiple from "@carbon/icons-react/es/UserMultiple";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Dinheiro, FotoCliente, Pagina } from "@/componentes/ui/basicos";
import { Icon } from "@/componentes/ui/icon";
import { Selo } from "@/componentes/ui/marcadores";
import { Badge } from "@/componentes/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/componentes/ui/sheet";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { TabelaLista, type AtalhoLista, type Coluna, type Faceta } from "@/componentes/ui/tabela-lista";
import { EstadoVazio } from "@/componentes/ui/basicos";
import { useFicha, useRegistrarLista } from "@/componentes/ui/ficha";
import { usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { dinheiro, relativa, telefone } from "@/lib/formatos";
import type { Tom } from "@/lib/regras/situacao";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const CADASTRO: Record<D.Cliente["cadastro"], { texto: string; tom: Tom }> = {
	aguardando: { texto: "Aguardando aprovação", tom: "atencao" },
	aprovado: { texto: "Aprovado", tom: "ok" },
	recusado: { texto: "Recusado", tom: "erro" },
	bloqueado: { texto: "Bloqueado", tom: "erro" },
};

type Linha = D.Cliente & { reservas: number; total: number; ultimo?: Date };

function NovoCliente({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
	const { abrir } = useFicha();
	const [tipo, setTipo] = useState<"pf" | "pj">("pf");
	return (
		<Sheet open={aberto} onOpenChange={(o) => !o && aoFechar()}>
			<SheetContent side="right" size="sm" className="w-full sm:max-w-sm">
				<SheetHeader className="border-b px-5 py-4">
					<SheetTitle>Novo cliente</SheetTitle>
					<SheetDescription>CPF, CNPJ e documentos ficam para a ficha, que abre logo depois de salvar.</SheetDescription>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-5 py-4"
					onSubmit={(e) => {
						e.preventDefault();
						aoFechar();
						toast.success("Cliente criado");
						abrir("cliente", 18);
					}}
				>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="novo-nome">Nome</Label>
						<Input id="novo-nome" required placeholder="Nome completo ou razão social" />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="novo-tel">WhatsApp</Label>
						<Input id="novo-tel" required inputMode="tel" placeholder="(21) 99999-9999" />
					</div>
					<fieldset className="flex flex-col gap-1.5">
						<legend className="mb-1.5 text-xs font-medium">Tipo</legend>
						<div className="flex gap-2">
							{(["pf", "pj"] as const).map((t) => (
								<Button key={t} type="button" variant={tipo === t ? "secondary" : "outline"} size="sm" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
									{t === "pf" ? "Pessoa física" : "Produtora ou empresa"}
								</Button>
							))}
						</div>
					</fieldset>
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

export function TelaClientes() {
	const agora = useAgora(60_000);
	const { podeVerFinanceiro, ehDono } = usePapel();
	const { abrir } = useFicha();
	const [novo, setNovo] = useState(false);

	const linhas: Linha[] = useMemo(
		() =>
			D.clientes.map((c) => {
				const e = Q.estatisticasCliente(c.id);
				return { ...c, reservas: e.reservas, total: e.totalAlugado, ultimo: e.ultimoAluguel };
			}),
		[],
	);
	useRegistrarLista("cliente", linhas.map((l) => String(l.id)));

	const colunas: Coluna<Linha>[] = [
		{
			id: "nome",
			header: "Cliente",
			label: "Cliente",
			sortable: true,
			hideable: false,
			width: "w-[34%] md:w-[28%]",
			cell: (c) => (
				<span className="flex min-w-0 items-center gap-2">
					<FotoCliente nome={c.nome} />
					<span className="truncate font-medium">{c.nome}</span>
				</span>
			),
			exportar: (c) => c.nome,
		},
		{
			id: "tipo",
			header: "Tipo",
			label: "Tipo",
			width: "w-[22%] md:w-[12%]",
			cell: (c) => <Badge variant="outline">{c.tipo === "pf" ? "Pessoa física" : "Produtora"}</Badge>,
			exportar: (c) => (c.tipo === "pf" ? "Pessoa física" : "Produtora"),
		},
		{
			id: "telefone",
			header: "WhatsApp",
			label: "WhatsApp",
			width: "w-[15%]",
			hideBelow: "md",
			cell: (c) => <span className="tabular-nums">{telefone(c.telefone)}</span>,
			exportar: (c) => telefone(c.telefone),
		},
		...(ehDono
			? ([
					{
						id: "cadastro",
						header: "Cadastro",
						label: "Cadastro",
						sortable: true,
						width: "w-[44%] md:w-[18%]",
						cell: (c) => <Selo tom={CADASTRO[c.cadastro].tom}>{CADASTRO[c.cadastro].texto}</Selo>,
						exportar: (c) => CADASTRO[c.cadastro].texto,
					},
					{
						id: "contrato",
						header: "Contrato geral",
						label: "Contrato geral",
						defaultHidden: true,
						hideBelow: "lg",
						width: "w-[12%]",
						cell: (c) => (c.contratoGeral ? <Selo tom="ok">{c.contratoGeral.modelo}</Selo> : <Selo tom="neutro">Sem contrato</Selo>),
					},
					{
						id: "reservas",
						header: "Reservas",
						label: "Reservas",
						sortable: true,
						align: "right",
						hideBelow: "md",
						width: "w-[8%]",
						cell: (c) => <span className="tabular-nums">{c.reservas}</span>,
						exportar: (c) => c.reservas,
					},
				] satisfies Coluna<Linha>[])
			: [
					{
						id: "cadastro",
						header: "Cadastro",
						label: "Cadastro",
						width: "w-[44%] md:w-[18%]",
						cell: (c: Linha) => <Selo tom={CADASTRO[c.cadastro].tom}>{CADASTRO[c.cadastro].texto}</Selo>,
					},
				]),
		...(podeVerFinanceiro
			? ([
					{
						id: "total",
						header: "Total alugado",
						label: "Total alugado",
						sortable: true,
						align: "right",
						hideBelow: "md",
						width: "w-[12%]",
						cell: (c) => <Dinheiro valor={c.total} />,
						exportar: (c) => dinheiro(c.total),
					},
				] satisfies Coluna<Linha>[])
			: []),
		...(ehDono
			? ([
					{
						id: "ultimo",
						header: "Último aluguel",
						label: "Último aluguel",
						sortable: true,
						hideBelow: "lg",
						width: "w-[11%]",
						cell: (c) => (c.ultimo ? <span className="text-muted-foreground">{relativa(c.ultimo, agora)}</span> : <span className="text-muted-foreground">—</span>),
					},
				] satisfies Coluna<Linha>[])
			: []),
	];

	const facetas: Faceta<Linha>[] = [
		{ id: "tipo", rotulo: "Tipo", valor: (c) => c.tipo, opcoes: [{ valor: "pf", rotulo: "Pessoa física" }, { valor: "pj", rotulo: "Produtora" }] },
		...(ehDono
			? [
					{
						id: "cadastro",
						rotulo: "Cadastro",
						valor: (c: Linha) => c.cadastro,
						opcoes: Object.entries(CADASTRO).map(([valor, d]) => ({ valor, rotulo: d.texto })),
					},
				]
			: []),
	];

	const sessentaDias = agora.getTime() - 60 * 86_400_000;
	const atalhos: AtalhoLista[] = ehDono
		? [
				{ nome: "Aguardando aprovação", parametros: { f: "cadastro:aguardando" } },
				{ nome: "Produtoras", parametros: { f: "tipo:pj" } },
				{ nome: "Sem aluguel há 60 dias", parametros: { recorte: "sumidos" } },
				{ nome: "Bloqueados", parametros: { f: "cadastro:bloqueado" } },
			]
		: [];

	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Clientes"
				descricao={ehDono ? "Pessoas e produtoras que alugam, com a situação do cadastro." : "Quem pode retirar equipamento."}
				acoes={
					ehDono ? (
						<Button onClick={() => setNovo(true)}>
							<Icon icon={Add} data-icon="inline-start" />
							Novo cliente
						</Button>
					) : null
				}
			/>
			<TabelaLista<Linha>
				nome="clientes"
				linhas={linhas}
				colunas={colunas}
				idDa={(c) => String(c.id)}
				placeholderBusca={ehDono ? "Buscar nome, telefone, CPF ou CNPJ…" : "Buscar nome ou telefone…"}
				config={{
					texto: (c) => `${c.nome} ${c.razaoSocial ?? ""} ${c.telefone} ${ehDono ? `${c.cpf ?? ""} ${c.cnpj ?? ""}` : ""}`,
					ordenacoes: {
						nome: (c) => c.nome,
						cadastro: (c) => c.cadastro,
						reservas: (c) => c.reservas,
						total: (c) => c.total,
						ultimo: (c) => c.ultimo?.getTime() ?? 0,
					},
					ordemPadrao: { coluna: "nome", direcao: "asc" },
					recortes: {
						id: "recorte",
						rotuloTodos: "Todos",
						opcoes: [
							{ valor: "aguardando", rotulo: "Aguardando aprovação", filtro: (c) => c.cadastro === "aguardando" },
							{ valor: "produtoras", rotulo: "Produtoras", filtro: (c) => c.tipo === "pj" },
							{ valor: "sumidos", rotulo: "Sem aluguel há 60 dias", filtro: (c) => !!c.ultimo && c.ultimo.getTime() < sessentaDias },
						],
					},
					arquivada: (c) => !!c.arquivadoEm,
				}}
				facetas={facetas}
				atalhos={atalhos}
				podeExportar={ehDono}
				aoClicar={(c) => abrir("cliente", c.id)}
				rodape={({ total }) => `${total} ${total === 1 ? "cliente" : "clientes"}`}
				vazio={
					<EstadoVazio
						icone={UserMultiple}
						titulo="Nenhum cliente ainda"
						descricao="Seus clientes aparecem aqui quando chegam pelo WhatsApp ou quando você cadastra o primeiro."
						acao={ehDono ? <Button variant="outline" size="sm" onClick={() => setNovo(true)}>Novo cliente</Button> : undefined}
					/>
				}
				vazioComFiltro="Nenhum cliente com esses filtros."
				celular={(c) => (
					<>
						<FotoCliente nome={c.nome} tamanho={32} />
						<span className="flex min-w-0 flex-1 flex-col gap-0.5">
							<span className="truncate font-medium text-sm">{c.nome}</span>
							<span className="truncate text-muted-foreground text-xs">{c.tipo === "pf" ? "Pessoa física" : "Produtora"}</span>
						</span>
						{ehDono ? <Selo tom={CADASTRO[c.cadastro].tom}>{CADASTRO[c.cadastro].texto}</Selo> : null}
					</>
				)}
			/>
			<NovoCliente aberto={novo} aoFechar={() => setNovo(false)} />
		</Pagina>
	);
}
