import type * as React from "react";

import { cn } from "~/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {
	variant?: "default" | "gradient" | "elevated";
}

function Card({ className, variant = "default", ...props }: CardProps) {
	const variantClass = {
		default: "bg-card border border-border/60 shadow-[var(--shadow-sm)]",
		gradient:
			"bg-gradient-to-br from-white to-muted/30 border border-border/60 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow duration-300",
		elevated:
			"bg-card border-t-4 border-t-primary border-x border-b border-border/60 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300",
	}[variant];

	return (
		<div
			data-slot="card"
			className={cn(
				"text-card-foreground flex flex-col gap-6 rounded-xl py-6",
				variantClass,
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-title"
			className={cn("leading-none font-semibold", className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-action"
			className={cn(
				"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
				className,
			)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-content"
			className={cn("px-6", className)}
			{...props}
		/>
	);
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
			{...props}
		/>
	);
}

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardAction,
	CardDescription,
	CardContent,
};
