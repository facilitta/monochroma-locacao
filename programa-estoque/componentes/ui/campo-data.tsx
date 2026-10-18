"use client";
// Campo de data e de data com hora, próprios do app: mostram dd/mm/aaaa e 24 horas em qualquer navegador
// (o campo nativo segue o idioma do navegador e, em inglês, mostra mês/dia e AM/PM).
// O valor continua no formato do campo nativo ("2026-10-17T09:00" ou "2026-10-17"), para as regras não mudarem.

import CalendarIcon from "@carbon/icons-react/es/Calendar";
import { Calendar } from "@/componentes/ui/calendar";
import { Icon } from "@/componentes/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/componentes/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { useAgora } from "@/lib/relogio";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ptBR } from "react-day-picker/locale";

const dois = (n: number) => String(n).padStart(2, "0");

function lerDia(valor: string): Date | undefined {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
	if (!m) return undefined;
	return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function escreverDia(d: Date): string {
	return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

const SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

function mostrarDia(d: Date | undefined): string {
	if (!d) return "Escolher data";
	const semana = SEMANA.format(d).replace(".", "");
	return `${semana}, ${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Horários de 30 em 30 minutos, do dia inteiro. */
const HORARIOS = Array.from({ length: 48 }, (_, i) => `${dois(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`);

const GATILHO =
	"flex h-8 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-left text-xs shadow-campo outline-none transition-colors hover:border-ring/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 dark:bg-muted max-md:text-base";

type Comum = {
	id?: string;
	valor: string;
	aoMudar: (valor: string) => void;
	desativado?: boolean;
	invalido?: boolean;
	/** Nome do campo, para quem usa leitor de tela (a hora vira "Hora da <rotulo>"). */
	rotulo: string;
	/** Bloqueia no calendário os dias antes de hoje (hoje do relógio do app). */
	semPassado?: boolean;
	className?: string;
};

function Dia({
	id,
	dia,
	aoEscolher,
	desativado,
	invalido,
	rotulo,
	minimo,
	semPassado,
}: {
	id?: string;
	dia: Date | undefined;
	aoEscolher: (d: Date) => void;
	desativado?: boolean;
	invalido?: boolean;
	rotulo: string;
	minimo?: Date;
	semPassado?: boolean;
}) {
	const [aberto, setAberto] = useState(false);
	const agora = useAgora(60_000);
	const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
	const antesDe = minimo && (!semPassado || minimo > hoje) ? minimo : semPassado ? hoje : undefined;
	return (
		<Popover open={aberto} onOpenChange={setAberto}>
			<PopoverTrigger asChild>
				<button
					id={id}
					type="button"
					disabled={desativado}
					aria-invalid={invalido || undefined}
					aria-label={`${rotulo}: ${mostrarDia(dia)}`}
					className={cn(GATILHO, "flex-1")}
				>
					<Icon icon={CalendarIcon} className="size-4 shrink-0 text-muted-foreground" />
					<span className={cn("truncate tabular-nums", !dia && "text-muted-foreground")}>{mostrarDia(dia)}</span>
				</button>
			</PopoverTrigger>
			<PopoverContent size="fit" align="start">
				<Calendar
					mode="single"
					locale={ptBR}
					today={agora}
					selected={dia}
					defaultMonth={dia ?? agora}
					disabled={antesDe ? { before: antesDe } : undefined}
					onSelect={(d) => {
						if (!d) return;
						aoEscolher(d);
						setAberto(false);
					}}
					className="max-md:[--cell-size:--spacing(11)]"
				/>
			</PopoverContent>
		</Popover>
	);
}

/** Data com hora (substitui o campo nativo "datetime-local"). */
export function CampoDataHora({ id, valor, aoMudar, desativado, invalido, rotulo, semPassado, className }: Comum) {
	const dia = lerDia(valor);
	const horaAtual = /T(\d{2}:\d{2})/.exec(valor)?.[1] ?? "09:00";
	const horarios = HORARIOS.includes(horaAtual) ? HORARIOS : [...HORARIOS, horaAtual].sort();
	return (
		<div className={cn("flex min-w-0 gap-2", className)}>
			<Dia
				id={id}
				dia={dia}
				desativado={desativado}
				invalido={invalido}
				rotulo={rotulo}
				semPassado={semPassado}
				aoEscolher={(d) => aoMudar(`${escreverDia(d)}T${horaAtual}`)}
			/>
			<Select
				value={horaAtual}
				disabled={desativado || !dia}
				onValueChange={(h) => dia && aoMudar(`${escreverDia(dia)}T${h}`)}
			>
				<SelectTrigger aria-label={`Hora da ${rotulo.toLowerCase()}`} aria-invalid={invalido || undefined} className="w-24 shrink-0 tabular-nums max-md:text-base">
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="max-h-72">
					{horarios.map((h) => (
						<SelectItem key={h} value={h} className="tabular-nums">
							{h}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

/** Só a data (substitui o campo nativo "date"). */
export function CampoData({ id, valor, aoMudar, desativado, invalido, rotulo, semPassado, className, minimo }: Comum & { minimo?: string }) {
	return (
		<div className={cn("flex min-w-0", className)}>
			<Dia
				id={id}
				dia={lerDia(valor)}
				desativado={desativado}
				invalido={invalido}
				rotulo={rotulo}
				minimo={minimo ? lerDia(minimo) : undefined}
				semPassado={semPassado}
				aoEscolher={(d) => aoMudar(escreverDia(d))}
			/>
		</div>
	);
}
