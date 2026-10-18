const FUSO = "America/Sao_Paulo";

const formatoDinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoNumero = new Intl.NumberFormat("pt-BR");
const formatoPorcento = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;
const DIAS_LONGOS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;

export const MINUTO = 60_000;
export const HORA = 60 * MINUTO;
export const DIA = 24 * HORA;

type Partes = { ano: number; mes: number; dia: number; hora: number; minuto: number; semana: number };

function partes(d: Date): Partes {
	const f = new Intl.DateTimeFormat("en-US", {
		timeZone: FUSO,
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		weekday: "short",
		hour12: false,
	}).formatToParts(d);
	const v = (t: string) => f.find((p) => p.type === t)?.value ?? "0";
	const semanas = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	return {
		ano: Number(v("year")),
		mes: Number(v("month")),
		dia: Number(v("day")),
		hora: Number(v("hour")) % 24,
		minuto: Number(v("minute")),
		semana: semanas.indexOf(v("weekday")),
	};
}

const dois = (n: number) => String(n).padStart(2, "0");

export function dinheiro(valor: number): string {
	return formatoDinheiro.format(valor);
}

export function dinheiroCompacto(valor: number): string {
	if (Math.abs(valor) >= 1000) {
		const mil = valor / 1000;
		return `R$ ${mil.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
	}
	return dinheiro(valor);
}

export function numero(valor: number): string {
	return formatoNumero.format(valor);
}

export function porcento(fracao: number): string {
	return formatoPorcento.format(fracao);
}

export function data(d: Date): string {
	const p = partes(d);
	return `${dois(p.dia)}/${dois(p.mes)}/${p.ano}`;
}

export function dataCurta(d: Date): string {
	const p = partes(d);
	return `${dois(p.dia)}/${dois(p.mes)}`;
}

export function diaSemana(d: Date): string {
	return DIAS[partes(d).semana];
}

export function diaSemanaLongo(d: Date): string {
	return DIAS_LONGOS[partes(d).semana];
}

export function diaMes(d: Date): string {
	const p = partes(d);
	return `${p.dia} ${MESES[p.mes - 1]}`;
}

export function hora(d: Date): string {
	const p = partes(d);
	return p.minuto === 0 ? `${p.hora}h` : `${dois(p.hora)}:${dois(p.minuto)}`;
}

export function horaRelogio(d: Date): string {
	const p = partes(d);
	return `${dois(p.hora)}:${dois(p.minuto)}`;
}

export function diaEHora(d: Date): string {
	return `${diaSemana(d)} ${dataCurta(d)} ${hora(d)}`;
}

export function dataCompleta(d: Date): string {
	return `${diaSemanaLongo(d)}, ${data(d)} às ${horaRelogio(d)}`;
}

export function mesmoDia(a: Date, b: Date): boolean {
	const pa = partes(a);
	const pb = partes(b);
	return pa.ano === pb.ano && pa.mes === pb.mes && pa.dia === pb.dia;
}

export function inicioDoDia(d: Date): Date {
	const p = partes(d);
	return new Date(`${p.ano}-${dois(p.mes)}-${dois(p.dia)}T00:00:00-03:00`);
}

export function periodo(inicio: Date, fim: Date): string {
	const pi = partes(inicio);
	const pf = partes(fim);
	if (pi.mes === pf.mes) return `${pi.dia} a ${pf.dia} ${MESES[pf.mes - 1]}`;
	return `${pi.dia} ${MESES[pi.mes - 1]} a ${pf.dia} ${MESES[pf.mes - 1]}`;
}

export function duracao(ms: number): string {
	const abs = Math.abs(ms);
	if (abs < HORA) return `${Math.max(1, Math.round(abs / MINUTO))} min`;
	if (abs < DIA) return `${Math.round(abs / HORA)} h`;
	const dias = Math.round(abs / DIA);
	return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export function relativa(d: Date, agora: Date): string {
	const diff = d.getTime() - agora.getTime();
	const abs = Math.abs(diff);
	if (abs < MINUTO) return "agora";
	if (abs > 30 * DIA) return diaMes(d);
	return diff < 0 ? `há ${duracao(abs)}` : `em ${duracao(abs)}`;
}

export function mmss(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	return `${dois(Math.floor(total / 60))}:${dois(total % 60)}`;
}

export function telefone(digitos: string): string {
	const d = digitos.replace(/\D/g, "").replace(/^55/, "");
	if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
	if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
	return digitos;
}

export function telefoneMascarado(digitos: string): string {
	const d = digitos.replace(/\D/g, "").replace(/^55/, "");
	return `(${d.slice(0, 2)}) ${d.slice(2, 3)}****-${d.slice(-4)}`;
}

export function cpfMascarado(): string {
	return "•••.•••.•••-••";
}

export function cnpjMascarado(cnpj: string): string {
	const d = cnpj.replace(/\D/g, "");
	return `••.•••.•••/${d.slice(8, 12) || "0001"}-••`;
}

export function iniciais(nome: string): string {
	const partesNome = nome.replace(/\b(Ltda|ME|EIRELI|S\/A)\b/gi, "").trim().split(/\s+/);
	const primeira = partesNome[0]?.[0] ?? "";
	const segunda = partesNome.length > 1 ? partesNome[1][0] : (partesNome[0]?.[1] ?? "");
	return (primeira + segunda).toUpperCase();
}

export function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
	return `${numero(n)} ${n === 1 ? singular : pluralForma}`;
}

export function semAcento(texto: string): string {
	return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function normalizarEtiqueta(codigo: string): string {
	const limpo = codigo.trim().toUpperCase().replace(/\s+/g, "");
	return limpo.startsWith("EQ-") ? limpo : `EQ-${limpo.replace(/^EQ/, "")}`;
}

export function somenteDigitos(texto: string): string {
	return texto.replace(/\D/g, "");
}
