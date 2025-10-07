import { useEffect, useState } from "react";

/**
 * Hook to manage Zama SDK initialization based on network
 * - Initializes on Sepolia (chainId 11155111)
 * - Cleans up on localhost or other networks
 */
export function useZamaSDK() {
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		let currentChainId: string | null = null;

		const initZamaSDK = async (chainId: number) => {
			// Only initialize for Sepolia (chainId 11155111)
			if (chainId !== 11155111) {
				if ((window as any).fhevm) {
					delete (window as any).fhevm;
				}
				if (mounted) {
					setIsInitialized(false);
					setError(null);
				}
				return;
			}

			// Already initialized for this network
			if ((window as any).fhevm && currentChainId === chainId.toString()) {
				if (mounted) setIsInitialized(true);
				return;
			}

			try {
				setIsLoading(true);
				setError(null);

				// Dynamic import of Zama SDK
				const { initSDK, createInstance, SepoliaConfig } = await import(
					/* @vite-ignore */
					/* @ts-expect-error */
					"https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js"
				);

				await initSDK();

				const ethereum = (window as any).ethereum;
				if (!ethereum) {
					throw new Error("No Ethereum provider found");
				}

				const cfg = { ...SepoliaConfig, network: ethereum };
				const instance = await createInstance(cfg);

				if (mounted) {
					(window as any).fhevm = instance;
					currentChainId = chainId.toString();
					setIsInitialized(true);
				}
			} catch (err) {
				console.error("[Zama SDK] Initialization failed:", err);
				if (mounted) {
					setError(err instanceof Error ? err.message : "Unknown error");
					setIsInitialized(false);
				}
			} finally {
				if (mounted) setIsLoading(false);
			}
		};

		const handleChainChanged = async (chainIdHex: string) => {
			const chainId = parseInt(chainIdHex, 16);
			console.info(`[Zama SDK] Chain changed to ${chainId}`);
			await initZamaSDK(chainId);
		};

		const setupListener = async () => {
			const ethereum = (window as any).ethereum;
			if (!ethereum) {
				console.warn("[Zama SDK] No Ethereum provider available");
				return;
			}

			try {
				// Get current chain ID
				const chainIdHex = await ethereum.request({ method: "eth_chainId" });
				const chainId = parseInt(chainIdHex, 16);
				await initZamaSDK(chainId);

				// Listen for chain changes
				ethereum.on("chainChanged", handleChainChanged);
			} catch (err) {
				console.error("[Zama SDK] Failed to get chain ID:", err);
			}
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

	return { isInitialized, isLoading, error };
}
