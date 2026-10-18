import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const raiz = fileURLToPath(new URL("../..", import.meta.url));
const unico = process.env.ARQUIVO_UNICO !== "nao";

export default defineConfig({
	root: fileURLToPath(new URL(".", import.meta.url)),
	plugins: [react(), tailwindcss(), ...(unico ? [viteSingleFile()] : [])],
	resolve: {
		alias: [
			{ find: "@/lib/navegacao", replacement: fileURLToPath(new URL("./navegacao.tsx", import.meta.url)) },
			{ find: /^@\//, replacement: `${raiz}/` },
		],
	},
	define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production") },
	server: { port: 5173, host: "127.0.0.1", strictPort: true },
	preview: { port: 4173, host: "127.0.0.1", strictPort: true },
	build: { outDir: "dist", emptyOutDir: true, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 10_000 },
});
