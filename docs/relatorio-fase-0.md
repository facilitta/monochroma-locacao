# Relatório da Fase 0: protótipo visual clicável

> 18/10/2026. Sem banco, sem login e sem robô: só o visual, com dados inventados.
> Termina com o "aprovado" do Alef no fim deste arquivo. Pedido de ajuste vira nova rodada da Fase 0.

## Como abrir

- **No computador ou no celular, sem instalar nada:** a página **"Protótipo Monochroma"**, publicada na conta do Alef no Claude (privada até ele compartilhar). Comece pelo índice (menu da foto, no canto de cima → "Índice do protótipo").
- **No Mac:** `programa-estoque/LEIAME.md` explica como rodar (`npm install` e `npm run dev`).
- O relógio do protótipo está parado em **sexta, 16/10/2026, 10:00**, para as telas baterem com os dados de exemplo.
- Para ver como a Julia (balcão): menu da foto → "Protótipo: ver como" → Julia Zuqui.

## 1. O que ficou pronto

**As 20 telas da seção 7**, navegáveis, com os dados de `prototipo/dados.ts` (40 equipamentos, 90 unidades, 30 clientes, 25 reservas em todas as etapas, 10 conversas):

| # | Tela | O que dá para fazer no protótipo |
|---|---|---|
| 7.1 | Hoje | Ver o que sai, o que volta e o que precisa do dono; agir no alerta sem sair da tela |
| 7.2 | Conversas | Ler a conversa do robô, assumir, devolver ao robô, responder com resposta pronta |
| 7.3 | Reservas | Quadro por etapa (arrastar entre etapas) e tabela com filtros, recortes e exportação |
| 7.4 | Ficha da reserva | Régua de etapas, itens, pagamentos, documentos, histórico; motivo da saída bloqueada |
| 7.5 | Clientes | Lista com situação do cadastro, recortes, busca sem acento |
| 7.6 | Ficha do cliente | Aprovar cadastro, ver documentos, reservas, conversas; edição no lugar com "Desfazer" |
| 7.7 | Pagamentos | O que a InfinitePay confirmou, cauções, estornos, valores divergentes |
| 7.8 | Painéis | Faturamento por mês, quanto cada peça já rendeu, peças paradas, atrasos |
| 7.9 | Automações | Ligar e desligar cada automação, ver a última execução e os textos prontos |
| 7.10 | Configurações | Ajustes da locadora já preenchidos com os padrões; o que falta aparece como "a definir" |
| 7.11 | Catálogo | Cada modelo com unidades livres agora e uso |
| 7.12 | Ficha do equipamento | Unidades, agenda, vídeos de teste câmera + lente, pacote básico, retorno |
| 7.13 | Unidades | Cada peça física, com estado (livre, separada, na rua, atrasada, em reparo…) |
| 7.14 | Kits, pacote básico e extras | O que sai junto, o que é cobrado à parte e o que falta para montar |
| 7.15 | Agenda | Linha do tempo por unidade com folga de 12 h e reparo hachurado; no celular, "Está livre?" |
| 7.16 | Montador de pedido | Cliente, período, itens livres no período, preço e modelo de ordem calculados |
| 7.17 | Balcão | Saída e volta por leitura de etiqueta (simulada), com "ok" ou "com dano" e foto |
| 7.18 | Manutenção | Quadro de reparo com aviso de 15 dias e de reserva marcada para a peça |
| 7.19 | Etiquetas | Prévia em tamanho real com QR e código `EQ-XXXXXXXX`, seleção em lote |
| 7.20 | Alertas | Todos os alertas abertos, com a ação de cada um |

**Também pronto:**

- Temas claro e escuro, em 1440 px (computador) e 390 px (celular). O balcão abre no escuro por padrão (decisão 024).
- `/prototipo/linguagem-visual`: os três grupos de cor (etapa, situação, estado da unidade) lado a lado, em cor e em escala de cinza. Cada grupo tem forma própria: etapa é quadradinho + nome; situação é selo com ícone; estado da unidade é pílula com contorno.
- `/prototipo/papeis`: o que o dono (Xerxes e Alef) e o balcão (Julia Zuqui) veem, com troca de papel.
- `/prototipo`: índice das telas e dos cinco estados de cada tela (vazio, carregando, erro, sem internet, sem permissão).
- Cor de destaque magenta tirada do logo do Instagram (#C4427F), com tons próprios para link e foco que passam no contraste (decisão 022).
- Busca de registros e ações com Ctrl/Cmd + K; "?" mostra os atalhos.
- `docs/modelo.md`: diagrama de entidades do banco `locacao` (o que existe na 001 e 002 e o que as migrações 003 em diante acrescentam).
- `docs/plano-fase-0.md`, `docs/pendencias.md` e 26 decisões em `docs/decisoes/`.
- Campo de data próprio, com calendário e hora de 30 em 30 minutos: mostra `dd/mm/aaaa` e 24 horas em qualquer navegador (decisão 026).
- Os componentes do protótipo são os definitivos: nas próximas fases troca-se só a fonte dos dados.

### Conferência automática (`npm run conferir:fase0`)

| Critério | Resultado |
|---|---|
| 20 telas × 2 temas × 2 larguras → 80 capturas sem erro no console | **80 capturas, 0 com erro** |
| Contraste AA (axe) nas 80 combinações | **Zero falhas** |
| 390 px: rolagem lateral | **Nenhuma** |
| 390 px: alvos de toque abaixo de 44 px (48 px no balcão) | **Nenhum** |
| 390 px: campos com letra abaixo de 16 px | **Nenhum** |
| Cor, raio ou sombra fora de `app/globals.css` | **Zero** |
| Linguagem visual em escala de cinza: item sem forma, ícone ou texto | **Nenhum** |
| Palavras proibidas e respostas cruas do banco na tela | **Zero** |
| Todas as telas abertas como balcão: algum "R$" na tela | **Nenhum** (Pagamentos, Painéis, Automações, Configurações, Kits e Montador mostram "Esta tela é só do dono.") |
| Pagamentos e Painéis no menu do balcão | **Não aparecem** |

Conferência extra, como Julia no celular (tema escuro, que é o padrão dela), com cada aba das fichas de reserva e de cliente: **Nenhum R$** em 19 telas e fichas (todas as abas); o Balcão abriu no escuro (`testes/fase0/balcao-celular.mjs`).

O resultado completo está em `docs/conferencia-fase-0.json`.

## 2. O que não ficou e por quê

- **Nada está ligado de verdade.** Banco, login com Google, robô, InfinitePay, Autentique e Drive entram nas Fases 1 a 3. Todo botão que "grava" só muda a tela e mostra o aviso.
- **Câmera no balcão:** funciona no app rodando no Mac (endereço local) e, depois, no servidor com cadeado (HTTPS). Na página publicada, a câmera é bloqueada pela própria página; por isso há "Simular leitura" e "Digitar código".
- **Imprimir e baixar PDF:** na página publicada esses botões não fazem nada (a página não pode abrir a impressão nem baixar arquivos). No app rodando no Mac, "Imprimir" abre a impressão do navegador. Os PDFs de verdade (etiquetas em lote, ordem de locação) são feitos pelo servidor nas Fases 1 e 2.
- **Logo:** redesenhado a partir da imagem do Instagram. Fica provisório até chegar o arquivo original.
- **Cor "Na rua":** é um rosa próximo do destaque magenta. Passa no contraste e tem forma própria (pílula com ícone), mas, se incomodar, dá para mudar o tom na Fase 1.

## 3. O que precisa do Alef (ou do Xerxes)

1. **Abrir o protótipo e responder:** "aprovado" ou a lista de ajustes. Só depois disso começa a Fase 1.
2. **Colocar a pasta no Mac:** descompactar o pacote entregue em `~/Claude/servidor/projetos/locacao/` (cria `docs/` e preenche `programa-estoque/`, substituindo o `LEIAME.md` vazio que já estava lá). O Claude só conseguiu ler o Mac, não gravar.
3. **Arquivo original do logo** (SVG ou PNG grande), para fechar as cores.
4. **Para a Fase 1, os itens que mais pesam** (lista completa em `docs/pendencias.md`):
   - valor da caução (fixo por pedido, porcentagem ou por faixa);
   - porcentagem da diária por hora de atraso e se tem teto;
   - endereço e horário do balcão;
   - planilha de equipamentos e fotos para o cadastro inicial;
   - modelo da folha adesiva das etiquetas;
   - valor que define "alto valor" nas ordens de locação.
5. **Julia e o Montador de pedido:** hoje ela não abre Kits nem o Montador, porque os dois mostram preço. Se ela precisar montar pedido no balcão, faço uma versão do Montador sem valores (o cliente recebe o valor pelo link, como sempre).
6. **Confirmar as 5 propostas para as contradições da base** (`docs/pendencias.md`, seção 3). Elas entram nas migrações novas da Fase 1, sem reescrever a 001 e a 002.

## Capturas

Pasta `docs/capturas/fase-0/`, no formato `<tela>-<tema>-<largura>.png`.

| Tela | Claro 1440 | Claro 390 | Escuro 1440 | Escuro 390 |
|---|---|---|---|---|
| 7.1 Hoje | [ver](capturas/fase-0/hoje-claro-1440.png) | [ver](capturas/fase-0/hoje-claro-390.png) | [ver](capturas/fase-0/hoje-escuro-1440.png) | [ver](capturas/fase-0/hoje-escuro-390.png) |
| 7.2 Conversas | [ver](capturas/fase-0/conversas-claro-1440.png) | [ver](capturas/fase-0/conversas-claro-390.png) | [ver](capturas/fase-0/conversas-escuro-1440.png) | [ver](capturas/fase-0/conversas-escuro-390.png) |
| 7.3 Reservas | [ver](capturas/fase-0/reservas-claro-1440.png) | [ver](capturas/fase-0/reservas-claro-390.png) | [ver](capturas/fase-0/reservas-escuro-1440.png) | [ver](capturas/fase-0/reservas-escuro-390.png) |
| 7.4 Ficha da reserva | [ver](capturas/fase-0/ficha-reserva-claro-1440.png) | [ver](capturas/fase-0/ficha-reserva-claro-390.png) | [ver](capturas/fase-0/ficha-reserva-escuro-1440.png) | [ver](capturas/fase-0/ficha-reserva-escuro-390.png) |
| 7.5 Clientes | [ver](capturas/fase-0/clientes-claro-1440.png) | [ver](capturas/fase-0/clientes-claro-390.png) | [ver](capturas/fase-0/clientes-escuro-1440.png) | [ver](capturas/fase-0/clientes-escuro-390.png) |
| 7.6 Ficha do cliente | [ver](capturas/fase-0/ficha-cliente-claro-1440.png) | [ver](capturas/fase-0/ficha-cliente-claro-390.png) | [ver](capturas/fase-0/ficha-cliente-escuro-1440.png) | [ver](capturas/fase-0/ficha-cliente-escuro-390.png) |
| 7.7 Pagamentos | [ver](capturas/fase-0/pagamentos-claro-1440.png) | [ver](capturas/fase-0/pagamentos-claro-390.png) | [ver](capturas/fase-0/pagamentos-escuro-1440.png) | [ver](capturas/fase-0/pagamentos-escuro-390.png) |
| 7.8 Painéis | [ver](capturas/fase-0/paineis-claro-1440.png) | [ver](capturas/fase-0/paineis-claro-390.png) | [ver](capturas/fase-0/paineis-escuro-1440.png) | [ver](capturas/fase-0/paineis-escuro-390.png) |
| 7.9 Automações | [ver](capturas/fase-0/automacoes-claro-1440.png) | [ver](capturas/fase-0/automacoes-claro-390.png) | [ver](capturas/fase-0/automacoes-escuro-1440.png) | [ver](capturas/fase-0/automacoes-escuro-390.png) |
| 7.10 Configurações | [ver](capturas/fase-0/configuracoes-claro-1440.png) | [ver](capturas/fase-0/configuracoes-claro-390.png) | [ver](capturas/fase-0/configuracoes-escuro-1440.png) | [ver](capturas/fase-0/configuracoes-escuro-390.png) |
| 7.11 Catálogo | [ver](capturas/fase-0/catalogo-claro-1440.png) | [ver](capturas/fase-0/catalogo-claro-390.png) | [ver](capturas/fase-0/catalogo-escuro-1440.png) | [ver](capturas/fase-0/catalogo-escuro-390.png) |
| 7.12 Ficha do equipamento | [ver](capturas/fase-0/ficha-equipamento-claro-1440.png) | [ver](capturas/fase-0/ficha-equipamento-claro-390.png) | [ver](capturas/fase-0/ficha-equipamento-escuro-1440.png) | [ver](capturas/fase-0/ficha-equipamento-escuro-390.png) |
| 7.13 Unidades | [ver](capturas/fase-0/unidades-claro-1440.png) | [ver](capturas/fase-0/unidades-claro-390.png) | [ver](capturas/fase-0/unidades-escuro-1440.png) | [ver](capturas/fase-0/unidades-escuro-390.png) |
| 7.14 Kits | [ver](capturas/fase-0/kits-claro-1440.png) | [ver](capturas/fase-0/kits-claro-390.png) | [ver](capturas/fase-0/kits-escuro-1440.png) | [ver](capturas/fase-0/kits-escuro-390.png) |
| 7.15 Agenda | [ver](capturas/fase-0/agenda-claro-1440.png) | [ver](capturas/fase-0/agenda-claro-390.png) | [ver](capturas/fase-0/agenda-escuro-1440.png) | [ver](capturas/fase-0/agenda-escuro-390.png) |
| 7.16 Montador de pedido | [ver](capturas/fase-0/montador-claro-1440.png) | [ver](capturas/fase-0/montador-claro-390.png) | [ver](capturas/fase-0/montador-escuro-1440.png) | [ver](capturas/fase-0/montador-escuro-390.png) |
| 7.17 Balcão | [ver](capturas/fase-0/balcao-claro-1440.png) | [ver](capturas/fase-0/balcao-claro-390.png) | [ver](capturas/fase-0/balcao-escuro-1440.png) | [ver](capturas/fase-0/balcao-escuro-390.png) |
| 7.18 Manutenção | [ver](capturas/fase-0/manutencao-claro-1440.png) | [ver](capturas/fase-0/manutencao-claro-390.png) | [ver](capturas/fase-0/manutencao-escuro-1440.png) | [ver](capturas/fase-0/manutencao-escuro-390.png) |
| 7.19 Etiquetas | [ver](capturas/fase-0/etiquetas-claro-1440.png) | [ver](capturas/fase-0/etiquetas-claro-390.png) | [ver](capturas/fase-0/etiquetas-escuro-1440.png) | [ver](capturas/fase-0/etiquetas-escuro-390.png) |
| 7.20 Alertas | [ver](capturas/fase-0/alertas-claro-1440.png) | [ver](capturas/fase-0/alertas-claro-390.png) | [ver](capturas/fase-0/alertas-escuro-1440.png) | [ver](capturas/fase-0/alertas-escuro-390.png) |

Extras: `linguagem-visual-claro-1440.png`, `linguagem-visual-escuro-1440.png`, `linguagem-visual-escala-de-cinza-1440.png`, `papeis-*-1440.png`, `prototipo-*-1440.png` e as telas abertas como Julia (`hoje-balcao-claro-1440.png`, `balcao-balcao-claro-1440.png`).

## Aprovação

Escreva abaixo "aprovado" ou os ajustes:

> 
