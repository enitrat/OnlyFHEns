import type { Route } from "./+types/dashboard";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { PageContainer, SectionContainer } from "~/components/ui/container";
import { useTranslation } from "~/lib/i18n";
import { getSigner } from "~/lib/eth";
import { getNetwork } from "~/utils/getNetwork";
import { Badge } from "~/components/ui/badge";
import {
	ArrowDownToLine,
	CheckCircle,
	Coins,
	Lock,
	Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getCreator } from "~/lib/creators";
import { getTransactionErrorI18nKey } from "~/lib/parseTransactionError";
import { useNetwork } from "~/lib/useNetwork";
import { useWalletAction } from "~/lib/useWalletAction";
import { useAccount } from "wagmi";
import { onlyfhen } from "~/services/onlyfhen";
import { useFHE } from "~/hooks/useFHE";
import { useOperatorGuard } from "~/hooks/useOperatorGuard";
import { Hero } from "~/components/layout/Hero";
import { useBalanceStore } from "~/stores/useBalanceStore";

function shortenAddress(value?: string | null, chars = 4) {
	if (!value) return "";
	return `${value.slice(0, chars + 2)}…${value.slice(-chars)}`;
}

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Dashboard | OnlyFHEn" },
		{
			name: "description",
			content:
				"Creator dashboard for decrypting balances and managing withdrawals.",
		},
	];
}

export default function Dashboard() {
	const { contractAddress } = useNetwork();
	const { requireWallet } = useWalletAction();
	const { address: walletAddress, isConnected } = useAccount();
	const { decrypt, encryptUint64For } = useFHE();
	const { ensureOnlyFHEnOperator } = useOperatorGuard(contractAddress);
	const { refetchBalance } = useBalanceStore();
	const [amount, setAmount] = useState("");
	const [decryptStatus, setDecryptStatus] = useState("");
	const [decryptedValue, setDecryptedValue] = useState("");
	const [withdrawStatus, setWithdrawStatus] = useState("");
	const [withdrawTx, setWithdrawTx] = useState("");
	const [checking, setChecking] = useState(true);
	const [registrationError, setRegistrationError] = useState<string | null>(
		null,
	);
	const [redirecting, setRedirecting] = useState(false);
	const [creatorAddress, setCreatorAddress] = useState<string | null>(null);
	const [isDecrypting, setIsDecrypting] = useState(false);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const navigate = useNavigate();
	const { t } = useTranslation();

	useEffect(() => {
		let cancelled = false;
		let timeout: ReturnType<typeof setTimeout> | undefined;
		const checkRegistration = async () => {
			// Don't check registration if wallet is not connected
			if (!isConnected || !walletAddress) {
				setChecking(false);
				setCreatorAddress(null);
				setRegistrationError(null);
				return;
			}

			try {
				setChecking(true);
				setRegistrationError(null);
				setRedirecting(false);
				const addr = walletAddress;
				if (cancelled) return;
				setCreatorAddress(addr);

				if (!contractAddress) {
					setRegistrationError(
						t("dashboard.advanced.defaultLabel", {
							value: t("common.notConfigured"),
						}),
					);
					return;
				}

				const service = await onlyfhen(contractAddress);
				const registered = await service.isRegistered(addr);
				if (!registered) {
					setRegistrationError(t("dashboard.notRegistered"));
					setRedirecting(true);
					timeout = setTimeout(() => {
						navigate("/register", { replace: true });
					}, 1600);
				}
			} catch (error: any) {
				if (!cancelled) {
					setRegistrationError(error?.message || t("dashboard.notRegistered"));
				}
			} finally {
				if (!cancelled) setChecking(false);
			}
		};
		checkRegistration();
		return () => {
			cancelled = true;
			if (timeout) clearTimeout(timeout);
		};
	}, [contractAddress, navigate, t, isConnected, walletAddress]);

	const creatorLabel = useMemo(
		() => shortenAddress(creatorAddress),
		[creatorAddress],
	);
	const [welcomeName, setWelcomeName] = React.useState<string>(creatorLabel);

	React.useEffect(() => {
		const loadWelcomeName = async () => {
			if (!creatorAddress) {
				setWelcomeName(creatorLabel);
				return;
			}
			try {
				const network = await getNetwork();
				const prof = await getCreator(network, creatorAddress);
				setWelcomeName(prof?.name || creatorLabel);
			} catch {
				setWelcomeName(creatorLabel);
			}
		};
		loadWelcomeName();
	}, [creatorAddress, creatorLabel]);
	const disableActions = checking || !!registrationError || redirecting;

	const handleDecrypt = async () => {
		setIsDecrypting(true);

		let fetchToastId: string | undefined;
		let decryptToastId: string | undefined;

		try {
			setDecryptStatus(t("balance.status.fetching"));
			setDecryptedValue("");
			if (!contractAddress)
				throw new Error(t("balance.errors.missingContract"));

			// Step 1: Fetch encrypted balance
			fetchToastId = toast.loading(t("balance.loading.fetchingBalance"));
			const signer = await getSigner();
			const creator = creatorAddress || (await signer.getAddress());
			const service = await onlyfhen(contractAddress);
			const handle: string = await service.encryptedBalanceOf(creator);
			toast.success(t("balance.loading.balanceRetrieved"), {
				id: fetchToastId,
			});

			// Step 2: Decrypt balance
			decryptToastId = toast.loading(t("balance.loading.decryptingBalance"));
			setDecryptStatus(t("balance.status.submit"));
			const decrypted = await decrypt([{ handle, contractAddress }]);
			const value = decrypted[handle];
			setDecryptedValue(String(value));
			setDecryptStatus(t("balance.status.success"));
			toast.success(t("balance.loading.decryptionSuccess"), {
				id: decryptToastId,
				duration: 5000,
			});
		} catch (error: any) {
			console.error(error);

			// Dismiss all pending toasts
			if (fetchToastId) toast.dismiss(fetchToastId);
			if (decryptToastId) toast.dismiss(decryptToastId);

			const errorKey = getTransactionErrorI18nKey(error);
			const userMessage = t(errorKey);
			setDecryptStatus(userMessage);
			toast.error(userMessage, { duration: 6000 });
		} finally {
			setIsDecrypting(false);
		}
	};

	const handleWithdraw = async (e: FormEvent) => {
		e.preventDefault();
		setWithdrawStatus("");
		setWithdrawTx("");
		setIsWithdrawing(true);

		let operatorToastId: string | undefined;
		let encryptToastId: string | undefined;
		let submitToastId: string | undefined;
		let confirmToastId: string | undefined;

		try {
			if (!contractAddress)
				throw new Error(t("withdraw.errors.missingContract"));
			if (!amount) throw new Error(t("withdraw.errors.missingAmount"));

			const signer = await getSigner();
			const userAddr = await signer.getAddress();
			const service = await onlyfhen(contractAddress);

			// Step 1: Ensure operator permission
			operatorToastId = toast.loading(t("common.loading.checkingOperator"));
			const needsOperator = await ensureOnlyFHEnOperator();

			if (needsOperator) {
				toast.success(t("common.loading.operatorGranted"), {
					id: operatorToastId,
				});
			} else {
				toast.success(t("common.loading.operatorAlreadySet"), {
					id: operatorToastId,
				});
			}

			// Step 2: Encrypt withdrawal amount
			encryptToastId = toast.loading(t("withdraw.loading.encryptingAmount"));
			const encryptedData = await encryptUint64For(
				contractAddress,
				userAddr,
				BigInt(amount),
			);
			toast.success(t("common.loading.encrypted"), { id: encryptToastId });

			// Step 3: Submit withdrawal request
			submitToastId = toast.loading(t("withdraw.loading.submittingRequest"));
			const tx = await service.requestWithdraw(
				encryptedData.handle,
				encryptedData.inputProof,
			);
			toast.success(t("withdraw.loading.requestSubmitted"), {
				id: submitToastId,
			});

			// Step 4: Wait for confirmation
			confirmToastId = toast.loading(t("common.loading.confirmingTx"));
			setWithdrawStatus(t("withdraw.status.pending"));
			const receipt = await tx.wait();
			setWithdrawTx(receipt?.hash || tx.hash);
			setWithdrawStatus(t("withdraw.status.success"));
			toast.success(t("withdraw.status.success"), {
				id: confirmToastId,
				duration: 5000,
			});

			// Refetch balance after successful withdrawal
			refetchBalance();
		} catch (error: any) {
			console.error(error);

			// Dismiss all pending toasts
			if (operatorToastId) toast.dismiss(operatorToastId);
			if (encryptToastId) toast.dismiss(encryptToastId);
			if (submitToastId) toast.dismiss(submitToastId);
			if (confirmToastId) toast.dismiss(confirmToastId);

			const errorKey = getTransactionErrorI18nKey(error);
			const userMessage = t(errorKey);
			setWithdrawStatus(userMessage);
			toast.error(userMessage, { duration: 6000 });
		} finally {
			setIsWithdrawing(false);
		}
	};

	return (
		<main className="min-h-dvh">
			<Hero
				badge={t("dashboard.heroBadge")}
				title={t("dashboard.heroTitle")}
				subtitle={t("dashboard.heroSubtitle")}
			>
				<div className="flex flex-wrap justify-center gap-2 pt-2">
					{welcomeName && (
						<Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2">
							{t("dashboard.welcome", { name: welcomeName })}
						</Badge>
					)}
					{redirecting && (
						<Badge className="bg-warning/20 backdrop-blur-sm text-white border-warning/30 px-4 py-2">
							{t("dashboard.redirecting")}
						</Badge>
					)}
					{checking && (
						<Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 animate-pulse">
							Loading…
						</Badge>
					)}
				</div>

				{registrationError && (
					<div className="flex justify-center">
						<Alert className="mt-4 max-w-xl border-destructive/50 bg-destructive/10 text-destructive-foreground">
							<AlertDescription>{registrationError}</AlertDescription>
						</Alert>
					</div>
				)}
			</Hero>

			{/* Main Content - Single Card with Two States */}
			<section className="relative -mt-8 md:-mt-12 lg:-mt-16 pb-24 px-4 z-10">
				<div className="container mx-auto">
					<Card
						variant="gradient"
						className="shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow duration-300 w-full max-w-2xl lg:max-w-3xl mx-auto"
					>
						<CardHeader>
							<div className="flex items-center gap-3 mb-2">
								<div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
									{decryptedValue ? (
										<ArrowDownToLine className="size-6 text-primary" />
									) : (
										<Lock className="size-6 text-primary" />
									)}
								</div>
								<div>
									<CardTitle className="text-xl">
										{decryptedValue
											? t("dashboard.withdrawCard.title")
											: t("dashboard.balanceCard.title")}
									</CardTitle>
									<CardDescription className="mt-1">
										{decryptedValue
											? t("dashboard.withdrawCard.description")
											: t("dashboard.balanceCard.description")}
									</CardDescription>
								</div>
							</div>
						</CardHeader>

						{/* State 1: Require decryption */}
						{!decryptedValue && (
							<CardContent className="space-y-4">
								<Button
									onClick={requireWallet(handleDecrypt)}
									size="lg"
									className="w-full"
									disabled={disableActions || isDecrypting}
								>
									{isDecrypting ? (
										<>
											<Loader2 className="size-5 animate-spin" />
											{t("common.loading.decrypting")}
										</>
									) : (
										<>
											<Lock className="size-5" />
											{t("dashboard.balanceCard.button")}
										</>
									)}
								</Button>
								{decryptStatus && (
									<Alert>
										<AlertDescription>{decryptStatus}</AlertDescription>
									</Alert>
								)}
							</CardContent>
						)}

						{/* State 2: Decrypted → allow withdrawing up to available */}
						{decryptedValue && (
							<CardContent className="space-y-4">
								<Alert className="border-success/40 bg-success/10">
									<AlertDescription className="flex items-center gap-2">
										<CheckCircle className="size-4 text-success" />
										{t("balance.decryptedLabel", { value: decryptedValue })}
									</AlertDescription>
								</Alert>

								<form
									onSubmit={requireWallet(handleWithdraw)}
									className="space-y-4"
								>
									<div className="grid gap-2">
										<Label
											htmlFor="withdraw-amount"
											className="text-sm font-medium flex items-center gap-2"
										>
											<Coins className="size-4" />
											{t("withdraw.fields.amount")}
										</Label>
										<div className="flex gap-2">
											<Input
												id="withdraw-amount"
												required
												inputMode="numeric"
												value={amount}
												onChange={(e) => setAmount(e.target.value)}
												placeholder={t("withdraw.placeholders.amount")}
												className="flex-1"
											/>
											<Button
												type="button"
												variant="secondary"
												onClick={() => setAmount(String(decryptedValue))}
												disabled={disableActions}
											>
												{t("common.max") || "Max"}
											</Button>
										</div>
										<p className="text-xs text-muted-foreground">
											{t("withdraw.helper.available", {
												value: decryptedValue,
											})}
										</p>
									</div>
									<Button
										type="submit"
										size="lg"
										className="w-full"
										disabled={
											disableActions ||
											isWithdrawing ||
											!amount ||
											(() => {
												try {
													const a = BigInt(amount);
													const d = BigInt(decryptedValue);
													return a === 0n || a > d;
												} catch {
													return true;
												}
											})()
										}
									>
										{isWithdrawing ? (
											<>
												<Loader2 className="size-5 animate-spin" />
												{t("common.loading.processing")}
											</>
										) : (
											<>
												<ArrowDownToLine className="size-5" />
												{t("withdraw.button")}
											</>
										)}
									</Button>
									{withdrawStatus && (
										<Alert>
											<AlertDescription>{withdrawStatus}</AlertDescription>
										</Alert>
									)}
									{withdrawTx && (
										<Alert className="border-info/30 bg-info/10">
											<AlertDescription className="text-sm">
												{t("withdraw.tx.label")}{" "}
												<a
													className="text-primary underline underline-offset-4 hover:text-primary/80"
													href={`https://sepolia.etherscan.io/tx/${withdrawTx}`}
													target="_blank"
													rel="noreferrer"
												>
													{t("withdraw.tx.link")}
												</a>
											</AlertDescription>
										</Alert>
									)}
								</form>
							</CardContent>
						)}
					</Card>

					{/* Local FHE Status (localhost only) */}
					<div className="w-full max-w-3xl mx-auto mt-6"></div>
				</div>
			</section>
		</main>
	);
}
