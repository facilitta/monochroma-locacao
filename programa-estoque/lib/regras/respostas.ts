// Tradução das respostas do banco. Nenhuma resposta aparece crua na tela (seção 8.6).
import type { Tom } from "@/lib/regras/situacao";

export type Resposta = { frase: string; acao?: string; tom: Tom };

const RESPOSTAS: Record<string, Resposta> = {
	INDISPONIVEL: { frase: "Essa peça já foi reservada por outra pessoa.", acao: "Escolher outra unidade ou outra data", tom: "erro" },
	FORA_DO_HORARIO: { frase: "Esse horário está fora do horário do balcão.", acao: "Escolher outro horário", tom: "atencao" },
	EQUIPAMENTO_INATIVO: { frase: "Esse equipamento está arquivado ou desativado.", acao: "Escolher outro equipamento", tom: "erro" },
	CLIENTE_BLOQUEADO: { frase: "Este cliente está bloqueado.", acao: "Chamar o dono", tom: "erro" },
	NOVA_CHANCE_USADA: { frase: "A segunda pré-reserva já foi usada.", acao: "Passar para a equipe", tom: "atencao" },
	APROVACAO_DA_EQUIPE: { frase: "Alto valor e viagem juntos: a equipe aprova antes de enviar.", acao: "Aprovar envio", tom: "atencao" },
	CONFIRMADA: { frase: "Pagamento confirmado pela InfinitePay.", tom: "ok" },
	CONFIRMADA_APOS_PRAZO: { frase: "Pagou depois dos 20 minutos, e a peça ainda estava livre. Reserva confirmada.", tom: "ok" },
	REEMBOLSAR: { frase: "Pagou depois do prazo e a peça já foi tomada. Estorne pela InfinitePay.", acao: "Estornar na transação original", tom: "erro" },
	PAGAMENTO_DIVERGENTE: { frase: "Na conferência, o valor ou a reserva não bateram.", acao: "Ver pagamento", tom: "erro" },
	STATUS_INVALIDO: { frase: "Esta reserva não aceita pagamento nesta etapa.", tom: "erro" },
	PAGAMENTO_NAO_VERIFICADO: { frase: "Aluguel ou caução ainda não confirmados pelo sistema.", acao: "Chamar o dono", tom: "erro" },
	CLIENTE_NAO_APROVADO: { frase: "Cliente novo aguardando aprovação.", acao: "Ver documentos", tom: "atencao" },
	FALTA_ASSINATURA: { frase: "Falta assinar o contrato geral ou a ordem.", acao: "Reenviar link", tom: "atencao" },
	FALTA_LER: { frase: "Ainda falta ler peças desta reserva.", acao: "Ler as que faltam", tom: "atencao" },
	LIDA: { frase: "Conferido.", tom: "ok" },
	JA_CONFERIDA: { frase: "Esta etiqueta já foi conferida.", tom: "info" },
	NAO_E_DESTA_RESERVA: { frase: "Esta peça não é desta reserva.", tom: "erro" },
	OUTRA_UNIDADE_MESMO_MODELO: { frase: "Outra unidade do mesmo modelo. Trocar por esta?", acao: "Trocar", tom: "atencao" },
	VOLTA_OK: { frase: "Voltou ok.", tom: "ok" },
	VOLTA_COM_DANO: { frase: "Voltou com problema. Manutenção aberta.", tom: "atencao" },
	ETIQUETA_NAO_ENCONTRADA: { frase: "Não achei essa etiqueta.", acao: "Digitar o código", tom: "erro" },
	NAO_E_DESTE_CLIENTE: { frase: "Essa reserva é de outro cliente.", tom: "erro" },
	ESCOLHER_CLIENTE: { frase: "Este telefone está em mais de um cliente.", acao: "Perguntar para qual produtora é o pedido", tom: "info" },
};

export function traduzir(codigo: string): Resposta {
	const [base] = codigo.split(":");
	return RESPOSTAS[base] ?? { frase: "Não consegui concluir. Tente de novo.", tom: "erro" };
}
