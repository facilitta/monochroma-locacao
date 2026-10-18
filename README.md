# Monochroma · locação

Pasta `projetos/locacao/` do servidor: o app interno de aluguéis e estoque e a documentação.

| Pasta | O que tem |
|---|---|
| `programa-estoque/` | O app (Next.js). Como rodar: `programa-estoque/LEIAME.md` |
| `docs/` | Plano, decisões, pendências, diagrama do banco, capturas e relatório de cada fase |

**Situação:** Fase 0, protótipo visual com dados de exemplo (sem banco, sem login). O relatório está em `docs/relatorio-fase-0.md`.

**Vercel:** só para ver o protótipo no navegador. O projeto do Vercel usa `programa-estoque` como pasta raiz. O app de verdade, com banco e login, roda no servidor próprio (decisões 012 e 013).

No Mac, a base do banco (`banco/`) e os pilares do robô (`agente/`) ficam nesta mesma pasta e entram neste repositório quando a Fase 1 começar.

Nunca suba `.env` nem dado real de cliente.
