export const CHAINS = {
	sepolia: { id: 11155111, name: "sepolia" as const },
	localhost: { id: 31337, name: "localhost" as const },
};

export type ChainKey = keyof typeof CHAINS;

const env = (import.meta as any).env || {};

export const CONTRACTS: Record<
	ChainKey,
	{
		OnlyFHEn: `0x${string}`;
		Token: `0x${string}`;
	}
> = {
	sepolia: {
		OnlyFHEn: env.VITE_ONLYFHEN_ADDRESS_SEPOLIA,
		Token: env.VITE_TOKEN_ADDRESS_SEPOLIA,
	},
	localhost: {
		OnlyFHEn: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
		Token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
	},
};

export function getChainKeyFromId(chainId: number): ChainKey {
	const match = (
		Object.entries(CHAINS) as Array<[ChainKey, { id: number }]>
	).find(([, value]) => value.id === chainId);
	return match?.[0] ?? "localhost";
}
