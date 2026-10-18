// Lista única de exemplos da Fase 0. Todos os nomes, telefones, documentos e valores são inventados.
// Agora do protótipo: sexta, 16/10/2026, 10:00 (horário de Brasília). Os testes das Fases 1 a 3 usam esta mesma base.

import type { Etapa } from "@/lib/regras/etapas";

export const EXEMPLO = true;

const dois = (n: number) => String(n).padStart(2, "0");
/** Dia de outubro de 2026 (aceita fora do mês, ex.: 31 = 31/10, 33 = 02/11), hora local. */
export function em(dia: number, hora = 0, minuto = 0): Date {
	const base = new Date(`2026-10-01T${dois(hora)}:${dois(minuto)}:00-03:00`);
	return new Date(base.getTime() + (dia - 1) * 86_400_000);
}
const seg = (d: Date, s: number) => new Date(d.getTime() + s * 1000);

/* ---------------------------------------------------------------- tipos */

export type Categoria = "camera" | "lente" | "audio" | "iluminacao" | "suporte" | "acessorio" | "outro";

export const CATEGORIAS: Record<Categoria, string> = {
	camera: "Câmera",
	lente: "Lente",
	audio: "Áudio",
	iluminacao: "Iluminação",
	suporte: "Suporte",
	acessorio: "Acessório",
	outro: "Outro",
};

export type Equipamento = {
	id: number;
	nome: string;
	categoria: Categoria;
	marca: string;
	modelo: string;
	descricao?: string;
	precoDiaria: number;
	valorReposicao: number;
	ativo: boolean;
	arquivadoEm?: Date;
	temFoto: boolean;
};

export type EstadoBanco = "ok" | "em_reparo" | "baixada";

export type Unidade = {
	id: number;
	equipamentoId: number;
	numeroSerie: string | null;
	codigo: string;
	estado: EstadoBanco;
	valorCompra?: number;
	compradaEm?: Date;
	etiquetaImpressaEm?: Date;
	ultimaConferenciaEm?: Date;
	motivoBaixa?: "vendida" | "perdida" | "roubada";
	observacoes?: string;
};

export type AcessorioObrigatorio = { equipamentoId: number; acessorioId: number; quantidade: number };
export type AcessorioExtra = { equipamentoId: number; acessorioId: number };
export type Combinacao = { id: number; cameraId: number; lenteId: number; videoUrl: string | null; temFoto: boolean; observacao?: string };
export type Kit = { id: number; nome: string; descricao: string; componentes: { equipamentoId: number; quantidade: number }[]; ativo: boolean; saidas90d: number };

export type TipoDocumentoPessoal = "documento_foto" | "selfie_documento" | "comprovante_endereco";

export type Cliente = {
	id: number;
	tipo: "pf" | "pj";
	nome: string;
	razaoSocial?: string;
	cpf?: string;
	cnpj?: string;
	telefone: string;
	email?: string;
	dataNascimento?: string;
	endereco?: string;
	cep?: string;
	contatoEmergencia?: { nome: string; telefone: string };
	cadastro: "aguardando" | "aprovado" | "recusado" | "bloqueado";
	motivo?: string;
	contratoGeral?: { modelo: "CG-PF" | "CG-PJ"; versao: string; assinadoEm: Date };
	documentos: { tipo: TipoDocumentoPessoal; recebidoEm: Date }[];
	comoConheceu?: string;
	observacoes?: string;
	origemCampos: Record<string, "robo" | "dono" | "importacao">;
	criadoEm: Date;
	naoQuerMensagens?: boolean;
	arquivadoEm?: Date;
};

export type Contato = {
	id: number;
	clienteId: number;
	nome: string;
	telefone: string;
	email?: string;
	papel: "assina" | "retira" | "outro";
	funcao: string;
	podeRetirar: boolean;
	principal: boolean;
};

export type ModeloOrdem = "OL-Padrão" | "OL-Longo" | "OL-Viagem" | "OL-Alto valor";

export type Reserva = {
	id: number;
	clienteId: number;
	contatoRetiraId?: number;
	etapa: Etapa;
	retiradaEm: Date;
	devolucaoEm: Date;
	criadaEm: Date;
	ordemEnviadaEm?: Date;
	expiraEm?: Date;
	producao?: string;
	cidadeUso?: string;
	foraDoRj: boolean;
	modeloOrdem: ModeloOrdem;
	reservaAnteriorId?: number;
	ordemAssinadaEm?: Date;
	saidaSemAssinaturaMotivo?: string;
	motivoCancelamento?: string;
	observacoes?: string;
	origem: "robo" | "dono";
	separadaEm?: Date;
	saidaEm?: Date;
	voltaEm?: Date;
	encerradaEm?: Date;
};

/** Linha de pedido: o que entra na ordem de locação, com preço congelado. */
export type Linha = {
	reservaId: number;
	equipamentoId: number;
	quantidade: number;
	tipo: "equipamento" | "basico" | "extra";
	kitId?: number;
};

/** Unidade presa na reserva (reserva_itens). */
export type Item = {
	id: number;
	reservaId: number;
	unidadeId: number;
	ativo: boolean;
	naoSaiuMotivo?: string;
};

export type StatusPagamento = "aguardando" | "confirmado" | "divergente" | "a_reembolsar" | "estornado";

export type Pagamento = {
	id: number;
	reservaId: number;
	tipo: "aluguel" | "caucao" | "prorrogacao";
	forma?: "pix" | "cartao";
	parcelas?: number;
	valor: number;
	valorRecebido?: number;
	status: StatusPagamento;
	linkCriadoEm: Date;
	pagoEm?: Date;
	checadoEm?: Date;
	idTransacao?: string;
};

export type Devolucao = {
	id: number;
	pagamentoId: number;
	tipo: "estorno" | "caucao";
	valor: number;
	valorRetido: number;
	motivoRetencao?: string;
	feitoEm: Date;
	feitoPor: string;
};

export type Movimentacao = {
	id: number;
	reservaId?: number;
	unidadeId: number;
	tipo: "saida" | "volta" | "envio_reparo" | "volta_reparo" | "baixa" | "estorno";
	comDano: boolean;
	em: Date;
	feitoPor: string;
	observacao?: string;
};

export type SituacaoManutencao = "aberta" | "na_oficina" | "esperando_peca" | "pronta" | "liberada" | "descartada";
export type TipoDano = "arranhao" | "quebrado" | "falta_peca" | "sujo" | "nao_liga" | "outro";

export type Manutencao = {
	id: number;
	unidadeId: number;
	situacao: SituacaoManutencao;
	tipo: TipoDano;
	problema: string;
	abertaEm: Date;
	oficina?: string;
	custo?: number;
	previsaoVolta?: Date;
	cobrarCliente?: boolean;
	valorCobrado?: number;
	cobrancaDecididaEm?: Date;
	reservaOrigemId?: number;
	encerradaEm?: Date;
};

export type Conversa = {
	id: number;
	telefone: string;
	clienteId?: number;
	nomeExibido: string;
	comQuem: "robo" | "equipe";
	assumidaPor?: string;
	roboSilenciadoAte?: Date;
	silenciadoPor?: string;
	passadaEm?: Date;
	ultimaMsgClienteEm: Date;
	naoLidas: number;
	roboRespondendo?: boolean;
	resumoRobo?: {
		pediu: string;
		datas?: string;
		duvida?: string;
		jaECliente: boolean;
		cadastro: string;
		itens?: { equipamentoId: number; quantidade: number }[];
		retirada?: Date;
		devolucao?: Date;
	};
	documentoEsperado?: TipoDocumentoPessoal;
	reservaId?: number;
};

export type Mensagem = {
	id: number;
	conversaId: number;
	autor: "cliente" | "robo" | "equipe" | "automacao";
	usuario?: string;
	texto: string;
	em: Date;
	status?: "enviado" | "entregue" | "lido" | "falhou";
	anexo?: { tipo: "foto" | "documento"; restrito: boolean; descricao: string };
	modelo?: string;
};

export type Documento = {
	id: number;
	tipo: "contrato_geral" | "ordem_locacao" | "termo_retirada" | "termo_devolucao" | "recibo_locacao" | "recibo_caucao" | "lista_separacao";
	numero: string;
	reservaId?: number;
	clienteId?: number;
	modelo?: string;
	versaoModelo: string;
	enviadoEm?: Date;
	assinadoEm?: Date;
};

export type Evento = {
	id: number;
	em: Date;
	ator: "dono" | "balcao" | "robo" | "automacao" | "integracao" | "cliente";
	quem?: string;
	texto: string;
	reservaId?: number;
	clienteId?: number;
	unidadeId?: number;
	equipamentoId?: number;
	manutencaoId?: number;
};

export type Tarefa = {
	id: number;
	titulo: string;
	venceEm: Date;
	feitaEm?: Date;
	responsavel?: string;
	reservaId?: number;
	clienteId?: number;
	unidadeId?: number;
	manutencaoId?: number;
	origem: "dono" | "automacao" | "robo";
};

export type Execucao = {
	id: number;
	em: Date;
	reservaId?: number;
	clienteId?: number;
	oQueFez: string;
	resultado: "ok" | "erro" | "cancelada" | "simulada";
	motivo?: string;
};

export type Automacao = {
	id: number;
	numero: number;
	nome: string;
	quando: string;
	se?: string;
	entao: string;
	modelo?: string;
	ligada: boolean;
	fase: 2 | 3 | 4;
	tempos?: { rotulo: string; valor: string }[];
	execucoes: Execucao[];
};

export type ModeloMensagem = {
	id: number;
	nome: string;
	descricao: string;
	texto: string;
	situacao: "rascunho" | "aguardando_donos" | "em_analise_ycloud" | "aprovado";
};

/* ---------------------------------------------------------------- catálogo */

export const equipamentos: Equipamento[] = [
	{ id: 1, nome: "FX3", categoria: "camera", marca: "Sony", modelo: "ILME-FX3", descricao: "Câmera de cinema compacta, full frame.", precoDiaria: 350, valorReposicao: 18000, ativo: true, temFoto: true },
	{ id: 2, nome: "FX6", categoria: "camera", marca: "Sony", modelo: "ILME-FX6", precoDiaria: 650, valorReposicao: 38000, ativo: true, temFoto: true },
	{ id: 3, nome: "A7S III", categoria: "camera", marca: "Sony", modelo: "ILCE-7SM3", precoDiaria: 300, valorReposicao: 15000, ativo: true, temFoto: true },
	{ id: 4, nome: "Pocket 6K Pro", categoria: "camera", marca: "Blackmagic", modelo: "BMPCC 6K Pro", precoDiaria: 220, valorReposicao: 11000, ativo: true, temFoto: false },
	{ id: 5, nome: "Komodo 6K", categoria: "camera", marca: "RED", modelo: "Komodo 6K", precoDiaria: 700, valorReposicao: 42000, ativo: true, temFoto: true },
	{ id: 6, nome: "C70", categoria: "camera", marca: "Canon", modelo: "EOS C70", precoDiaria: 450, valorReposicao: 26000, ativo: true, temFoto: false },
	{ id: 7, nome: "Lente 35mm", categoria: "lente", marca: "Sony", modelo: "FE 35mm f/1.4 GM", precoDiaria: 120, valorReposicao: 8000, ativo: true, temFoto: true },
	{ id: 8, nome: "Lente 50mm", categoria: "lente", marca: "Sony", modelo: "FE 50mm f/1.2 GM", precoDiaria: 140, valorReposicao: 11000, ativo: true, temFoto: true },
	{ id: 9, nome: "Lente 85mm", categoria: "lente", marca: "Sony", modelo: "FE 85mm f/1.4 GM", precoDiaria: 130, valorReposicao: 9000, ativo: true, temFoto: true },
	{ id: 10, nome: "Lente 24-70mm", categoria: "lente", marca: "Sony", modelo: "FE 24-70mm f/2.8 GM II", precoDiaria: 160, valorReposicao: 12500, ativo: true, temFoto: true },
	{ id: 11, nome: "Lente 16-35mm", categoria: "lente", marca: "Sony", modelo: "FE 16-35mm f/2.8 GM", precoDiaria: 130, valorReposicao: 10000, ativo: true, temFoto: false },
	{ id: 12, nome: "Lente 70-200mm", categoria: "lente", marca: "Sony", modelo: "FE 70-200mm f/2.8 GM II", precoDiaria: 180, valorReposicao: 15000, ativo: true, temFoto: true },
	{ id: 13, nome: "Lente 18-35mm", categoria: "lente", marca: "Sigma", modelo: "18-35mm f/1.8 Art (EF)", precoDiaria: 90, valorReposicao: 4500, ativo: true, temFoto: false },
	{ id: 14, nome: "Kit de lentes cine", categoria: "lente", marca: "Samyang", modelo: "VDSLR 35/50/85 T1.5", precoDiaria: 220, valorReposicao: 12000, ativo: true, temFoto: false },
	{ id: 15, nome: "Gravador F6", categoria: "audio", marca: "Zoom", modelo: "F6", precoDiaria: 120, valorReposicao: 5500, ativo: true, temFoto: true },
	{ id: 16, nome: "Microfone shotgun", categoria: "audio", marca: "Sennheiser", modelo: "MKE 600", precoDiaria: 60, valorReposicao: 2200, ativo: true, temFoto: false },
	{ id: 17, nome: "Lapela sem fio", categoria: "audio", marca: "Sennheiser", modelo: "EW 112P G4", precoDiaria: 90, valorReposicao: 4800, ativo: true, temFoto: true },
	{ id: 18, nome: "Microfone NTG5", categoria: "audio", marca: "Rode", modelo: "NTG5", precoDiaria: 70, valorReposicao: 3500, ativo: true, temFoto: false },
	{ id: 19, nome: "Wireless GO II", categoria: "audio", marca: "Rode", modelo: "Wireless GO II", precoDiaria: 60, valorReposicao: 2400, ativo: true, temFoto: false },
	{ id: 20, nome: "Refletor 300d", categoria: "iluminacao", marca: "Aputure", modelo: "LS 300d II", precoDiaria: 160, valorReposicao: 6000, ativo: true, temFoto: true },
	{ id: 21, nome: "Refletor 200x", categoria: "iluminacao", marca: "Amaran", modelo: "200x", precoDiaria: 90, valorReposicao: 2800, ativo: true, temFoto: false },
	{ id: 22, nome: "Painel LED", categoria: "iluminacao", marca: "Godox", modelo: "LDX100Bi", precoDiaria: 80, valorReposicao: 2500, ativo: true, temFoto: true },
	{ id: 23, nome: "Refletor Forza 60", categoria: "iluminacao", marca: "Nanlite", modelo: "Forza 60", precoDiaria: 70, valorReposicao: 2200, ativo: true, temFoto: false },
	{ id: 24, nome: "Tripé de luz", categoria: "iluminacao", marca: "Avenger", modelo: "C-stand 40\"", precoDiaria: 20, valorReposicao: 600, ativo: true, temFoto: false },
	{ id: 25, nome: "Rebatedor 5 em 1", categoria: "iluminacao", marca: "Godox", modelo: "110 cm", precoDiaria: 15, valorReposicao: 300, ativo: true, temFoto: false },
	{ id: 26, nome: "Softbox 90 cm", categoria: "iluminacao", marca: "Aputure", modelo: "Light Dome II", precoDiaria: 25, valorReposicao: 500, ativo: true, temFoto: false },
	{ id: 27, nome: "Tripé de vídeo", categoria: "suporte", marca: "Sachtler", modelo: "Flowtech 75", precoDiaria: 120, valorReposicao: 9000, ativo: true, temFoto: true },
	{ id: 28, nome: "Estabilizador RS 3 Pro", categoria: "suporte", marca: "DJI", modelo: "RS 3 Pro", precoDiaria: 150, valorReposicao: 5500, ativo: true, temFoto: true },
	{ id: 29, nome: "Slider", categoria: "suporte", marca: "Edelkrone", modelo: "SliderPLUS", precoDiaria: 80, valorReposicao: 4000, ativo: true, temFoto: false },
	{ id: 30, nome: "Monitor Ninja V", categoria: "suporte", marca: "Atomos", modelo: "Ninja V", precoDiaria: 90, valorReposicao: 4200, ativo: true, temFoto: false },
	{ id: 31, nome: "Bateria NP-FZ100", categoria: "acessorio", marca: "Sony", modelo: "NP-FZ100", precoDiaria: 40, valorReposicao: 450, ativo: true, temFoto: false },
	{ id: 32, nome: "Cartão CFexpress A", categoria: "acessorio", marca: "Sony", modelo: "CEA-G160T 160 GB", precoDiaria: 30, valorReposicao: 1500, ativo: true, temFoto: false },
	{ id: 33, nome: "Bateria V-mount", categoria: "acessorio", marca: "Core SWX", modelo: "Hypercore 150 Wh", precoDiaria: 50, valorReposicao: 1800, ativo: true, temFoto: false },
	{ id: 34, nome: "Follow focus", categoria: "acessorio", marca: "Tilta", modelo: "Nucleus-Nano II", precoDiaria: 40, valorReposicao: 1500, ativo: true, temFoto: false },
	{ id: 35, nome: "Matte box", categoria: "acessorio", marca: "SmallRig", modelo: "Mini", precoDiaria: 35, valorReposicao: 1200, ativo: true, temFoto: false },
	{ id: 36, nome: "Cabo HDMI 2 m", categoria: "acessorio", marca: "Genérico", modelo: "HDMI 2.1", precoDiaria: 10, valorReposicao: 80, ativo: true, temFoto: false },
	{ id: 37, nome: "Bateria BP-U", categoria: "acessorio", marca: "Sony", modelo: "BP-U70", precoDiaria: 40, valorReposicao: 900, ativo: true, temFoto: false },
	{ id: 38, nome: "Cartão SD 128 GB", categoria: "acessorio", marca: "Sandisk", modelo: "Extreme Pro V90", precoDiaria: 15, valorReposicao: 400, ativo: true, temFoto: false },
	{ id: 39, nome: "Bateria LP-E6NH", categoria: "acessorio", marca: "Canon", modelo: "LP-E6NH", precoDiaria: 20, valorReposicao: 350, ativo: true, temFoto: false },
	{ id: 40, nome: "Gaiola antiga", categoria: "acessorio", marca: "SmallRig", modelo: "Cage A7 III", precoDiaria: 20, valorReposicao: 300, ativo: false, arquivadoEm: em(2, 11), temFoto: false },
];

type U = [number, string | null, string, EstadoBanco?, Partial<Unidade>?];
const u0: U[] = [
	[1, "4021", "EQ-1A2B3C4D", "ok", { valorCompra: 10000, compradaEm: em(-180), etiquetaImpressaEm: em(-170) }],
	[1, "4022", "EQ-5E6F7A8B", "ok", { valorCompra: 10500, compradaEm: em(-170), etiquetaImpressaEm: em(-160) }],
	[1, "4023", "EQ-7B8C9D0E", "em_reparo", { valorCompra: 11000, compradaEm: em(-150), etiquetaImpressaEm: em(-140) }],
	[1, "4024", "EQ-2B3C4D5E", "ok", { valorCompra: 11000, compradaEm: em(-120), etiquetaImpressaEm: em(-110) }],
	[1, "4025", "EQ-6C7D8E9F", "ok", { valorCompra: 12000, compradaEm: em(-40) }],
	[2, "FX6-1180", "EQ-3D8A1F02", "ok", { valorCompra: 30000, compradaEm: em(-200), etiquetaImpressaEm: em(-190) }],
	[2, "FX6-1194", "EQ-9B2C7E41", "ok", { valorCompra: 31000, compradaEm: em(-90), etiquetaImpressaEm: em(-80) }],
	[3, "A7S-552", "EQ-4F1E6A93", "ok", { valorCompra: 12000, compradaEm: em(-300), etiquetaImpressaEm: em(-290) }],
	[3, "A7S-608", "EQ-8A3B5C17", "ok", { valorCompra: 12500, compradaEm: em(-240), etiquetaImpressaEm: em(-230) }],
	[4, "BM-2210", "EQ-1C9D4E7A", "ok", { valorCompra: 9000, compradaEm: em(-260), etiquetaImpressaEm: em(-250) }],
	[4, "BM-2297", "EQ-6E2F8A31", "ok", { valorCompra: 9200, compradaEm: em(-210), etiquetaImpressaEm: em(-200) }],
	[5, "KM-0071", "EQ-2A7B9C04", "ok", { valorCompra: 36000, compradaEm: em(-160), etiquetaImpressaEm: em(-150) }],
	[6, "C70-3310", "EQ-5B8C1D62", "ok", { valorCompra: 22000, compradaEm: em(-330), etiquetaImpressaEm: em(-320) }],
	[7, "117", "EQ-0F4A2B8C", "ok", { valorCompra: 7000, compradaEm: em(-280), etiquetaImpressaEm: em(-270) }],
	[7, "118", "EQ-9C0D1E2F", "em_reparo", { valorCompra: 7200, compradaEm: em(-250), etiquetaImpressaEm: em(-240) }],
	[8, "205", "EQ-7D1E3F5A", "ok", { valorCompra: 9500, compradaEm: em(-220), etiquetaImpressaEm: em(-210) }],
	[9, "311", "EQ-4A6B8C0D", "ok", { valorCompra: 8000, compradaEm: em(-230), etiquetaImpressaEm: em(-220) }],
	[9, "312", "EQ-3E5F7A9B", "ok", { valorCompra: 8200, compradaEm: em(-60) }],
	[10, "402", "EQ-8C2D4E6F", "ok", { valorCompra: 11000, compradaEm: em(-190), etiquetaImpressaEm: em(-180) }],
	[10, "409", "EQ-1B3C5D7E", "ok", { valorCompra: 11200, compradaEm: em(-100), etiquetaImpressaEm: em(-95) }],
	[11, "510", "EQ-6F8A0B2C", "ok", { valorCompra: 8800, compradaEm: em(-270), etiquetaImpressaEm: em(-260) }],
	[12, "620", "EQ-5D7E9F1A", "ok", { valorCompra: 13000, compradaEm: em(-140), etiquetaImpressaEm: em(-130) }],
	[13, "SG-77", "EQ-2C4D6E8F", "ok", { valorCompra: 3800, compradaEm: em(-400), etiquetaImpressaEm: em(-390) }],
	[14, "SY-KIT1", "EQ-7A9B1C3D", "ok", { valorCompra: 10000, compradaEm: em(-360), etiquetaImpressaEm: em(-350) }],
	[15, "F6-901", "EQ-0B2C4D6E", "ok", { valorCompra: 4800, compradaEm: em(-210), etiquetaImpressaEm: em(-200) }],
	[16, "MK-31", "EQ-3F5A7B9C", "ok", { valorCompra: 1900, compradaEm: em(-300), etiquetaImpressaEm: em(-290) }],
	[16, "MK-32", "EQ-8E0F2A4B", "ok", { valorCompra: 1900, compradaEm: em(-300), etiquetaImpressaEm: em(-290) }],
	[17, "G4-A", "EQ-1D3E5F7A", "ok", { valorCompra: 4200, compradaEm: em(-180), etiquetaImpressaEm: em(-170) }],
	[17, "G4-B", "EQ-6A8B0C2D", "ok", { valorCompra: 4200, compradaEm: em(-180), etiquetaImpressaEm: em(-170) }],
	[18, "NT-12", "EQ-9F1A3B5C", "ok", { valorCompra: 3000, compradaEm: em(-150), etiquetaImpressaEm: em(-140) }],
	[19, "WG-1", "EQ-4B6C8D0E", "ok", { valorCompra: 2000, compradaEm: em(-120), etiquetaImpressaEm: em(-110) }],
	[19, "WG-2", "EQ-7E9F1A3B", "baixada", { valorCompra: 2000, compradaEm: em(-120), motivoBaixa: "perdida", observacoes: "Não voltou de uma diária em agosto." }],
	[20, "AP-301", "EQ-2D4E6F8A", "ok", { valorCompra: 5200, compradaEm: em(-260), etiquetaImpressaEm: em(-250) }],
	[20, "AP-302", "EQ-5A7B9C1D", "ok", { valorCompra: 5200, compradaEm: em(-260), etiquetaImpressaEm: em(-250) }],
	[21, "AM-11", "EQ-8B0C2D4E", "ok", { valorCompra: 2400, compradaEm: em(-200), etiquetaImpressaEm: em(-190) }],
	[21, "AM-12", "EQ-3C5D7E9F", "em_reparo", { valorCompra: 2400, compradaEm: em(-200), etiquetaImpressaEm: em(-190) }],
	[22, "LD-01", "EQ-A1B2C3D4", "ok", { valorCompra: 2100, compradaEm: em(-220), etiquetaImpressaEm: em(-210) }],
	[22, "LD-02", "EQ-B2C3D4E5", "ok", { valorCompra: 2100, compradaEm: em(-220), etiquetaImpressaEm: em(-210) }],
	[22, "LD-03", "EQ-F7E6D5C4", "ok", { valorCompra: 2100, compradaEm: em(-30) }],
	[23, "FZ-6", "EQ-6D8E0F2A", "ok", { valorCompra: 1900, compradaEm: em(-170), etiquetaImpressaEm: em(-160) }],
	[24, null, "EQ-C3D4E5F6", "ok", { valorCompra: 500, compradaEm: em(-400), etiquetaImpressaEm: em(-390) }],
	[24, null, "EQ-D4E5F6A7", "ok", { valorCompra: 500, compradaEm: em(-400), etiquetaImpressaEm: em(-390) }],
	[24, null, "EQ-9A1B3C5D", "ok", { valorCompra: 500, compradaEm: em(-400), etiquetaImpressaEm: em(-390) }],
	[24, null, "EQ-2E4F6A8B", "ok", { valorCompra: 500, compradaEm: em(-400), etiquetaImpressaEm: em(-390) }],
	[25, null, "EQ-E5F6A7B8", "ok", { valorCompra: 250, compradaEm: em(-380), etiquetaImpressaEm: em(-370) }],
	[25, null, "EQ-F6A7B8C9", "ok", { valorCompra: 250, compradaEm: em(-380), etiquetaImpressaEm: em(-370) }],
	[26, null, "EQ-0C2D4E6F", "ok", { valorCompra: 420, compradaEm: em(-260), etiquetaImpressaEm: em(-250) }],
	[26, null, "EQ-7F9A1B3C", "ok", { valorCompra: 420, compradaEm: em(-260), etiquetaImpressaEm: em(-250) }],
	[27, "SC-75", "EQ-4C6D8E0F", "ok", { valorCompra: 7800, compradaEm: em(-350), etiquetaImpressaEm: em(-340) }],
	[28, "RS3-41", "EQ-1E3F5A7B", "ok", { valorCompra: 4800, compradaEm: em(-160), etiquetaImpressaEm: em(-150) }],
	[28, "RS3-58", "EQ-8D0E2F4A", "ok", { valorCompra: 4800, compradaEm: em(-90), etiquetaImpressaEm: em(-85) }],
	[29, "EK-3", "EQ-5F7A9B1C", "ok", { valorCompra: 3500, compradaEm: em(-310), etiquetaImpressaEm: em(-300) }],
	[30, "NV-81", "EQ-2B4C6D8E", "ok", { valorCompra: 3600, compradaEm: em(-230), etiquetaImpressaEm: em(-220) }],
	[30, "NV-95", "EQ-9E1F3A5B", "ok", { valorCompra: 3600, compradaEm: em(-130), etiquetaImpressaEm: em(-120) }],
	[31, null, "EQ-3A4B5C6D", "ok", { valorCompra: 380, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B1A2C3D4", "ok", { valorCompra: 380, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B2A3C4D5", "ok", { valorCompra: 380, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B3A4C5D6", "ok", { valorCompra: 380, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B4A5C6D7", "ok", { valorCompra: 380, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B5A6C7D8", "ok", { valorCompra: 380, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B6A7C8D9", "ok", { valorCompra: 380, compradaEm: em(-150), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B7A8C9DA", "ok", { valorCompra: 380, compradaEm: em(-150), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B8A9CADB", "ok", { valorCompra: 380, compradaEm: em(-150), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-B9AACBDC", "ok", { valorCompra: 380, compradaEm: em(-150), etiquetaImpressaEm: em(1) }],
	[31, null, "EQ-BAABCCDD", "ok", { valorCompra: 380, compradaEm: em(-20) }],
	[31, null, "EQ-BBACCDDE", "ok", { valorCompra: 380, compradaEm: em(-20) }],
	[32, "CF-1", "EQ-C1D2E3F4", "ok", { valorCompra: 1300, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[32, "CF-2", "EQ-C2D3E4F5", "ok", { valorCompra: 1300, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[32, "CF-3", "EQ-C3D4E5FA", "ok", { valorCompra: 1300, compradaEm: em(-200), etiquetaImpressaEm: em(1) }],
	[32, "CF-4", "EQ-C4D5E6FB", "ok", { valorCompra: 1300, compradaEm: em(-150), etiquetaImpressaEm: em(1) }],
	[32, "CF-5", "EQ-C5D6E7FC", "ok", { valorCompra: 1300, compradaEm: em(-150), etiquetaImpressaEm: em(1) }],
	[32, "CF-6", "EQ-C6D7E8FD", "ok", { valorCompra: 1300, compradaEm: em(-20) }],
	[33, "VM-1", "EQ-D1E2F3A4", "ok", { valorCompra: 1500, compradaEm: em(-160), etiquetaImpressaEm: em(-150) }],
	[33, "VM-2", "EQ-D2E3F4A5", "ok", { valorCompra: 1500, compradaEm: em(-160), etiquetaImpressaEm: em(-150) }],
	[33, "VM-3", "EQ-D3E4F5A6", "ok", { valorCompra: 1500, compradaEm: em(-160), etiquetaImpressaEm: em(-150) }],
	[33, "VM-4", "EQ-D4E5F6A8", "ok", { valorCompra: 1500, compradaEm: em(-160), etiquetaImpressaEm: em(-150) }],
	[34, "TL-1", "EQ-E1F2A3B4", "ok", { valorCompra: 1300, compradaEm: em(-100), etiquetaImpressaEm: em(-95) }],
	[35, "MB-1", "EQ-E2F3A4B5", "ok", { valorCompra: 1000, compradaEm: em(-100), etiquetaImpressaEm: em(-95) }],
	[36, null, "EQ-F1A2B3C4", "ok", { valorCompra: 60, compradaEm: em(-300), etiquetaImpressaEm: em(-290) }],
	[36, null, "EQ-F2A3B4C5", "ok", { valorCompra: 60, compradaEm: em(-300), etiquetaImpressaEm: em(-290) }],
	[37, null, "EQ-A2B3C4D5", "ok", { valorCompra: 800, compradaEm: em(-200), etiquetaImpressaEm: em(-190) }],
	[37, null, "EQ-A3B4C5D6", "ok", { valorCompra: 800, compradaEm: em(-200), etiquetaImpressaEm: em(-190) }],
	[37, null, "EQ-A4B5C6D7", "ok", { valorCompra: 800, compradaEm: em(-90), etiquetaImpressaEm: em(-85) }],
	[37, null, "EQ-A5B6C7D8", "ok", { valorCompra: 800, compradaEm: em(-90), etiquetaImpressaEm: em(-85) }],
	[38, null, "EQ-A6B7C8D9", "ok", { valorCompra: 350, compradaEm: em(-260), etiquetaImpressaEm: em(-250) }],
	[38, null, "EQ-A7B8C9DA", "ok", { valorCompra: 350, compradaEm: em(-260), etiquetaImpressaEm: em(-250) }],
	[39, null, "EQ-A8B9CADB", "ok", { valorCompra: 300, compradaEm: em(-330), etiquetaImpressaEm: em(-320) }],
	[39, null, "EQ-A9BACBDC", "ok", { valorCompra: 300, compradaEm: em(-330), etiquetaImpressaEm: em(-320) }],
];

export const unidades: Unidade[] = u0.map(([equipamentoId, numeroSerie, codigo, estado, extra], i) => ({
	id: i + 1,
	equipamentoId,
	numeroSerie,
	codigo,
	estado: estado ?? "ok",
	ultimaConferenciaEm: i % 7 === 3 ? em(-120) : em(-12 - (i % 20)),
	...extra,
}));

export function unidadePorCodigo(codigo: string): Unidade {
	const x = unidades.find((u) => u.codigo === codigo);
	if (!x) throw new Error(`unidade ${codigo} não existe nos dados de exemplo`);
	return x;
}

export const acessoriosObrigatorios: AcessorioObrigatorio[] = [
	{ equipamentoId: 1, acessorioId: 31, quantidade: 2 },
	{ equipamentoId: 1, acessorioId: 32, quantidade: 1 },
	{ equipamentoId: 3, acessorioId: 31, quantidade: 2 },
	{ equipamentoId: 3, acessorioId: 32, quantidade: 1 },
	{ equipamentoId: 2, acessorioId: 37, quantidade: 2 },
	{ equipamentoId: 2, acessorioId: 32, quantidade: 1 },
	{ equipamentoId: 5, acessorioId: 33, quantidade: 2 },
	{ equipamentoId: 6, acessorioId: 38, quantidade: 1 },
	{ equipamentoId: 4, acessorioId: 38, quantidade: 1 },
	{ equipamentoId: 30, acessorioId: 36, quantidade: 1 },
];

export const acessoriosExtras: AcessorioExtra[] = [
	{ equipamentoId: 1, acessorioId: 31 },
	{ equipamentoId: 1, acessorioId: 32 },
	{ equipamentoId: 3, acessorioId: 31 },
	{ equipamentoId: 2, acessorioId: 37 },
	{ equipamentoId: 5, acessorioId: 33 },
	{ equipamentoId: 1, acessorioId: 34 },
	{ equipamentoId: 1, acessorioId: 35 },
];

export const combinacoes: Combinacao[] = [
	{ id: 1, cameraId: 1, lenteId: 7, videoUrl: "https://youtu.be/exemplo-fx3-35mm", temFoto: true },
	{ id: 2, cameraId: 1, lenteId: 8, videoUrl: "https://youtu.be/exemplo-fx3-50mm", temFoto: true },
	{ id: 3, cameraId: 1, lenteId: 9, videoUrl: "https://youtu.be/exemplo-fx3-85mm", temFoto: false, observacao: "Cena com luz de janela." },
	{ id: 4, cameraId: 1, lenteId: 10, videoUrl: "https://youtu.be/exemplo-fx3-2470", temFoto: true },
	{ id: 5, cameraId: 1, lenteId: 11, videoUrl: null, temFoto: false },
	{ id: 6, cameraId: 1, lenteId: 12, videoUrl: "https://youtu.be/exemplo-fx3-70200", temFoto: false },
	{ id: 7, cameraId: 3, lenteId: 7, videoUrl: "https://youtu.be/exemplo-a7s-35mm", temFoto: false },
	{ id: 8, cameraId: 3, lenteId: 9, videoUrl: "https://youtu.be/exemplo-a7s-85mm", temFoto: true },
	{ id: 9, cameraId: 2, lenteId: 10, videoUrl: "https://youtu.be/exemplo-fx6-2470", temFoto: true },
	{ id: 10, cameraId: 2, lenteId: 11, videoUrl: null, temFoto: false },
];

export const kits: Kit[] = [
	{
		id: 1,
		nome: "Kit entrevista",
		descricao: "Câmera, lente, tripé, áudio e uma luz principal.",
		componentes: [
			{ equipamentoId: 1, quantidade: 1 },
			{ equipamentoId: 10, quantidade: 1 },
			{ equipamentoId: 27, quantidade: 1 },
			{ equipamentoId: 17, quantidade: 1 },
			{ equipamentoId: 15, quantidade: 1 },
			{ equipamentoId: 20, quantidade: 1 },
		],
		ativo: true,
		saidas90d: 11,
	},
	{
		id: 2,
		nome: "Kit luz",
		descricao: "Dois painéis de LED com tripés e um rebatedor.",
		componentes: [
			{ equipamentoId: 22, quantidade: 2 },
			{ equipamentoId: 24, quantidade: 2 },
			{ equipamentoId: 25, quantidade: 1 },
		],
		ativo: true,
		saidas90d: 3,
	},
];

/* ---------------------------------------------------------------- clientes */

const ok = { recebidoEm: em(-60) };
const tresDocs = (d: Date) => [
	{ tipo: "documento_foto" as const, recebidoEm: d },
	{ tipo: "selfie_documento" as const, recebidoEm: d },
	{ tipo: "comprovante_endereco" as const, recebidoEm: d },
];

function pf(id: number, nome: string, telefone: string, extra: Partial<Cliente> = {}): Cliente {
	return {
		id,
		tipo: "pf",
		nome,
		cpf: `000.${String(100 + id).padStart(3, "0")}.${String(200 + id).padStart(3, "0")}-${dois(id % 97)}`,
		telefone,
		email: `${nome.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@exemplo.com`,
		dataNascimento: `${dois((id % 27) + 1)}/${dois((id % 12) + 1)}/${1985 + (id % 12)}`,
		endereco: `Rua Exemplo, ${100 + id * 7}, Rio de Janeiro, RJ`,
		cep: `22${String(700 + id).padStart(3, "0")}-000`,
		contatoEmergencia: { nome: "Contato Exemplo", telefone: `2199${String(id).padStart(3, "0")}0000` },
		cadastro: "aprovado",
		contratoGeral: { modelo: "CG-PF", versao: "v1 (minuta)", assinadoEm: em(-90 + id) },
		documentos: tresDocs(em(-95 + id)),
		origemCampos: { email: "robo", endereco: "robo", dataNascimento: "robo", contatoEmergencia: "robo" },
		criadoEm: em(-100 + id),
		...extra,
	};
}

export const clientes: Cliente[] = [
	pf(1, "Ana Exemplo", "21977770000", { comoConheceu: "Instagram", observacoes: "Prefere retirar no começo da manhã." }),
	pf(2, "Bruno Exemplo", "21955550000"),
	pf(3, "Carla Exemplo", "21988880000", { comoConheceu: "Indicação" }),
	{
		id: 4,
		tipo: "pj",
		nome: "Produtora Exemplo Ltda",
		razaoSocial: "Produtora Exemplo Ltda",
		cnpj: "00.000.000/0001-91",
		telefone: "21966660000",
		email: "contato@exemplo.com",
		endereco: "Rua Exemplo, 100, Botafogo, Rio de Janeiro, RJ",
		cep: "22250-000",
		contatoEmergencia: { nome: "Rita Exemplo", telefone: "21944440000" },
		cadastro: "aguardando",
		documentos: tresDocs(em(16, 8, 40)),
		origemCampos: { razaoSocial: "robo", cnpj: "robo", endereco: "robo", email: "robo", contatoEmergencia: "robo" },
		criadoEm: em(15, 17, 20),
	},
	pf(5, "Daniel Exemplo", "21933330005"),
	pf(6, "Eduarda Exemplo", "21933330006"),
	pf(7, "Felipe Exemplo", "21933330007"),
	pf(8, "Helena Exemplo", "21933330008"),
	pf(9, "Igor Exemplo", "21933330009"),
	pf(10, "Joana Exemplo", "21933330010"),
	pf(11, "Lucas Exemplo", "21933330011"),
	pf(12, "Marina Exemplo", "21933330012"),
	pf(13, "Nina Exemplo", "21933330013"),
	pf(14, "Otávio Exemplo", "21933330014"),
	pf(15, "Paula Exemplo", "21933330015"),
	pf(16, "Rafael Exemplo", "21933330016"),
	pf(17, "Sofia Exemplo", "21933330017"),
	{
		id: 18,
		tipo: "pf",
		nome: "Tiago Exemplo",
		telefone: "21922220018",
		cadastro: "aguardando",
		documentos: [],
		origemCampos: { nome: "robo" },
		criadoEm: em(16, 9, 31),
	},
	{
		id: 19,
		tipo: "pj",
		nome: "Estúdio Exemplo ME",
		razaoSocial: "Estúdio Exemplo ME",
		cnpj: "00.000.000/0002-72",
		telefone: "21922220019",
		email: "estudio@exemplo.com",
		endereco: "Avenida Exemplo, 2000, Barra da Tijuca, Rio de Janeiro, RJ",
		cep: "22640-000",
		contatoEmergencia: { nome: "Contato Exemplo", telefone: "21911110019" },
		cadastro: "aprovado",
		contratoGeral: { modelo: "CG-PJ", versao: "v1 (minuta)", assinadoEm: em(-70) },
		documentos: tresDocs(em(-72)),
		origemCampos: {},
		criadoEm: em(-75),
	},
	{
		id: 20,
		tipo: "pj",
		nome: "Filmes Exemplo Ltda",
		razaoSocial: "Filmes Exemplo Ltda",
		cnpj: "00.000.000/0003-53",
		telefone: "21922220020",
		email: "filmes@exemplo.com",
		endereco: "Rua Exemplo, 45, Laranjeiras, Rio de Janeiro, RJ",
		cep: "22240-000",
		contatoEmergencia: { nome: "Contato Exemplo", telefone: "21911110020" },
		cadastro: "aprovado",
		contratoGeral: { modelo: "CG-PJ", versao: "v1 (minuta)", assinadoEm: em(-40) },
		documentos: tresDocs(em(-41)),
		origemCampos: {},
		criadoEm: em(-45),
	},
	pf(21, "Vitória Exemplo", "21933330021", { cadastro: "recusado", motivo: "Documento ilegível e sem resposta ao novo pedido.", contratoGeral: undefined }),
	pf(22, "Wagner Exemplo", "21933330022", { cadastro: "bloqueado", motivo: "Devolveu com dano e não respondeu à cobrança." }),
	pf(23, "Yara Exemplo", "21933330023"),
	pf(24, "Zeca Exemplo", "21933330024", { naoQuerMensagens: true }),
	{
		id: 25,
		tipo: "pj",
		nome: "Coletivo Exemplo",
		razaoSocial: "Coletivo Exemplo Produções Ltda",
		cnpj: "00.000.000/0004-34",
		telefone: "21922220025",
		email: "coletivo@exemplo.com",
		cadastro: "aprovado",
		contratoGeral: { modelo: "CG-PJ", versao: "v1 (minuta)", assinadoEm: em(-200) },
		documentos: tresDocs(em(-201)),
		origemCampos: {},
		criadoEm: em(-205),
	},
	pf(26, "Bianca Exemplo", "21933330026", {
		cadastro: "aguardando",
		contratoGeral: undefined,
		documentos: [
			{ tipo: "documento_foto", recebidoEm: em(15, 19) },
			{ tipo: "comprovante_endereco", recebidoEm: em(15, 19) },
		],
	}),
	pf(27, "Davi Exemplo", "21933330027"),
	pf(28, "Elisa Exemplo", "21933330028"),
	pf(29, "Fábio Exemplo", "21933330029", { cpf: "000.129.229-29" }),
	pf(30, "Fabio Exemplo", "21933330030", { cpf: "000.129.229-29", cadastro: "aguardando", contratoGeral: undefined, documentos: [] }),
];

void ok;

export const contatos: Contato[] = [
	{ id: 1, clienteId: 4, nome: "Rita Exemplo", telefone: "21944440000", email: "rita@exemplo.com", papel: "assina", funcao: "sócia", podeRetirar: true, principal: true },
	{ id: 2, clienteId: 4, nome: "Bruno Exemplo", telefone: "21955550000", papel: "retira", funcao: "produtor", podeRetirar: true, principal: false },
	{ id: 3, clienteId: 4, nome: "Caio Exemplo", telefone: "21944440003", papel: "outro", funcao: "assistente de câmera", podeRetirar: false, principal: false },
	{ id: 4, clienteId: 19, nome: "Contato Exemplo", telefone: "21911110019", email: "estudio@exemplo.com", papel: "assina", funcao: "dono do estúdio", podeRetirar: true, principal: true },
	{ id: 5, clienteId: 20, nome: "Contato Exemplo", telefone: "21911110020", email: "filmes@exemplo.com", papel: "assina", funcao: "produtora executiva", podeRetirar: true, principal: true },
	{ id: 6, clienteId: 25, nome: "Contato Exemplo", telefone: "21911110025", papel: "assina", funcao: "diretor", podeRetirar: true, principal: true },
];

/* ---------------------------------------------------------------- reservas */

export const reservas: Reserva[] = [
	// Encerradas (histórico)
	{ id: 1032, clienteId: 13, etapa: "encerrada", retiradaEm: em(3, 9), devolucaoEm: em(5, 9), criadaEm: em(1, 15), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(1, 15, 12), saidaEm: em(3, 9, 10), voltaEm: em(5, 8, 50), encerradaEm: em(5, 18) },
	{ id: 1033, clienteId: 14, etapa: "encerrada", retiradaEm: em(5, 14), devolucaoEm: em(13, 14), criadaEm: em(3, 10), foraDoRj: false, modeloOrdem: "OL-Longo", origem: "robo", ordemAssinadaEm: em(3, 10, 15), saidaEm: em(5, 14, 5), voltaEm: em(13, 13, 40), encerradaEm: em(14, 10) },
	{ id: 1034, clienteId: 16, etapa: "encerrada", retiradaEm: em(8, 9), devolucaoEm: em(10, 9), criadaEm: em(6, 11), foraDoRj: true, cidadeUso: "Paraty, RJ", modeloOrdem: "OL-Padrão", origem: "dono", ordemAssinadaEm: em(6, 11, 30), saidaEm: em(8, 9, 15), voltaEm: em(10, 9, 30), encerradaEm: em(10, 17) },
	{ id: 1035, clienteId: 17, etapa: "encerrada", retiradaEm: em(9, 10), devolucaoEm: em(11, 10), criadaEm: em(7, 9), foraDoRj: true, cidadeUso: "São Paulo, SP", modeloOrdem: "OL-Viagem", origem: "robo", ordemAssinadaEm: em(7, 9, 10), saidaEm: em(9, 10, 5), voltaEm: em(11, 9, 55), encerradaEm: em(12, 11) },
	// Devolvida com dano a decidir (lente 35mm não liga)
	{ id: 1030, clienteId: 15, etapa: "devolvida", retiradaEm: em(8, 14), devolucaoEm: em(10, 12), criadaEm: em(6, 16), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(6, 16, 9), saidaEm: em(8, 14, 10), voltaEm: em(10, 11, 50), producao: "Clipe Exemplo", cidadeUso: "Rio de Janeiro, RJ" },
	// Devolvida sem pendência: caução a devolver
	{ id: 1031, clienteId: 1, etapa: "devolvida", retiradaEm: em(13, 9), devolucaoEm: em(14, 9), criadaEm: em(10, 20), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(10, 20, 6), saidaEm: em(13, 9, 5), voltaEm: em(14, 9, 0), producao: "Curta Exemplo", cidadeUso: "Rio de Janeiro, RJ" },
	// Cancelada
	{ id: 1036, clienteId: 12, etapa: "cancelada", retiradaEm: em(19, 9), devolucaoEm: em(20, 9), criadaEm: em(13, 14), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", motivoCancelamento: "Cliente desistiu", ordemAssinadaEm: em(13, 14, 10) },
	// Devolvida hoje, em conferência
	{ id: 1037, clienteId: 11, etapa: "devolvida", retiradaEm: em(14, 10), devolucaoEm: em(16, 10), criadaEm: em(12, 9), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(12, 9, 12), saidaEm: em(14, 10, 10), voltaEm: em(16, 9, 30), producao: "Documentário Exemplo" },
	// Na rua, atrasada
	{ id: 1038, clienteId: 3, etapa: "retirada", retiradaEm: em(14, 9), devolucaoEm: em(15, 17, 30), criadaEm: em(12, 18), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(12, 18, 7), saidaEm: em(14, 9, 10), producao: "Comercial Exemplo", cidadeUso: "Niterói, RJ" },
	// Na rua, devolveu parte (pendente com cliente) e está atrasada
	{ id: 1039, clienteId: 9, etapa: "retirada", retiradaEm: em(13, 9), devolucaoEm: em(15, 18), criadaEm: em(11, 10), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(11, 10, 20), saidaEm: em(13, 9, 5), producao: "Podcast Exemplo" },
	// Expirada: pagou depois do prazo e a peça já estava tomada
	{ id: 1040, clienteId: 3, etapa: "expirada", retiradaEm: em(17, 9), devolucaoEm: em(19, 9), criadaEm: em(15, 9, 40), ordemEnviadaEm: em(15, 9, 41), expiraEm: em(15, 10, 1), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo" },
	// Na rua, saiu hoje cedo
	{ id: 1041, clienteId: 10, etapa: "retirada", retiradaEm: em(16, 9), devolucaoEm: em(19, 9), criadaEm: em(14, 15), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(14, 15, 9), saidaEm: em(16, 9, 5), producao: "Casamento Exemplo" },
	// Separada, sai hoje 11h
	{ id: 1042, clienteId: 1, etapa: "separada", retiradaEm: em(16, 11), devolucaoEm: em(19, 11), criadaEm: em(14, 19), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(14, 19, 8), separadaEm: em(16, 8, 30), producao: "Clipe Exemplo 2", cidadeUso: "Rio de Janeiro, RJ" },
	// Pré-reserva: aluguel pago, caução aguardando; sai hoje 14h
	{ id: 1043, clienteId: 2, etapa: "pre_reserva", retiradaEm: em(16, 14), devolucaoEm: em(17, 12), criadaEm: em(16, 9, 45), ordemEnviadaEm: em(16, 9, 47), expiraEm: em(16, 10, 7), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(16, 9, 50), producao: "Entrevista Exemplo" },
	// Na rua
	{ id: 1044, clienteId: 8, etapa: "retirada", retiradaEm: em(15, 10), devolucaoEm: em(17, 10), criadaEm: em(13, 16), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(13, 16, 5), saidaEm: em(15, 10, 10), producao: "Série Exemplo" },
	// Na rua, volta hoje 18h
	{ id: 1045, clienteId: 19, contatoRetiraId: 4, etapa: "retirada", retiradaEm: em(14, 14), devolucaoEm: em(16, 18), criadaEm: em(12, 11), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "dono", ordemAssinadaEm: em(12, 11, 30), saidaEm: em(14, 14, 20), producao: "Ensaio Exemplo" },
	// Confirmada, cliente novo aguardando aprovação, falta assinar
	{ id: 1046, clienteId: 4, contatoRetiraId: 2, etapa: "confirmada", retiradaEm: em(20, 9), devolucaoEm: em(22, 18), criadaEm: em(16, 8, 30), ordemEnviadaEm: em(16, 8, 32), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", producao: "Comercial Exemplo 2", cidadeUso: "Rio de Janeiro, RJ" },
	// Confirmada, mas a FX3 presa está em reparo
	{ id: 1047, clienteId: 5, etapa: "confirmada", retiradaEm: em(19, 10), devolucaoEm: em(20, 10), criadaEm: em(15, 14), ordemEnviadaEm: em(15, 14, 2), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(15, 14, 9) },
	// Confirmada, sai amanhã e não foi separada
	{ id: 1048, clienteId: 7, etapa: "confirmada", retiradaEm: em(17, 9), devolucaoEm: em(19, 9), criadaEm: em(15, 11), ordemEnviadaEm: em(15, 11, 1), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", ordemAssinadaEm: em(15, 11, 8), producao: "Videoclipe Exemplo" },
	// Orçamentos
	{ id: 1049, clienteId: 1, etapa: "orcamento", retiradaEm: em(20, 9), devolucaoEm: em(22, 9), criadaEm: em(16, 9, 10), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "dono" },
	{ id: 1053, clienteId: 18, etapa: "orcamento", retiradaEm: em(24, 9), devolucaoEm: em(26, 9), criadaEm: em(16, 9, 35), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo" },
	{ id: 1054, clienteId: 20, etapa: "orcamento", retiradaEm: em(27, 9), devolucaoEm: em(34, 9), criadaEm: em(15, 18), foraDoRj: true, cidadeUso: "Belo Horizonte, MG", modeloOrdem: "OL-Viagem", origem: "dono", producao: "Longa Exemplo" },
	// Expirada (a primeira chance da Ana)
	{ id: 1050, clienteId: 1, etapa: "expirada", retiradaEm: em(17, 9), devolucaoEm: em(19, 9), criadaEm: em(16, 8, 58), ordemEnviadaEm: em(16, 9, 0), expiraEm: em(16, 9, 20), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo" },
	// Pré-reserva correndo, segunda chance
	{ id: 1051, clienteId: 1, etapa: "pre_reserva", retiradaEm: em(17, 9), devolucaoEm: em(19, 9), criadaEm: em(16, 9, 52), ordemEnviadaEm: seg(em(16, 9, 52), 41), expiraEm: seg(em(16, 10, 12), 41), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo", reservaAnteriorId: 1050 },
	// Expirou com um pagamento de valor diferente
	{ id: 1052, clienteId: 6, etapa: "expirada", retiradaEm: em(19, 9), devolucaoEm: em(20, 9), criadaEm: em(16, 9, 37), ordemEnviadaEm: em(16, 9, 38), expiraEm: em(16, 9, 58), foraDoRj: false, modeloOrdem: "OL-Padrão", origem: "robo" },
];

const L = (reservaId: number, equipamentoId: number, quantidade = 1, tipo: Linha["tipo"] = "equipamento", kitId?: number): Linha => ({
	reservaId,
	equipamentoId,
	quantidade,
	tipo,
	kitId,
});

export const linhas: Linha[] = [
	L(1032, 3), L(1032, 31, 2, "basico"), L(1032, 32, 1, "basico"), L(1032, 7),
	L(1033, 2), L(1033, 37, 2, "basico"), L(1033, 32, 1, "basico"), L(1033, 10), L(1033, 27),
	L(1034, 1), L(1034, 31, 2, "basico"), L(1034, 32, 1, "basico"), L(1034, 9),
	L(1035, 5), L(1035, 33, 2, "basico"), L(1035, 14),
	L(1030, 1), L(1030, 31, 2, "basico"), L(1030, 32, 1, "basico"), L(1030, 7),
	L(1031, 3), L(1031, 31, 2, "basico"), L(1031, 32, 1, "basico"), L(1031, 9), L(1031, 31, 1, "extra"),
	L(1036, 4), L(1036, 38, 1, "basico"),
	L(1037, 28), L(1037, 30), L(1037, 36, 1, "basico"),
	L(1038, 1), L(1038, 31, 2, "basico"), L(1038, 32, 1, "basico"), L(1038, 8), L(1038, 30), L(1038, 36, 1, "basico"),
	L(1039, 15), L(1039, 17, 2),
	L(1040, 9),
	L(1041, 4), L(1041, 38, 1, "basico"), L(1041, 13),
	L(1042, 1), L(1042, 31, 2, "basico"), L(1042, 32, 1, "basico"), L(1042, 7),
	L(1043, 22, 2, "equipamento", 2), L(1043, 24, 2, "equipamento", 2), L(1043, 25, 1, "equipamento", 2),
	L(1044, 2), L(1044, 37, 2, "basico"), L(1044, 32, 1, "basico"), L(1044, 11), L(1044, 27),
	L(1045, 20, 2), L(1045, 26, 2), L(1045, 24, 2),
	L(1046, 1), L(1046, 31, 2, "basico"), L(1046, 32, 1, "basico"), L(1046, 9), L(1046, 17), L(1046, 15), L(1046, 30), L(1046, 36, 1, "basico"),
	L(1047, 1), L(1047, 31, 2, "basico"), L(1047, 32, 1, "basico"), L(1047, 10),
	L(1048, 3), L(1048, 31, 2, "basico"), L(1048, 32, 1, "basico"), L(1048, 10), L(1048, 31, 1, "extra"),
	L(1049, 1), L(1049, 31, 2, "basico"), L(1049, 32, 1, "basico"), L(1049, 9),
	L(1053, 3), L(1053, 31, 2, "basico"), L(1053, 32, 1, "basico"), L(1053, 7),
	L(1054, 5), L(1054, 33, 2, "basico"), L(1054, 14), L(1054, 27), L(1054, 20, 2),
	L(1050, 1), L(1050, 31, 2, "basico"), L(1050, 32, 1, "basico"),
	L(1051, 1), L(1051, 31, 2, "basico"), L(1051, 32, 1, "basico"),
	L(1052, 12), L(1052, 28),
];

/** Unidades presas por reserva, na ordem das linhas (códigos de etiqueta). */
const presas: Record<number, string[]> = {
	1032: ["EQ-4F1E6A93", "EQ-B1A2C3D4", "EQ-B2A3C4D5", "EQ-C1D2E3F4", "EQ-0F4A2B8C"],
	1033: ["EQ-3D8A1F02", "EQ-A2B3C4D5", "EQ-A3B4C5D6", "EQ-C2D3E4F5", "EQ-8C2D4E6F", "EQ-4C6D8E0F"],
	1034: ["EQ-1A2B3C4D", "EQ-3A4B5C6D", "EQ-B3A4C5D6", "EQ-C3D4E5FA", "EQ-4A6B8C0D"],
	1035: ["EQ-2A7B9C04", "EQ-D1E2F3A4", "EQ-D2E3F4A5", "EQ-7A9B1C3D"],
	1030: ["EQ-6C7D8E9F", "EQ-B4A5C6D7", "EQ-B5A6C7D8", "EQ-C4D5E6FB", "EQ-9C0D1E2F"],
	1031: ["EQ-8A3B5C17", "EQ-B6A7C8D9", "EQ-B7A8C9DA", "EQ-C5D6E7FC", "EQ-3E5F7A9B", "EQ-B8A9CADB"],
	1036: ["EQ-6E2F8A31", "EQ-A6B7C8D9"],
	1037: ["EQ-8D0E2F4A", "EQ-9E1F3A5B", "EQ-F2A3B4C5"],
	1038: ["EQ-1A2B3C4D", "EQ-3A4B5C6D", "EQ-B1A2C3D4", "EQ-C1D2E3F4", "EQ-7D1E3F5A", "EQ-2B4C6D8E", "EQ-F1A2B3C4"],
	1039: ["EQ-0B2C4D6E", "EQ-1D3E5F7A", "EQ-6A8B0C2D"],
	1040: [],
	1041: ["EQ-1C9D4E7A", "EQ-A7B8C9DA", "EQ-2C4D6E8F"],
	1042: ["EQ-2B3C4D5E", "EQ-B2A3C4D5", "EQ-B3A4C5D6", "EQ-C2D3E4F5", "EQ-0F4A2B8C"],
	1043: ["EQ-A1B2C3D4", "EQ-B2C3D4E5", "EQ-C3D4E5F6", "EQ-D4E5F6A7", "EQ-E5F6A7B8"],
	1044: ["EQ-9B2C7E41", "EQ-A4B5C6D7", "EQ-A5B6C7D8", "EQ-C3D4E5FA", "EQ-6F8A0B2C", "EQ-4C6D8E0F"],
	1045: ["EQ-2D4E6F8A", "EQ-5A7B9C1D", "EQ-0C2D4E6F", "EQ-7F9A1B3C", "EQ-9A1B3C5D", "EQ-2E4F6A8B"],
	1046: ["EQ-2B3C4D5E", "EQ-B4A5C6D7", "EQ-B5A6C7D8", "EQ-C4D5E6FB", "EQ-4A6B8C0D", "EQ-6A8B0C2D", "EQ-0B2C4D6E", "EQ-9E1F3A5B", "EQ-F2A3B4C5"],
	1047: ["EQ-7B8C9D0E", "EQ-B6A7C8D9", "EQ-B7A8C9DA", "EQ-C5D6E7FC", "EQ-1B3C5D7E"],
	1048: ["EQ-4F1E6A93", "EQ-B8A9CADB", "EQ-B9AACBDC", "EQ-C6D7E8FD", "EQ-8C2D4E6F", "EQ-BAABCCDD"],
	1049: [],
	1053: [],
	1054: [],
	1050: [],
	1051: ["EQ-5E6F7A8B", "EQ-B4A5C6D7", "EQ-B5A6C7D8", "EQ-C4D5E6FB"],
	1052: ["EQ-5D7E9F1A", "EQ-1E3F5A7B"],
};

export const itens: Item[] = Object.entries(presas).flatMap(([rid, codigos]) =>
	codigos.map((codigo, i) => {
		const reservaId = Number(rid);
		const r = reservas.find((x) => x.id === reservaId);
		const ativo = r ? ["pre_reserva", "confirmada", "separada", "retirada", "devolvida"].includes(r.etapa) : false;
		return { id: reservaId * 100 + i, reservaId, unidadeId: unidadePorCodigo(codigo).id, ativo };
	}),
);

/* ---------------------------------------------------------------- pagamentos */

let pid = 1;
const P = (p: Omit<Pagamento, "id">): Pagamento => ({ id: pid++, ...p });
const confirmado = (reservaId: number, tipo: Pagamento["tipo"], valor: number, forma: "pix" | "cartao", quando: Date, parcelas?: number) =>
	P({ reservaId, tipo, valor, valorRecebido: valor, forma, parcelas, status: "confirmado", linkCriadoEm: new Date(quando.getTime() - 300_000), pagoEm: quando, checadoEm: seg(quando, 4), idTransacao: `IP-${reservaId}-${tipo === "aluguel" ? "A" : tipo === "caucao" ? "C" : "P"}` });

/** Caução de exemplo: R$ 500,00 por pedido (valor real a definir pelo dono). */
export const CAUCAO_EXEMPLO = 500;

export const pagamentos: Pagamento[] = [
	confirmado(1032, "aluguel", 0, "pix", em(1, 15, 14)),
	confirmado(1032, "caucao", CAUCAO_EXEMPLO, "pix", em(1, 15, 15)),
	confirmado(1033, "aluguel", 0, "cartao", em(3, 10, 18), 3),
	confirmado(1033, "caucao", CAUCAO_EXEMPLO, "pix", em(3, 10, 19)),
	confirmado(1034, "aluguel", 0, "pix", em(6, 11, 33)),
	confirmado(1034, "caucao", CAUCAO_EXEMPLO, "pix", em(6, 11, 34)),
	confirmado(1035, "aluguel", 0, "cartao", em(7, 9, 12), 2),
	confirmado(1035, "caucao", CAUCAO_EXEMPLO, "pix", em(7, 9, 14)),
	confirmado(1030, "aluguel", 0, "pix", em(6, 16, 12)),
	confirmado(1030, "caucao", CAUCAO_EXEMPLO, "pix", em(6, 16, 13)),
	confirmado(1031, "aluguel", 0, "pix", em(10, 20, 9)),
	confirmado(1031, "caucao", CAUCAO_EXEMPLO, "pix", em(10, 20, 10)),
	confirmado(1036, "aluguel", 0, "pix", em(13, 14, 12)),
	confirmado(1036, "caucao", CAUCAO_EXEMPLO, "pix", em(13, 14, 13)),
	confirmado(1037, "aluguel", 0, "cartao", em(12, 9, 14), 1),
	confirmado(1037, "caucao", CAUCAO_EXEMPLO, "pix", em(12, 9, 15)),
	confirmado(1038, "aluguel", 0, "pix", em(12, 18, 9)),
	confirmado(1038, "caucao", CAUCAO_EXEMPLO, "pix", em(12, 18, 10)),
	confirmado(1039, "aluguel", 0, "pix", em(11, 10, 22)),
	confirmado(1039, "caucao", CAUCAO_EXEMPLO, "pix", em(11, 10, 23)),
	P({ reservaId: 1040, tipo: "aluguel", forma: "pix", valor: 0, valorRecebido: 0, status: "a_reembolsar", linkCriadoEm: em(15, 9, 41), pagoEm: em(15, 10, 11), checadoEm: seg(em(15, 10, 11), 5), idTransacao: "IP-1040-A" }),
	confirmado(1041, "aluguel", 0, "cartao", em(14, 15, 11), 2),
	confirmado(1041, "caucao", CAUCAO_EXEMPLO, "pix", em(14, 15, 12)),
	confirmado(1042, "aluguel", 0, "pix", em(14, 19, 10)),
	confirmado(1042, "caucao", CAUCAO_EXEMPLO, "pix", em(14, 19, 11)),
	confirmado(1043, "aluguel", 0, "cartao", em(16, 9, 52), 3),
	P({ reservaId: 1043, tipo: "caucao", forma: "pix", valor: CAUCAO_EXEMPLO, status: "aguardando", linkCriadoEm: em(16, 9, 47) }),
	confirmado(1044, "aluguel", 0, "pix", em(13, 16, 7)),
	confirmado(1044, "caucao", CAUCAO_EXEMPLO, "pix", em(13, 16, 8)),
	confirmado(1045, "aluguel", 0, "pix", em(12, 11, 32)),
	confirmado(1045, "caucao", CAUCAO_EXEMPLO, "pix", em(12, 11, 33)),
	confirmado(1046, "aluguel", 0, "cartao", em(16, 8, 36), 4),
	confirmado(1046, "caucao", CAUCAO_EXEMPLO, "pix", em(16, 8, 38)),
	confirmado(1047, "aluguel", 0, "pix", em(15, 14, 5)),
	confirmado(1047, "caucao", CAUCAO_EXEMPLO, "pix", em(15, 14, 6)),
	confirmado(1048, "aluguel", 0, "pix", em(15, 11, 4)),
	confirmado(1048, "caucao", CAUCAO_EXEMPLO, "pix", em(15, 11, 5)),
	P({ reservaId: 1050, tipo: "aluguel", forma: "pix", valor: 0, status: "aguardando", linkCriadoEm: em(16, 9, 0) }),
	P({ reservaId: 1050, tipo: "caucao", forma: "pix", valor: CAUCAO_EXEMPLO, status: "aguardando", linkCriadoEm: em(16, 9, 0) }),
	P({ reservaId: 1051, tipo: "aluguel", forma: "pix", valor: 0, status: "aguardando", linkCriadoEm: seg(em(16, 9, 52), 41) }),
	P({ reservaId: 1051, tipo: "caucao", forma: "pix", valor: CAUCAO_EXEMPLO, status: "aguardando", linkCriadoEm: seg(em(16, 9, 52), 41) }),
	P({ reservaId: 1052, tipo: "aluguel", forma: "pix", valor: 0, valorRecebido: 165, status: "divergente", linkCriadoEm: em(16, 9, 38), pagoEm: em(16, 9, 40), checadoEm: seg(em(16, 9, 40), 6), idTransacao: "IP-1052-A" }),
	P({ reservaId: 1052, tipo: "caucao", forma: "pix", valor: CAUCAO_EXEMPLO, status: "aguardando", linkCriadoEm: em(16, 9, 38) }),
];

export const devolucoes: Devolucao[] = [
	{ id: 1, pagamentoId: 2, tipo: "caucao", valor: CAUCAO_EXEMPLO, valorRetido: 0, feitoEm: em(5, 18), feitoPor: "Xerxes" },
	{ id: 2, pagamentoId: 4, tipo: "caucao", valor: CAUCAO_EXEMPLO, valorRetido: 0, feitoEm: em(13, 10), feitoPor: "Alef" },
	{ id: 3, pagamentoId: 6, tipo: "caucao", valor: 380, valorRetido: 120, motivoRetencao: "Multa de atraso (exemplo)", feitoEm: em(10, 17), feitoPor: "Xerxes" },
	{ id: 4, pagamentoId: 8, tipo: "caucao", valor: CAUCAO_EXEMPLO, valorRetido: 0, feitoEm: em(12, 11), feitoPor: "Xerxes" },
	{ id: 5, pagamentoId: 13, tipo: "estorno", valor: 0, valorRetido: 0, motivoRetencao: "Cancelado mais de 48 h antes: devolução integral", feitoEm: em(13, 18), feitoPor: "Alef" },
	{ id: 6, pagamentoId: 14, tipo: "caucao", valor: CAUCAO_EXEMPLO, valorRetido: 0, feitoEm: em(13, 18), feitoPor: "Alef" },
];

/* ---------------------------------------------------------------- balcão e reparo */

let mid = 1;
const M = (m: Omit<Movimentacao, "id">): Movimentacao => ({ id: mid++, ...m });

function saidaEVolta(reservaId: number, saida?: Date, volta?: Date, quem = "Julia Zuqui", semVolta: string[] = [], comDano: string[] = []): Movimentacao[] {
	return (presas[reservaId] ?? []).flatMap((codigo, i) => {
		const unidadeId = unidadePorCodigo(codigo).id;
		const lista: Movimentacao[] = [];
		if (saida) lista.push(M({ reservaId, unidadeId, tipo: "saida", comDano: false, em: seg(saida, i * 20), feitoPor: quem }));
		if (volta && !semVolta.includes(codigo))
			lista.push(M({ reservaId, unidadeId, tipo: "volta", comDano: comDano.includes(codigo), em: seg(volta, i * 25), feitoPor: quem, observacao: comDano.includes(codigo) ? "Não liga depois da volta." : undefined }));
		return lista;
	});
}

export const movimentacoes: Movimentacao[] = [
	...saidaEVolta(1032, em(3, 9, 10), em(5, 8, 50)),
	...saidaEVolta(1033, em(5, 14, 5), em(13, 13, 40), "Xerxes"),
	...saidaEVolta(1034, em(8, 9, 15), em(10, 9, 30)),
	...saidaEVolta(1035, em(9, 10, 5), em(11, 9, 55)),
	...saidaEVolta(1030, em(8, 14, 10), em(10, 11, 50), "Julia Zuqui", [], ["EQ-9C0D1E2F"]),
	...saidaEVolta(1031, em(13, 9, 5), em(14, 9, 0)),
	...saidaEVolta(1037, em(14, 10, 10), em(16, 9, 30)),
	...saidaEVolta(1038, em(14, 9, 10)),
	...saidaEVolta(1039, em(13, 9, 5), em(15, 17, 40), "Julia Zuqui", ["EQ-1D3E5F7A", "EQ-6A8B0C2D"]),
	...saidaEVolta(1041, em(16, 9, 5)),
	...saidaEVolta(1044, em(15, 10, 10)),
	...saidaEVolta(1045, em(14, 14, 20), undefined, "Alef"),
	M({ unidadeId: unidadePorCodigo("EQ-7B8C9D0E").id, tipo: "envio_reparo", comDano: false, em: em(13, 11), feitoPor: "Xerxes", observacao: "Sujeira no sensor achada na conferência." }),
	M({ unidadeId: unidadePorCodigo("EQ-7E9F1A3B").id, tipo: "baixa", comDano: false, em: em(-50), feitoPor: "Xerxes", observacao: "Perdida." }),
];

export const manutencoes: Manutencao[] = [
	{ id: 47, unidadeId: unidadePorCodigo("EQ-9C0D1E2F").id, situacao: "aberta", tipo: "nao_liga", problema: "Não liga: o foco automático não responde.", abertaEm: em(10, 11, 55), reservaOrigemId: 1030, cobrarCliente: true },
	{ id: 48, unidadeId: unidadePorCodigo("EQ-7B8C9D0E").id, situacao: "na_oficina", tipo: "sujo", problema: "Sensor sujo, manchas na imagem.", abertaEm: em(13, 11), oficina: "Oficina Exemplo", custo: 180, previsaoVolta: em(19, 18) },
	{ id: 45, unidadeId: unidadePorCodigo("EQ-3C5D7E9F").id, situacao: "esperando_peca", tipo: "nao_liga", problema: "Ventoinha parou; luz desliga sozinha depois de alguns minutos.", abertaEm: em(-2, 15), oficina: "Oficina Exemplo", custo: 240, previsaoVolta: em(23, 18) },
	{ id: 41, unidadeId: unidadePorCodigo("EQ-F7E6D5C4").id, situacao: "liberada", tipo: "quebrado", problema: "Trava do suporte quebrada.", abertaEm: em(-2), oficina: "Oficina Exemplo", custo: 60, encerradaEm: em(4), cobrarCliente: false, cobrancaDecididaEm: em(4) },
	{ id: 39, unidadeId: unidadePorCodigo("EQ-1E3F5A7B").id, situacao: "liberada", tipo: "outro", problema: "Atualização de firmware e calibração.", abertaEm: em(-14), custo: 0, encerradaEm: em(-12), cobrarCliente: false, cobrancaDecididaEm: em(-12) },
];

/* ---------------------------------------------------------------- conversas */

export const conversas: Conversa[] = [
	{
		id: 1,
		telefone: "21988880000",
		clienteId: 3,
		nomeExibido: "Carla Exemplo",
		comQuem: "equipe",
		passadaEm: em(16, 9, 38),
		ultimaMsgClienteEm: em(16, 9, 37),
		naoLidas: 2,
		reservaId: 1038,
		resumoRobo: {
			pediu: "Lente 85mm",
			datas: "sáb 17/10 9h → seg 19/10 9h",
			duvida: "Pediu para alugar sem caução.",
			jaECliente: true,
			cadastro: "Aprovado",
			itens: [{ equipamentoId: 9, quantidade: 1 }],
			retirada: em(17, 9),
			devolucao: em(19, 9),
		},
	},
	{ id: 2, telefone: "21955550000", clienteId: 2, nomeExibido: "Bruno Exemplo", comQuem: "robo", ultimaMsgClienteEm: em(16, 9, 58), naoLidas: 0, roboRespondendo: true, reservaId: 1043 },
	{ id: 3, telefone: "21966660000", clienteId: 4, nomeExibido: "Produtora Exemplo Ltda", comQuem: "robo", ultimaMsgClienteEm: em(16, 8, 41), naoLidas: 0, reservaId: 1046 },
	{
		id: 4,
		telefone: "21922220018",
		clienteId: 18,
		nomeExibido: "Tiago Exemplo",
		comQuem: "robo",
		ultimaMsgClienteEm: em(16, 9, 36),
		naoLidas: 0,
		reservaId: 1053,
		resumoRobo: { pediu: "A7S III com Lente 35mm", datas: "sáb 24/10 9h → seg 26/10 9h", jaECliente: false, cadastro: "Sem cadastro", itens: [{ equipamentoId: 3, quantidade: 1 }, { equipamentoId: 7, quantidade: 1 }], retirada: em(24, 9), devolucao: em(26, 9) },
	},
	{ id: 5, telefone: "21933330006", clienteId: 6, nomeExibido: "Eduarda Exemplo", comQuem: "equipe", passadaEm: em(16, 9, 41), ultimaMsgClienteEm: em(16, 9, 44), naoLidas: 1, reservaId: 1052 },
	{ id: 6, telefone: "21933330009", clienteId: 9, nomeExibido: "Igor Exemplo", comQuem: "robo", ultimaMsgClienteEm: em(15, 19, 2), naoLidas: 0, reservaId: 1039 },
	{ id: 7, telefone: "21933330011", clienteId: 11, nomeExibido: "Lucas Exemplo", comQuem: "robo", roboSilenciadoAte: em(16, 21, 31), silenciadoPor: "Julia Zuqui", ultimaMsgClienteEm: em(16, 9, 28), naoLidas: 0, reservaId: 1037 },
	{ id: 8, telefone: "21922220019", clienteId: 19, nomeExibido: "Estúdio Exemplo ME", comQuem: "equipe", assumidaPor: "Alef", ultimaMsgClienteEm: em(16, 8, 12), naoLidas: 0, reservaId: 1045 },
	{ id: 9, telefone: "21977770000", clienteId: 1, nomeExibido: "Ana Exemplo", comQuem: "robo", ultimaMsgClienteEm: em(16, 9, 51), naoLidas: 0, reservaId: 1051 },
	{ id: 10, telefone: "21933330024", clienteId: 24, nomeExibido: "Zeca Exemplo", comQuem: "robo", ultimaMsgClienteEm: em(-52, 15), naoLidas: 0 },
];

let msg = 1;
const T = (conversaId: number, autor: Mensagem["autor"], texto: string, quando: Date, extra: Partial<Mensagem> = {}): Mensagem => ({
	id: msg++,
	conversaId,
	autor,
	texto,
	em: quando,
	status: autor === "cliente" ? undefined : "lido",
	...extra,
});

export const mensagens: Mensagem[] = [
	T(1, "cliente", "oi! tudo bem?", em(16, 9, 30)),
	T(1, "robo", "Oi, Carla! Tudo ótimo. Como posso ajudar?", em(16, 9, 30, )),
	T(1, "cliente", "tem a 85mm pra sábado?", em(16, 9, 33)),
	T(1, "robo", "Tem sim! A Lente 85mm está livre de sábado, 17/10, às 9h até segunda, 19/10, às 9h. O balcão não abre no domingo. Quer que eu monte o pedido?", em(16, 9, 34)),
	T(1, "cliente", "quero. mas consegue fazer sem caução? já alugo aí faz tempo", em(16, 9, 37)),
	T(1, "robo", "Entendo! Essa decisão é da equipe. Já chamei alguém para te responder por aqui, tá bom?", em(16, 9, 38)),
	T(2, "cliente", "paguei o aluguel no cartão", em(16, 9, 55)),
	T(2, "robo", "Recebido! O pagamento do aluguel foi confirmado pela InfinitePay. Falta só a caução, pelo link só Pix da mensagem anterior.", em(16, 9, 56)),
	T(2, "cliente", "beleza, vou pagar agora", em(16, 9, 58)),
	T(3, "robo", "Olá! Para o primeiro aluguel da Produtora Exemplo, preciso da foto do documento, de uma selfie segurando o documento de quem assina e do comprovante de endereço da empresa.", em(16, 8, 20)),
	T(3, "cliente", "[foto recebida: documento com foto]", em(16, 8, 38), { anexo: { tipo: "foto", restrito: true, descricao: "documento com foto" } }),
	T(3, "cliente", "[foto recebida: selfie segurando o documento]", em(16, 8, 39), { anexo: { tipo: "foto", restrito: true, descricao: "selfie segurando o documento" } }),
	T(3, "cliente", "[foto recebida: comprovante de endereço]", em(16, 8, 40), { anexo: { tipo: "foto", restrito: true, descricao: "comprovante de endereço" } }),
	T(3, "cliente", "pronto, mandei tudo", em(16, 8, 41)),
	T(3, "robo", "Obrigado! Recebi os três documentos. O primeiro cadastro passa por uma aprovação rápida da equipe e eu te aviso por aqui.", em(16, 8, 42)),
	T(4, "cliente", "boa tarde, vcs alugam a7s3?", em(16, 9, 31)),
	T(4, "robo", "Boa! Alugamos sim. Para quais datas? Me diz o dia e a hora da retirada e da devolução.", em(16, 9, 31)),
	T(4, "cliente", "sábado dia 24 de manhã até segunda de manhã, com uma 35mm", em(16, 9, 34)),
	T(4, "robo", "A A7S III e a Lente 35mm estão livres nessas datas. Para fechar, preciso de alguns dados. Pode me mandar numa mensagem só:\n1. nome completo\n2. CPF\n3. data de nascimento\n4. e-mail\n5. endereço com CEP\n6. contato de emergência (nome e telefone)\n7. nome da produção e cidade de uso\n8. quem vai retirar\nE, por ser o primeiro aluguel: foto do documento, selfie segurando o documento e comprovante de endereço.", em(16, 9, 35)),
	T(4, "cliente", "Tiago Exemplo, vou mandar o resto já", em(16, 9, 36)),
	T(5, "cliente", "fiz o pix do aluguel", em(16, 9, 40)),
	T(5, "robo", "O valor que chegou é diferente do valor da reserva. Já chamei a equipe para conferir com você.", em(16, 9, 41)),
	T(5, "equipe", "Oi, Eduarda! O pagamento precisa ser do valor total do aluguel, pelo link. Quer que eu reenvie?", em(16, 9, 43), { usuario: "Xerxes" }),
	T(5, "cliente", "achei que dava pra pagar metade agora", em(16, 9, 44)),
	T(6, "automacao", "Oi, Igor! A devolução da reserva 1039 era ontem às 18h e ainda faltam 2 peças. Pode me dizer quando vai trazer?", em(15, 19, 0), { modelo: "devolucao_atrasada" }),
	T(6, "cliente", "foi mal, trago amanhã cedo", em(15, 19, 2)),
	T(6, "robo", "Combinado! Avisei a equipe.", em(15, 19, 3)),
	T(7, "cliente", "deixei tudo no balcão, valeu", em(16, 9, 28)),
	T(7, "equipe", "Recebido, Lucas! Já conferimos e está tudo ok. Obrigada!", em(16, 9, 31), { usuario: "Julia Zuqui" }),
	T(8, "cliente", "dá pra estender até amanhã?", em(16, 8, 12)),
	T(8, "equipe", "Vou ver aqui se as luzes estão livres e já te falo.", em(16, 8, 20), { usuario: "Alef" }),
	T(9, "cliente", "quero de novo a fx3 pra sábado, perdi o prazo antes", em(16, 9, 51)),
	T(9, "robo", "Sem problema! A FX3 ainda está livre. Abri uma nova pré-reserva e te mandei a ordem e os links. Ela vale por 20 minutos e não será renovada.", em(16, 9, 52)),
	T(10, "robo", "Oi, Zeca! Faz tempo que você não aparece. Temos novidades no catálogo. Quer ver?", em(-52, 15), { modelo: "oferta_novo_aluguel" }),
];

/* ---------------------------------------------------------------- documentos, eventos, tarefas */

export const documentos: Documento[] = [
	{ id: 1, tipo: "ordem_locacao", numero: "OL-2026-0042", reservaId: 1046, modelo: "OL-Padrão", versaoModelo: "v1 (minuta)", enviadoEm: em(16, 8, 32) },
	{ id: 2, tipo: "contrato_geral", numero: "CG-2026-0019", clienteId: 4, reservaId: 1046, modelo: "CG-PJ", versaoModelo: "v1 (minuta)", enviadoEm: em(16, 8, 32) },
	{ id: 3, tipo: "ordem_locacao", numero: "OL-2026-0040", reservaId: 1042, modelo: "OL-Padrão", versaoModelo: "v1 (minuta)", enviadoEm: em(14, 19, 2), assinadoEm: em(14, 19, 8) },
	{ id: 4, tipo: "ordem_locacao", numero: "OL-2026-0041", reservaId: 1043, modelo: "OL-Padrão", versaoModelo: "v1 (minuta)", enviadoEm: em(16, 9, 47), assinadoEm: em(16, 9, 50) },
	{ id: 5, tipo: "ordem_locacao", numero: "OL-2026-0036", reservaId: 1038, modelo: "OL-Padrão", versaoModelo: "v1 (minuta)", enviadoEm: em(12, 18, 2), assinadoEm: em(12, 18, 7) },
	{ id: 6, tipo: "termo_retirada", numero: "TR-2026-0031", reservaId: 1038, versaoModelo: "v1", enviadoEm: em(14, 9, 12) },
	{ id: 7, tipo: "ordem_locacao", numero: "OL-2026-0043", reservaId: 1047, modelo: "OL-Padrão", versaoModelo: "v1 (minuta)", enviadoEm: em(15, 14, 2), assinadoEm: em(15, 14, 9) },
	{ id: 8, tipo: "ordem_locacao", numero: "OL-2026-0044", reservaId: 1048, modelo: "OL-Padrão", versaoModelo: "v1 (minuta)", enviadoEm: em(15, 11, 1), assinadoEm: em(15, 11, 8) },
	{ id: 9, tipo: "ordem_locacao", numero: "OL-2026-0045", reservaId: 1051, modelo: "OL-Padrão", versaoModelo: "v1 (minuta)", enviadoEm: seg(em(16, 9, 52), 41) },
	{ id: 10, tipo: "termo_devolucao", numero: "TD-2026-0027", reservaId: 1031, versaoModelo: "v1", enviadoEm: em(14, 8, 50) },
	{ id: 11, tipo: "recibo_locacao", numero: "RL-2026-0030", reservaId: 1031, versaoModelo: "v1", enviadoEm: em(10, 20, 11) },
];

export const eventosExtras: Evento[] = [
	{ id: 1, em: em(16, 8, 30), ator: "robo", texto: "Robô criou a pré-reserva com 9 peças.", reservaId: 1046, clienteId: 4 },
	{ id: 2, em: em(16, 8, 32), ator: "integracao", texto: "Ordem OL-2026-0042 e contrato geral CG-PJ enviados pela Autentique.", reservaId: 1046 },
	{ id: 3, em: em(16, 8, 36), ator: "integracao", texto: "InfinitePay confirmou o aluguel (cartão em 4 vezes). Conferido de novo pelo n8n.", reservaId: 1046 },
	{ id: 4, em: em(16, 8, 38), ator: "integracao", texto: "InfinitePay confirmou a caução (Pix). Conferido de novo pelo n8n.", reservaId: 1046 },
	{ id: 5, em: em(16, 8, 38), ator: "integracao", texto: "Reserva confirmada: aluguel e caução confirmados.", reservaId: 1046 },
	{ id: 6, em: em(16, 8, 40), ator: "robo", texto: "Recebeu os 3 documentos do cliente e pediu aprovação.", clienteId: 4, reservaId: 1046 },
	{ id: 7, em: em(16, 9, 0), ator: "dono", quem: "Alef", texto: "Trocou a unidade de lapela pela EQ-6A8B0C2D.", reservaId: 1046 },
	{ id: 8, em: em(13, 11), ator: "dono", quem: "Xerxes", texto: "Mandou a unidade para reparo: sensor sujo.", unidadeId: unidadePorCodigo("EQ-7B8C9D0E").id, manutencaoId: 48 },
	{ id: 9, em: em(10, 11, 55), ator: "balcao", quem: "Julia Zuqui", texto: "Volta com problema: não liga. Manutenção 47 aberta.", reservaId: 1030, unidadeId: unidadePorCodigo("EQ-9C0D1E2F").id, manutencaoId: 47 },
];

export const tarefas: Tarefa[] = [
	{ id: 1, titulo: "Estornar pela InfinitePay (transação original)", venceEm: em(16, 12), reservaId: 1040, origem: "automacao" },
	{ id: 2, titulo: "Devolver caução por Pix", venceEm: em(15, 9), reservaId: 1031, origem: "automacao" },
	{ id: 3, titulo: "Aprovar cadastro", venceEm: em(16, 12), clienteId: 4, origem: "automacao" },
	{ id: 4, titulo: "Trocar unidade da FX3", venceEm: em(17, 18), reservaId: 1047, origem: "automacao" },
	{ id: 5, titulo: "Ligar para o Igor sobre as lapelas", venceEm: em(16, 9), reservaId: 1039, origem: "dono", responsavel: "Xerxes" },
	{ id: 6, titulo: "Decidir cobrança do dano da lente 35mm", venceEm: em(13, 18), manutencaoId: 47, reservaId: 1030, origem: "automacao" },
];

/* ---------------------------------------------------------------- automações e mensagens prontas */

export const automacoes: Automacao[] = [
	{ id: 1, numero: 1, nome: "Aviso de pré-reserva expirada", quando: "O relógio do banco expirou a pré-reserva", se: "nenhum pagamento chegou", entao: "avisa o cliente que a reserva foi liberada e que ele pode pedir uma nova pré-reserva, que não será renovada; se já era a segunda, chama a equipe", modelo: "reserva_expirada", ligada: true, fase: 3, execucoes: [
		{ id: 1, em: em(16, 9, 21), reservaId: 1050, oQueFez: "Mandou a mensagem reserva_expirada para Ana Exemplo.", resultado: "ok" },
		{ id: 2, em: em(15, 10, 2), reservaId: 1040, oQueFez: "Mandou a mensagem reserva_expirada para Carla Exemplo.", resultado: "ok" },
	] },
	{ id: 2, numero: 2, nome: "Confirmação de pagamento", quando: "Chega o aviso de pagamento da InfinitePay", entao: "consulta a InfinitePay de novo; se valor e reserva batem, confirma o pagamento; com aluguel e caução confirmados, a reserva vira Confirmada e o robô avisa o cliente; se não batem, chama a equipe", ligada: true, fase: 3, execucoes: [
		{ id: 3, em: em(16, 9, 52), reservaId: 1043, oQueFez: "Conferiu com a InfinitePay e confirmou o aluguel. A caução ainda falta.", resultado: "ok" },
		{ id: 4, em: em(16, 9, 40), reservaId: 1052, oQueFez: "Valor diferente na conferência. Não confirmou e chamou a equipe.", resultado: "erro", motivo: "valor recebido diferente do valor da reserva" },
	] },
	{ id: 3, numero: 3, nome: "Pagamento fora do prazo com peça tomada", quando: "O banco responde que é preciso estornar", entao: "abre o alerta, cria a tarefa de estorno pela transação original, explica ao cliente e chama a equipe", modelo: "pagamento_fora_do_prazo", ligada: true, fase: 3, execucoes: [
		{ id: 5, em: em(15, 10, 11), reservaId: 1040, oQueFez: "Criou a tarefa de estorno e avisou Carla Exemplo.", resultado: "ok" },
	] },
	{ id: 4, numero: 4, nome: "Documentos do cliente novo", quando: "Cliente novo enviou os 3 documentos", entao: "cria a tarefa \"Aprovar cadastro\" e avisa a equipe", ligada: true, fase: 3, execucoes: [
		{ id: 6, em: em(16, 8, 40), clienteId: 4, oQueFez: "Criou a tarefa Aprovar cadastro para Produtora Exemplo Ltda.", resultado: "ok" },
	] },
	{ id: 5, numero: 5, nome: "Lembrete de retirada", quando: "Véspera da retirada, às 17h", se: "a reserva está confirmada ou separada", entao: "manda o lembrete ao cliente (hora, endereço, quem retira leva documento); se não estiver separada, avisa a equipe", modelo: "lembrete_retirada", ligada: true, fase: 3, tempos: [{ rotulo: "Horário", valor: "17:00" }], execucoes: [
		{ id: 7, em: em(15, 17), reservaId: 1042, oQueFez: "Mandou o lembrete de retirada para Ana Exemplo.", resultado: "ok" },
		{ id: 8, em: em(15, 17), reservaId: 1036, oQueFez: "Não mandou.", resultado: "cancelada", motivo: "a reserva foi cancelada antes" },
	] },
	{ id: 6, numero: 6, nome: "Lembrete de devolução", quando: "Véspera da devolução, às 17h", se: "a reserva está na rua", entao: "manda o lembrete de devolução", modelo: "lembrete_devolucao", ligada: true, fase: 3, tempos: [{ rotulo: "Horário", valor: "17:00" }], execucoes: [
		{ id: 9, em: em(14, 17), reservaId: 1038, oQueFez: "Mandou o lembrete de devolução para Carla Exemplo.", resultado: "ok" },
		{ id: 10, em: em(15, 17), reservaId: 1045, oQueFez: "Mandou o lembrete de devolução para Estúdio Exemplo ME.", resultado: "ok" },
	] },
	{ id: 7, numero: 7, nome: "Devolução atrasada", quando: "Passou a hora da devolução mais 60 minutos de tolerância", se: "a reserva está na rua", entao: "abre o alerta, o robô avisa o cliente e chama a equipe; o app conta as horas de atraso", modelo: "devolucao_atrasada", ligada: true, fase: 3, tempos: [{ rotulo: "Tolerância", valor: "60 min" }], execucoes: [
		{ id: 11, em: em(15, 18, 31), reservaId: 1038, oQueFez: "Avisou Carla Exemplo e chamou a equipe.", resultado: "ok" },
		{ id: 12, em: em(15, 19), reservaId: 1039, oQueFez: "Avisou Igor Exemplo e chamou a equipe.", resultado: "ok" },
	] },
	{ id: 8, numero: 8, nome: "Peça em reparo com reserva", quando: "Unidade entrou em reparo", se: "ela tem reserva futura", entao: "abre o alerta e cria a tarefa \"Trocar unidade\"", ligada: true, fase: 2, execucoes: [
		{ id: 13, em: em(13, 11), reservaId: 1047, oQueFez: "Criou a tarefa Trocar unidade da FX3.", resultado: "ok" },
	] },
	{ id: 9, numero: 9, nome: "Reparo demorado", quando: "Unidade em reparo há 15 dias", se: "a manutenção ainda está aberta", entao: "abre o alerta e avisa o dono", ligada: true, fase: 2, tempos: [{ rotulo: "Prazo", valor: "15 dias" }], execucoes: [] },
	{ id: 10, numero: 10, nome: "Assinatura pendente", quando: "30 minutos depois de confirmada", se: "falta assinar o contrato geral ou a ordem", entao: "reenvia o link de assinatura da Autentique uma vez", modelo: "assinatura_pendente", ligada: true, fase: 3, tempos: [{ rotulo: "Espera", valor: "30 min" }], execucoes: [
		{ id: 14, em: em(16, 9, 8), reservaId: 1046, oQueFez: "Reenviou o link de assinatura para Produtora Exemplo Ltda.", resultado: "ok" },
	] },
	{ id: 11, numero: 11, nome: "Caução a devolver", quando: "Reserva devolvida sem pendência", entao: "cria a tarefa \"Devolver caução por Pix\", já descontados a multa de atraso ou o dano; ao registrar a devolução, avisa o cliente", modelo: "caucao_devolvida", ligada: true, fase: 3, execucoes: [
		{ id: 15, em: em(14, 9, 1), reservaId: 1031, oQueFez: "Criou a tarefa Devolver caução por Pix.", resultado: "ok" },
	] },
	{ id: 12, numero: 12, nome: "Cliente sumido", quando: "Cliente sem alugar há 60 dias", se: "ele não pediu para parar de receber mensagens", entao: "sugere uma mensagem de retorno para o dono aprovar; só sai com o sim dele", modelo: "oferta_novo_aluguel", ligada: false, fase: 4, tempos: [{ rotulo: "Dias sem alugar", valor: "60" }], execucoes: [] },
	{ id: 13, numero: 13, nome: "Resumo da semana", quando: "Toda segunda, às 8h", entao: "mostra ao dono, no app, as saídas da semana, os atrasos, os reparos e as cauções a devolver", ligada: false, fase: 4, tempos: [{ rotulo: "Dia e hora", valor: "segunda, 08:00" }], execucoes: [] },
];

export const modelosMensagem: ModeloMensagem[] = [
	{ id: 1, nome: "reserva_expirada", descricao: "Pré-reserva expirou sem pagamento", texto: "Oi, {{nome}}! Os 20 minutos da reserva {{reserva}} passaram e as peças foram liberadas. Se ainda quiser, posso abrir uma nova pré-reserva, que não será renovada.", situacao: "aguardando_donos" },
	{ id: 2, nome: "pagamento_fora_do_prazo", descricao: "Pagou depois do prazo e a peça já foi tomada", texto: "Oi, {{nome}}! Seu pagamento chegou depois do prazo e a peça já foi reservada por outra pessoa. O valor será estornado pela InfinitePay, no mesmo meio de pagamento. A equipe vai falar com você.", situacao: "aguardando_donos" },
	{ id: 3, nome: "lembrete_retirada", descricao: "Véspera da retirada", texto: "Oi, {{nome}}! Amanhã às {{hora}} é a retirada da reserva {{reserva}}, em {{endereco}}. Quem retira precisa levar documento com foto.", situacao: "aguardando_donos" },
	{ id: 4, nome: "lembrete_devolucao", descricao: "Véspera da devolução", texto: "Oi, {{nome}}! Amanhã às {{hora}} é a devolução da reserva {{reserva}}. Qualquer coisa, é só responder aqui.", situacao: "aguardando_donos" },
	{ id: 5, nome: "devolucao_atrasada", descricao: "Passou da hora da devolução", texto: "Oi, {{nome}}! A devolução da reserva {{reserva}} era às {{hora}}. Pode me dizer quando vai trazer?", situacao: "aguardando_donos" },
	{ id: 6, nome: "assinatura_pendente", descricao: "Falta assinar", texto: "Oi, {{nome}}! Falta assinar a ordem da reserva {{reserva}}. O link é este: {{link}}", situacao: "rascunho" },
	{ id: 7, nome: "caucao_devolvida", descricao: "Caução devolvida por Pix", texto: "Oi, {{nome}}! A caução da reserva {{reserva}} foi devolvida por Pix: {{valor}}.", situacao: "rascunho" },
	{ id: 8, nome: "oferta_novo_aluguel", descricao: "Cliente sumido há 60 dias", texto: "Oi, {{nome}}! Faz tempo que você não aparece. Temos novidades no catálogo. Quer ver?", situacao: "rascunho" },
];

/* ---------------------------------------------------------------- números para os painéis (exemplo) */

export const faturadoPorMes: { mes: string; valor: number; anterior: number }[] = [
	{ mes: "nov", valor: 9800, anterior: 0 },
	{ mes: "dez", valor: 12400, anterior: 0 },
	{ mes: "jan", valor: 7600, anterior: 0 },
	{ mes: "fev", valor: 10100, anterior: 0 },
	{ mes: "mar", valor: 11800, anterior: 0 },
	{ mes: "abr", valor: 9300, anterior: 0 },
	{ mes: "mai", valor: 13600, anterior: 0 },
	{ mes: "jun", valor: 12900, anterior: 0 },
	{ mes: "jul", valor: 15200, anterior: 0 },
	{ mes: "ago", valor: 14100, anterior: 0 },
	{ mes: "set", valor: 16400, anterior: 0 },
	{ mes: "out", valor: 18400, anterior: 0 },
];

export const configuracoesExemplo = {
	nome: "Monochroma",
	endereco: null as string | null,
	telefone: "21900000000",
	horasFolga: 12,
	minutosPreReserva: 20,
	toleranciaMin: 60,
	horasPorDiaria: 24,
	cancelamentoGratisHoras: 48,
	cancelamentoRetencaoPct: 50,
	multaPctHora: null as number | null,
	caucaoPedido: null as number | null,
	valorAltoValor: null as number | null,
	horarioBalcao: [
		{ dia: "segunda", abre: "09:00", fecha: "18:00" },
		{ dia: "terça", abre: "09:00", fecha: "18:00" },
		{ dia: "quarta", abre: "09:00", fecha: "18:00" },
		{ dia: "quinta", abre: "09:00", fecha: "18:00" },
		{ dia: "sexta", abre: "09:00", fecha: "18:00" },
		{ dia: "sábado", abre: "09:00", fecha: "13:00" },
		{ dia: "domingo", abre: null as string | null, fecha: null as string | null },
	],
	feriados: [
		{ data: em(12), descricao: "Nossa Senhora Aparecida" },
		{ data: em(33), descricao: "Finados" },
		{ data: em(46), descricao: "Proclamação da República" },
		{ data: em(51), descricao: "Dia da Consciência Negra" },
		{ data: em(86), descricao: "Natal" },
	],
};
