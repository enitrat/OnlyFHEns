import type { Route } from "./+types/register";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { SectionContainer } from "~/components/ui/container";
import { getSigner } from "~/lib/eth";
import { useTranslation } from "~/lib/i18n";
import {
	UserPlus,
	CheckCircle,
	Wallet,
	Shield,
	LockKeyhole,
	Sparkles,
	Users,
	Heart,
	TrendingUp,
	Globe,
	Loader2,
	X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { upsertCreator } from "~/lib/creators";
import { getNetwork } from "~/utils/getNetwork";
import { getTransactionErrorI18nKey } from "~/lib/parseTransactionError";
import { useNetwork } from "~/lib/useNetwork";
import { useWalletAction } from "~/lib/useWalletAction";
import { onlyfhen } from "~/services/onlyfhen";
import { Hero } from "~/components/layout/Hero";
import { useAccount } from "wagmi";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Devenir Créateur | OnlyFHEn" },
		{
			name: "description",
			content: "Financez vos contenus en toute confidentialité.",
		},
	];
}

export default function Register() {
	const { t } = useTranslation();
	const { contractAddress } = useNetwork();
	const { requireWallet } = useWalletAction();
	const { address, isConnected } = useAccount();
	const [status, setStatus] = useState<string>("");
	const [txHash, setTxHash] = useState<string>("");
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [displayName, setDisplayName] = useState("");
	const [xHandle, setXHandle] = useState("");
	const [showProfileModal, setShowProfileModal] = useState(false);
	const navigate = useNavigate();

	// Check if user is already registered and redirect to dashboard
	useEffect(() => {
		let cancelled = false;

		const checkRegistration = async () => {
			if (!isConnected || !address || !contractAddress) {
				return;
			}

			try {
				const service = await onlyfhen(contractAddress);
				const registered = await service.isRegistered(address);

				if (!cancelled && registered) {
					navigate("/dashboard", { replace: true });
				}
			} catch (error) {
				console.error("Error checking registration:", error);
			}
		};

		checkRegistration();

		return () => {
			cancelled = true;
		};
	}, [isConnected, address, contractAddress, navigate]);

	const onSubmit = async (e?: FormEvent) => {
		console.log("onSubmit", contractAddress);
		e?.preventDefault?.();
		setStatus("");
		setTxHash("");
		setIsSuccess(false);
		setIsLoading(true);

		let checkToastId: string | undefined;
		let submitToastId: string | undefined;
		let confirmToastId: string | undefined;

		try {
			if (!contractAddress)
				throw new Error(t("register.errors.missingContract"));

			// Step 1: Check registration status
			checkToastId = toast.loading(t("register.loading.checkingRegistration"));
			const signer = await getSigner();
			const addr = await signer.getAddress();
			const service = await onlyfhen(contractAddress);
			const registered = await service.isRegistered(addr);

			if (registered) {
				toast.success(t("register.loading.alreadyRegistered"), {
					id: checkToastId,
				});
				// Allow updating local profile even if already registered
				try {
					const network = await getNetwork();
					const safeName =
						(displayName || "").trim() ||
						`${addr.slice(0, 6)}…${addr.slice(-4)}`;
					await upsertCreator(network, {
						address: addr,
						name: safeName,
						x: xHandle.trim() || undefined,
					});
					toast.success(t("register.profile.saved"), { duration: 3000 });
				} catch {
					// ignore local save errors in MVP
				}
				navigate("/dashboard", { replace: true });
				return;
			}

			toast.success(t("register.loading.readyToRegister"), {
				id: checkToastId,
			});

			// Step 2: Submit registration transaction
			submitToastId = toast.loading(
				t("register.loading.submittingRegistration"),
			);
			const tx = await service.registerCreator();
			toast.success(t("common.loading.txSubmitted"), { id: submitToastId });

			// Step 3: Wait for confirmation
			confirmToastId = toast.loading(t("common.loading.confirmingTx"));
			setStatus(t("register.status.pending"));
			const receipt = await tx.wait();
			setTxHash(receipt?.hash || tx.hash);
			setStatus(t("register.status.success"));
			toast.success(t("register.status.success"), {
				id: confirmToastId,
				duration: 5000,
			});
			setIsSuccess(true);

			// Save creator profile locally once tx passes
			try {
				const network = await getNetwork();
				const safeName =
					(displayName || "").trim() || `${addr.slice(0, 6)}…${addr.slice(-4)}`;
				await upsertCreator(network, {
					address: addr,
					name: safeName,
					x: xHandle.trim() || undefined,
				});
				toast.success(t("register.profile.saved"), { duration: 3000 });
			} catch {
				console.error("error saving creator profile");
				// ignore local save errors in MVP
			}

			await new Promise((resolve) => setTimeout(resolve, 5000));
			navigate("/dashboard", { replace: true });
		} catch (err: any) {
			console.error(err);

			// Dismiss all pending toasts
			if (checkToastId) toast.dismiss(checkToastId);
			if (submitToastId) toast.dismiss(submitToastId);
			if (confirmToastId) toast.dismiss(confirmToastId);

			const errorKey = getTransactionErrorI18nKey(err);
			const userMessage = t(errorKey);
			setStatus(userMessage);
			toast.error(userMessage, { duration: 6000 });
		} finally {
			setIsLoading(false);
		}
	};

	const features = useMemo(
		() => [
			{
				icon: Shield,
				title: t("register.features.confidentiality.title"),
				desc: t("register.features.confidentiality.desc"),
			},
			{
				icon: Users,
				title: t("register.features.simplicity.title"),
				desc: t("register.features.simplicity.desc"),
			},
			{
				icon: Wallet,
				title: t("register.features.withdrawals.title"),
				desc: t("register.features.withdrawals.desc"),
			},
			{
				icon: LockKeyhole,
				title: t("register.features.control.title"),
				desc: t("register.features.control.desc"),
			},
		],
		[t],
	);

	return (
		<main className="min-h-dvh">
			<Hero
				badge={
					<>
						<Sparkles className="size-4" />
						<span>{t("register.heroBadge")}</span>
					</>
				}
			>
				<div className="grid gap-8 lg:gap-16 lg:grid-cols-2 items-start">
					{/* Left Column - Title, Subtitle & CTA */}
					<div className="flex flex-col gap-6 lg:gap-8">
						<div className="space-y-4">
							<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
								{t("register.heroTitle")}
							</h1>
							<p className="text-lg md:text-xl text-white/90">
								{t("register.heroSubtitle")}
							</p>
						</div>

						<div className="flex flex-col gap-4">
							<Button
								size="lg"
								className="bg-white text-accent hover:bg-white/90 shadow-xl px-8 w-fit mx-auto"
								onClick={requireWallet(() => setShowProfileModal(true))}
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="size-5 animate-spin" />
										{t("common.loading.processing")}
									</>
								) : (
									<>
										<UserPlus className="size-5" />
										{t("register.ctaPrimary")}
									</>
								)}
							</Button>

							{status && (
								<Alert
									className={`${
										isSuccess
											? "border-success/30 bg-success/10"
											: "bg-white/10 backdrop-blur-sm border-white/30"
									}`}
								>
									<AlertDescription className="flex items-center gap-2 text-white">
										{isSuccess && <CheckCircle className="size-4 text-white" />}
										{status}
									</AlertDescription>
								</Alert>
							)}

							{txHash && (
								<Alert className="bg-white/10 backdrop-blur-sm border-white/30">
									<AlertDescription className="text-sm text-white">
										{t("common.txLabel")}{" "}
										<a
											className="text-white underline underline-offset-4 hover:text-white/80 font-semibold"
											href={`https://sepolia.etherscan.io/tx/${txHash}`}
											target="_blank"
											rel="noreferrer"
										>
											{t("common.viewExplorer")}
										</a>
									</AlertDescription>
								</Alert>
							)}
						</div>
					</div>

					{/* Right Column - Creator Preview Card */}
					<div className="hidden lg:block">
						<Card variant="gradient" className="shadow-2xl overflow-hidden">
							<CardContent className="p-0">
								{/* Creator Profile Header */}
								<div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-6 border-b border-border/60">
									<div className="flex items-center gap-3 mb-4">
										<div className="size-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
											R
										</div>
										<div>
											<h3 className="font-semibold text-lg">Rock Riot</h3>
											<p className="text-sm text-muted-foreground">@rockriot</p>
										</div>
									</div>
									{/* Stats Pills */}
									<div className="flex gap-2 flex-wrap">
										<div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
											<Users className="size-3 text-primary" />
											<span>12.5K fans</span>
										</div>
										<div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
											<Heart className="size-3 text-destructive" />
											<span>348 tips</span>
										</div>
										<div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
											<Globe className="size-3 text-secondary" />
											<span>Worldwide</span>
										</div>
									</div>
								</div>

								{/* Image */}
								<div className="aspect-video bg-muted relative overflow-hidden">
									<img
										src="/creator_rock.png"
										alt="A Rock Band Playing Music"
										className="w-full h-full object-cover"
									/>
									<div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
										<TrendingUp className="size-3 text-success" />
										<span>Trending</span>
									</div>
								</div>

								{/* Engagement Stats */}
								<div className="grid grid-cols-3 gap-px bg-border/60">
									<div className="bg-card p-4 text-center">
										<div className="text-2xl font-bold text-primary">152</div>
										<div className="text-xs text-muted-foreground mt-1">
											Posts
										</div>
									</div>
									<div className="bg-card p-4 text-center">
										<div className="text-2xl font-bold text-secondary">89%</div>
										<div className="text-xs text-muted-foreground mt-1">
											Engagement
										</div>
									</div>
									<div className="bg-card p-4 text-center">
										<div className="text-2xl font-bold text-success">4.9</div>
										<div className="text-xs text-muted-foreground mt-1">
											Rating
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</Hero>

			{/* Profile Modal */}
			{showProfileModal && (
				<div className="fixed inset-0 z-50">
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => !isLoading && setShowProfileModal(false)}
					/>
					<div className="absolute inset-0 flex items-center justify-center p-4">
						<Card className="w-full max-w-lg">
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>{t("register.profile.title")}</CardTitle>
									<CardDescription>
										{t("register.profile.description")}
									</CardDescription>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => !isLoading && setShowProfileModal(false)}
									aria-label="Close"
								>
									<X className="size-5" />
								</Button>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="modal-creator-name">
										{t("register.profile.fields.name")}
									</Label>
									<Input
										id="modal-creator-name"
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
										placeholder={t("register.profile.placeholders.name")}
										disabled={isLoading}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="modal-creator-handle">
										{t("register.profile.fields.x")}
									</Label>
									<Input
										id="modal-creator-handle"
										value={xHandle}
										onChange={(e) => setXHandle(e.target.value)}
										placeholder={t("register.profile.placeholders.x")}
										disabled={isLoading}
									/>
								</div>
								<div className="flex gap-2 justify-end pt-2">
									<Button
										type="button"
										variant="secondary"
										onClick={() => setShowProfileModal(false)}
										disabled={isLoading}
									>
										Cancel
									</Button>
									<Button
										type="button"
										onClick={() => {
											const name = (displayName || "").trim();
											if (!name) {
												toast.error(t("register.profile.errors.nameRequired"));
												return;
											}
											setShowProfileModal(false);
											onSubmit();
										}}
										disabled={isLoading}
									>
										{isLoading ? (
											<>
												<Loader2 className="size-5 animate-spin" />
												{t("common.loading.processing")}
											</>
										) : (
											t("register.ctaPrimary")
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			)}

			{/* Reasons section */}
			<SectionContainer maxWidth="full" className="py-12 md:py-16">
				<h2 className="text-2xl md:text-3xl font-semibold text-center">
					{t("register.reasons.title")}
				</h2>
				<p className="text-muted-foreground text-center mt-2 max-w-2xl mx-auto">
					{t("register.reasons.subtitle")}
				</p>
				<div className="mt-10 grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((f, i) => (
						<Card key={i} variant="elevated">
							<CardHeader>
								<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
									<f.icon className="h-5 w-5" />
								</div>
								<CardTitle className="mt-3 text-base">{f.title}</CardTitle>
								<CardDescription>{f.desc}</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</SectionContainer>
		</main>
	);
}
