import type { Route } from "./+types/mint";
import { type FormEvent, useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { getContract, getSigner } from "~/lib/eth";
import MockTokenArtifact from "../../../artifacts/contracts/mocks/MockConfidentialFungibleToken.sol/MockConfidentialFungibleToken.json";
import { useTranslation } from "~/lib/i18n";
import { isSepolia } from "~/utils/getNetwork";
import { useWalletAction } from "~/lib/useWalletAction";
import { db } from "~/lib/db";
import { useBalanceStore } from "~/stores/useBalanceStore";
import { Hero } from "~/components/layout/Hero";
import { Coins, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Frappe (dev) | OnlyFHEn" },
		{
			name: "description",
			content: "Frapper des jetons confidentiels (en dev)",
		},
	];
}

export default function Mint() {
	const { t } = useTranslation();
	const { requireWallet } = useWalletAction();
	const { refetchBalance } = useBalanceStore();
	const env = (import.meta as any).env || {};
	const defaultToken = env.VITE_TOKEN_ADDRESS_SEPOLIA;
	const [tokenAddress] = useState<string>(defaultToken);
	const [txHash, setTxHash] = useState<string>("");
	const [isSepoliaNetwork, setIsSepoliaNetwork] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		isSepolia()
			.then(setIsSepoliaNetwork)
			.catch(() => setIsSepoliaNetwork(false));
	}, []);

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setTxHash("");
		setIsLoading(true);

		const MINT_AMOUNT = 1000;
		let submitToastId: string | undefined;
		let confirmToastId: string | undefined;

		try {
			if (!tokenAddress) throw new Error(t("mint.errors.missingToken"));

			const signer = await getSigner();
			const me = await signer.getAddress();
			const token = await getContract<any>(
				tokenAddress,
				MockTokenArtifact.abi,
				true,
			);

			// Submit transaction
			submitToastId = toast.loading(t("mint.loading.submitting"));
			const tx = await token.mint(me, MINT_AMOUNT);
			toast.success(t("mint.loading.submitted"), { id: submitToastId });

			// Wait for confirmation
			confirmToastId = toast.loading(t("common.loading.confirmingTx"));
			const receipt = await tx.wait();
			setTxHash(receipt?.hash || tx.hash);
			toast.success(
				t("mint.status.successWithAmount", { amount: MINT_AMOUNT }),
				{
					id: confirmToastId,
					duration: 5000,
				},
			);

			// Refetch balance after successful mint
			refetchBalance();
		} catch (err: any) {
			console.error(err);

			// Dismiss pending toasts
			if (submitToastId) toast.dismiss(submitToastId);
			if (confirmToastId) toast.dismiss(confirmToastId);

			const errorMessage = err?.message || t("mint.status.error");
			toast.error(errorMessage, { duration: 6000 });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="min-h-dvh bg-background">
			<Hero
				badge={t("mint.heroBadge")}
				title={t("mint.heroTitle")}
				subtitle={t("mint.heroSubtitle")}
			/>

			{/* Content */}
			<section className="-mt-12 md:-mt-16 pb-16 px-4">
				<div className="container mx-auto flex justify-center">
					<Card className="shadow-[0_2px_8px_rgba(10,20,40,0.06)] w-full max-w-2xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Coins className="size-6" />
								{t("mint.title")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isSepoliaNetwork && (
								<Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
									<AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
									<AlertDescription className="text-amber-800 dark:text-amber-200">
										{t("mint.noteSepolia")}
									</AlertDescription>
								</Alert>
							)}

							<form onSubmit={requireWallet(onSubmit)} className="space-y-6">
								<div className="text-center space-y-2 py-8">
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
										<Coins className="size-8 text-primary" />
									</div>
									<p className="text-muted-foreground">
										{t("mint.description")}
									</p>
								</div>

								<Button
									type="submit"
									size="lg"
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? (
										<>
											<Loader2 className="size-5 animate-spin" />
											{t("common.loading.processing")}
										</>
									) : (
										<>
											<Coins className="size-5" />
											{t("mint.button")}
										</>
									)}
								</Button>

								{txHash && (
									<Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
										<AlertDescription className="text-green-800 dark:text-green-200">
											{t("mint.tx.label")}{" "}
											<a
												className="underline font-medium hover:text-green-900 dark:hover:text-green-100"
												href={`https://sepolia.etherscan.io/tx/${txHash}`}
												target="_blank"
												rel="noreferrer"
											>
												{t("mint.tx.link")}
											</a>
										</AlertDescription>
									</Alert>
								)}
							</form>
						</CardContent>
					</Card>
				</div>
			</section>
		</main>
	);
}
