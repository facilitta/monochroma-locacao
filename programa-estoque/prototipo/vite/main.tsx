import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "../../app/globals.css";
import { AdaptadorMemoria } from "./adaptador";
import "./endereco";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Casca } from "@/componentes/estrutura/casca";
import { Provedores } from "@/componentes/estrutura/provedores";
import { useBusca, useCaminho } from "@/lib/navegacao";
import { ROTAS } from "@/telas/rotas";

function Roteador() {
	const caminho = useCaminho();
	const busca = useBusca();
	const Tela = ROTAS[caminho] ?? ROTAS["/hoje"];
	return (
		<Casca>
			<Tela key={`${caminho}|${busca.get("estado") ?? ""}`} />
		</Casca>
	);
}

createRoot(document.getElementById("raiz") as HTMLElement).render(
	<StrictMode>
		<AdaptadorMemoria>
			<Provedores>
				<Roteador />
			</Provedores>
		</AdaptadorMemoria>
	</StrictMode>,
);
