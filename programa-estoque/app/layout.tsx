import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Provedores } from "@/componentes/estrutura/provedores";
import "./globals.css";

export const metadata: Metadata = {
	title: "Monochroma",
	description: "Aluguéis, clientes e estoque da Monochroma.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
			<body>
				<NuqsAdapter>
					<Provedores>{children}</Provedores>
				</NuqsAdapter>
			</body>
		</html>
	);
}
