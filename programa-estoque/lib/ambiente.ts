// A página publicada do protótipo roda dentro de uma moldura que não deixa baixar arquivos nem abrir a impressão.
// Fora dela (app no Mac ou no servidor), tudo funciona normalmente.

export function dentroDaMoldura(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return window.self !== window.top;
	} catch {
		return true;
	}
}
