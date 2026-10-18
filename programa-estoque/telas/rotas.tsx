"use client";
// Mapa de rotas usado pela versão de arquivo único do protótipo. No Next.js, cada rota tem o seu page.tsx em app/(app)/.

import type { ComponentType } from "react";
import { TelaAgenda } from "@/telas/agenda";
import { TelaAlertas } from "@/telas/alertas";
import { TelaAutomacoes } from "@/telas/automacoes";
import { TelaBalcao } from "@/telas/balcao";
import { TelaCatalogo } from "@/telas/catalogo";
import { TelaClientes } from "@/telas/clientes";
import { TelaConfiguracoes } from "@/telas/configuracoes";
import { TelaConversas } from "@/telas/conversas";
import { TelaEtiquetas } from "@/telas/etiquetas";
import { TelaHoje } from "@/telas/hoje";
import { TelaKits } from "@/telas/kits";
import { TelaLinguagemVisual } from "@/telas/linguagem-visual";
import { TelaManutencao } from "@/telas/manutencao";
import { TelaPagamentos } from "@/telas/pagamentos";
import { TelaPaineis } from "@/telas/paineis";
import { TelaPapeis } from "@/telas/papeis";
import { TelaPedidoNovo } from "@/telas/pedido-novo";
import { TelaPrototipo } from "@/telas/prototipo";
import { TelaReservas } from "@/telas/reservas";
import { TelaUnidades } from "@/telas/unidades";

export const ROTAS: Record<string, ComponentType> = {
	"/hoje": TelaHoje,
	"/conversas": TelaConversas,
	"/reservas": TelaReservas,
	"/clientes": TelaClientes,
	"/pagamentos": TelaPagamentos,
	"/paineis": TelaPaineis,
	"/automacoes": TelaAutomacoes,
	"/configuracoes": TelaConfiguracoes,
	"/catalogo": TelaCatalogo,
	"/unidades": TelaUnidades,
	"/kits": TelaKits,
	"/agenda": TelaAgenda,
	"/pedido/novo": TelaPedidoNovo,
	"/balcao": TelaBalcao,
	"/manutencao": TelaManutencao,
	"/etiquetas": TelaEtiquetas,
	"/alertas": TelaAlertas,
	"/prototipo": TelaPrototipo,
	"/prototipo/linguagem-visual": TelaLinguagemVisual,
	"/prototipo/papeis": TelaPapeis,
};
