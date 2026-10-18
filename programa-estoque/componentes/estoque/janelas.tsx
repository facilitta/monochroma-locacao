"use client";
// Janelas do estoque: importar planilha, novo equipamento, nova unidade, mandar para reparo, baixar e ler etiqueta.

import DocumentImport from "@carbon/icons-react/es/DocumentImport";
import Flash from "@carbon/icons-react/es/Flash";
import Scan from "@carbon/icons-react/es/Scan";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/componentes/ui/alert-dialog";
import { Button } from "@/componentes/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Icon } from "@/componentes/ui/icon";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/componentes/ui/sheet";
import { Textarea } from "@/componentes/ui/textarea";
import { Selo } from "@/componentes/ui/marcadores";
import { normalizarEtiqueta } from "@/lib/formatos";
import { traduzir } from "@/lib/regras/respostas";
import * as D from "@/prototipo/dados";
import * as Q from "@/prototipo/consultas";
import { OPCOES_CATEGORIA } from "@/prototipo/consultas-estoque";
import { useState } from "react";
import { toast } from "sonner";

const CAMPO = "flex flex-col gap-1.5";

export function ImportarPlanilha({ aberta, aoFechar }: { aberta: boolean; aoFechar: () => void }) {
	const [escolheu, setEscolheu] = useState(false);
	const previa = [
		{ nome: "Lente 100mm macro", categoria: "Lente", diaria: "R$ 110,00", unidades: 1, ok: true },
		{ nome: "Gravador F3", categoria: "Áudio", diaria: "R$ 60,00", unidades: 2, ok: true },
		{ nome: "Refletor 600d", categoria: "Iluminação", diaria: "R$ 260,00", unidades: 1, ok: true },
		{ nome: "Tripé sem nome", categoria: "—", diaria: "—", unidades: 1, ok: false },
	];
	return (
		<Dialog
			open={aberta}
			onOpenChange={(o) => {
				if (!o) {
					setEscolheu(false);
					aoFechar();
				}
			}}
		>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Importar planilha de equipamentos</DialogTitle>
					<DialogDescription>Use o modelo da locadora. Você vê a prévia antes de gravar e pode desfazer em até 48 horas.</DialogDescription>
				</DialogHeader>
				{!escolheu ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center">
						<Icon icon={DocumentImport} className="size-6 text-muted-foreground" />
						<p className="text-muted-foreground text-xs">Planilha em .xlsx ou .csv, uma linha por equipamento.</p>
						<Button variant="outline" size="sm" onClick={() => setEscolheu(true)}>
							Escolher arquivo
						</Button>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						<p className="text-xs">
							<span className="font-medium">equipamentos-exemplo.xlsx</span> · 4 linhas lidas
						</p>
						<div className="overflow-x-auto rounded-lg border">
							<table className="w-full text-xs">
								<thead className="bg-muted text-muted-foreground">
									<tr>
										<th className="px-3 py-2 text-left font-normal">Equipamento</th>
										<th className="px-3 py-2 text-left font-normal">Categoria</th>
										<th className="px-3 py-2 text-right font-normal">Diária</th>
										<th className="px-3 py-2 text-right font-normal">Unidades</th>
										<th className="px-3 py-2 text-left font-normal">Situação</th>
									</tr>
								</thead>
								<tbody>
									{previa.map((l) => (
										<tr key={l.nome} className="border-t">
											<td className="px-3 py-2">{l.nome}</td>
											<td className="px-3 py-2">{l.categoria}</td>
											<td className="px-3 py-2 text-right tabular-nums">{l.diaria}</td>
											<td className="px-3 py-2 text-right tabular-nums">{l.unidades}</td>
											<td className="px-3 py-2">{l.ok ? <Selo tom="ok">Pronta</Selo> : <Selo tom="erro">Falta categoria e diária</Selo>}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className="text-muted-foreground text-xs">A linha recusada vai para um arquivo à parte, para corrigir e importar de novo.</p>
					</div>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={aoFechar}>
						Cancelar
					</Button>
					<Button
						disabled={!escolheu}
						onClick={() => {
							toast.success("3 equipamentos importados", { action: { label: "Desfazer", onClick: () => toast("Importação desfeita") } });
							setEscolheu(false);
							aoFechar();
						}}
					>
						Importar 3 linhas
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function NovoEquipamento({ aberto, aoFechar, aoCriar }: { aberto: boolean; aoFechar: () => void; aoCriar: (id: number) => void }) {
	const [categoria, setCategoria] = useState<string>("camera");
	return (
		<Sheet open={aberto} onOpenChange={(o) => !o && aoFechar()}>
			<SheetContent side="right" size="sm" className="w-full sm:max-w-sm">
				<SheetHeader className="border-b px-5 py-4">
					<SheetTitle>Novo equipamento</SheetTitle>
					<SheetDescription>O modelo no catálogo. As unidades com etiqueta nascem na ficha, logo depois de salvar.</SheetDescription>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-5 py-4"
					onSubmit={(e) => {
						e.preventDefault();
						toast.success("Equipamento criado");
						aoFechar();
						aoCriar(1);
					}}
				>
					<div className={CAMPO}>
						<Label htmlFor="eq-nome">Nome</Label>
						<Input id="eq-nome" required placeholder="Ex.: FX3" />
					</div>
					<div className={CAMPO}>
						<Label htmlFor="eq-categoria">Categoria</Label>
						<Select value={categoria} onValueChange={setCategoria}>
							<SelectTrigger id="eq-categoria" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{OPCOES_CATEGORIA.map((o) => (
									<SelectItem key={o.valor} value={o.valor}>
										{o.rotulo}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className={CAMPO}>
							<Label htmlFor="eq-marca">Marca</Label>
							<Input id="eq-marca" placeholder="Ex.: Sony" />
						</div>
						<div className={CAMPO}>
							<Label htmlFor="eq-modelo">Modelo</Label>
							<Input id="eq-modelo" placeholder="Ex.: ILME-FX3" />
						</div>
					</div>
					<div className={CAMPO}>
						<Label htmlFor="eq-diaria">Diária (R$)</Label>
						<Input id="eq-diaria" inputMode="decimal" required placeholder="0,00" />
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={aoFechar}>
							Cancelar
						</Button>
						<Button type="submit">Salvar e abrir ficha</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}

export function NovaUnidade({ aberta, aoFechar, aoCriar }: { aberta: boolean; aoFechar: () => void; aoCriar: (id: number) => void }) {
	const [equipamento, setEquipamento] = useState("1");
	return (
		<Sheet open={aberta} onOpenChange={(o) => !o && aoFechar()}>
			<SheetContent side="right" size="sm" className="w-full sm:max-w-sm">
				<SheetHeader className="border-b px-5 py-4">
					<SheetTitle>Nova unidade</SheetTitle>
					<SheetDescription>A etiqueta EQ- é criada sozinha. Depois é só imprimir.</SheetDescription>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-5 py-4"
					onSubmit={(e) => {
						e.preventDefault();
						toast.success("Unidade criada com a etiqueta EQ-6C7D8E9F");
						aoFechar();
						aoCriar(5);
					}}
				>
					<div className={CAMPO}>
						<Label htmlFor="un-eq">Equipamento</Label>
						<Select value={equipamento} onValueChange={setEquipamento}>
							<SelectTrigger id="un-eq" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{D.equipamentos
									.filter((e) => e.ativo)
									.map((e) => (
										<SelectItem key={e.id} value={String(e.id)}>
											{e.nome} · {e.marca}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>
					<div className={CAMPO}>
						<Label htmlFor="un-serie">Nº de série</Label>
						<Input id="un-serie" placeholder="Deixe vazio se a peça não tiver" />
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={aoFechar}>
							Cancelar
						</Button>
						<Button type="submit">Criar unidade</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}

export function MandarParaReparo({ aberta, aoFechar, quantidade }: { aberta: boolean; aoFechar: () => void; quantidade: number }) {
	const [tipo, setTipo] = useState("outro");
	return (
		<Dialog open={aberta} onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Mandar para reparo</DialogTitle>
					<DialogDescription>
						{quantidade === 1 ? "A unidade fica bloqueada na agenda até ser liberada." : `As ${quantidade} unidades ficam bloqueadas na agenda até serem liberadas.`}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className={CAMPO}>
						<Label htmlFor="rep-tipo">Problema</Label>
						<Select value={tipo} onValueChange={setTipo}>
							<SelectTrigger id="rep-tipo" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="arranhao">Arranhão</SelectItem>
								<SelectItem value="quebrado">Quebrado</SelectItem>
								<SelectItem value="falta_peca">Falta peça</SelectItem>
								<SelectItem value="sujo">Sujo</SelectItem>
								<SelectItem value="nao_liga">Não liga</SelectItem>
								<SelectItem value="outro">Outro</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className={CAMPO}>
						<Label htmlFor="rep-obs">Observação</Label>
						<Textarea id="rep-obs" placeholder="O que foi visto na peça" />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={aoFechar}>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							toast.success(quantidade === 1 ? "Manutenção aberta" : `${quantidade} manutenções abertas`);
							aoFechar();
						}}
					>
						Abrir manutenção
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function BaixarUnidades({ aberta, aoFechar, quantidade }: { aberta: boolean; aoFechar: () => void; quantidade: number }) {
	const [motivo, setMotivo] = useState<string>("");
	return (
		<AlertDialog open={aberta} onOpenChange={(o) => !o && aoFechar()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{quantidade === 1 ? "Baixar esta unidade?" : `Baixar ${quantidade} unidades?`}</AlertDialogTitle>
					<AlertDialogDescription>
						A baixa não se desfaz. A unidade sai do estoque e some das listas, mas o histórico continua guardado.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className={CAMPO}>
					<Label htmlFor="baixa-motivo">Motivo</Label>
					<Select value={motivo} onValueChange={setMotivo}>
						<SelectTrigger id="baixa-motivo" className="w-full">
							<SelectValue placeholder="Escolha o motivo" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="vendida">Vendida</SelectItem>
							<SelectItem value="perdida">Perdida</SelectItem>
							<SelectItem value="roubada">Roubada</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={!motivo}
						onClick={() => {
							toast.success(quantidade === 1 ? "Unidade baixada" : `${quantidade} unidades baixadas`);
							aoFechar();
						}}
					>
						Baixar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function LerEtiqueta({ aberta, aoFechar, aoAchar }: { aberta: boolean; aoFechar: () => void; aoAchar: (unidadeId: number) => void }) {
	const [codigo, setCodigo] = useState("");
	const [erro, setErro] = useState<string | null>(null);
	const [lanterna, setLanterna] = useState(false);
	const procurar = (valor: string) => {
		const u = Q.unidadePorCodigo(normalizarEtiqueta(valor));
		if (!u) {
			setErro(traduzir("ETIQUETA_NAO_ENCONTRADA").frase);
			return;
		}
		setErro(null);
		setCodigo("");
		aoFechar();
		aoAchar(u.id);
	};
	return (
		<Dialog open={aberta} onOpenChange={(o) => !o && aoFechar()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Ler etiqueta</DialogTitle>
					<DialogDescription>Aponte a câmera para o QR da etiqueta ou digite o código.</DialogDescription>
				</DialogHeader>
				<div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-muted">
					<span className="absolute inset-x-10 inset-y-12 rounded-md border-2 border-ring" aria-hidden />
					<span className="relative text-muted-foreground text-xs">Câmera simulada no protótipo</span>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<Button variant="outline" onClick={() => setLanterna((v) => !v)} aria-pressed={lanterna}>
						<Icon icon={Flash} data-icon="inline-start" />
						Lanterna
					</Button>
					<Button variant="outline" onClick={() => procurar("EQ-1A2B3C4D")}>
						<Icon icon={Scan} data-icon="inline-start" />
						Simular leitura
					</Button>
				</div>
				<form
					className="flex flex-col gap-1.5"
					onSubmit={(e) => {
						e.preventDefault();
						procurar(codigo);
					}}
				>
					<Label htmlFor="ler-codigo">Digitar código</Label>
					<div className="flex gap-2">
						<Input id="ler-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="1A2B3C4D ou EQ-1A2B3C4D" autoComplete="off" className="font-mono" />
						<Button type="submit" variant="outline">
							Abrir
						</Button>
					</div>
					{erro ? <p className="text-erro text-xs">{erro}</p> : null}
				</form>
			</DialogContent>
		</Dialog>
	);
}
