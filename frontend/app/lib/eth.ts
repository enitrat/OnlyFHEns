export type TxResult = {
	hash: string;
};
import MockTokenArtifact from "../../../artifacts/contracts/mocks/MockConfidentialFungibleToken.sol/MockConfidentialFungibleToken.json";

export function getEthers(): any {
	const eth = (globalThis as any).ethers;
	if (!eth) throw new Error("Ethers not loaded. Check CDN script.");
	return eth;
}

export async function getProvider() {
	const { BrowserProvider } = getEthers();
	const { ethereum } = globalThis as any;
	if (!ethereum)
		throw new Error("window.ethereum not found. Install a wallet.");
	return new BrowserProvider(ethereum);
}

export async function getSigner() {
	const provider = await getProvider();
	// Request accounts if needed
	await (provider as any).send?.("eth_requestAccounts", []);
	return provider.getSigner();
}

export async function getChainId(): Promise<number> {
	const provider = await getProvider();
	const network = await provider.getNetwork();
	return Number(network?.chainId);
}

export async function getContract<T = any>(
	address: string,
	abi: any,
	withSigner = true,
): Promise<T> {
	const ethers = getEthers();
	const provider = await getProvider();
	const signer = withSigner ? await getSigner() : undefined;
	return new ethers.Contract(address, abi, signer ?? provider);
}

export function getFhevm(): any {
	const inst = (globalThis as any).fhevm;
	if (!inst) throw new Error("FHEVM relayer instance not ready yet.");
	return inst;
}

function getLocalFheUrl() {
	const env = (import.meta as any).env || {};
	return env.VITE_LOCAL_FHE_URL || "http://127.0.0.1:8787";
}

function normalizeBytesLike(v: any): string | Uint8Array {
	if (v == null) return v as any;
	if (typeof v === "string") return v as any;
	if (v instanceof Uint8Array) return v;
	if (Array.isArray(v)) return new Uint8Array(v);
	if (typeof v === "object") {
		// Likely a JSON-ified Uint8Array: { "0": 1, "1": 255, ... }
		const arr = Object.values(v) as number[];
		return new Uint8Array(arr);
	}
	return v as any;
}

export async function encryptAmountForContract(
	contractAddress: string,
	userAddress: string,
	amount: bigint,
) {
	const { isSepolia } = await import("~/utils/getNetwork");
	const isSepoliaNetwork = await isSepolia();

	if (!isSepoliaNetwork) {
		// Use local Bun server to create encrypted inputs via HH plugin
		const res = await fetch(`${getLocalFheUrl()}/api/encrypt-input`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contractAddress,
				userAddress,
				amount: amount.toString(),
			}),
		});
		if (!res.ok) throw new Error(`Local encrypt failed: ${await res.text()}`);
		const data = await res.json();
		return {
			handle: normalizeBytesLike(data.handle),
			inputProof: normalizeBytesLike(data.inputProof),
		};
	} else {
		const instance = getFhevm();
		const buffer = instance.createEncryptedInput(contractAddress, userAddress);
		buffer.add64(amount);
		const ciphertexts = await buffer.encrypt();
		return {
			handle: normalizeBytesLike(ciphertexts.handles?.[0]),
			inputProof: normalizeBytesLike(ciphertexts.inputProof),
		};
	}
}

export async function localUserDecrypt(
	handle: string,
	contractAddress: string,
	signerAddress: string,
): Promise<string> {
	const res = await fetch(`${getLocalFheUrl()}/api/user-decrypt`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ handle, contractAddress, signerAddress }),
	});
	if (!res.ok)
		throw new Error(`Local user-decrypt failed: ${await res.text()}`);
	const data = await res.json();
	return data.value as string;
}

// Ensure the connected wallet has granted `spender` as operator on the confidential token.
// If not, silently set it with expiry now + `minSeconds` (default 1h).
export async function ensureOperator(
	tokenAddress: string,
	spender: string,
	minSeconds = 60 * 60,
): Promise<boolean> {
	const token = await getContract<any>(
		tokenAddress,
		MockTokenArtifact.abi,
		true,
	);
	const signer = await getSigner();
	const holder: string = await signer.getAddress();
	const already = await token.isOperator(holder, spender);
	if (already) return false;
	const until =
		Math.floor(Date.now() / 1000) + Math.max(1, Math.floor(minSeconds));
	const tx = await token.setOperator(spender, until);
	await tx.wait();
	return true;
}
