import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useTranslation } from "~/lib/i18n";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "~/components/ui/carousel";
import { UserPlus, Heart, Lock, Sparkles } from "lucide-react";
import { Hero } from "~/components/layout/Hero";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "OnlyFHEn — Private Tipping for Creators" },
		{
			name: "description",
			content:
				"Empower your favorite creators with complete privacy. Tip confidentially using Zama FHE.",
		},
	];
}

export default function Index() {
	const { t } = useTranslation();
	const featuredCreators = [
		{
			id: 1,
			name: "Chloe Davis",
			image: "/creator1.png",
			category: t("mockCreators.influencer"),
		},
		{
			id: 2,
			name: "Marcus Kim",
			image: "/creator2.png",
			category: t("mockCreators.racing"),
		},
		{
			id: 3,
			name: "Ethan Ward",
			image: "/creator3.png",
			category: t("mockCreators.podcast"),
		},
		{
			id: 4,
			name: "Julian Hayes",
			image: "/creator4.png",
			category: t("mockCreators.writing"),
		},
	];

	return (
		<main className="min-h-dvh bg-background">
			<Hero
				title={
					<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight">
						{t("landing.heroLineStart")}{" "}
						<span className="inline-block relative">
							<span className="relative z-10">
								{t("landing.heroLineHighlight")}
							</span>
							<svg
								className="absolute -bottom-2 left-0 w-full"
								height="12"
								viewBox="0 0 200 12"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M2 6C50 2 150 2 198 6C150 10 50 10 2 6Z"
									stroke="white"
									strokeWidth="3"
									strokeLinecap="round"
								/>
							</svg>
						</span>
						<br />
						{t("landing.heroLineCreators")}
						<br />
						<span className="relative inline-block">
							{t("landing.heroLineLove")}
							<Heart className="inline-block ml-4 size-16 md:size-20 fill-white text-white animate-pulse" />
						</span>
					</h1>
				}
				subtitle={
					<p className="text-xl md:text-2xl lg:text-3xl text-white/90 font-medium max-w-3xl mx-auto">
						{t("landing.heroSubheadlinePrefix")}
						<span className="font-bold text-white">
							{t("landing.heroSubheadlineHighlight")}
						</span>
					</p>
				}
				decorations={
					<>
						<div className="absolute top-20 right-1/4 opacity-20 hidden md:block">
							<Sparkles className="size-16 text-white" />
						</div>
						<div className="absolute bottom-20 left-1/4 opacity-20 hidden md:block">
							<Heart className="size-20 text-white" />
						</div>
					</>
				}
				contentClassName="max-w-5xl mx-auto space-y-8"
			>
				<div className="flex justify-center">
					<Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-6 py-3 text-base font-semibold gap-2 shadow-lg">
						<Lock className="size-5" />
						{t("landing.heroBadgeLabel")}
					</Badge>
				</div>
				<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
					<Button
						asChild
						size="lg"
						className="bg-white text-accent hover:bg-white/90 shadow-xl hover:shadow-2xl text-lg px-8 h-14"
					>
						<Link to="/register">
							<UserPlus className="size-6" />
							{t("landing.ctaCreator")}
						</Link>
					</Button>
					<Button
						asChild
						size="lg"
						variant="secondary"
						className="bg-black/30 backdrop-blur-sm text-white border-white/30 hover:bg-black/40 shadow-xl text-lg px-8 h-14"
					>
						<Link to="/tip">
							<Heart className="size-6" />
							{t("landing.ctaSupport")}
						</Link>
					</Button>
				</div>
			</Hero>

			{/* Creators Carousel Section */}
			<section className="py-16 md:py-24 bg-background">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
							{t("landing.carouselTitle")}
						</h2>
						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
							{t("landing.carouselSubtitle")}
						</p>
					</div>

					{/* Carousel */}
					<div className="max-w-7xl mx-auto">
						<Carousel
							opts={{
								align: "start",
								loop: true,
							}}
							className="w-full"
						>
							<CarouselContent className="-ml-4">
								{featuredCreators.map((creator) => (
									<CarouselItem
										key={creator.id}
										className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
									>
										<Link
											to={`/tip?creator=${creator.id}`}
											className="group block"
										>
											<div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white to-muted/30 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-2">
												{/* Creator Image */}
												<div className="aspect-[3/4] overflow-hidden">
													<img
														src={creator.image}
														alt={creator.name}
														className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
													/>
												</div>

												{/* Gradient Overlay */}
												<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

												{/* Creator Info */}
												<div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
													<h3 className="font-bold text-lg mb-1">
														{creator.name}
													</h3>
													<Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">
														{creator.category}
													</Badge>
												</div>

												{/* Support button overlay */}
												<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
													<Button size="lg" className="shadow-xl">
														<Heart className="size-5" />
														{t("landing.carouselSupport")}
													</Button>
												</div>
											</div>
										</Link>
									</CarouselItem>
								))}
							</CarouselContent>
							<CarouselPrevious className="hidden md:flex -left-12 bg-white shadow-lg border-border/60 hover:bg-muted" />
							<CarouselNext className="hidden md:flex -right-12 bg-white shadow-lg border-border/60 hover:bg-muted" />
						</Carousel>
					</div>

					{/* View All Button */}
					<div className="text-center mt-12">
						<Button
							asChild
							size="lg"
							variant="outline"
							className="text-lg px-8"
						>
							<Link to="/tip">{t("landing.carouselViewAll")}</Link>
						</Button>
					</div>
				</div>
			</section>
		</main>
	);
}
