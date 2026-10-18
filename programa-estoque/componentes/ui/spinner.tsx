import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva("shrink-0 animate-girar", {
	variants: {
		size: {
			default: "size-4",
			sm: "size-3",
			lg: "size-10",
		},
	},
	defaultVariants: { size: "default" },
});

function Spinner({
	className,
	size,
	rotulo = "Carregando",
	...props
}: React.ComponentProps<"svg"> & VariantProps<typeof spinnerVariants> & { rotulo?: string }) {
	return (
		<svg
			data-slot="spinner"
			role="status"
			aria-label={rotulo}
			viewBox="0 0 16 16"
			fill="none"
			className={cn(spinnerVariants({ size }), className)}
			{...props}
		>
			<circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
			<path d="M8 1.75a6.25 6.25 0 0 1 6.25 6.25" stroke="var(--ring)" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

export { Spinner };
