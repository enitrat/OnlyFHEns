import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useFHE } from "~/hooks/useFHE";
import { useNetwork } from "~/lib/useNetwork";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { useBalanceStore } from "~/stores/useBalanceStore";
import { useTranslation } from "~/lib/i18n";

export function CustomConnectButton() {
	const { address, isConnected } = useAccount();
	const { contractAddress } = useNetwork();
	const { decrypt } = useFHE();
	const {
		balance,
		isLoading: isLoadingBalance,
		fetchBalance,
		reset,
	} = useBalanceStore();
	const hasFetchedRef = useRef(false);
	const prevAddressRef = useRef<string | undefined>(address);
	const { t } = useTranslation();

	// Reset when disconnected
	useEffect(() => {
		if (!isConnected) {
			reset();
			hasFetchedRef.current = false;
			prevAddressRef.current = undefined;
		}
	}, [isConnected, reset]);

	// Detect account switch and refetch
	useEffect(() => {
		if (
			isConnected &&
			address &&
			prevAddressRef.current &&
			prevAddressRef.current !== address
		) {
			// Account switched - refetch balance
			hasFetchedRef.current = false;
			reset();
		}
		prevAddressRef.current = address;
	}, [address, isConnected, reset]);

	// Fetch balance when connected
	useEffect(() => {
		if (
			isConnected &&
			address &&
			contractAddress &&
			!hasFetchedRef.current &&
			balance === null &&
			!isLoadingBalance
		) {
			hasFetchedRef.current = true;
			fetchBalance(address, contractAddress, decrypt);
		}
	}, [
		isConnected,
		address,
		contractAddress,
		balance,
		isLoadingBalance,
		fetchBalance,
		decrypt,
	]);

	return (
		<ConnectButton.Custom>
			{({
				account,
				chain,
				openAccountModal,
				openChainModal,
				openConnectModal,
				authenticationStatus,
				mounted,
			}) => {
				const ready = mounted && authenticationStatus !== "loading";
				const connected =
					ready &&
					account &&
					chain &&
					(!authenticationStatus || authenticationStatus === "authenticated");

				return (
					<div
						{...(!ready && {
							"aria-hidden": true,
							style: {
								opacity: 0,
								pointerEvents: "none",
								userSelect: "none",
							},
						})}
					>
						{(() => {
							if (!connected) {
								return (
									<Button onClick={openConnectModal} variant="default">
										Connect Wallet
									</Button>
								);
							}

							if (chain.unsupported) {
								return (
									<Button onClick={openChainModal} variant="destructive">
										Wrong network
									</Button>
								);
							}

							return (
								<div className="flex gap-2">
									<Button
										onClick={openChainModal}
										variant="outline"
										size="sm"
										className="gap-2"
									>
										{chain.hasIcon && chain.iconUrl && (
											<img
												alt={chain.name ?? "Chain icon"}
												src={chain.iconUrl}
												className="size-4"
											/>
										)}
										<span className="hidden sm:inline">{chain.name}</span>
									</Button>

									<Button
										onClick={openAccountModal}
										variant="outline"
										size="sm"
										className="gap-2"
									>
										{isLoadingBalance ? (
											<>
												<Loader2 className="size-4 animate-spin" />
												<span className="hidden sm:inline">
													{t("common.loading.decrypting")}
												</span>
											</>
										) : balance !== null ? (
											<>
												<span className="font-mono">{balance}</span>
												<span className="hidden sm:inline">tokens</span>
											</>
										) : (
											account.displayName
										)}
									</Button>
								</div>
							);
						})()}
					</div>
				);
			}}
		</ConnectButton.Custom>
	);
}
