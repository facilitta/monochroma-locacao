# Programa de estoque e aluguéis da Monochroma

App interno dos donos (Xerxes e Alef) e do balcão (Julia Zuqui): clientes, conversas, reservas, pagamentos e o estoque (catálogo, unidades com etiqueta, agenda, balcão, manutenção, etiquetas).

**Situação: Fase 0, protótipo visual com dados de exemplo.** Ainda não há banco nem login. As telas leem `prototipo/dados.ts` e `prototipo/consultas.ts`, que imitam as funções e visões do banco `locacao`. Na Fase 1 troca-se só a fonte de dados.

## Rodar no Mac

Precisa do Node 22 (versão de longo suporte; o Next.js 16 pede 20.9 ou mais). Para ver a versão: `node -v`.

```
cd ~/Claude/servidor/projetos/locacao/programa-estoque
npm install
npm run dev
```

Abra http://localhost:3000. Parâmetros úteis no endereço (só no protótipo):

| Parâmetro | Efeito |
|---|---|
| `?papel=balcao` ou `?papel=dono` | Ver como a Julia (balcão) ou como dono |
| `?tema=escuro` ou `?tema=claro` | Forçar o tema |
| `?estado=vazio`, `carregando` ou `erro` | Ver os estados da tela |
| `?internet=nao` | Simular a falta de internet |
| `?relogio=parado` | Congelar o relógio em sexta, 16/10/2026, 10:00 |

O menu do usuário (foto no canto superior direito) também troca o papel e o tema.

## Protótipo em arquivo único

```
npm run prototipo:arquivo-unico
```

Gera `prototipo/vite/dist/index.html`, uma página só, com tudo dentro, para abrir no navegador ou publicar. É a mesma interface: só o módulo de navegação muda (`prototipo/vite/navegacao.tsx`).

## Conferência da Fase 0

Na primeira vez, instale o navegador de teste: `npx playwright install chromium`.

```
npm run prototipo:arquivo-unico
npx vite preview --config prototipo/vite/vite.config.ts &
BASE=http://127.0.0.1:4173/ npm run conferir:fase0
```

Gera as 80 capturas em `../docs/capturas/fase-0/` e o resultado em `testes/fase0/saida/`.

## Pastas

| Pasta | O que tem |
|---|---|
| `app/` | Rotas do Next.js; `app/globals.css` é o único arquivo com cores, raios e sombras (tokens) |
| `componentes/ui/` | Pacote único de visual (adaptado de trycompai/crm) |
| `componentes/estrutura/` | Casca: trilho, cabeçalho, barra inferior, busca, fichas |
| `componentes/fichas/` | Fichas laterais de cada tipo de registro |
| `telas/` | Uma tela por arquivo |
| `lib/` | Regras (etapas, estados, respostas do banco), formatos, papel, navegação |
| `prototipo/` | Dados de exemplo, consultas e o build de arquivo único |
| `testes/fase0/` | Conferência automática dos critérios de aceite |

Créditos: `LICENSES/trycompai-crm-MIT.txt` e `THIRD_PARTY_NOTICES.md`.
