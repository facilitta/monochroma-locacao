// Logo provisório da Monochroma, redesenhado a partir do perfil do Instagram.
// Trocar pelo arquivo original quando chegar (pendência 9).
import { cn } from "@/lib/utils";

export function MarcaMonochroma({ className, comNome = true }: { className?: string; comNome?: boolean }) {
	return (
		<span className={cn("inline-flex items-center gap-2", className)}>
			<svg viewBox="0 0 32 32" className="size-6 shrink-0" role="img" aria-label="Monochroma">
				<circle cx="16" cy="16" r="16" className="fill-logo-fundo" />
				<path
					d="M8.4 22.6V10.1c0-.3.2-.5.5-.5h2.4l4.5 7.1 4.5-7.1h2.3c.3 0 .5.2.5.5v12.5c0 .3-.2.5-.5.5h-2.2a.5.5 0 0 1-.5-.5v-7.5l-3.6 5.4h-1.1l-3.6-5.4v7.5c0 .3-.2.5-.5.5H8.9a.5.5 0 0 1-.5-.5Z"
					className="fill-logo-tinta"
				/>
				<circle cx="25.2" cy="9.4" r="2.6" className="fill-logo-tinta" />
				<path d="M25.2 9.4V6.8a2.6 2.6 0 0 1 1.3.35Z" className="fill-logo-rosa-claro" />
				<path d="M25.2 9.4l1.3-2.25a2.6 2.6 0 0 1 .95.95Z" className="fill-logo-rosa-medio" />
				<path d="M25.2 9.4l2.25-1.3a2.6 2.6 0 0 1 .35 1.3Z" className="fill-logo-rosa-forte" />
			</svg>
			{comNome ? <span className="font-medium text-sm tracking-tight">Monochroma</span> : null}
		</span>
	);
}
