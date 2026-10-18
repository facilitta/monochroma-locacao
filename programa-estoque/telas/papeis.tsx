"use client";
// /prototipo/papeis: o que cada papel vê (seção 12), com a troca de papel do protótipo.

import UserAvatar from "@carbon/icons-react/es/UserAvatar";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Cartao, FotoCliente, Pagina } from "@/componentes/ui/basicos";
import { Icon } from "@/componentes/ui/icon";
import { Selo } from "@/componentes/ui/marcadores";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componentes/ui/table";
import { USUARIOS, usePapel } from "@/lib/papel";
import { toast } from "sonner";

const LINHAS: { tela: string; balcao: string }[] = [
	{ tela: "Hoje", balcao: "Só “Saídas e voltas”, “Em manutenção” e os alertas do balcão (1, 2, 4, 5, 6, 7, 8, 10, 12 e 15), sem valores." },
	{ tela: "Reservas e ficha da reserva", balcao: "Lê e marca Separada. Não vê valores, caução, multas nem a aba Pagamentos; vê os selos “Aluguel: confirmado / aguardando” e “Caução: confirmada / aguardando”, sem valor." },
	{ tela: "Clientes e ficha do cliente", balcao: "Vê nome, tipo, WhatsApp e os contatos que podem retirar. Nunca CPF ou CNPJ completo, endereço ou Documentos." },
	{ tela: "Catálogo, Unidades, Agenda", balcao: "Lê. Não vê preço, valor de compra, reposição nem “quanto já rendeu”; não baixa unidade; não arrasta na agenda." },
	{ tela: "Manutenção", balcao: "Abre e move. Não decide cobrança nem vê custo." },
	{ tela: "Etiquetas", balcao: "Imprime. Não muda o tamanho padrão." },
	{ tela: "Balcão", balcao: "Dá saída e recebe volta. Não vê valores nem caução; não libera falta de assinatura." },
	{ tela: "Alertas", balcao: "Só os do balcão." },
	{ tela: "Conversas", balcao: "Vê e responde (a resposta pausa o robô por 12 horas); pode “Assumir” e “Devolver ao robô”. Não vê anexos restritos." },
	{ tela: "Pagamentos, Kits, Painéis, Automações, Configurações", balcao: "Não vê." },
];

export function TelaPapeis() {
	const { usuario, definirUsuario } = usePapel();
	const trocar = (id: number) => {
		definirUsuario(id);
		const u = USUARIOS.find((x) => x.id === id);
		toast.success(`Vendo como ${u?.nome}`, { description: u?.papel === "dono" ? "Dono: acesso total." : "Balcão: sem financeiro." });
	};
	return (
		<Pagina>
			<CabecalhoPagina
				titulo="Papéis"
				descricao="Quem usa o app e o que cada papel vê. A regra fica no servidor e nas permissões do banco, não só na tela. Login só com Google."
			/>
			<div className="grid gap-6 md:grid-cols-2">
				<Cartao titulo="Dono" descricao="Acesso total, incluindo o financeiro." corpoClassName="flex flex-col gap-3 p-4">
					{USUARIOS.filter((u) => u.papel === "dono").map((u) => (
						<div key={u.id} className="flex items-center gap-3">
							<FotoCliente nome={u.nome} tamanho={32} />
							<span className="flex-1 text-sm">{u.nome}</span>
							{usuario.id === u.id ? (
								<Selo tom="ok">Vendo como</Selo>
							) : (
								<Button variant="outline" size="sm" onClick={() => trocar(u.id)}>
									<Icon icon={UserAvatar} data-icon="inline-start" />
									Ver como {u.nome}
								</Button>
							)}
						</div>
					))}
				</Cartao>
				<Cartao
					titulo="Balcão"
					descricao="Agenda, reservas, clientes, Conversas e o balcão de saída e volta. Não vê valores recebidos, faturamento, caução, multas nem tabela de preços."
					corpoClassName="flex flex-col gap-3 p-4"
				>
					{USUARIOS.filter((u) => u.papel === "balcao").map((u) => (
						<div key={u.id} className="flex items-center gap-3">
							<FotoCliente nome={u.nome} tamanho={32} />
							<span className="flex-1 text-sm">{u.nome}</span>
							{usuario.id === u.id ? (
								<Selo tom="ok">Vendo como</Selo>
							) : (
								<Button variant="outline" size="sm" onClick={() => trocar(u.id)}>
									<Icon icon={UserAvatar} data-icon="inline-start" />
									Ver como {u.nome}
								</Button>
							)}
						</div>
					))}
				</Cartao>
			</div>
			<Cartao titulo="O que o balcão vê em cada tela" descricao="O dono vê tudo. Campo restrito não aparece para o balcão, nem como “oculto”.">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-1/3 pl-4">Tela</TableHead>
							<TableHead className="pr-4">Balcão</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{LINHAS.map((l) => (
							<TableRow key={l.tela}>
								<TableCell className="whitespace-normal pl-4 align-top font-medium">{l.tela}</TableCell>
								<TableCell className="whitespace-normal pr-4 align-top">{l.balcao}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Cartao>
		</Pagina>
	);
}
