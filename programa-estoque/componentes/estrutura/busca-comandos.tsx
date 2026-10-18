"use client";
// Ctrl/Cmd+K: busca registros e ações. "?" mostra os atalhos de teclado.

import Add from "@carbon/icons-react/es/Add";
import Camera from "@carbon/icons-react/es/Camera";
import Scan from "@carbon/icons-react/es/Scan";
import Tag from "@carbon/icons-react/es/Tag";
import Task from "@carbon/icons-react/es/Task";
import UserAvatar from "@carbon/icons-react/es/UserAvatar";
import Calendar from "@carbon/icons-react/es/Calendar";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "@/componentes/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Icon } from "@/componentes/ui/icon";
import { useNavegar } from "@/lib/navegacao";
import { usePapel } from "@/lib/papel";
import { semAcento, somenteDigitos, telefone } from "@/lib/formatos";
import * as D from "@/prototipo/dados";
import { useEffect, useMemo, useState } from "react";

export function BuscaComandos() {
	const [aberta, setAberta] = useState(false);
	const [atalhos, setAtalhos] = useState(false);
	const [termo, setTermo] = useState("");
	const navegar = useNavegar();
	const { ehDono } = usePapel();

	useEffect(() => {
		const aoTeclar = (e: KeyboardEvent) => {
			const alvo = e.target as HTMLElement | null;
			const digitando = alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setAberta((v) => !v);
			} else if (e.key === "?" && !digitando) {
				setAtalhos(true);
			}
		};
		window.addEventListener("keydown", aoTeclar);
		return () => window.removeEventListener("keydown", aoTeclar);
	}, []);

	const ir = (href: string) => {
		setAberta(false);
		setTermo("");
		navegar(href);
	};

	const t = semAcento(termo);
	const dig = somenteDigitos(termo);
	const resultados = useMemo(() => {
		if (t.length < 2) return { clientes: [], reservas: [], equipamentos: [], unidades: [] };
		return {
			clientes: D.clientes.filter((c) => semAcento(c.nome).includes(t) || (dig.length >= 4 && c.telefone.includes(dig))).slice(0, 5),
			reservas: D.reservas.filter((r) => String(r.id).includes(dig || "-")).slice(0, 5),
			equipamentos: D.equipamentos.filter((e) => semAcento(`${e.nome} ${e.marca} ${e.modelo}`).includes(t)).slice(0, 5),
			unidades: D.unidades.filter((u) => semAcento(u.codigo).replace("eq-", "").includes(t.replace(/^eq-?/, "")) || (u.numeroSerie && semAcento(u.numeroSerie).includes(t))).slice(0, 5),
		};
	}, [t, dig]);

	return (
		<>
			<CommandDialog open={aberta} onOpenChange={setAberta} title="Busca" description="Busque um registro ou uma ação">
				<CommandInput placeholder="Buscar cliente, reserva, equipamento, etiqueta ou ação…" value={termo} onValueChange={setTermo} />
				<CommandList>
					<CommandEmpty>Nada encontrado.</CommandEmpty>
					<CommandGroup heading="Ações">
						{ehDono ? (
							<CommandItem onSelect={() => ir("/pedido/novo")}>
								<Icon icon={Add} />
								Nova reserva
							</CommandItem>
						) : null}
						<CommandItem onSelect={() => ir("/agenda?livre=sim")}>
							<Icon icon={Calendar} />
							Está livre?
						</CommandItem>
						<CommandItem onSelect={() => ir("/balcao")}>
							<Icon icon={Scan} />
							Abrir balcão
						</CommandItem>
					</CommandGroup>
					{resultados.reservas.length ? (
						<CommandGroup heading="Reservas">
							{resultados.reservas.map((r) => (
								<CommandItem key={r.id} value={`reserva ${r.id}`} onSelect={() => ir(`/reservas?ficha=reserva:${r.id}`)}>
									<Icon icon={Task} />
									Reserva {r.id}
									<CommandShortcut>{D.clientes.find((c) => c.id === r.clienteId)?.nome}</CommandShortcut>
								</CommandItem>
							))}
						</CommandGroup>
					) : null}
					{resultados.clientes.length ? (
						<CommandGroup heading="Clientes">
							{resultados.clientes.map((c) => (
								<CommandItem key={c.id} value={`cliente ${c.nome} ${c.telefone}`} onSelect={() => ir(`/clientes?ficha=cliente:${c.id}`)}>
									<Icon icon={UserAvatar} />
									{c.nome}
									<CommandShortcut>{telefone(c.telefone)}</CommandShortcut>
								</CommandItem>
							))}
						</CommandGroup>
					) : null}
					{resultados.equipamentos.length ? (
						<CommandGroup heading="Equipamentos">
							{resultados.equipamentos.map((e) => (
								<CommandItem key={e.id} value={`equipamento ${e.nome} ${e.marca}`} onSelect={() => ir(`/catalogo?ficha=equipamento:${e.id}`)}>
									<Icon icon={Camera} />
									{e.nome}
									<CommandShortcut>{e.marca}</CommandShortcut>
								</CommandItem>
							))}
						</CommandGroup>
					) : null}
					{resultados.unidades.length ? (
						<CommandGroup heading="Etiquetas">
							{resultados.unidades.map((u) => (
								<CommandItem key={u.id} value={`etiqueta ${u.codigo}`} onSelect={() => ir(`/unidades?ficha=unidade:${u.id}`)}>
									<Icon icon={Tag} />
									<span className="font-mono">{u.codigo}</span>
									<CommandShortcut>{D.equipamentos.find((e) => e.id === u.equipamentoId)?.nome}</CommandShortcut>
								</CommandItem>
							))}
						</CommandGroup>
					) : null}
				</CommandList>
			</CommandDialog>
			<Dialog open={atalhos} onOpenChange={setAtalhos}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Atalhos de teclado</DialogTitle>
						<DialogDescription>Funcionam em qualquer tela do computador.</DialogDescription>
					</DialogHeader>
					<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-xs">
						<dt className="font-mono">Ctrl/Cmd + K</dt>
						<dd>Buscar registros e ações</dd>
						<dt className="font-mono">?</dt>
						<dd>Mostrar estes atalhos</dd>
						<dt className="font-mono">↑ ↓</dt>
						<dd>Registro anterior ou seguinte, com a ficha aberta</dd>
						<dt className="font-mono">Esc</dt>
						<dd>Fechar a ficha ou desfazer a edição</dd>
						<dt className="font-mono">Enter</dt>
						<dd>Salvar o campo em edição</dd>
					</dl>
				</DialogContent>
			</Dialog>
		</>
	);
}
