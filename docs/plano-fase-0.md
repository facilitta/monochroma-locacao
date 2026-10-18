# Plano da Fase 0: protótipo visual clicável

> 18/10/2026. Sem banco. Termina com o "aprovado" do Alef em `relatorio-fase-0.md`.

## Entregas
1. As 20 telas da seção 7, navegáveis, com os dados de `prototipo/dados.ts`: trilho, fichas, abas, quadro arrastável, agenda, balcão com leitura simulada (e câmera real quando houver).
2. Temas claro e escuro, em 1440 px e 390 px.
3. `/prototipo/linguagem-visual`, com os três grupos de cor em cor e em escala de cinza.
4. Tela de papéis (`/prototipo/papeis`): dono (Xerxes e Alef) e balcão (Julia Zuqui), com o financeiro escondido.
5. `docs/modelo.md` com o diagrama de entidades.
6. Capturas em `docs/capturas/fase-0/<tela>-<tema>-<largura>.png` e relatório.
7. Versão clicável publicada como página privada, para abrir no computador e no celular.

## Ordem
1. Leitura do prompt, do repositório de referência (trycompai/crm) e do app de admissão; resumo e dúvidas ao Alef.
2. Base: tokens (8.2, 8.3), pacote único de componentes (`componentes/ui/`), casca (trilho, cabeçalho, barra inferior, busca Ctrl/Cmd+K, alertas), tabela padrão, ficha lateral com pilha, dados e consultas de exemplo.
3. Telas em cinco frentes paralelas, sobre a mesma base:
   - Reservas: quadro e tabela, ficha da reserva, montador, manutenção.
   - Atendimento: Hoje, Conversas, Alertas, Balcão.
   - Estoque: Catálogo, Unidades, Kits.
   - Agenda e equipamento: Agenda, ficha do equipamento, Etiquetas.
   - Gestão: ficha do cliente, Pagamentos, Painéis, Automações, Configurações, linguagem visual, papéis, índice do protótipo.
4. Integração, conferência automática e correções.
5. Publicação, relatório e pacote da pasta.

## Riscos
| Risco | Como tratar |
|---|---|
| Frentes paralelas criarem visuais diferentes | Um só pacote de componentes e tokens; regras escritas para todas; revisão final por captura |
| Contraste com o novo destaque magenta | Tons de foco e link separados, conferidos pelo axe nas 80 combinações |
| Alvos de toque pequenos no celular | Regra global de 44 px em `app/globals.css` para botões e alvos marcados |
| Máquina de trabalho com 2 núcleos | Um só servidor de desenvolvimento compartilhado; capturas finais sobre o arquivo único |

## Como cada critério de aceite é verificado (`testes/fase0/conferir.mjs`)
| Critério | Verificação |
|---|---|
| 80 capturas sem erro no console | Playwright abre cada tela nas 4 combinações, salva a captura e registra erros do console |
| Zero falhas de contraste AA | axe-core (regra color-contrast) em cada uma das 80 combinações |
| 390 px: sem rolagem lateral, alvos ≥ 44 px (48 no balcão), campos ≥ 16 px | Medição no navegador de `scrollWidth`, das caixas dos elementos clicáveis e do tamanho da fonte dos campos |
| Nenhuma cor, raio ou sombra fora dos tokens | Busca no código (fora de `app/globals.css`) por cores literais, `rgb(`, `oklch(`, `color-mix`, `shadow-[` e `rounded-[` |
| Linguagem visual em escala de cinza distinguível | Captura da página com filtro de cinza; cada item tem forma, ícone e texto (conferido no DOM) |
| Palavras proibidas | Varredura do texto visível de todas as telas por palavras em inglês, termos técnicos e respostas cruas do banco |
| Balcão sem financeiro | Todas as telas abertas como balcão: nenhum "R$" no texto visível; Pagamentos e Painéis fora do trilho |
| Aprovação | O Alef escreve "aprovado" no relatório |
