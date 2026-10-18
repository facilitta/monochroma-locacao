// Prepara o arquivo único para publicar como página: tira doctype, html, head e body
// (a publicação já envolve a página nesse esqueleto) e põe o <title> no começo.
import { readFileSync, writeFileSync } from "node:fs";

const entrada = new URL("./dist/index.html", import.meta.url);
const saida = new URL("./dist/publicar.html", import.meta.url);
const html = readFileSync(entrada, "utf8");

const pegar = (re) => [...html.matchAll(re)].map((m) => m[0]);
const titulo = pegar(/<title>[\s\S]*?<\/title>/g)[0] ?? "<title>Protótipo Monochroma</title>";
const descricao = pegar(/<meta name="description"[^>]*>/g)[0] ?? "";
const estilos = pegar(/<style[^>]*>[\s\S]*?<\/style>/g);
const scripts = pegar(/<script[^>]*>[\s\S]*?<\/script>/g);
const corpo = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) ?? ["", ""])[1].replace(/<script[^>]*>[\s\S]*?<\/script>/g, "").trim();

writeFileSync(saida, [titulo, descricao, ...estilos, corpo, ...scripts].join("\n"));
console.log(`publicar.html: ${(readFileSync(saida).length / 1024).toFixed(0)} KB`);
