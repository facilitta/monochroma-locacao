# Pendências e padrões provisórios

> Atualizado em 18/10/2026, na Fase 0. A lista oficial do projeto é `3-PENDENCIAS.md`; este arquivo acompanha o código.
> Nada aqui trava o trabalho: onde há padrão, ele vale até o Alef ou o Xerxes decidir.

## 1. Perguntas da seção 16 (feitas uma vez, em 18/10)

| # | Pergunta | Padrão em uso | Resposta |
|---|---|---|---|
| 1 | Multa por hora de atraso: % da diária por hora? Tem teto? | O app só calcula as horas de atraso e avisa o dono | — |
| 2 | Valor da caução: fixo por pedido, % do valor ou por faixa? | Campo vazio e aviso; o protótipo usa R$ 500,00 só como exemplo | — |
| 3 | Prazo para devolver a caução | Até 24 horas (sugestão) | — |
| 4 | Preço por semana, por mês, combos e promoções | Só diária | — |
| 5 | Taxa do cartão no cancelamento: quem paga? | [A DEFINIR] | — |
| 6 | Endereço e horário de retirada e devolução | Seg a sex 9h–18h, sáb 9h–13h; endereço vazio | — |
| 7 | Planilha de equipamentos e fotos | Modelo de planilha a montar; dados de exemplo no protótipo | — |
| 8 | Folha adesiva das etiquetas (modelo Pimaco) | A4 adesiva genérica | — |
| 9 | Arquivo do logo | **Parcial (18/10):** perfil do Instagram enviado. Destaque magenta #C4427F e logo redesenhado, provisório | Falta o arquivo original |
| 10 | Contas: InfinitePay, YCloud, Autentique, Workspace | Ambientes de teste | — |
| 11 | Textos das mensagens prontas | Rascunhos em `modelos_mensagem`, situação "aguardando os donos" | — |
| 12 | Provedor do servidor e domínio | Decidir na Fase 4 | — |
| 13 | Modelos de contrato, valor de "alto valor", questionário, advogado | Modelos listados; "alto valor" vazio, então nenhuma ordem cai em OL-Alto valor | — |
| 14 | Prazos de guarda pela LGPD | [A DEFINIR] | — |
| 15 | Contador: locação no MEI e limite anual | [A DEFINIR] | — |
| 16 | Mudança de período para valor menor | O caso fica com a equipe | — |

## 2. Dúvidas do passo 1 (18/10)

| Dúvida | Resposta do Alef |
|---|---|
| Chat sem acesso ao Mac | Mac ligado às 17:53. A base foi lida (001, 002 e pilares), só leitura |
| Admissão em Vite + Supabase | Ele deixou o Supabase por custo com vários projetos. Código não copiado (decisão 014) |
| Documentos de empresa no 1º aluguel | "Depois". Padrão: documento e selfie de quem assina + comprovante de endereço da empresa; contrato social não é pedido |
| Balcão no tema escuro | Escuro por padrão; ele muda depois se quiser (decisão 024) |

## 3. Contradições entre a base e o prompt (para a Fase 1)

1. **`pagamentos` × link da InfinitePay.** Na 001, `id_transacao`, `pago_em` e `conferido_por` são obrigatórios. Um link ainda não pago não tem nenhum dos três. Proposta: a 009 solta as três exigências e cria uma regra que as cobra só em `confirmado`, `a_reembolsar` e `estornado`.
2. **Caução por equipamento × por pedido.** A 001 tem `equipamentos.valor_caucao` e `catalogo_disponivel` (002) devolve esse valor ao robô. Proposta: a coluna fica sem uso; o robô passa a receber a caução do `calcular_preco`.
3. **Pasta do robô.** No disco está `projetos/locacao/ponte-ycloud/`; o prompt manda `n8n/`. Proposta: criar `n8n/` na Fase 3 e deixar `ponte-ycloud/` vazia até o Alef apagar.
4. **`reservas.valor_total`** (001) soma aluguel e caução. Com a caução em pagamento separado, a coluna perde o sentido de "valor a pagar num link só". Proposta: manter, sem uso nas telas.
5. **Pilares.** Ainda descrevem comprovante lido pela IA, caução "conforme o catálogo" e atraso como diária extra. Atualização prevista na Fase 3.

## 4. Padrões provisórios (números que o prompt dá como padrão)

| Onde | Valor provisório |
|---|---|
| Folga entre aluguéis | 12 h (configurável) |
| Pré-reserva | 20 min; 2 min se a ordem não sair |
| Tolerância na devolução | 60 min |
| Cancelamento | grátis até 48 h; depois 50% |
| Prazo de resposta ao cliente (alerta 2) | 15 min no horário do balcão |
| Aviso de reparo demorado | 15 dias |
| Cliente sumido | 60 dias sem alugar |
| Equipamento parado | 60 dias sem aluguel |
| Lembretes de retirada e devolução | véspera, 17h |
| Reenvio do link de assinatura | 30 min depois de confirmada |
| Resumo da semana | segunda, 8h |
| Pausa do robô quando a equipe responde | 12 h |
| Ficha de sessão do robô | 30 min |
| Volume para dimensionar | 500 unidades, 3.000 reservas por ano, 3 pessoas ao mesmo tempo |
| Linhas por página | 25 (Catálogo: 50) |
| Aviso "Salvo · Desfazer" | 6 s |
| Recarga de reserva das telas | 15 s |
