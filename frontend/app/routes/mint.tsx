import type { Route } from "./+types/mint";
import { type FormEvent, useState, useEffect } from "react";
import { Navbar } from "~/components/navbar";
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
import { getContract, getSigner } from "~/lib/eth";
import MockTokenArtifact from "../../../artifacts/contracts/mocks/MockConfidentialFungibleToken.sol/MockConfidentialFungibleToken.json";
import { useTranslation } from "~/lib/i18n";
import { isSepolia } from "~/utils/getNetwork";
import { useWalletAction } from "~/lib/useWalletAction";
import { db } from "~/lib/db";

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
	const env = (import.meta as any).env || {};
	const defaultToken = env.VITE_TOKEN_ADDRESS_SEPOLIA;
	const [tokenAddress, setTokenAddress] = useState<string>(defaultToken);
	const [amount, setAmount] = useState<string>("");
	const [status, setStatus] = useState<string>("");
	const [txHash, setTxHash] = useState<string>("");
	const [isSepoliaNetwork, setIsSepoliaNetwork] = useState<boolean>(false);

	useEffect(() => {
		isSepolia()
			.then(setIsSepoliaNetwork)
			.catch(() => setIsSepoliaNetwork(false));
	}, []);

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setStatus("");
		setTxHash("");
		try {
			if (!tokenAddress) throw new Error(t("mint.errors.missingToken"));
			if (!amount) throw new Error(t("mint.errors.missingAmount"));
			const signer = await getSigner();
			const me = await signer.getAddress();
			const token = await getContract<any>(
				tokenAddress,
				MockTokenArtifact.abi,
				true,
			);
			const tx = await token.mint(me, Number(amount));
			setStatus(t("mint.status.pending"));
			const receipt = await tx.wait();
			setTxHash(receipt?.hash || tx.hash);
			setStatus(t("mint.status.success"));
		} catch (err: any) {
			console.error(err);
			setStatus(err?.message || t("mint.status.error"));
		}
	};

	return (
		<main className="min-h-dvh bg-background">
			<Navbar />
			<section className="relative min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4">
				<div className="w-full max-w-2xl">
					<Card className="shadow-[0_2px_8px_rgba(10,20,40,0.06)]">
						<CardHeader>
							<CardTitle>{t("mint.title")}</CardTitle>
							<CardDescription>{t("mint.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={requireWallet(onSubmit)} className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="token">{t("mint.fields.token")}</Label>
									<Input
										id="token"
										value={tokenAddress}
										onChange={(e) => setTokenAddress(e.target.value)}
										placeholder={t("mint.placeholders.token")}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="amount">{t("mint.fields.amount")}</Label>
									<Input
										id="amount"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										placeholder={t("mint.placeholders.amount")}
									/>
								</div>
								<Button type="submit" size="lg">
									{t("mint.button")}
								</Button>
								{isSepoliaNetwork && (
									<Alert>
										<AlertDescription>{t("mint.noteSepolia")}</AlertDescription>
									</Alert>
								)}
								{status && (
									<Alert>
										<AlertDescription>{status}</AlertDescription>
									</Alert>
								)}
								{txHash && (
									<Alert>
										<AlertDescription>
											{t("mint.tx.label")}
											<a
												className="underline"
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
