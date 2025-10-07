import OnlyFHEnArtifact from "../../../artifacts/contracts/OnlyFHEn.sol/OnlyFHEn.json";
import MockTokenArtifact from "../../../artifacts/contracts/mocks/MockConfidentialFungibleToken.sol/MockConfidentialFungibleToken.json";
import { getContract } from "~/lib/eth";

type ReadWriteOnlyFHEn = any;

export async function onlyfhen(address: string) {
	const writable = await getContract<ReadWriteOnlyFHEn>(
		address,
		OnlyFHEnArtifact.abi,
		true,
	);
	const ro = await getContract<ReadWriteOnlyFHEn>(
		address,
		OnlyFHEnArtifact.abi,
		false,
	);

	return {
		isRegistered: (addr: string) => ro.isRegistered(addr) as Promise<boolean>,
		tokenAddress: () => ro.TOKEN() as Promise<string>,
		encryptedBalanceOf: (addr: string) =>
			ro.getEncryptedBalance(addr) as Promise<string>,
		tipCreator: (creator: string, handle: any, inputProof: any) =>
			writable.tipCreator(creator, handle, inputProof),
		requestWithdraw: (handle: any, inputProof: any) =>
			writable.requestWithdraw(handle, inputProof),
		registerCreator: () => writable.registerCreator(),
		token: async (withSigner = true) => {
			const tokenAddress = await ro.TOKEN();
			return getContract<any>(tokenAddress, MockTokenArtifact.abi, withSigner);
		},
		ro,
		rw: writable,
	};
}
