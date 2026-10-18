// Adaptador do nuqs (estado no endereço) para o endereço em memória.
import { renderQueryString, unstable_createAdapterProvider, type unstable_AdapterInterface } from "nuqs/adapters/custom";
import { useMemo, useSyncExternalStore } from "react";
import { assinarBusca, irPara, lerBusca } from "./endereco";

function useAdaptadorMemoria(): unstable_AdapterInterface {
	const busca = useSyncExternalStore(assinarBusca, lerBusca, lerBusca);
	const searchParams = useMemo(() => new URLSearchParams(busca), [busca]);
	return {
		searchParams,
		updateUrl: (search, opcoes) => irPara(renderQueryString(search) || "?", opcoes.history === "replace"),
		getSearchParamsSnapshot: () => new URLSearchParams(lerBusca()),
	};
}

export const AdaptadorMemoria = unstable_createAdapterProvider(useAdaptadorMemoria);
