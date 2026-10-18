"use client";
// /prototipo: índice do protótipo para o Alef aprovar a Fase 0.

import ArrowRight from "@carbon/icons-react/es/ArrowRight";
import { CabecalhoPagina, Cartao, Pagina } from "@/componentes/ui/basicos";
import { Icon } from "@/componentes/ui/icon";
import { Link } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";

type Item = { href: string; nome: string; numero?: string; descricao: string; comoBalcao?: boolean };

const GRUPOS: { titulo: string; itens: Item[] }[] = [
	{
		titulo: "Locação",
		itens: [
			{ href: "/hoje", numero: "7.1", nome: "Hoje", descricao: "O que sai, o que volta e o que precisa do dono." },
			{ href: "/conversas", numero: "7.2", nome: "Conversas", descricao: "WhatsApp com o robô e a equipe na mesma linha do tempo." },
			{ href: "/reservas", numero: "7.3", nome: "Reservas", descricao: "Quadro por etapa e tabela." },
			{ href: "/reservas?ficha=reserva:1046", numero: "7.4", nome: "Ficha da reserva", descricao: "Reserva 1046, com a saída bloqueada." },
			{ href: "/clientes", numero: "7.5", nome: "Clientes", descricao: "Todos os clientes e a situação do cadastro." },
			{ href: "/clientes?ficha=cliente:4", numero: "7.6", nome: "Ficha do cliente", descricao: "Produtora Exemplo, aguardando aprovação." },
			{ href: "/pagamentos", numero: "7.7", nome: "Pagamentos", descricao: "O que a InfinitePay confirmou, estornos e cauções." },
			{ href: "/paineis", numero: "7.8", nome: "Painéis", descricao: "Se o estoque está rendendo." },
			{ href: "/automacoes", numero: "7.9", nome: "Automações", descricao: "Ligar, desligar e conferir as automações prontas." },
			{ href: "/configuracoes", numero: "7.10", nome: "Configurações", descricao: "Ajustes da locadora, já preenchidos." },
		],
	},
	{
		titulo: "Estoque",
		itens: [
			{ href: "/catalogo", numero: "7.11", nome: "Catálogo", descricao: "Cada modelo, quantas unidades livres e o uso." },
			{ href: "/catalogo?ficha=equipamento:1", numero: "7.12", nome: "Ficha do equipamento", descricao: "FX3: unidades, agenda, vídeos de teste e retorno." },
			{ href: "/unidades", numero: "7.13", nome: "Unidades", descricao: "Cada peça física, onde está e em que estado." },
			{ href: "/kits", numero: "7.14", nome: "Kits, pacote básico e extras", descricao: "O que sai junto e o que é cobrado à parte." },
			{ href: "/agenda", numero: "7.15", nome: "Agenda", descricao: "Linha do tempo de ocupação; no celular, “Está livre?”." },
			{ href: "/pedido/novo", numero: "7.16", nome: "Montador de pedido", descricao: "Reserva com preço calculado pelo banco." },
			{ href: "/balcao", numero: "7.17", nome: "Balcão", descricao: "Saída e volta lendo as etiquetas pelo celular." },
			{ href: "/manutencao", numero: "7.18", nome: "Manutenção", descricao: "Peças em reparo até voltar a ser alugáveis." },
			{ href: "/etiquetas", numero: "7.19", nome: "Etiquetas", descricao: "QR e código legível, no tamanho real." },
			{ href: "/alertas", numero: "7.20", nome: "Alertas", descricao: "Todos os alertas abertos." },
		],
	},
	{
		titulo: "Páginas do protótipo",
		itens: [
			{ href: "/prototipo/linguagem-visual", nome: "Linguagem visual", descricao: "Os três grupos de cor, em cor e em escala de cinza." },
			{ href: "/prototipo/papeis", nome: "Papéis", descricao: "O que o dono e o balcão veem; troca de papel." },
		],
	},
];

const ESTADOS: Item[] = [
	{ href: "/clientes?estado=vazio", nome: "Vazio", descricao: "Como a tela fica sem nenhum registro." },
	{ href: "/reservas?estado=carregando", nome: "Carregando", descricao: "Esqueleto com as medidas da tela pronta." },
	{ href: "/pagamentos?estado=erro", nome: "Erro", descricao: "Frase simples e “Tentar de novo”." },
	{ href: "/hoje?internet=nao", nome: "Sem internet", descricao: "Faixa no topo e botões que gravam desligados." },
	{ href: "/pagamentos", nome: "Sem permissão", descricao: "Tela só do dono, aberta como Julia (balcão). Volte ao dono no menu da foto.", comoBalcao: true },
];

function Lista({ itens }: { itens: Item[] }) {
	const { definirUsuario } = usePapel();
	return (
		<ul className="flex flex-col divide-y">
			{itens.map((i) => (
				<li key={i.href}>
					<Link
						href={i.href}
						onClick={() => {
							if (i.comoBalcao) definirUsuario(3);
						}}
						className="flex items-center gap-3 px-4 py-3 hover:bg-muted"
					>
						{i.numero ? <span className="w-9 shrink-0 font-mono text-muted-foreground text-xs tabular-nums">{i.numero}</span> : null}
						<span className="flex min-w-0 flex-1 flex-col gap-0.5">
							<span className="font-medium text-sm">{i.nome}</span>
							<span className="text-muted-foreground text-xs">{i.descricao}</span>
						</span>
						<Icon icon={ArrowRight} className="size-4 shrink-0 text-muted-foreground" />
					</Link>
				</li>
			))}
		</ul>
	);
}

export function TelaPrototipo() {
	const { usuario } = usePapel();
	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Protótipo da Fase 0"
				descricao={`As 20 telas com dados de exemplo, sem banco. Agora do protótipo: sexta, 16/10/2026, 10:00. Vendo como ${usuario.nome} (${usuario.papel === "dono" ? "dono" : "balcão"}); troque no menu da foto, no canto de cima.`}
			/>
			<div className="grid gap-6 lg:grid-cols-2">
				{GRUPOS.slice(0, 2).map((g) => (
					<Cartao key={g.titulo} titulo={g.titulo}>
						<Lista itens={g.itens} />
					</Cartao>
				))}
				<Cartao titulo={GRUPOS[2].titulo}>
					<Lista itens={GRUPOS[2].itens} />
				</Cartao>
				<Cartao titulo="Os cinco estados" descricao="Toda tela tem estes estados. Os links abaixo forçam cada um.">
					<Lista itens={ESTADOS} />
				</Cartao>
			</div>
			<p className="text-muted-foreground text-xs">
				Atalhos de teclado: Ctrl/Cmd + K busca registros e ações; “?” mostra os atalhos. Para aprovar, escreva “aprovado” no relatório da Fase 0 ou peça os ajustes.
			</p>
		</Pagina>
	);
}
