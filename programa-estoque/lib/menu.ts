// Itens do trilho e da barra inferior (seção 7.0) e o que cada papel vê (seção 12).
import Camera from "@carbon/icons-react/es/Camera";
import Chat from "@carbon/icons-react/es/Chat";
import ChartColumn from "@carbon/icons-react/es/ChartColumn";
import Flow from "@carbon/icons-react/es/Flow";
import Home from "@carbon/icons-react/es/Home";
import Notification from "@carbon/icons-react/es/Notification";
import Package from "@carbon/icons-react/es/Package";
import QrCode from "@carbon/icons-react/es/QrCode";
import Receipt from "@carbon/icons-react/es/Receipt";
import Roadmap from "@carbon/icons-react/es/Roadmap";
import Scan from "@carbon/icons-react/es/Scan";
import Settings from "@carbon/icons-react/es/Settings";
import Tag from "@carbon/icons-react/es/Tag";
import Task from "@carbon/icons-react/es/Task";
import Tools from "@carbon/icons-react/es/Tools";
import UserMultiple from "@carbon/icons-react/es/UserMultiple";
import Wallet from "@carbon/icons-react/es/Wallet";
import ShoppingCart from "@carbon/icons-react/es/ShoppingCart";
import type { CarbonIcon } from "@/componentes/ui/icon";
import type { Papel } from "@/lib/papel";

export type ItemMenu = {
	rota: string;
	nome: string;
	icone: CarbonIcon;
	nomeTrilho?: string;
	grupo: "locacao" | "estoque" | "pe" | "fora";
	papeis: Papel[];
};

export const MENU: ItemMenu[] = [
	{ rota: "/hoje", nome: "Hoje", icone: Home, grupo: "locacao", papeis: ["dono", "balcao"] },
	{ rota: "/conversas", nome: "Conversas", icone: Chat, grupo: "locacao", papeis: ["dono", "balcao"] },
	{ rota: "/reservas", nome: "Reservas", icone: Task, grupo: "locacao", papeis: ["dono", "balcao"] },
	{ rota: "/clientes", nome: "Clientes", icone: UserMultiple, grupo: "locacao", papeis: ["dono", "balcao"] },
	{ rota: "/pagamentos", nome: "Pagamentos", nomeTrilho: "Paga\u00admentos", icone: Wallet, grupo: "locacao", papeis: ["dono"] },
	{ rota: "/paineis", nome: "Painéis", icone: ChartColumn, grupo: "locacao", papeis: ["dono"] },
	{ rota: "/catalogo", nome: "Catálogo", icone: Camera, grupo: "estoque", papeis: ["dono", "balcao"] },
	{ rota: "/unidades", nome: "Unidades", icone: Tag, grupo: "estoque", papeis: ["dono", "balcao"] },
	{ rota: "/kits", nome: "Kits", icone: Package, grupo: "estoque", papeis: ["dono"] },
	{ rota: "/agenda", nome: "Agenda", icone: Roadmap, grupo: "estoque", papeis: ["dono", "balcao"] },
	{ rota: "/manutencao", nome: "Manutenção", nomeTrilho: "Manu\u00adtenção", icone: Tools, grupo: "estoque", papeis: ["dono", "balcao"] },
	{ rota: "/etiquetas", nome: "Etiquetas", icone: QrCode, grupo: "estoque", papeis: ["dono", "balcao"] },
	{ rota: "/automacoes", nome: "Automações", nomeTrilho: "Auto\u00admações", icone: Flow, grupo: "pe", papeis: ["dono"] },
	{ rota: "/configuracoes", nome: "Configurações", nomeTrilho: "Configu\u00adrações", icone: Settings, grupo: "pe", papeis: ["dono"] },
	{ rota: "/balcao", nome: "Balcão", icone: Scan, grupo: "fora", papeis: ["dono", "balcao"] },
	{ rota: "/alertas", nome: "Alertas", icone: Notification, grupo: "fora", papeis: ["dono", "balcao"] },
	{ rota: "/pedido/novo", nome: "Novo pedido", icone: ShoppingCart, grupo: "fora", papeis: ["dono"] },
	{ rota: "/recibos", nome: "Recibos", icone: Receipt, grupo: "fora", papeis: ["dono"] },
];

export const BARRA_INFERIOR = ["/hoje", "/balcao", "/conversas", "/agenda"];

export function podeAbrir(rota: string, papel: Papel): boolean {
	const item = MENU.find((m) => rota === m.rota || rota.startsWith(`${m.rota}/`));
	return item ? item.papeis.includes(papel) : true;
}

export function itemDaRota(rota: string): ItemMenu | undefined {
	return MENU.find((m) => rota === m.rota || rota.startsWith(`${m.rota}/`));
}
