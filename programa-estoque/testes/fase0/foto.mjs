// Captura rápida de uma tela do protótipo (servidor de desenvolvimento em 127.0.0.1:5173).
// Uso: node testes/fase0/foto.mjs "/reservas?ficha=reserva:1046" escuro 390 saida.png [balcao]
import { chromium } from "playwright";

const [rota = "/hoje", tema = "claro", largura = "1440", saida = "foto.png", papel = "dono"] = process.argv.slice(2);
const base = process.env.BASE ?? "http://127.0.0.1:5173/";
const [caminho, qs = ""] = rota.split("?");
const p = new URLSearchParams(qs);
p.set("tela", caminho.replace(/^\//, ""));
p.set("tema", tema);
p.set("papel", papel);
p.set("relogio", "parado");
const url = `${base}?${p.toString()}`;
const w = Number(largura);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, deviceScaleFactor: w < 768 ? 2 : 1, colorScheme: tema === "escuro" ? "dark" : "light", hasTouch: w < 768, isMobile: w < 768, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
const page = await ctx.newPage();
const erros = [];
page.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
page.on("pageerror", (e) => erros.push(String(e)));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(Number(process.env.ESPERA ?? 600));
if (process.env.ACAO) await page.evaluate(process.env.ACAO);
if (process.env.ESPERA2) await page.waitForTimeout(Number(process.env.ESPERA2));
const cheia = process.env.CHEIA === "sim";
await page.screenshot({ path: saida, fullPage: cheia });
const larguraDoc = await page.evaluate(() => document.scrollingElement.scrollWidth);
console.log(JSON.stringify({ url, erros, rolagemLateral: larguraDoc > w }));
await browser.close();
