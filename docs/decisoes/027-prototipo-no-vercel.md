# 027 · Protótipo no Vercel

**Data:** 18/10/2026

## Contexto
As instruções do projeto deixavam o Vercel fora da locação, porque o plano grátis não permite uso comercial. Em 18/10 o Alef pediu para colocar o protótipo da Fase 0 no Vercel grátis da conta dele (time Facilitta).

## Opções
1. Só a página publicada no Claude (sem câmera, impressão nem exportação).
2. Protótipo também no Vercel, ligado a um repositório no GitHub.

## Decisão
Opção 2, pedida pelo Alef. Repositório privado `facilitta/monochroma-locacao`; projeto `monochroma-locacao` no Vercel, com `programa-estoque` como pasta raiz. Endereço: https://monochroma-locacao.vercel.app. Cada envio para a ramificação `main` atualiza o endereço sozinho.

## Consequências
- Só para ver o protótipo com dados de exemplo. O app de verdade, com banco, login e dados de clientes, continua indo para o servidor próprio (decisões 012 e 013).
- O endereço pede login do Vercel (proteção padrão do projeto). Quem não é do time Facilitta não abre, a menos que a proteção seja desligada.
- Fica valendo a observação do plano grátis: uso para revisão, não para operar a locadora.
