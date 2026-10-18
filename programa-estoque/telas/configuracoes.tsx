"use client";
// 7.10 Configurações: ajustar a locadora sem mexer em código. Tudo já vem preenchido.

import { CampoDataHora } from "@/componentes/ui/campo-data";
import Add from "@carbon/icons-react/es/Add";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { CabecalhoPagina, Cartao, Codigo, EstadoErro, FotoCliente, Pagina } from "@/componentes/ui/basicos";
import { Icon } from "@/componentes/ui/icon";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { MarcaMonochroma } from "@/componentes/ui/logo";
import { EtapaRotulo, PontoSituacao, Selo } from "@/componentes/ui/marcadores";
import { Skeleton } from "@/componentes/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componentes/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/componentes/ui/toggle-group";
import { BarraAlteracoes, Definir, Interruptor } from "@/componentes/gestao/comum";
import { useConexao, useEstadoTela } from "@/lib/estado-prototipo";
import { data, dinheiro, relativa, telefone } from "@/lib/formatos";
import { Link, useParametro } from "@/lib/navegacao";
import { USUARIOS } from "@/lib/papel";
import { useAgora } from "@/lib/relogio";
import { ETAPAS, ORDEM_DAS_ETAPAS } from "@/lib/regras/etapas";
import { cn } from "@/lib/utils";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

const SECOES = [
	{ id: "locadora", nome: "Locadora" },
	{ id: "equipe", nome: "Equipe e papéis" },
	{ id: "precos", nome: "Regras de preço" },
	{ id: "horario", nome: "Horário e feriados" },
	{ id: "etapas", nome: "Etapas (ver)" },
	{ id: "mensagens", nome: "Mensagens prontas" },
	{ id: "pagamentos", nome: "Pagamentos (InfinitePay)" },
	{ id: "contrato", nome: "Contrato e documentos" },
	{ id: "etiquetas", nome: "Etiquetas" },
	{ id: "whatsapp", nome: "WhatsApp e robô" },
	{ id: "privacidade", nome: "Privacidade" },
	{ id: "saude", nome: "Saúde das integrações" },
	{ id: "sobre", nome: "Sobre" },
] as const;

type Secao = (typeof SECOES)[number]["id"];

/* ---------- peças ---------- */

function CartaoConfig({
	titulo,
	descricao,
	children,
	alterado,
	aoSalvar,
	somenteLeitura,
}: {
	titulo: string;
	descricao: string;
	children: ReactNode;
	alterado?: boolean;
	aoSalvar?: () => void;
	somenteLeitura?: boolean;
}) {
	const { offline } = useConexao();
	return (
		<Cartao
			titulo={titulo}
			descricao={descricao}
			acao={
				somenteLeitura ? (
					<Badge variant="outline">Só leitura</Badge>
				) : (
					<Button variant="outline" size="sm" disabled={!alterado || offline} onClick={aoSalvar} title={offline ? "Volta quando a internet voltar" : undefined}>
						Salvar
					</Button>
				)
			}
			corpoClassName="p-4"
		>
			{children}
		</Cartao>
	);
}

function Linha({ rotulo, children, ajuda }: { rotulo: ReactNode; children: ReactNode; ajuda?: ReactNode }) {
	return (
		<div className="grid gap-1.5 border-b py-3 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center sm:gap-4">
			<div className="flex flex-col gap-0.5">
				<span className="text-xs font-medium">{rotulo}</span>
				{ajuda ? <span className="text-muted-foreground text-2xs">{ajuda}</span> : null}
			</div>
			<div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">{children}</div>
		</div>
	);
}

function CampoNumero({ id, valor, aoMudar, sufixo, largura = "w-20", placeholder }: { id: string; valor: string; aoMudar: (v: string) => void; sufixo?: string; largura?: string; placeholder?: string }) {
	return (
		<span className="inline-flex items-center gap-2">
			<Input id={id} inputMode="numeric" value={valor} placeholder={placeholder} onChange={(e) => aoMudar(e.target.value)} className={cn(largura, "tabular-nums")} />
			{sufixo ? <span className="text-muted-foreground">{sufixo}</span> : null}
		</span>
	);
}

/* ---------- seções ---------- */

function SecaoLocadora({ marcar }: { marcar: (v: boolean) => void }) {
	const [nome, setNome] = useState(D.configuracoesExemplo.nome);
	const [tel, setTel] = useState(telefone(D.configuracoesExemplo.telefone));
	const alterado = nome !== D.configuracoesExemplo.nome || tel !== telefone(D.configuracoesExemplo.telefone);
	return (
		<CartaoConfig
			titulo="Locadora"
			descricao="Nome, logo, endereço e telefone que aparecem nas etiquetas, nos documentos e nas mensagens."
			alterado={alterado}
			aoSalvar={() => {
				marcar(false);
				toast.success("Locadora salva");
			}}
		>
			<Linha rotulo={<Label htmlFor="cfg-nome">Nome</Label>}>
				<Input id="cfg-nome" value={nome} onChange={(e) => (setNome(e.target.value), marcar(true))} className="max-w-xs" />
			</Linha>
			<Linha rotulo="Logo" ajuda="Redesenho provisório a partir do Instagram.">
				<MarcaMonochroma />
				<Definir>arquivo original do logo</Definir>
			</Linha>
			<Linha rotulo="Cor de destaque" ajuda="Sai do logo: o magenta da bolinha. Troca só uma variável.">
				<span aria-hidden className="size-6 rounded-md bg-primary" />
				<span>Magenta do logo, com texto branco</span>
			</Linha>
			<Linha rotulo="Endereço de retirada e devolução">
				<Definir>endereço</Definir>
			</Linha>
			<Linha rotulo={<Label htmlFor="cfg-tel">Telefone nas etiquetas</Label>}>
				<Input id="cfg-tel" value={tel} onChange={(e) => (setTel(e.target.value), marcar(true))} className="max-w-xs tabular-nums" />
			</Linha>
		</CartaoConfig>
	);
}

function SecaoEquipe() {
	return (
		<CartaoConfig titulo="Equipe e papéis" descricao="Quem entra no app e o que cada um vê. O login é só com Google: só entra o e-mail desta lista." somenteLeitura>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Pessoa</TableHead>
						<TableHead className="hidden sm:table-cell">E-mail Google</TableHead>
						<TableHead>Papel</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{USUARIOS.map((u) => (
						<TableRow key={u.id}>
							<TableCell>
								<span className="flex items-center gap-2">
									<FotoCliente nome={u.nome} />
									{u.nome}
								</span>
							</TableCell>
							<TableCell className="hidden sm:table-cell">{u.email}</TableCell>
							<TableCell>
								{u.papel === "dono" ? (
									<Badge variant="outline">Dono · acesso total</Badge>
								) : (
									<Badge variant="outline">Balcão · sem financeiro</Badge>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<p className="pt-3 text-muted-foreground text-xs">
				Balcão vê agenda, reservas, clientes, Conversas e o balcão de saída e volta. Não vê valores recebidos, faturamento, caução, multas nem tabela de preços.{" "}
				<Link href="/prototipo/papeis" className="text-link underline-offset-4 hover:underline">
					Ver o que cada papel vê
				</Link>
			</p>
			<Button variant="outline" size="sm" className="mt-3">
				<Icon icon={Add} data-icon="inline-start" />
				Autorizar outro e-mail
			</Button>
		</CartaoConfig>
	);
}

function SecaoPrecos({ marcar }: { marcar: (v: boolean) => void }) {
	const c = D.configuracoesExemplo;
	const [tolerancia, setTolerancia] = useState(String(c.toleranciaMin));
	const [multa, setMulta] = useState("");
	const [gratis, setGratis] = useState(String(c.cancelamentoGratisHoras));
	const [retencao, setRetencao] = useState(String(c.cancelamentoRetencaoPct));
	const alterado = tolerancia !== String(c.toleranciaMin) || multa !== "" || gratis !== String(c.cancelamentoGratisHoras) || retencao !== String(c.cancelamentoRetencaoPct);
	const [ret, setRet] = useState("2026-10-16T10:00");
	const [dev, setDev] = useState("2026-10-19T10:00");
	const inicio = new Date(`${ret}:00-03:00`);
	const fim = new Date(`${dev}:00-03:00`);
	const valido = !Number.isNaN(inicio.getTime()) && !Number.isNaN(fim.getTime()) && fim > inicio;
	const preco = valido ? Q.calcularPreco([{ equipamentoId: 1, quantidade: 1, tipo: "equipamento" }, { equipamentoId: 31, quantidade: 2, tipo: "basico" }, { equipamentoId: 32, quantidade: 1, tipo: "basico" }], inicio, fim) : null;
	const horas = valido ? Math.round((fim.getTime() - inicio.getTime()) / 3_600_000) : 0;
	const mudar = (f: (v: string) => void) => (v: string) => {
		f(v);
		marcar(true);
	};
	return (
		<div className="flex flex-col gap-6">
			<CartaoConfig
				titulo="Regras de preço"
				descricao="Como a diária é contada. Mudar uma regra não muda reserva já criada: o preço fica congelado."
				alterado={alterado}
				aoSalvar={() => {
					marcar(false);
					toast.success("Regras de preço salvas");
				}}
			>
				<Linha rotulo="Diária" ajuda="Cada dia conta; o fim de semana não vira diária única.">
					<Selo tom="ok">Ligada</Selo>
					<span>24 h a partir da retirada</span>
				</Linha>
				<Linha rotulo={<Label htmlFor="cfg-tol">Tolerância na devolução</Label>}>
					<CampoNumero id="cfg-tol" valor={tolerancia} aoMudar={mudar(setTolerancia)} sufixo="min" />
				</Linha>
				<Linha rotulo={<Label htmlFor="cfg-multa">Multa por hora de atraso</Label>} ajuda="Descontada da caução. Vazio: o app só conta as horas e avisa.">
					<CampoNumero id="cfg-multa" valor={multa} aoMudar={mudar(setMulta)} sufixo="% da diária por hora" placeholder="—" />
					<Definir>% e teto</Definir>
				</Linha>
				<Linha rotulo="Caução" ajuda="Uma por pedido, link separado só Pix.">
					<Definir>valor fixo, % ou faixa</Definir>
				</Linha>
				<Linha rotulo="Cancelamento depois de pago" ajuda="A devolução sai pela InfinitePay, na transação original.">
					<span>grátis até</span>
					<CampoNumero id="cfg-gratis" valor={gratis} aoMudar={mudar(setGratis)} sufixo="h antes da retirada; depois, o cliente paga" />
					<CampoNumero id="cfg-ret" valor={retencao} aoMudar={mudar(setRetencao)} sufixo="%" largura="w-16" />
				</Linha>
				<Linha rotulo="Preço dos extras" ajuda="Cada extra cobra a diária do próprio acessório.">
					<Link href="/kits?aba=extras" className="text-link underline-offset-4 hover:underline">
						Editar em Kits › Extras
					</Link>
				</Linha>
				<Linha rotulo="Semana, mês, combos e promoções" ajuda="Até decidir, só diária.">
					<Definir />
				</Linha>
			</CartaoConfig>
			<Cartao titulo="Simular" descricao="Calcula pelo banco, como o robô e o Montador fazem. Exemplo com a FX3 e o pacote básico." corpoClassName="p-4">
				<div className="flex flex-wrap items-end gap-3">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="sim-ret">Retirada</Label>
						<CampoDataHora id="sim-ret" rotulo="Retirada" valor={ret} aoMudar={setRet} className="w-72" />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="sim-dev">Devolução</Label>
						<CampoDataHora id="sim-dev" rotulo="Devolução" valor={dev} aoMudar={setDev} className="w-72" />
					</div>
					<p className="pb-1.5 text-sm" aria-live="polite">
						{preco ? (
							<>
								{horas} h → <span className="font-medium">{preco.regra}</span> · {dinheiro(preco.valorAluguel)}
							</>
						) : (
							<span className="text-erro">A devolução precisa ser depois da retirada.</span>
						)}
					</p>
				</div>
			</Cartao>
		</div>
	);
}

function SecaoHorario({ marcar }: { marcar: (v: boolean) => void }) {
	const c = D.configuracoesExemplo;
	const [folga, setFolga] = useState(String(c.horasFolga));
	return (
		<CartaoConfig
			titulo="Horário e feriados"
			descricao="Retirada e devolução só no horário do balcão. O robô e a agenda respeitam este horário."
			alterado={folga !== String(c.horasFolga)}
			aoSalvar={() => {
				marcar(false);
				toast.success("Horário salvo");
			}}
		>
			<p className="pb-3 text-xs">
				<Definir>horário real de retirada e devolução</Definir> <span className="text-muted-foreground">Padrão provisório abaixo.</span>
			</p>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Dia</TableHead>
						<TableHead>Abre</TableHead>
						<TableHead>Fecha</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{c.horarioBalcao.map((h) => (
						<TableRow key={h.dia}>
							<TableCell className="capitalize">{h.dia}</TableCell>
							<TableCell className="tabular-nums">{h.abre ?? "fechado"}</TableCell>
							<TableCell className="tabular-nums">{h.fecha ?? "—"}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<div className="pt-4">
				<Linha rotulo={<Label htmlFor="cfg-folga">Folga entre aluguéis</Label>} ajuda="Para conferência e limpeza. Domingos e feriados contam como horas normais.">
					<CampoNumero
						id="cfg-folga"
						valor={folga}
						aoMudar={(v) => {
							setFolga(v);
							marcar(true);
						}}
						sufixo="h"
					/>
				</Linha>
				<Linha rotulo="Feriados">
					<ul className="flex flex-col gap-1">
						{c.feriados.map((f) => (
							<li key={f.descricao} className="tabular-nums">
								{data(f.data)} · {f.descricao}
							</li>
						))}
					</ul>
				</Linha>
			</div>
		</CartaoConfig>
	);
}

function SecaoEtapas() {
	return (
		<CartaoConfig titulo="Etapas" descricao="As etapas da reserva, com a cor e o que cada uma exige. A etapa só muda por função do banco, com histórico." somenteLeitura>
			<ul className="flex flex-col divide-y">
				{ORDEM_DAS_ETAPAS.map((e) => (
					<li key={e} className="grid gap-1 py-2.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
						<EtapaRotulo etapa={e} />
						<span className="text-muted-foreground text-xs">{ETAPAS[e].exige}</span>
					</li>
				))}
			</ul>
		</CartaoConfig>
	);
}

const SITUACAO_MODELO: Record<D.ModeloMensagem["situacao"], { texto: string; tom: "neutro" | "atencao" | "info" | "ok" }> = {
	rascunho: { texto: "Rascunho", tom: "neutro" },
	aguardando_donos: { texto: "Aguardando o sim dos donos", tom: "atencao" },
	em_analise_ycloud: { texto: "Em análise na YCloud", tom: "info" },
	aprovado: { texto: "Aprovada", tom: "ok" },
};

function SecaoMensagens() {
	return (
		<CartaoConfig titulo="Mensagens prontas" descricao="Mensagens aprovadas para escrever fora da janela de 24 horas. O texto só vai para a YCloud com o sim do Xerxes e do Alef." somenteLeitura>
			<ul className="flex flex-col divide-y">
				{D.modelosMensagem.map((m) => (
					<li key={m.id} className="flex flex-col gap-1.5 py-3 first:pt-0">
						<span className="flex flex-wrap items-center gap-2">
							<Codigo>{m.nome}</Codigo>
							<span className="text-muted-foreground text-xs">{m.descricao}</span>
							<span className="flex-1" />
							<Selo tom={SITUACAO_MODELO[m.situacao].tom}>{SITUACAO_MODELO[m.situacao].texto}</Selo>
						</span>
						<p className="rounded-md bg-muted px-3 py-2 text-xs/5">{m.texto}</p>
					</li>
				))}
			</ul>
		</CartaoConfig>
	);
}

function SecaoPagamentos() {
	return (
		<CartaoConfig titulo="Pagamentos (InfinitePay)" descricao="Conta da locadora e as regras de cobrança. Só consulta: as chaves ficam no n8n, nunca no app." somenteLeitura>
			<Linha rotulo="Conta">
				<span>Conta da locadora (MEI)</span>
				<Definir>abrir a conta</Definir>
			</Linha>
			<Linha rotulo="Ligação">
				<PontoSituacao tom="neutro">Ambiente de teste · liga na fase 3</PontoSituacao>
			</Linha>
			<Linha rotulo="Aluguel">Link de pagamento com Pix e cartão. No parcelado, os juros ficam com o cliente.</Linha>
			<Linha rotulo="Caução">Link separado, só Pix, para não pagar taxa de cartão sobre um valor que volta.</Linha>
			<Linha rotulo="Taxas de Pix, cartão e parcelado">
				<Definir>conferir as taxas atuais</Definir>
			</Linha>
			<Linha rotulo="Confirmação">Automática, com dupla checagem: o n8n consulta a InfinitePay de novo antes de confirmar.</Linha>
		</CartaoConfig>
	);
}

function SecaoContrato() {
	const modelos: { nome: string; quando: string }[] = [
		{ nome: "CG-PF", quando: "Contrato geral de pessoa física, assinado uma vez." },
		{ nome: "CG-PJ", quando: "Contrato geral de empresa ou produtora com CNPJ, assinado uma vez." },
		{ nome: "OL-Padrão", quando: "Ordem de locação de aluguel comum." },
		{ nome: "OL-Longo", quando: "7 diárias ou mais." },
		{ nome: "OL-Viagem", quando: "Uso fora do estado do Rio de Janeiro." },
		{ nome: "OL-Alto valor", quando: "Equipamentos que somam mais de R$ [A DEFINIR]." },
	];
	return (
		<CartaoConfig titulo="Contrato e documentos" descricao="Modelos fixos por caso. O sistema só preenche os campos; texto novo entra como versão nova, depois de revisado por advogado." somenteLeitura>
			<ul className="flex flex-col divide-y">
				{modelos.map((m) => (
					<li key={m.nome} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0">
						<Codigo className="w-24">{m.nome}</Codigo>
						<span className="min-w-0 flex-1 text-xs">{m.quando}</span>
						<Selo tom="atencao">v1 · minuta, aguardando advogado</Selo>
					</li>
				))}
			</ul>
			<p className="pt-3 text-xs">
				<span className="font-medium">Regra de escolha:</span> vale o caso de maior risco: Alto valor, Viagem, Longo, Padrão. Alto valor e Viagem juntos: a equipe aprova antes do envio.
			</p>
			<p className="pt-2 text-xs">
				<span className="font-medium">Assinatura:</span> Autentique, com aviso automático. <PontoSituacao tom="neutro">ambiente de teste</PontoSituacao>
			</p>
			<p className="pt-2 text-xs">
				<Definir>advogado e aprovação dos modelos</Definir>
			</p>
		</CartaoConfig>
	);
}

function SecaoEtiquetas({ marcar }: { marcar: (v: boolean) => void }) {
	const [tamanho, setTamanho] = useState("a4");
	const [x, setX] = useState("0");
	const [y, setY] = useState("0");
	return (
		<CartaoConfig
			titulo="Etiquetas"
			descricao="Tamanho padrão e calibração da impressão. A etiqueta leva só o código, nunca dado de cliente."
			alterado={tamanho !== "a4" || x !== "0" || y !== "0"}
			aoSalvar={() => {
				marcar(false);
				toast.success("Etiquetas salvas");
			}}
		>
			<Linha rotulo="Tamanho padrão">
				<ToggleGroup
					type="single"
					value={tamanho}
					onValueChange={(v) => {
						if (v) {
							setTamanho(v);
							marcar(true);
						}
					}}
					variant="outline"
					spacing={0}
				>
					<ToggleGroupItem value="a4">Folha A4 adesiva</ToggleGroupItem>
					<ToggleGroupItem value="50x25">50 × 25 mm</ToggleGroupItem>
					<ToggleGroupItem value="62x29">62 × 29 mm</ToggleGroupItem>
				</ToggleGroup>
			</Linha>
			<Linha rotulo="Folha Pimaco">
				<Definir>modelo exato da folha</Definir>
			</Linha>
			<Linha rotulo="Deslocamento" ajuda="Acerte com a página de teste da tela Etiquetas.">
				<CampoNumero id="cfg-x" valor={x} aoMudar={(v) => (setX(v), marcar(true))} sufixo="mm para o lado" largura="w-16" />
				<CampoNumero id="cfg-y" valor={y} aoMudar={(v) => (setY(v), marcar(true))} sufixo="mm para baixo" largura="w-16" />
			</Linha>
		</CartaoConfig>
	);
}

function SecaoWhatsapp({ marcar }: { marcar: (v: boolean) => void }) {
	const [robo, setRobo] = useState(true);
	const [pausa, setPausa] = useState("12");
	return (
		<CartaoConfig
			titulo="WhatsApp e robô"
			descricao="O número atual da locadora roda só pela YCloud, sem app no celular. As respostas da equipe saem pela tela Conversas."
			alterado={!robo || pausa !== "12"}
			aoSalvar={() => {
				marcar(false);
				toast.success("WhatsApp e robô salvos");
			}}
		>
			<Linha rotulo="Número">
				<span className="tabular-nums">{telefone(D.configuracoesExemplo.telefone)}</span>
				<span className="text-muted-foreground">(exemplo) · ligado só à YCloud</span>
			</Linha>
			<Linha rotulo="Robô ligado" ajuda="Desligado, nenhuma conversa vai para o Denis.">
				<Interruptor
					ligado={robo}
					rotulo="Robô ligado"
					aoMudar={(v) => {
						setRobo(v);
						marcar(true);
					}}
				/>
				<span>{robo ? "Ligado" : "Desligado"}</span>
			</Linha>
			<Linha rotulo="Horário de resposta automática">
				<span>24 horas por dia</span>
				<span className="text-muted-foreground">(padrão provisório)</span>
			</Linha>
			<Linha rotulo={<Label htmlFor="cfg-pausa">Pausa quando a equipe responde</Label>} ajuda="Quando alguém responde por Conversas, o robô pausa naquela conversa.">
				<CampoNumero
					id="cfg-pausa"
					valor={pausa}
					aoMudar={(v) => {
						setPausa(v);
						marcar(true);
					}}
					sufixo="h"
				/>
			</Linha>
			<Linha rotulo="Verificação de empresa na Meta">
				<Definir>com o CNPJ do MEI</Definir>
			</Linha>
		</CartaoConfig>
	);
}

function SecaoPrivacidade() {
	return (
		<CartaoConfig titulo="Privacidade" descricao="Quanto tempo cada dado fica guardado. Uma rotina apaga o que venceu e registra o que fez." somenteLeitura>
			<Linha rotulo="Documentos pessoais" ajuda="Documento com foto, selfie e comprovante. Só os donos veem.">
				<Definir>prazo pela LGPD, com advogado</Definir>
			</Linha>
			<Linha rotulo="Contratos e pagamentos">Não se apagam.</Linha>
			<Linha rotulo="Pedidos do titular">Exportar tudo sobre um cliente, corrigir e apagar documentos fora dos prazos legais, com registro.</Linha>
			<Linha rotulo="Robô e documentos">A imagem de documento pedida pelo robô nunca passa pelo modelo de IA.</Linha>
		</CartaoConfig>
	);
}

function SecaoSaude() {
	const agora = useAgora(60_000);
	const min = (m: number) => new Date(agora.getTime() - m * 60_000);
	const itens: { nome: string; tom: "ok" | "atencao" | "neutro"; quando: Date; detalhe: string }[] = [
		{ nome: "WhatsApp (YCloud)", tom: "ok", quando: min(2), detalhe: "último aviso de mensagem" },
		{ nome: "InfinitePay", tom: "ok", quando: min(8), detalhe: "último aviso de pagamento" },
		{ nome: "Autentique", tom: "ok", quando: min(10), detalhe: "último aviso de assinatura" },
		{ nome: "Google Drive", tom: "atencao", quando: min(45), detalhe: "fila com 2 arquivos esperando envio" },
		{ nome: "n8n do servidor", tom: "ok", quando: min(1), detalhe: "último sinal" },
		{ nome: "Cópia do banco", tom: "ok", quando: new Date("2026-10-16T03:00:00-03:00"), detalhe: "cópia diária das 3h" },
	];
	return (
		<CartaoConfig titulo="Saúde das integrações" descricao="O último sinal de cada serviço. Se um parar, o app avisa e nada se perde: a fila espera." somenteLeitura>
			<ul className="flex flex-col divide-y">
				{itens.map((i) => (
					<li key={i.nome} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0">
						<PontoSituacao tom={i.tom} className="w-44">
							{i.nome}
						</PontoSituacao>
						<span className="flex-1 text-muted-foreground text-xs">{i.detalhe}</span>
						<span className="text-xs tabular-nums">{relativa(i.quando, agora)}</span>
					</li>
				))}
			</ul>
			<p className="pt-3 text-muted-foreground text-2xs">Valores de exemplo. As ligações entram na fase 3.</p>
		</CartaoConfig>
	);
}

function SecaoSobre() {
	return (
		<CartaoConfig titulo="Sobre" descricao="Versão do app e créditos." somenteLeitura>
			<Linha rotulo="Versão">Protótipo da fase 0, com dados de exemplo</Linha>
			<Linha rotulo="Créditos">Partes da interface adaptadas de trycompai/crm (licença MIT).</Linha>
			<Linha rotulo="Ícones e fonte">IBM Carbon e Geist.</Linha>
		</CartaoConfig>
	);
}

/* ---------- tela ---------- */

export function TelaConfiguracoes() {
	const estado = useEstadoTela();
	const { offline } = useConexao();
	const [secaoP, definirSecao] = useParametro("secao");
	const secao = (SECOES.some((s) => s.id === secaoP) ? secaoP : "locadora") as Secao;
	const [sujo, setSujo] = useState(false);
	const [versao, setVersao] = useState(0);
	const atual = SECOES.find((s) => s.id === secao) ?? SECOES[0];

	const corpo = (() => {
		const props = { marcar: setSujo };
		switch (secao) {
			case "locadora":
				return <SecaoLocadora key={versao} {...props} />;
			case "equipe":
				return <SecaoEquipe />;
			case "precos":
				return <SecaoPrecos key={versao} {...props} />;
			case "horario":
				return <SecaoHorario key={versao} {...props} />;
			case "etapas":
				return <SecaoEtapas />;
			case "mensagens":
				return <SecaoMensagens />;
			case "pagamentos":
				return <SecaoPagamentos />;
			case "contrato":
				return <SecaoContrato />;
			case "etiquetas":
				return <SecaoEtiquetas key={versao} {...props} />;
			case "whatsapp":
				return <SecaoWhatsapp key={versao} {...props} />;
			case "privacidade":
				return <SecaoPrivacidade />;
			case "saude":
				return <SecaoSaude />;
			default:
				return <SecaoSobre />;
		}
	})();

	return (
		<Pagina>
			<CabecalhoPagina titulo="Configurações" descricao="Ajuste a locadora sem mexer em código. Tudo já vem preenchido; mudar é opcional." />
			<div className="flex flex-col gap-6 md:flex-row md:items-start">
				<nav aria-label="Seções das configurações" className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-56 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0">
					{SECOES.map((s) => (
						<Button
							key={s.id}
							variant={s.id === secao ? "secondary" : "ghost"}
							size="sm"
							aria-current={s.id === secao ? "page" : undefined}
							onClick={() => {
								definirSecao(s.id === "locadora" ? null : s.id);
								setSujo(false);
								setVersao((v) => v + 1);
							}}
							className="shrink-0 justify-start max-md:border max-md:border-border"
						>
							{s.nome}
						</Button>
					))}
				</nav>
				<div className="flex min-w-0 flex-1 flex-col gap-6">
					<h2 className="sr-only">{atual.nome}</h2>
					{estado === "erro" ? (
						<div className="rounded-lg border">
							<EstadoErro frase="Não consegui carregar as configurações." />
						</div>
					) : estado === "carregando" ? (
						<Skeleton className="h-72 rounded-lg" />
					) : (
						corpo
					)}
					<BarraAlteracoes
						aberta={sujo}
						desligado={offline}
						aoDescartar={() => {
							setSujo(false);
							setVersao((v) => v + 1);
						}}
						aoSalvar={() => {
							setSujo(false);
							toast.success("Alterações salvas");
						}}
					/>
				</div>
			</div>
		</Pagina>
	);
}
