import * as React from "react";
import { cn } from "~/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "primary" | "secondary" | "accent";
}

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
	({ className, variant = "default", children, ...props }, ref) => {
		const backgroundClass = {
			default: "",
			primary: "bg-[image:var(--bg-wash-primary)]",
			secondary: "bg-[image:var(--bg-wash-secondary)]",
			accent: "bg-[image:var(--bg-wash-accent)]",
		}[variant];

		return (
			<div
				ref={ref}
				className={cn(
					"min-h-[calc(100dvh-4rem)] py-12 md:py-20",
					backgroundClass,
					className,
				)}
				{...props}
			>
				{children}
			</div>
		);
	},
);
PageContainer.displayName = "PageContainer";

interface SectionContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const SectionContainer = React.forwardRef<
	HTMLDivElement,
	SectionContainerProps
>(({ className, maxWidth = "2xl", children, ...props }, ref) => {
	const maxWidthClass = {
		sm: "max-w-sm",
		md: "max-w-md",
		lg: "max-w-lg",
		xl: "max-w-xl",
		"2xl": "max-w-2xl",
		full: "max-w-full",
	}[maxWidth];

	return (
		<div
			ref={ref}
			className={cn("container mx-auto px-4", maxWidthClass, className)}
			{...props}
		>
			{children}
		</div>
	);
});
SectionContainer.displayName = "SectionContainer";

export { PageContainer, SectionContainer };
