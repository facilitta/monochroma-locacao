// Conferência automática dos critérios de aceite da Fase 0 (seção 14).
// Uso: BASE=http://127.0.0.1:4173/ node testes/fase0/conferir.mjs
// BASE aponta para o protótipo de arquivo único (prototipo/vite/dist/index.html servido por qualquer servidor estático).

import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../..", import.meta.url));
const docs = join(raiz, "..", "docs");
const pastaCapturas = join(docs, "capturas", "fase-0");
const saida = join(raiz, "testes", "fase0", "saida");
mkdirSync(pastaCapturas, { recursive: true });
mkdirSync(saida, { recursive: true });

const BASE = process.env.BASE ?? "http://127.0.0.1:4173/";
const SO = process.env.SO ? process.env.SO.split(",") : null;

export const TELAS = [
	["hoje", "/hoje"],
	["conversas", "/conversas?conversa=1"],
	["reservas", "/reservas"],
	["ficha-reserva", "/reservas?ficha=reserva:1046"],
	["clientes", "/clientes"],
	["ficha-cliente", "/clientes?ficha=cliente:4"],
	["pagamentos", "/pagamentos"],
	["paineis", "/paineis"],
	["automacoes", "/automacoes"],
	["configuracoes", "/configuracoes"],
	["catalogo", "/catalogo"],
	["ficha-equipamento", "/catalogo?ficha=equipamento:1"],
	["unidades", "/unidades"],
	["kits", "/kits"],
	["agenda", "/agenda"],
	["montador", "/pedido/novo?conversa=1"],
	["balcao", "/balcao?reserva=1043&sentido=saida"],
	["manutencao", "/manutencao"],
	["etiquetas", "/etiquetas"],
	["alertas", "/alertas"],
];
const EXTRAS = [
	["linguagem-visual", "/prototipo/linguagem-visual"],
	["papeis", "/prototipo/papeis"],
	["prototipo", "/prototipo"],
];

function endereco(rota, tema, papel) {
	const [caminho, qs = ""] = rota.split("?");
	const p = new URLSearchParams(qs);
	p.set("tela", caminho.replace(/^\//, ""));
	p.set("tema", tema);
	p.set("papel", papel);
	p.set("relogio", "parado");
	return `${BASE}?${p.toString()}`;
}

const PALAVRAS_PROIBIDAS = /\b(status|sku|owner|asset|dashboard|pipeline|leads?|upsell|deal|stage|booking|checkout|loading|error|cancel|save|submit|delete|edit|search|filters?|settings|undefined|null|NaN|true|false|lorem|ipsum|fixme|showing|results?|page|rows?|selected|clear|ascending|descending|columns?)\b/gi;
const RESPOSTA_CRUA = /\b[A-Z]{3,}(?:_[A-Z]{2,})+\b/g;

const MEDIR = `(() => {
	const alvoMin = document.querySelector('[data-balcao]') ? 48 : 44;
	const seletor = 'a[href], button, [role=button], [role=tab], [role=switch], [role=menuitem], [role=option], input:not([type=hidden]), select, textarea, [data-alvo]';
	const pequenos = [];
	for (const el of document.querySelectorAll(seletor)) {
		const r = el.getBoundingClientRect();
		const st = getComputedStyle(el);
		if (r.width === 0 || r.height === 0 || st.visibility === 'hidden' || st.display === 'none') continue;
		if (el.closest('[aria-hidden=true],[inert],[data-isento-alvo]')) continue;
		if (el.classList.contains('sr-only') && document.activeElement !== el) continue;
		if (st.display === 'inline' && el.closest('p,li,dd,td,span') && el.tagName === 'A') continue;
		const pai = el.closest('label,[data-slot=switch-alvo]');
		const caixa = pai ? pai.getBoundingClientRect() : r;
		const larg = Math.max(r.width, caixa.width), alt = Math.max(r.height, caixa.height);
		const minimo = el.closest('[data-balcao]') ? 48 : 44;
		if (Math.min(larg, alt) + 0.5 < minimo) pequenos.push({ el: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40), w: Math.round(larg), h: Math.round(alt) });
	}
	const campos = [];
	for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')) {
		const r = el.getBoundingClientRect();
		if (r.width === 0) continue;
		const fs = parseFloat(getComputedStyle(el).fontSize);
		if (fs < 16) campos.push({ el: el.getAttribute('aria-label') || el.placeholder || el.name || el.id, fs });
	}
	const rolagem = document.scrollingElement.scrollWidth > window.innerWidth + 1;
	return { pequenos, campos, rolagem, alvoMin };
})()`;

async function esperarTela(page) {
	await page.waitForLoadState("networkidle");
	await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]') || document.querySelector("main"), null, { timeout: 15000 });
	await page.waitForTimeout(500);
}

const resultado = { inicio: new Date().toISOString(), base: BASE, capturas: [], balcao: [], tokens: [], escalaDeCinza: null };

const browser = await chromium.launch();

for (const [nome, rota] of [...TELAS, ...EXTRAS]) {
	if (SO && !SO.includes(nome)) continue;
	const extra = EXTRAS.some((e) => e[0] === nome);
	for (const tema of ["claro", "escuro"]) {
		for (const largura of extra ? [1440] : [1440, 390]) {
			const celular = largura < 768;
			const ctx = await browser.newContext({
				viewport: { width: largura, height: celular ? 844 : 900 },
				deviceScaleFactor: celular ? 2 : 1,
				colorScheme: tema === "escuro" ? "dark" : "light",
				hasTouch: celular,
				isMobile: celular,
				reducedMotion: "reduce",
				locale: "pt-BR",
				timezoneId: "America/Sao_Paulo",
			});
			const page = await ctx.newPage();
			const erros = [];
			page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
			page.on("pageerror", (e) => erros.push(String(e)));
			await page.goto(endereco(rota, tema, "dono"));
			await esperarTela(page);
			const arquivo = join(pastaCapturas, `${nome}-${tema}-${largura}.png`);
			await page.screenshot({ path: arquivo, fullPage: false });
			const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
			const contraste = axe.violations.filter((v) => v.id === "color-contrast").flatMap((v) => v.nodes.map((n) => ({ alvo: n.target.join(" "), resumo: n.failureSummary?.split("\n").slice(1, 2).join(" ") })));
			const outras = axe.violations.filter((v) => v.id !== "color-contrast").map((v) => ({ regra: v.id, quantos: v.nodes.length, exemplo: v.nodes[0]?.target.join(" ") }));
			const medidas = celular ? await page.evaluate(MEDIR) : null;
			const texto = await page.evaluate(() => document.body.innerText);
			const proibidas = [...new Set((texto.match(PALAVRAS_PROIBIDAS) ?? []).map((x) => x.toLowerCase()))];
			const cruas = [...new Set(texto.match(RESPOSTA_CRUA) ?? [])];
			resultado.capturas.push({ nome, tema, largura, arquivo: relative(docs, arquivo), erros, contraste, outras, medidas, proibidas, cruas });
			console.log(`${nome} ${tema} ${largura}: erros ${erros.length}, contraste ${contraste.length}${medidas ? `, alvos ${medidas.pequenos.length}, campos ${medidas.campos.length}, rolagem ${medidas.rolagem}` : ""}, palavras ${proibidas.length + cruas.length}`);
			await ctx.close();
		}
	}
}

// Balcão: nenhum valor em dinheiro em nenhuma tela; telas do dono bloqueadas.
for (const [nome, rota] of TELAS) {
	if (SO && !SO.includes(nome)) continue;
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
	const page = await ctx.newPage();
	await page.goto(endereco(rota, "claro", "balcao"));
	await esperarTela(page);
	const texto = await page.evaluate(() => document.body.innerText);
	const trilho = await page.evaluate(() => document.querySelector("nav[aria-label='Menu principal']")?.innerText ?? "");
	const bloqueada = texto.includes("Esta tela é só do dono.");
	const dinheiro = (texto.match(/R\$\s?[\d.,]+/g) ?? []).slice(0, 5);
	resultado.balcao.push({ nome, bloqueada, dinheiro, trilhoTemFinanceiro: /Paga\S*mentos|Painéis/.test(trilho) });
	if (nome === "hoje" || nome === "balcao") await page.screenshot({ path: join(pastaCapturas, `${nome}-balcao-claro-1440.png`) });
	console.log(`balcão ${nome}: ${bloqueada ? "bloqueada" : "aberta"}, R$ ${dinheiro.length}`);
	await ctx.close();
}

// Linguagem visual em escala de cinza.
{
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
	const page = await ctx.newPage();
	await page.goto(endereco("/prototipo/linguagem-visual", "claro", "dono"));
	await esperarTela(page);
	await page.addStyleTag({ content: "html{filter:grayscale(1)}" });
	await page.screenshot({ path: join(pastaCapturas, "linguagem-visual-escala-de-cinza-1440.png"), fullPage: true });
	const semTexto = await page.evaluate(() =>
		[...document.querySelectorAll("[data-slot=selo],[data-slot=pilula-unidade],[data-slot=etapa]")].filter((e) => !e.textContent.trim() || !e.querySelector("svg,[data-etapa]")).length,
	);
	resultado.escalaDeCinza = { arquivo: "capturas/fase-0/linguagem-visual-escala-de-cinza-1440.png", marcadoresSemFormaOuTexto: semTexto };
	await ctx.close();
}

await browser.close();

// Busca no código por cor, raio ou sombra fora dos tokens.
const PADROES = [
	[/#[0-9a-fA-F]{3,8}\b/, "cor em hexadecimal"],
	[/\brgba?\(/, "rgb()"],
	[/\boklch\(/, "oklch()"],
	[/\bhsla?\(/, "hsl()"],
	[/color-mix\(/, "color-mix()"],
	[/shadow-\[/, "sombra solta"],
	[/rounded-\[/, "raio solto"],
	[/\b(bg|text|border|ring|fill|stroke)-(black|white|red|green|blue|gray|zinc|neutral|slate|pink|rose|amber|yellow|emerald|sky|indigo|violet|purple|orange|lime|teal|cyan|fuchsia|stone)\b/, "cor da paleta padrão"],
];
function varrer(pasta) {
	for (const nome of readdirSync(pasta)) {
		const caminho = join(pasta, nome);
		if (statSync(caminho).isDirectory()) {
			if (["node_modules", "dist", "saida", ".next"].includes(nome)) continue;
			varrer(caminho);
		} else if (/\.(tsx?|css)$/.test(nome) && !caminho.endsWith("app/globals.css")) {
			readFileSync(caminho, "utf8")
				.split("\n")
				.forEach((linha, i) => {
					if (/^\s*(\/\/|\*|\/\*)/.test(linha)) return;
					for (const [re, tipo] of PADROES) if (re.test(linha)) resultado.tokens.push({ arquivo: relative(raiz, caminho), linha: i + 1, tipo, trecho: linha.trim().slice(0, 120) });
				});
		}
	}
}
for (const p of ["app", "componentes", "telas", "lib", "hooks", "prototipo"]) varrer(join(raiz, p));

resultado.fim = new Date().toISOString();
writeFileSync(join(saida, "resultado.json"), JSON.stringify(resultado, null, 2));

const c = resultado.capturas.filter((x) => !EXTRAS.some((e) => e[0] === x.nome));
const resumo = {
	capturas: c.length,
	comErroNoConsole: c.filter((x) => x.erros.length).length,
	comFalhaDeContraste: resultado.capturas.filter((x) => x.contraste.length).length,
	celularComRolagemLateral: c.filter((x) => x.medidas?.rolagem).length,
	celularComAlvoPequeno: c.filter((x) => x.medidas?.pequenos.length).length,
	celularComCampoPequeno: c.filter((x) => x.medidas?.campos.length).length,
	comPalavraProibida: resultado.capturas.filter((x) => x.proibidas.length || x.cruas.length).length,
	balcaoComDinheiro: resultado.balcao.filter((x) => x.dinheiro.length).length,
	balcaoTrilhoComFinanceiro: resultado.balcao.some((x) => x.trilhoTemFinanceiro),
	tokensForaDoArquivo: resultado.tokens.length,
	escalaDeCinza: resultado.escalaDeCinza,
};
writeFileSync(join(saida, "resumo.json"), JSON.stringify(resumo, null, 2));
console.log(JSON.stringify(resumo, null, 2));
