import { useEffect, useState } from "react";
import { CONTRACTS } from "~/config/contracts";
import { getNetwork, type NetworkType } from "~/utils/getNetwork";

/**
 * Hook that tracks the current network and provides network-specific values
 * Automatically updates when the user switches networks in their wallet
 */
export function useNetwork() {
	const [network, setNetwork] = useState<NetworkType>("localhost");
	const [contractAddress, setContractAddress] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let mounted = true;

		const updateNetwork = async () => {
			try {
				setIsLoading(true);
				const currentNetwork = await getNetwork();
				const address = CONTRACTS[currentNetwork]?.OnlyFHEn || "";

				if (mounted) {
					setNetwork(currentNetwork);
					setContractAddress(address);
				}
			} catch (error) {
				console.error("[useNetwork] Failed to get network:", error);
				if (mounted) {
					setNetwork("localhost");
					setContractAddress("");
				}
			} finally {
				if (mounted) {
					setIsLoading(false);
				}
			}
		};

		const handleChainChanged = (chainIdHex: string) => {
			const chainId = parseInt(chainIdHex, 16);
			console.info(`[useNetwork] Chain changed to ${chainId}`);
			updateNetwork();
		};

		const setupListener = () => {
			const ethereum = (window as any).ethereum;
			if (!ethereum) {
				console.warn("[useNetwork] No Ethereum provider available");
				setIsLoading(false);
				return;
			}

			// Initial network detection
			updateNetwork();

			// Listen for network changes
			ethereum.on("chainChanged", handleChainChanged);
		};

		setupListener();

		return () => {
			mounted = false;
			const ethereum = (window as any).ethereum;
			if (ethereum?.removeListener) {
				ethereum.removeListener("chainChanged", handleChainChanged);
			}
		};
	}, []);

	return {
		network,
		contractAddress,
		isLoading,
		isSepolia: network === "sepolia",
		isLocalhost: network === "localhost",
	};
}
