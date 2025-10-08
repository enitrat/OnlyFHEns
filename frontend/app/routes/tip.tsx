import type { Route } from "./+types/tip";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { getSigner } from "~/lib/eth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useTranslation } from "~/lib/i18n";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { getCreators, type CreatorProfile } from "~/lib/creators";
import { getNetwork } from "~/utils/getNetwork";
import { getTransactionErrorI18nKey } from "~/lib/parseTransactionError";
import { useNetwork } from "~/lib/useNetwork";
import { useWalletAction } from "~/lib/useWalletAction";
import { onlyfhen } from "~/services/onlyfhen";
import { useFHE } from "~/hooks/useFHE";
import { useOperatorGuard } from "~/hooks/useOperatorGuard";
import { Hero } from "~/components/layout/Hero";
import { useBalanceStore } from "~/stores/useBalanceStore";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Envoyer un pourboire | OnlyFHEn" },
		{
			name: "description",
			content: "Envoyez un pourboire en toute confidentialité",
		},
	];
}

export default function Tip() {
	const { t } = useTranslation();
	const { contractAddress } = useNetwork();
	const { requireWallet } = useWalletAction();
	const { decrypt, encryptUint64For } = useFHE();
	const { ensureOnlyFHEnOperator } = useOperatorGuard(contractAddress);
	const { balance: globalBalance, refetchBalance } = useBalanceStore();
	const [creator, setCreator] = useState("");
	const [amount, setAmount] = useState("");
	const [status, setStatus] = useState<string>("");
	const [txHash, setTxHash] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [savedCreators, setSavedCreators] = useState<CreatorProfile[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");

	useEffect(() => {
		let mounted = true;
		const loadCreators = async () => {
			try {
				const network = await getNetwork();
				const creators = await getCreators(network);
				if (mounted) {
					setSavedCreators(creators);
				}
			} catch {
				if (mounted) {
					setSavedCreators([]);
				}
			}
		};
		loadCreators();
		return () => {
			mounted = false;
		};
	}, []);

	const shortAddr = (value?: string | null, chars = 4) => {
		if (!value) return "";
		return `${value.slice(0, chars + 2)}…${value.slice(-chars)}`;
	};

	function normalize(s: string) {
		return (s || "").toLowerCase();
	}

	function isSubsequence(q: string, t: string) {
		if (!q) return true;
		let i = 0,
			j = 0;
		while (i < q.length && j < t.length) {
			if (q[i] === t[j]) i++;
			j++;
		}
		return i === q.length;
	}

	function scoreCandidate(q: string, c: CreatorProfile) {
		const target = normalize(
			`${c.name} ${c.address} ${c.x ?? ""} ${c.instagram ?? ""}`,
		);
		const queryN = normalize(q);
		if (!queryN) return 100; // no filter => top
		if (target.includes(queryN)) return 80;
		if (isSubsequence(queryN, target)) return 50;
		return 0;
	}

	const filtered = useMemo(() => {
		const list = savedCreators
			.map((c) => ({ c, s: scoreCandidate(query, c) }))
			.filter((x) => x.s > 0 || query === "")
			.sort(
				(a, b) =>
					b.s - a.s ||
					(a.c.name || a.c.address).localeCompare(b.c.name || b.c.address),
			)
			.map((x) => x.c);
		return list;
	}, [savedCreators, query]);

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setStatus("");
		setTxHash("");
		setIsLoading(true);

		let operatorToastId: string | undefined;
		let encryptToastId: string | undefined;
		let submitToastId: string | undefined;
		let confirmToastId: string | undefined;

		try {
			if (!contractAddress) throw new Error(t("tip.errors.missingContract"));
			if (!creator) throw new Error(t("tip.errors.missingCreator"));
			if (!amount) throw new Error(t("tip.errors.missingAmount"));

			const signer = await getSigner();
			const userAddr = await signer.getAddress();
			const service = await onlyfhen(contractAddress);

			// Step 1: Check if operator needs to be set
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

			// Step 2: Encrypt amount
			encryptToastId = toast.loading(t("tip.loading.encryptingTip"));
			const encryptedData = await encryptUint64For(
				contractAddress,
				userAddr,
				BigInt(amount),
			);
			toast.success(t("common.loading.encrypted"), { id: encryptToastId });

			// Step 3: Submit transaction
			submitToastId = toast.loading(t("tip.loading.submittingTip"));
			const tx = await service.tipCreator(
				creator,
				encryptedData.handle,
				encryptedData.inputProof,
			);
			toast.success(t("common.loading.txSubmitted"), { id: submitToastId });

			// Step 4: Wait for confirmation
			confirmToastId = toast.loading(t("common.loading.confirmingTx"));
			setStatus(t("tip.status.tipPending"));
			const receipt = await tx.wait();
			setTxHash(receipt?.hash || tx.hash);
			setStatus(t("tip.status.tipSuccess"));
			toast.success(t("tip.status.tipSuccess"), {
				id: confirmToastId,
				duration: 5000,
			});

			// Refetch balance after successful tip
			refetchBalance();
		} catch (err: any) {
			console.error(err);

			// Dismiss all pending toasts
			if (operatorToastId) toast.dismiss(operatorToastId);
			if (encryptToastId) toast.dismiss(encryptToastId);
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

	return (
		<main className="min-h-dvh bg-background">
			<Hero
				badge={t("tip.heroBadge")}
				title={t("tip.heroTitle")}
				subtitle={t("tip.heroSubtitle")}
			/>

			{/* Content */}
			<section className="-mt-12 md:-mt-16 pb-16 px-4">
				<div className="container mx-auto flex justify-center">
					<Card className="shadow-[0_2px_8px_rgba(10,20,40,0.06)] w-full max-w-2xl">
						<CardHeader>
							<CardTitle>{t("tip.title")}</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={requireWallet(onSubmit)} className="space-y-4">
								<div className="grid gap-2">
									<Label>{t("tip.fields.creator")}</Label>
									<div className="relative">
										<button
											type="button"
											className="w-full h-10 min-w-0 rounded-lg border bg-muted/30 px-4 text-left shadow-inner hover:bg-muted/40"
											onClick={() => setIsOpen((v) => !v)}
										>
											{creator
												? (() => {
														const sel = savedCreators.find(
															(c) =>
																c.address.toLowerCase() ===
																creator.toLowerCase(),
														);
														const label = sel?.name || shortAddr(creator);
														return `${label}`;
													})()
												: t("tip.creatorsDropdown.choose")}
										</button>
										{isOpen && (
											<div className="absolute z-10 mt-1 w-full rounded-lg border bg-background shadow-lg">
												<div className="p-2">
													<Input
														autoFocus
														placeholder={t("tip.creatorsDropdown.search")}
														value={query}
														onChange={(e) => setQuery(e.target.value)}
													/>
												</div>
												<div className="max-h-56 overflow-auto p-1">
													{filtered.length === 0 ? (
														<div className="px-3 py-2 text-sm text-muted-foreground">
															{t("tip.creatorsDropdown.noResults")}
														</div>
													) : (
														filtered.map((c) => (
															<button
																key={c.address}
																type="button"
																className="w-full text-left px-3 py-2 rounded-md hover:bg-muted"
																onClick={() => {
																	setCreator(c.address);
																	setIsOpen(false);
																}}
															>
																<div className="font-medium truncate">
																	{c.name || shortAddr(c.address)}
																</div>
																<div className="text-xs text-muted-foreground truncate">
																	{shortAddr(c.address)}
																	{c.x ? ` • ${c.x}` : ""}
																	{c.instagram ? ` • ${c.instagram}` : ""}
																</div>
															</button>
														))
													)}
												</div>
											</div>
										)}
									</div>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="amount">{t("tip.fields.amount")}</Label>
									<div className="flex gap-2">
										<Input
											id="amount"
											required
											value={amount}
											onChange={(e) => setAmount(e.target.value)}
											placeholder={t("tip.placeholders.amount")}
											className="flex-1"
										/>
										<Button
											type="button"
											variant="ghost"
											onClick={() => setAmount(String(globalBalance))}
											disabled={!globalBalance}
										>
											{t("common.max")}
										</Button>
									</div>
									{globalBalance && (
										<p className="text-xs text-muted-foreground">
											{t("withdraw.helper.available", {
												value: globalBalance,
											})}
										</p>
									)}
								</div>
								<Button
									type="submit"
									size="lg"
									disabled={isLoading || !creator}
									className="w-full"
								>
									{isLoading ? (
										<>
											<Loader2 className="size-5 animate-spin" />
											{t("common.loading.processing")}
										</>
									) : (
										t("tip.buttons.submit")
									)}
								</Button>
								{txHash && (
									<Alert>
										<AlertDescription>
											{t("tip.tx.label")}
											<a
												className="underline"
												href={`https://sepolia.etherscan.io/tx/${txHash}`}
												target="_blank"
												rel="noreferrer"
											>
												{t("tip.tx.link")}
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
