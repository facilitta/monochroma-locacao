# 021 · Protótipo em arquivo único

**Data:** 18/10/2026

## Contexto
Fase 0: o Alef precisa abrir o protótipo no computador e no celular sem instalar nada.

## Opções
Ver contexto.

## Decisão
As telas são componentes React que funcionam no Next.js e também num build de arquivo único (Vite + vite-plugin-singlefile), publicado como página privada. Só o módulo lib/navegacao.tsx muda entre os dois (no arquivo único, a rota vai no parâmetro "tela").

## Consequências
Os componentes são os definitivos. As capturas e os testes de contraste rodam sobre o arquivo único, que é a mesma interface.
