import { getSigner } from "~/lib/eth";
import { isSepolia } from "~/utils/getNetwork";

type HandleRef = { handle: string; contractAddress: string };

export function useFHE() {
	const decrypt = async (
		items: HandleRef[],
	): Promise<Record<string, string>> => {
		if (!items.length) return {};

		const signer = await getSigner();
		const me = await signer.getAddress();
		const onSepolia = await isSepolia();

		if (!onSepolia) {
			const { localUserDecrypt } = await import("~/lib/eth");
			const out: Record<string, string> = {};
			for (const it of items) {
				out[it.handle] = await localUserDecrypt(
					it.handle,
					it.contractAddress,
					me,
				);
			}
			return out;
		}

		const instance = (window as any).fhevm;
		if (!instance) throw new Error("Relayer SDK not initialized");

		const keypair = instance.generateKeypair();
		const startTimeStamp = Math.floor(Date.now() / 1000).toString();
		const durationDays = "10";
		const contractAddresses = [...new Set(items.map((i) => i.contractAddress))];

		const eip712 = instance.createEIP712(
			keypair.publicKey,
			contractAddresses,
			startTimeStamp,
			durationDays,
		);

		const signature = await signer.signTypedData(
			eip712.domain,
			{
				UserDecryptRequestVerification:
					eip712.types.UserDecryptRequestVerification,
			},
			eip712.message,
		);

		const result = await instance.userDecrypt(
			items.map((i) => ({
				handle: i.handle,
				contractAddress: i.contractAddress,
			})),
			keypair.privateKey,
			keypair.publicKey,
			signature.replace("0x", ""),
			contractAddresses,
			me,
			startTimeStamp,
			durationDays,
		);

		return result as Record<string, string>;
	};

	const encryptUint64For = async (
		contractAddress: string,
		user: string,
		amount: bigint,
	) => {
		const { encryptAmountForContract } = await import("~/lib/eth");
		return encryptAmountForContract(contractAddress, user, amount);
	};

	return { decrypt, encryptUint64For };
}
