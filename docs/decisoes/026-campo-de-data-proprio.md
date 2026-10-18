# 026 · Campo de data próprio

**Data:** 18/10/2026

## Contexto
Seção 8.6: datas em `dd/mm/aaaa`. O campo de data e hora do navegador segue o idioma do navegador: num Chrome em inglês ele mostra mês/dia/ano e AM/PM. As capturas da conferência saíram assim no Montador.

## Opções
1. Manter o campo do navegador e pedir que o navegador esteja em português.
2. Usar o calendário do pacote (seção 8.4, "calendário com intervalo e hora") num campo próprio.

## Decisão
Opção 2. `componentes/ui/campo-data.tsx` tem `CampoDataHora` (dia no calendário + hora de 30 em 30 minutos) e `CampoData` (só o dia). Mostram "sáb, 17/10/2026" e "09:00" em qualquer navegador. O valor guardado continua no formato do campo do navegador (`2026-10-17T09:00`), então as regras de preço e de horário do balcão não mudaram.

## Consequências
- Trocados os 12 campos de data do app: Montador, ficha da reserva (prorrogar), Agenda ("Está livre?" e "Prorrogar ou mudar período"), "Livre entre" do Catálogo e o simulador das Configurações.
- Nos campos que olham para a frente, os dias antes de hoje ficam bloqueados no calendário.
- No celular, os dias do calendário têm 44 px de toque.
