"use client";

import ArrowLeft from "@carbon/icons-react/es/ArrowLeft";
import Asleep from "@carbon/icons-react/es/Asleep";
import Light from "@carbon/icons-react/es/Light";
import Logout from "@carbon/icons-react/es/Logout";
import Notification from "@carbon/icons-react/es/Notification";
import OverflowMenuHorizontal from "@carbon/icons-react/es/OverflowMenuHorizontal";
import Scan from "@carbon/icons-react/es/Scan";
import TextScale from "@carbon/icons-react/es/TextScale";
import UserMultiple from "@carbon/icons-react/es/UserMultiple";
import Locked from "@carbon/icons-react/es/Locked";
import { Button } from "@/componentes/ui/button";
import { EstadoVazio, FaixaSemInternet, FotoCliente } from "@/componentes/ui/basicos";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/componentes/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import { Icon } from "@/componentes/ui/icon";
import { MarcaMonochroma } from "@/componentes/ui/logo";
import { Popover, PopoverContent, PopoverTrigger } from "@/componentes/ui/popover";
import { PontoSituacao } from "@/componentes/ui/marcadores";
import { HospedeFichas } from "@/componentes/estrutura/hospede-fichas";
import { BuscaComandos } from "@/componentes/estrutura/busca-comandos";
import { aplicarTextoMaior, lerTextoMaior, marcarTemaEscolhido, useMontado } from "@/componentes/estrutura/provedores";
import { BARRA_INFERIOR, MENU, podeAbrir, type ItemMenu } from "@/lib/menu";
import { Link, useCaminho } from "@/lib/navegacao";
import { USUARIOS, usePapel } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { relativa } from "@/lib/formatos";
import { useConexao } from "@/lib/estado-prototipo";
import { alertas as calcularAlertas } from "@/prototipo/consultas";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

function ativo(caminho: string, rota: string) {
	return caminho === rota || caminho.startsWith(`${rota}/`);
}

function ItemTrilho({ item, caminho }: { item: ItemMenu; caminho: string }) {
	const sel = ativo(caminho, item.rota);
	return (
		<Link
			href={item.rota}
			aria-current={sel ? "page" : undefined}
			className={cn(
				"flex w-[68px] flex-col items-center gap-1 rounded-md px-0.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				sel && "bg-muted text-foreground",
			)}
		>
			<Icon icon={item.icone} className="size-4" />
			<span title={item.nome} className="w-full text-center text-2xs leading-tight tracking-tight hyphens-manual">{item.nomeTrilho ?? item.nome}</span>
		</Link>
	);
}

function Trilho() {
	const caminho = useCaminho();
	const { papel } = usePapel();
	const grupos = (["locacao", "estoque", "pe"] as const).map((g) => MENU.filter((m) => m.grupo === g && m.papeis.includes(papel)));
	return (
		<nav aria-label="Menu principal" data-nao-imprimir className="hidden w-trilho shrink-0 flex-col items-center gap-1 overflow-y-auto border-r bg-background py-2 md:flex">
			{grupos[0].map((i) => (
				<ItemTrilho key={i.rota} item={i} caminho={caminho} />
			))}
			<span aria-hidden className="my-1 h-px w-10 bg-border" />
			{grupos[1].map((i) => (
				<ItemTrilho key={i.rota} item={i} caminho={caminho} />
			))}
			{grupos[2].length ? (
				<>
					<span className="flex-1" />
					<span aria-hidden className="my-1 h-px w-10 bg-border" />
					{grupos[2].map((i) => (
						<ItemTrilho key={i.rota} item={i} caminho={caminho} />
					))}
				</>
			) : null}
		</nav>
	);
}

function ListaAlertas({ aoFechar }: { aoFechar: () => void }) {
	const agora = useAgora(30_000);
	const { ehDono } = usePapel();
	const lista = calcularAlertas(agora).filter((a) => ehDono || (a.balcao && !a.financeiro));
	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<span className="font-medium text-sm">Alertas</span>
				<span className="text-muted-foreground text-xs tabular-nums">{lista.length} abertos</span>
			</div>
			{lista.length === 0 ? (
				<p className="px-3 py-6 text-center text-muted-foreground text-xs">Nenhum alerta aberto.</p>
			) : (
				<ul className="flex flex-col py-1">
					{lista.slice(0, 5).map((a) => (
						<li key={a.chave}>
							<Link
								href={a.reservaId ? `/reservas?ficha=reserva:${a.reservaId}` : a.conversaId ? `/conversas?conversa=${a.conversaId}` : "/alertas"}
								onClick={aoFechar}
								className="flex items-start gap-2 px-3 py-2 hover:bg-muted"
							>
								<PontoSituacao tom={a.tom} className="min-w-0 flex-1">
									<span className="truncate">
										{a.frase}
										{a.reservaId ? <span className="text-muted-foreground"> · {a.reservaId}</span> : null}
									</span>
								</PontoSituacao>
								<span className="shrink-0 text-muted-foreground text-xs">{relativa(a.desde, agora)}</span>
							</Link>
						</li>
					))}
				</ul>
			)}
			<div className="border-t p-2">
				<Button asChild variant="ghost" size="sm" className="w-full">
					<Link href="/alertas" onClick={aoFechar}>
						Ver todos
					</Link>
				</Button>
			</div>
		</div>
	);
}

function BotaoAlertas() {
	const agora = useAgora(30_000);
	const { ehDono } = usePapel();
	const [aberto, setAberto] = useState(false);
	const n = calcularAlertas(agora).filter((a) => ehDono || (a.balcao && !a.financeiro)).length;
	return (
		<Popover open={aberto} onOpenChange={setAberto}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" aria-label={`Alertas, ${n} abertos`}>
					<Icon icon={Notification} data-icon="inline-start" />
					<span>Alertas</span>
					<span className="tabular-nums">{n}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-2rem)] p-0">
				<ListaAlertas aoFechar={() => setAberto(false)} />
			</PopoverContent>
		</Popover>
	);
}

function MenuUsuario() {
	const { usuario, definirUsuario } = usePapel();
	const { resolvedTheme, setTheme } = useTheme();
	const [textoMaior, setTextoMaior] = useState(false);
	useEffect(() => setTextoMaior(lerTextoMaior()), []);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label={`Menu de ${usuario.nome}`} className="rounded-full">
					<FotoCliente nome={usuario.nome} tamanho={24} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-60">
				<DropdownMenuLabel className="flex flex-col">
					<span className="text-foreground">{usuario.nome}</span>
					<span className="font-normal text-muted-foreground">{usuario.papel === "dono" ? "Dono" : "Balcão"}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuCheckboxItem
					checked={resolvedTheme === "dark"}
					onCheckedChange={(v) => {
						marcarTemaEscolhido();
						setTheme(v ? "dark" : "light");
					}}
				>
					<Icon icon={resolvedTheme === "dark" ? Asleep : Light} className="size-4" />
					Modo escuro
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={textoMaior}
					onCheckedChange={(v) => {
						setTextoMaior(v);
						aplicarTextoMaior(v);
					}}
				>
					<Icon icon={TextScale} className="size-4" />
					Texto maior
				</DropdownMenuCheckboxItem>
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="font-normal text-muted-foreground">Protótipo: ver como</DropdownMenuLabel>
				<DropdownMenuRadioGroup value={String(usuario.id)} onValueChange={(v) => definirUsuario(Number(v))}>
					{USUARIOS.map((u) => (
						<DropdownMenuRadioItem key={u.id} value={String(u.id)}>
							{u.nome} · {u.papel === "dono" ? "dono" : "balcão"}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				<DropdownMenuItem asChild>
					<Link href="/prototipo">
						<Icon icon={UserMultiple} className="size-4" />Índice do protótipo
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/prototipo/papeis">
						<Icon icon={UserMultiple} className="size-4" />O que cada papel vê
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled>
					<Icon icon={Logout} className="size-4" />
					Sair
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function Cabecalho() {
	const { usuario } = usePapel();
	return (
		<header data-nao-imprimir className="flex h-cabecalho shrink-0 items-center gap-2 border-b bg-background px-3 md:px-4">
			<a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-2">
				Pular para o conteúdo
			</a>
			<Link href="/hoje" data-alvo className="flex items-center gap-2 rounded-md" aria-label="Monochroma, ir para Hoje">
				<MarcaMonochroma />
			</Link>
			<Link href="/prototipo" className="ml-1 hidden rounded-full border px-2 py-0.5 text-2xs text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex">
				Protótipo · dados de exemplo · {usuario.nome}
			</Link>
			<span className="flex-1" />
			<Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
				<Link href="/balcao">
					<Icon icon={Scan} data-icon="inline-start" />
					Balcão
				</Link>
			</Button>
			<BotaoAlertas />
			<MenuUsuario />
		</header>
	);
}

function BarraInferior() {
	const caminho = useCaminho();
	const { papel } = usePapel();
	const [mais, setMais] = useState(false);
	const itens = BARRA_INFERIOR.map((r) => MENU.find((m) => m.rota === r)).filter((m): m is ItemMenu => !!m && m.papeis.includes(papel));
	const resto = MENU.filter((m) => m.grupo !== "fora" && !BARRA_INFERIOR.includes(m.rota) && m.papeis.includes(papel));
	return (
		<>
			<nav aria-label="Menu" data-nao-imprimir className="flex h-barra-inferior shrink-0 items-stretch justify-around border-t bg-background px-1 md:hidden">
				{itens.map((i) => {
					const sel = ativo(caminho, i.rota);
					return (
						<Link
							key={i.rota}
							href={i.rota}
							data-alvo
							aria-current={sel ? "page" : undefined}
							className={cn("flex min-w-12 flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground", sel && "text-foreground")}
						>
							<Icon icon={i.icone} className="size-5" />
							<span className="text-2xs">{i.nome}</span>
						</Link>
					);
				})}
				<button
					type="button"
					data-alvo
					onClick={() => setMais(true)}
					className="flex min-w-12 flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground"
				>
					<Icon icon={OverflowMenuHorizontal} className="size-5" />
					<span className="text-2xs">Mais</span>
				</button>
			</nav>
			<Drawer open={mais} onOpenChange={setMais}>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Mais</DrawerTitle>
						<DrawerDescription>As outras telas do app.</DrawerDescription>
					</DrawerHeader>
					<ul className="grid grid-cols-3 gap-2 px-4 pb-6">
						{resto.map((i) => (
							<li key={i.rota}>
								<Link
									href={i.rota}
									onClick={() => setMais(false)}
									data-alvo
									className="flex flex-col items-center gap-1 rounded-lg border p-3 text-xs hover:bg-muted"
								>
									<Icon icon={i.icone} className="size-5" />
									{i.nome}
								</Link>
							</li>
						))}
					</ul>
				</DrawerContent>
			</Drawer>
		</>
	);
}

function SemPermissao() {
	return (
		<main id="conteudo" className="flex flex-1 items-center justify-center p-6">
			<EstadoVazio
				icone={Locked}
				titulo="Esta tela é só do dono."
				descricao="O papel de balcão não tem acesso a esta parte do app."
				acao={
					<Button asChild variant="outline" size="sm">
						<Link href="/hoje">
							<Icon icon={ArrowLeft} data-icon="inline-start" />
							Voltar para Hoje
						</Link>
					</Button>
				}
			/>
		</main>
	);
}


export function Casca({ children }: { children: React.ReactNode }) {
	const montado = useMontado();
	const caminho = useCaminho();
	const { papel } = usePapel();
	const { offline, hora } = useConexao();
	const permitido = useMemo(() => podeAbrir(caminho, papel), [caminho, papel]);
	if (!montado) {
		return <div className="altura-tela bg-background" aria-busy="true" />;
	}
	return (
		<div className="altura-tela flex flex-col bg-background text-foreground" data-papel={papel}>
			<Cabecalho />
			{offline ? <FaixaSemInternet hora={hora} /> : null}
			<div className="flex min-h-0 flex-1">
				<Trilho />
				<div className="flex min-w-0 flex-1 flex-col">{permitido ? children : <SemPermissao />}</div>
			</div>
			<BarraInferior />
			<HospedeFichas />
			<BuscaComandos />
		</div>
	);
}
