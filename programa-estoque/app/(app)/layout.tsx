import { Suspense } from "react";
import { Casca } from "@/componentes/estrutura/casca";

export const dynamic = "force-dynamic";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
	return (
		<Suspense>
			<Casca>{children}</Casca>
		</Suspense>
	);
}
