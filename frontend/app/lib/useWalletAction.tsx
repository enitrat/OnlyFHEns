import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

/**
 * Hook to check wallet connection before executing an action.
 * If wallet is not connected, opens the connect modal instead.
 *
 * @returns Object with isConnected status and requireWallet function
 */
export function useWalletAction() {
	const { isConnected } = useAccount();
	const { openConnectModal } = useConnectModal();

	/**
	 * Wraps an action to require wallet connection.
	 * If wallet is connected, executes the action.
	 * If wallet is not connected, opens the connect modal.
	 *
	 * @param action - The action to execute if wallet is connected
	 * @returns A wrapped function that checks wallet connection first
	 */
	const requireWallet = <T extends any[]>(
		action: (...args: T) => void | Promise<void>,
	) => {
		return (...args: T) => {
			if (!isConnected) {
				openConnectModal?.();
				return;
			}
			return action(...args);
		};
	};

	return {
		isConnected,
		requireWallet,
	};
}
