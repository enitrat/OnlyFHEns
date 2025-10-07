import { cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

type HeroProps = {
	badge?: ReactNode;
	title?: ReactNode;
	subtitle?: ReactNode;
	children?: ReactNode;
	className?: string;
	contentClassName?: string;
	decorations?: ReactNode;
};

function cx(...classes: Array<string | undefined | false | null>) {
	return classes.filter(Boolean).join(" ");
}

const TITLE_CLASS = "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight";
const SUBTITLE_CLASS = "text-lg md:text-xl text-white/90 mx-auto max-w-3xl";

function renderTitle(node: ReactNode) {
	if (!node) return null;
	if (typeof node === "string" || typeof node === "number") {
		return <h1 className={TITLE_CLASS}>{node}</h1>;
	}
	if (isValidElement(node)) {
		const element = node as ReactElement<{ className?: string }>;
		return cloneElement(element, {
			className: cx(TITLE_CLASS, element.props.className),
		});
	}
	return <h1 className={TITLE_CLASS}>{node}</h1>;
}

function renderSubtitle(node: ReactNode) {
	if (!node) return null;
	if (typeof node === "string" || typeof node === "number") {
		return <p className={SUBTITLE_CLASS}>{node}</p>;
	}
	if (isValidElement(node)) {
		const element = node as ReactElement<{ className?: string }>;
		return cloneElement(element, {
			className: cx(SUBTITLE_CLASS, element.props.className),
		});
	}
	return <p className={SUBTITLE_CLASS}>{node}</p>;
}

export function Hero({
	badge,
	title,
	subtitle,
	children,
	className,
	contentClassName,
	decorations,
}: HeroProps) {
	return (
		<section
			className={cx(
				"relative bg-gradient-hero text-white overflow-hidden",
				className,
			)}
		>
			<div className="absolute top-10 right-10 size-32 bg-white/10 rounded-full blur-3xl" />
			<div className="absolute bottom-10 left-10 size-40 bg-white/10 rounded-full blur-3xl" />
			{decorations}
			<div
				className={cx(
					"container mx-auto px-4 py-16 md:py-20 relative text-center space-y-4",
					contentClassName,
				)}
			>
				{badge && (
					<div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
						{badge}
					</div>
				)}
				{title && renderTitle(title)}
				{subtitle && renderSubtitle(subtitle)}
				{children}
			</div>
			<WaveDivider />
		</section>
	);
}

export function WaveDivider() {
	return (
		<div className="absolute bottom-0 left-0 right-0">
			<svg
				className="w-full h-12 md:h-16"
				viewBox="0 0 1200 80"
				preserveAspectRatio="none"
			>
				<path
					d="M0,40 C200,60 400,20 600,40 C800,60 1000,20 1200,40 L1200,80 L0,80 Z"
					fill="var(--background)"
				/>
			</svg>
		</div>
	);
}
