import { create } from "zustand";
import { getSigner } from "~/lib/eth";
import { onlyfhen } from "~/services/onlyfhen";

interface DecryptFunction {
	(
		requests: Array<{ handle: string; contractAddress: string }>,
	): Promise<Record<string, bigint>>;
}

interface BalanceState {
	balance: string | null;
	isLoading: boolean;
	error: string | null;
	fetchBalance: (
		address: string,
		contractAddress: string,
		decrypt: DecryptFunction,
	) => Promise<void>;
	refetchBalance: () => Promise<void>;
	reset: () => void;
	// Store the last fetch params for refetch
	lastFetchParams: {
		address: string;
		contractAddress: string;
		decrypt: DecryptFunction;
	} | null;
}

export const useBalanceStore = create<BalanceState>((set, get) => ({
	balance: null,
	isLoading: false,
	error: null,
	lastFetchParams: null,
	fetchBalance: async (address, contractAddress, decrypt) => {
		set({
			isLoading: true,
			error: null,
			lastFetchParams: { address, contractAddress, decrypt },
		});

		try {
			const signer = await getSigner();
			const userAddr = await signer.getAddress();

			// Get token from OnlyFHEn
			const service = await onlyfhen(contractAddress);
			const tokenAddr: string = await service.tokenAddress();
			const token = await service.token(false);
			const handle: string = await token.confidentialBalanceOf(userAddr);
			if (
				handle ==
				"0x0000000000000000000000000000000000000000000000000000000000000000"
			) {
				set({ balance: "0", isLoading: false });
				return;
			}

			// Decrypt the balance
			const result = await decrypt([{ handle, contractAddress: tokenAddr }]);
			const value = result[handle];

			set({ balance: String(value), isLoading: false });
		} catch (error) {
			console.error("Failed to fetch balance:", error);
			set({
				error: error instanceof Error ? error.message : "Unknown error",
				isLoading: false,
			});
		}
	},
	refetchBalance: async () => {
		const { lastFetchParams } = get();
		if (!lastFetchParams) {
			console.warn("No previous fetch params available for refetch");
			return;
		}
		const { address, contractAddress, decrypt } = lastFetchParams;
		await get().fetchBalance(address, contractAddress, decrypt);
	},
	reset: () =>
		set({
			balance: null,
			isLoading: false,
			error: null,
			lastFetchParams: null,
		}),
}));
