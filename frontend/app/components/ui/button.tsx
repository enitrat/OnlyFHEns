import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
	{
		variants: {
			variant: {
				default:
					"bg-[image:var(--gradient-primary-button)] text-primary-foreground shadow-md hover:shadow-[var(--shadow-primary)] hover:-translate-y-0.5",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-md hover:shadow-lg hover:-translate-y-0.5",
				outline:
					"border border-border bg-background shadow-sm hover:bg-muted hover:border-primary/40 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
				secondary:
					"bg-secondary/10 text-secondary-foreground border border-secondary/20 hover:bg-secondary/20 hover:border-secondary/30 shadow-sm",
				ghost:
					"hover:bg-muted hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
				success:
					"bg-success text-success-foreground hover:bg-success/90 shadow-md hover:shadow-lg hover:-translate-y-0.5",
				warning:
					"bg-warning text-warning-foreground hover:bg-warning/90 shadow-md hover:shadow-lg hover:-translate-y-0.5",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
				lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-base",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
