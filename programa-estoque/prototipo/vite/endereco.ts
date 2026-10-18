// Endereço em memória da versão de arquivo único. A página publicada roda num quadro protegido,
// onde mexer no endereço real do navegador pode não funcionar; por isso a rota e os filtros
// ficam numa pequena memória, e o endereço real só é atualizado quando o navegador permite.

declare global {
	interface Window {
		__buscaAtual?: () => string;
	}
}

function inicial(): string {
	try {
		const s = window.location.search;
		return s && s.length > 1 ? s : "?tela=hoje";
	} catch {
		return "?tela=hoje";
	}
}

let atual = inicial();
const ouvintes = new Set<() => void>();

export function lerBusca(): string {
	return atual;
}

export function assinarBusca(cb: () => void): () => void {
	ouvintes.add(cb);
	return () => {
		ouvintes.delete(cb);
	};
}

export function irPara(busca: string, _substituir = false) {
	const nova = busca.startsWith("?") ? busca : `?${busca}`;
	if (nova === atual) return;
	atual = nova;
	try {
		window.history.replaceState(null, "", nova);
	} catch {
		// o quadro não deixa mexer no endereço: segue só na memória
	}
	for (const cb of ouvintes) cb();
}

if (typeof window !== "undefined") window.__buscaAtual = lerBusca;
