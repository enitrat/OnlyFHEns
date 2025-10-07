import { getProvider } from "~/lib/eth";
import {
	CONTRACTS,
	type ChainKey,
	getChainKeyFromId,
} from "~/config/contracts";

export type NetworkType = ChainKey;

/**
 * Gets the current network from the connected wallet
 * @returns "sepolia" if connected to Sepolia (chainId 11155111), "localhost" otherwise
 */
export async function getNetwork(): Promise<NetworkType> {
	try {
		const provider = await getProvider();
		const network = await provider.getNetwork();
		const chainId = Number(network.chainId);
		return getChainKeyFromId(chainId);
	} catch (error) {
		console.warn(
			"Failed to get network from wallet, defaulting to localhost:",
			error,
		);
		return "localhost";
	}
}

/**
 * Checks if the current network is Sepolia
 * @returns true if connected to Sepolia
 */
export async function isSepolia(): Promise<boolean> {
	const network = await getNetwork();
	return network === "sepolia";
}

/**
 * Checks if the current network is local
 * @returns true if connected to local network
 */
export async function isLocal(): Promise<boolean> {
	const network = await getNetwork();
	return network === "localhost";
}

/**
 * Gets the OnlyFHEn contract address for the current network
 * @returns Contract address from environment variables based on current network
 */
export async function getOnlyFHEnAddress(): Promise<string> {
	const network = await getNetwork();
	const contracts = CONTRACTS[network];
	if (!contracts?.OnlyFHEn) {
		throw new Error(`OnlyFHEn address not configured for network: ${network}`);
	}
	return contracts.OnlyFHEn;
}

export function getContractsFor(network: ChainKey) {
	return CONTRACTS[network];
}
