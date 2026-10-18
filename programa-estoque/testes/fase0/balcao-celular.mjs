// Conferência extra: todas as telas abertas como balcão (Julia) no celular, no tema padrão dela (escuro),
// e cada aba das fichas de reserva e de cliente. Nenhum "R$" pode aparecer.
// Uso: BASE=http://127.0.0.1:4173/ node testes/fase0/balcao-celular.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:4173/";
const TELAS = [
	"/hoje", "/conversas?conversa=1", "/reservas", "/reservas?visao=tabela", "/reservas?ficha=reserva:1046", "/reservas?ficha=reserva:1043",
	"/clientes", "/clientes?ficha=cliente:4", "/clientes?ficha=cliente:1", "/catalogo", "/catalogo?ficha=equipamento:1", "/unidades",
	"/agenda", "/balcao", "/balcao?reserva=1043&sentido=saida", "/balcao?reserva=1039&sentido=volta", "/manutencao", "/etiquetas", "/alertas",
];

function endereco(rota) {
	const [caminho, qs = ""] = rota.split("?");
	const p = new URLSearchParams(qs);
	p.set("tela", caminho.replace(/^\//, ""));
	p.set("papel", "balcao");
	p.set("relogio", "parado");
	return `${BASE}?${p.toString()}`;
}

const browser = await chromium.launch();
const problemas = [];
for (const rota of TELAS) {
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce", locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
	const page = await ctx.newPage();
	await page.goto(endereco(rota));
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(700);
	const abas = await page.locator('[role="dialog"] [role="tab"]').count();
	const vistas = [];
	for (let i = 0; i <= abas; i++) {
		if (i > 0) {
			await page.locator('[role="dialog"] [role="tab"]').nth(i - 1).click();
			await page.waitForTimeout(300);
		}
		const texto = await page.evaluate(() => document.body.innerText);
		const dinheiro = texto.match(/R\$\s?[\d.,]+/g) ?? [];
		vistas.push(dinheiro.length);
		if (dinheiro.length) problemas.push({ rota, aba: i, dinheiro: dinheiro.slice(0, 3) });
	}
	const escuro = await page.evaluate(() => document.documentElement.classList.contains("dark"));
	console.log(`${rota}: ${abas} abas, R$ por vista ${vistas.join("/")}${rota.startsWith("/balcao") ? `, escuro ${escuro}` : ""}`);
	await ctx.close();
}
await browser.close();
console.log(problemas.length ? JSON.stringify(problemas, null, 2) : "Nenhum R$ no celular como balcão.");
process.exit(problemas.length ? 1 : 0);
