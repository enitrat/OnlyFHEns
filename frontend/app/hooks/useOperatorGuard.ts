import { useCallback } from "react";
import { ensureOperator } from "~/lib/eth";
import { onlyfhen } from "~/services/onlyfhen";

export function useOperatorGuard(contractAddress?: string) {
	const ensureOnlyFHEnOperator = useCallback(async () => {
		if (!contractAddress) throw new Error("Contract address missing");
		const service = await onlyfhen(contractAddress);
		const tokenAddr = await service.tokenAddress();
		return ensureOperator(tokenAddr, contractAddress);
	}, [contractAddress]);

	return { ensureOnlyFHEnOperator };
}
