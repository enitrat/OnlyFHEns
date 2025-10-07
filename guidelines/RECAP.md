# Building a Private Tipping dApp with Zama FHE (from this repo)

This tutorial distills what the codebase is doing into a practical, step-by-step guide. You’ll learn how to:

1. design FHE-aware Solidity contracts and patterns,
2. deploy locally and to Sepolia,
3. test FHE contracts with Hardhat,
4. integrate the Zama Relayer SDK on the frontend, and
5. run the full confidential flow (operator approvals, encryption, decryption), including the handy local “webserver
   hack,” plus the React hooks provided.

> Everything shown below comes from the code you shared. Paths are referenced so you can jump to the exact file.

---

## 0) What you’re building (mental model)

The app enables **confidential tips** to creators using an **OpenZeppelin confidential token** (balances and amounts are
encrypted). The core ideas:

- A creator **registers** once; the contract initializes an encrypted balance and grants the right ACLs so the creator
  and the contract can use it.
- A supporter tips a creator by **encrypting** an amount off-chain and sending the **ciphertext handle + proof** to the
  contract.
- The contract **pulls confidential tokens** from the supporter (requires operator permission), computes the **actual
  transferred e-amount**, and **adds** it to the creator’s encrypted balance.
- The creator can later **request a withdrawal** by sending an encrypted request; the contract transfers
  `min(requested, credited)` confidentially and updates the encrypted balance.

You’ll switch between two environments:

- **Local dev**: use Hardhat + a tiny **local web server** that bridges the browser to the Hardhat FHEVM plugin for
  **encrypt** and **userDecrypt**.
- **Sepolia**: use Zama’s **Relayer SDK** in the browser for encrypting inputs and user decrypts, with an **EIP-712**
  signature to authorize decryption.

---

## 1) Solidity: patterns for FHE interactions

**Main contract:** `contracts/OnlyFHEn.sol`

Key imports:

```solidity
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { IConfidentialFungibleToken } from "@openzeppelin/confidential-contracts/interfaces/IConfidentialFungibleToken.sol";
```

### 1.1 Encrypted storage and ACLs

Store encrypted values with FHE types (here `euint64`):

```solidity
mapping(address creatorAddress => euint64 encryptedBalance) private _balances;
mapping(address creatorAddress => bool isRegistered) public isRegistered;
IConfidentialFungibleToken public immutable TOKEN;
```

On registration, initialize and **grant ACL** to both the contract and the creator:

```solidity
function registerCreator() external {
  require(!isRegistered[msg.sender], "OnlyFHEn: already registered");
  isRegistered[msg.sender] = true;

  _balances[msg.sender] = FHE.asEuint64(0);
  FHE.allowThis(_balances[msg.sender]);
  FHE.allow(_balances[msg.sender], msg.sender);

  emit CreatorRegistered(msg.sender);
}
```

> **Why ACLs?** Ciphertexts are protected. You must **re-grant** after updates. Pattern used throughout:
>
> - After `FHE.add/sub`, immediately call:
>
>   ```solidity
>   FHE.allowThis(ciphertext);
>   FHE.allow(ciphertext, owner);
>   ```

There’s also a recovery helper if ACLs were lost:

```solidity
function reinit(address creator) external {
  require(msg.sender == creator || msg.sender == OWNER, "OnlyFHEn: not authorized");
  require(isRegistered[creator], "OnlyFHEn: creator not registered");
  euint64 bal = _balances[creator];
  FHE.allowThis(bal);
  FHE.allow(bal, creator);
}
```

### 1.2 Importing user-encrypted inputs

Users encrypt an amount off-chain and send **(handle, inputProof)**. In Solidity, convert:

```solidity
function tipCreator(address creator, externalEuint64 inputAmount, bytes calldata inputProof) external {
  require(isRegistered[creator], "OnlyFHEn: creator not registered");

  // Verify and import the user ciphertext
  euint64 eAmount = FHE.fromExternal(inputAmount, inputProof);

  // ... use eAmount with confidential token
}
```

### 1.3 Working with OpenZeppelin ConfidentialFungibleToken

The mock token used in dev: `contracts/mocks/MockConfidentialFungibleToken.sol`, extending OZ
`ConfidentialFungibleToken`.

Transfers done **confidentially**:

```solidity
// Supporter → contract
FHE.allowTransient(eAmount, address(TOKEN));
TOKEN.confidentialTransferFrom(msg.sender, address(this), eAmount);

// Sanity: compute actual sent
euint64 before = TOKEN.confidentialBalanceOf(address(this));
euint64 after  = TOKEN.confidentialBalanceOf(address(this));
euint64 sent   = FHE.sub(after, before);

// Credit creator
_balances[creator] = FHE.add(_balances[creator], sent);
FHE.allowThis(_balances[creator]);
FHE.allow(_balances[creator], creator);
```

For withdrawals:

```solidity
function requestWithdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
  require(isRegistered[msg.sender], "OnlyFHEn: creator not registered");

  euint64 req = FHE.fromExternal(encryptedAmount, inputProof);
  euint64 avail = _balances[msg.sender];
  euint64 maxSend = FHE.min(avail, req);

  FHE.allowTransient(maxSend, address(TOKEN));

  _balances[msg.sender] = FHE.sub(_balances[msg.sender], maxSend);
  FHE.allowThis(_balances[msg.sender]);
  FHE.allow(_balances[msg.sender], msg.sender);

  TOKEN.confidentialTransfer(msg.sender, maxSend);
  emit WithdrawRequested(msg.sender, maxSend);
}
```

### 1.4 Returning encrypted views

Views can return encrypted values (the **creator** can decrypt later via SDK):

```solidity
function getEncryptedBalance(address creator) external view returns (euint64) {
  return _balances[creator];
}
```

> **Tip:** Return `euint64` to the UI; **do not** decrypt on-chain.

---

## 2) Deployment with Hardhat (local & Sepolia)

**Script:** `deploy/01_deploy_onlyfhen.ts`

- If no `TOKEN` is provided (via **Hardhat vars** or env), it deploys a **MockConfidentialFungibleToken** for dev.
- Deploys **OnlyFHEn** with the token address.
- **Persists addresses** for the frontend:
  - Writes `frontend/app/config/contracts.<network>.json`
  - Writes `.env.local` with `VITE_ONLYFHEN_ADDRESS_*` and `VITE_TOKEN_ADDRESS_*`

```ts
const onlyfhen = await deploy("OnlyFHEn", { from: deployer, args: [tokenAddress], log: true });

// Write frontend config
fs.writeFileSync(
  contractsJsonPath,
  JSON.stringify(
    {
      network: hre.network.name,
      chainId,
      OnlyFHEn: onlyfhen.address,
      Token: tokenAddress,
    },
    null,
    2,
  ),
);

// Populate .env.local for vite
if (hre.network.name === "sepolia") {
  existingEnv[`VITE_ONLYFHEN_ADDRESS_SEPOLIA`] = onlyfhen.address;
  existingEnv[`VITE_TOKEN_ADDRESS_SEPOLIA`] = tokenAddress;
} else if (hre.network.name === "localhost") {
  existingEnv[`VITE_ONLYFHEN_ADDRESS_LOCALHOST`] = onlyfhen.address;
  existingEnv[`VITE_TOKEN_ADDRESS_LOCALHOST`] = tokenAddress;
}
```

**Run locally:**

```bash
# 1) Hardhat node
npx hardhat node

# 2) In another terminal: deploy
npx hardhat --network localhost deploy
```

**Run on Sepolia:**

```bash
# Make sure your hardhat config has Sepolia and accounts set
# Optionally provide a real confidential TOKEN via Hardhat vars/env:
#   HH vars set TOKEN=0xYourConfTokenAddress
npx hardhat --network sepolia deploy
```

Frontend reads these at runtime:

- `frontend/app/config/contracts.localhost.json`
- `frontend/app/config/contracts.sepolia.json`
- `.env.local` keys:
  - `VITE_ONLYFHEN_ADDRESS_LOCALHOST / _SEPOLIA`
  - `VITE_TOKEN_ADDRESS_LOCALHOST / _SEPOLIA`
  - `VITE_LOCAL_FHE_URL` (local helper, see §5.3)
  - `VITE_WC_PROJECT_ID` (WalletConnect)

---

## 3) Testing FHE contracts

**Files:**

- `test/OnlyFHEn.ts` (end-to-end for tipping & withdrawing)
- `test/ERC7984.test.ts` (confidential transfer sample)

The Hardhat **FHEVM plugin** (`hre.fhevm`) is used for:

- **Creating encrypted inputs**:

  ```ts
  const enc = await fhevm.createEncryptedInput(onlyFhenAddress, signer.address).add64(123_456n).encrypt();
  ```

- **User decryption** (off-chain, authorized):

  ```ts
  const clear = await fhevm.userDecryptEuint(FhevmType.euint64, encryptedHandle, onlyFhenAddress, signer);
  ```

Typical test flow (from `test/OnlyFHEn.ts`):

```ts
await onlyFhen.connect(alice).registerCreator();

await fhevm.initializeCLIApi();

// supporter Bob mints and sets operator
await token.mint(bob.address, Number(1_000_000n));
const exp = Math.round(Date.now()) + 60 * 60 * 24;
await token.connect(bob).setOperator(onlyFhenAddress, exp);

// tip 123_456
const encTip = await fhevm.createEncryptedInput(onlyFhenAddress, bob.address).add64(123_456n).encrypt();
await onlyFhen.connect(bob).tipCreator(alice.address, encTip.handles[0], encTip.inputProof);

// decrypt creator balance
const encBal = await onlyFhen.getEncryptedBalance(alice.address);
const clear = await fhevm.userDecryptEuint(FhevmType.euint64, encBal, onlyFhenAddress, alice);
expect(clear).to.eq(123_456n);
```

**Run tests:**

```bash
npx hardhat test
```

---

## 4) Frontend integration: loading Zama’s Relayer SDK

**Hook:** `frontend/app/lib/useZamaSDK.tsx`

- Loads the Relayer SDK **only on Sepolia** (chainId `11155111`).
- Dynamic import from CDN, initialize, then create instance and attach to `window.fhevm`.
- Re-initializes on `chainChanged`.

```tsx
export function useZamaSDK() {
  useEffect(() => {
    async function init(chainId: number) {
      if (chainId !== 11155111) {
        delete (window as any).fhevm;
        return;
      }

      const { initSDK, createInstance, SepoliaConfig } = await import(
        "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js"
      );
      await initSDK();

      const ethereum = (window as any).ethereum;
      const cfg = { ...SepoliaConfig, network: ethereum };
      const instance = await createInstance(cfg);

      (window as any).fhevm = instance;
    }

    // read chain, call init, and listen for changes...
  }, []);
}
```

**Injected in the app root:** `frontend/app/root.tsx`

```tsx
function ZamaSDKProvider({ children }: { children: React.ReactNode }) {
  useZamaSDK();
  return <>{children}</>;
}
```

Also note:

- Ethers v6 **UMD** is loaded in `<head>` for the browser:

  ```html
  <script src="https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.umd.min.js"></script>
  ```

- RainbowKit/Wagmi in `frontend/app/lib/wallet.tsx`.

---

## 5) End-to-end confidential flow (UI + helpers)

### 5.1 Detecting network & addresses

**Hook:** `frontend/app/lib/useNetwork.tsx`

- Determines current network (`"sepolia" | "localhost"`) using the wallet provider.
- Exposes `contractAddress` via env (`VITE_ONLYFHEN_ADDRESS_*`).
- Reacts to `chainChanged`.

```tsx
const { network, contractAddress, isSepolia, isLocalhost } = useNetwork();
```

Helper: `frontend/app/utils/getNetwork.ts` maps `chainId===11155111` to `"sepolia"`, otherwise `"localhost"`, and
provides `getOnlyFHEnAddress()` that reads the right env var.

### 5.2 Operator approvals (Confidential token)

To let the **OnlyFHEn** contract pull your confidential tokens, the supporter must set operator permission:

**Helper:** `frontend/app/lib/eth.ts`

```ts
export async function ensureOperator(tokenAddress: string, spender: string, minSeconds = 3600) {
  const token = await getContract<any>(tokenAddress, MockTokenArtifact.abi, true);
  const signer = await getSigner();
  const holder = await signer.getAddress();
  const already = await token.isOperator(holder, spender);
  if (already) return false;
  const until = Math.floor(Date.now() / 1000) + minSeconds;
  const tx = await token.setOperator(spender, until);
  await tx.wait();
  return true; // operator was set now
}
```

UI uses it in both **Tip** and **Withdraw** flows (`routes/tip.tsx`, `routes/dashboard.tsx`).

### 5.3 Encrypting inputs (two modes)

**One API — two backends:**

```ts
export async function encryptAmountForContract(contractAddress: string, userAddress: string, amount: bigint) {
  const isSepoliaNetwork = await isSepolia();

  if (!isSepoliaNetwork) {
    // Local dev: call local FHE helper (the “webserver hack”)
    const res = await fetch(`${getLocalFheUrl()}/api/encrypt-input`, {
      method: "POST",
      body: JSON.stringify({ contractAddress, userAddress, amount: amount.toString() }),
      headers: { "Content-Type": "application/json" },
    });
    const { handle, inputProof } = await res.json();
    return { handle, inputProof };
  } else {
    // Sepolia: Relayer SDK in browser
    const instance = getFhevm(); // window.fhevm
    const buffer = instance.createEncryptedInput(contractAddress, userAddress);
    buffer.add64(amount);
    const ciphertexts = await buffer.encrypt();
    return { handle: ciphertexts.handles?.[0], inputProof: ciphertexts.inputProof };
  }
}
```

- **Local helper server** (bridge to Hardhat plugin):
  - Base URL: `VITE_LOCAL_FHE_URL` (default `http://127.0.0.1:8787`)
  - Endpoints:
    - `POST /api/encrypt-input` → `{ handle, inputProof }`
    - `POST /api/user-decrypt` → `{ value }`

  - Suggested command (see i18n hints):

    ```bash
    bun run local-fhe
    ```

  - Source file is referenced at `frontend/server/local-fhe.ts` (not included here, but the UI expects those endpoints).

### 5.4 Tipping sequence (UI)

**File:** `frontend/app/routes/tip.tsx`

1. **Pick creator** (local profile list), enter **amount**.
2. Fetch the **token address** from the contract: `onlyfhen.TOKEN()`.
3. `ensureOperator(tokenAddr, contractAddress)`.
4. `encryptAmountForContract(contractAddress, userAddr, BigInt(amount))`.
5. `onlyfhen.tipCreator(creator, handle, inputProof)`.

Snippet:

```ts
const onlyfhen = await getContract(onlyfhenAddr, OnlyFHEnArtifact.abi, true);
const tokenAddr: string = await onlyfhen.TOKEN();
await ensureOperator(tokenAddr, onlyfhenAddr);
const encrypted = await encryptAmountForContract(onlyfhenAddr, userAddr, BigInt(amount));
await onlyfhen.tipCreator(creator, encrypted.handle, encrypted.inputProof);
```

### 5.5 Withdrawing sequence (UI)

**File:** `frontend/app/routes/dashboard.tsx`

1. **Decrypt** your credited balance (see next subsection).
2. Enter withdrawal amount.
3. `encryptAmountForContract(onlyfhenAddr, creatorAddr, BigInt(amount))`.
4. `onlyfhen.requestWithdraw(handle, inputProof)`.

### 5.6 Decrypting balances (UI)

Two similar flows: creator’s **credited balance** and user’s **token balance**.

**A) Localhost** — call the helper server:

```ts
const value = await localUserDecrypt(handle, contractAddress, signerAddress);
// returns clear string value
```

**B) Sepolia** — Zama Relayer SDK with EIP-712 sign:

```ts
const instance = (window as any).fhevm;
const keypair = instance.generateKeypair();

// set the scope of your consent
const startTimeStamp = Math.floor(Date.now() / 1000).toString();
const durationDays = "10";
const contractAddresses = [contractAddress];

const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);

// user signs the typed data
const signature = await signer.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message,
);

// perform userDecrypt
const result = await instance.userDecrypt(
  [{ handle, contractAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signature.replace("0x", ""),
  contractAddresses,
  await signer.getAddress(),
  startTimeStamp,
  durationDays,
);
const clearValue = result[handle];
```

You can see this end-to-end in:

- `routes/balance.tsx` (standalone balance check)
- `routes/dashboard.tsx` (decrypt before withdrawing)
- `routes/tip.tsx` (decrypt **token** balance to populate “Max”)

---

## 6) Useful frontend hooks & utilities

### 6.1 `useNetwork()` — network & addresses

**File:** `frontend/app/lib/useNetwork.tsx`

- Tracks current network (`"sepolia" | "localhost"`).
- Exposes `contractAddress` from env.
- Updates on `chainChanged`.

```tsx
const { network, contractAddress, isSepolia, isLocalhost, isLoading } = useNetwork();
```

### 6.2 `useZamaSDK()` — load/unload Relayer SDK

**File:** `frontend/app/lib/useZamaSDK.tsx`

- Injects and initializes SDK on Sepolia; removes instance on other chains.

### 6.3 Wallet & ethers helpers

**File:** `frontend/app/lib/eth.ts`

- `getProvider() / getSigner()` from the Ethers UMD (`window.ethers`).
- `getContract(address, abi, withSigner)` ctor helper.
- `getFhevm()` retrieves the Relayer SDK instance.
- `encryptAmountForContract()` and `localUserDecrypt()` unify local vs Sepolia code paths.
- `ensureOperator()` ensures the token operator is granted (with expiry).

### 6.4 Creator profiles (local)

**File:** `frontend/app/lib/creators.ts`

- Simple localStorage store keyed by network for saved creators.
- `getCreators`, `getCreator`, `upsertCreator`.

### 6.5 i18n

**File:** `frontend/app/lib/i18n.tsx`

- Minimal EN/FR dictionary; UI strings for statuses, errors, and toasts.

---

## 7) Putting it all together (happy paths)

### 7.1 Local development

1. **Start Hardhat:**

   ```bash
   npx hardhat node
   ```

2. **Deploy to localhost:**

   ```bash
   npx hardhat --network localhost deploy
   ```

   This writes:
   - `frontend/app/config/contracts.localhost.json`
   - `.env.local` with `VITE_ONLYFHEN_ADDRESS_LOCALHOST`, `VITE_TOKEN_ADDRESS_LOCALHOST`

3. **Start local FHE bridge (the webserver hack):**

   ```bash
   bun run local-fhe
   ```

   It must expose:
   - `POST /api/encrypt-input`
   - `POST /api/user-decrypt`

4. **Run the frontend** (Vite/React app) and connect a wallet to **localhost**.
5. **Flow**:
   - Go to **Become a creator** → `register` (tx).
   - In **Send tip** → choose creator, ensure operator is set automatically, encrypt, submit.
   - In **Dashboard** → **Decrypt my balance**, then **Request a withdrawal**.

### 7.2 Sepolia

1. **Deploy**:

   ```bash
   npx hardhat --network sepolia deploy
   ```

   Use a real TOKEN (set Hardhat var `TOKEN`) or the mock (if allowed).

2. **Frontend** automatically:
   - detects Sepolia,
   - loads **Relayer SDK** via `useZamaSDK`,
   - uses `window.fhevm` for encryption & user decrypt.

3. **Flow** as above; when decrypting, you’ll sign an **EIP-712** message to authorize the SDK.

---

## 8) Error handling & UX patterns (from the UI)

- The app maps low-level RPC errors to human-readable i18n keys in `frontend/app/lib/parseTransactionError.ts`.
- Toasts show staged progress:
  - “Checking operator,” “Encrypting,” “Submitting tx,” “Confirming…”

- On Sepolia, minting may be disabled depending on the token (see the note in `mint.tsx`).

---

## 9) Extra snippets you can copy-paste

### 9.1 Solidity: minimal FHE add pattern with ACL

```solidity
euint64 a = _balances[user];
euint64 b = FHE.asEuint64(100);
euint64 c = FHE.add(a, b);

// always re-grant after writes
FHE.allowThis(c);
FHE.allow(c, user);

_balances[user] = c;
```

### 9.2 Frontend: encrypt + call the contract (shared API)

```ts
const signer = await getSigner();
const me = await signer.getAddress();

const { handle, inputProof } = await encryptAmountForContract(contractAddress, me, BigInt(123));

const onlyfhen = await getContract<any>(contractAddress, OnlyFHEnArtifact.abi, true);
await onlyfhen.requestWithdraw(handle, inputProof);
```

### 9.3 Frontend: decrypt an `euint64` (Sepolia SDK)

```ts
const instance = (window as any).fhevm;
const keypair = instance.generateKeypair();

const contracts = [onlyfhenAddress];
const start = Math.floor(Date.now() / 1000).toString();
const days = "10";
const eip712 = instance.createEIP712(keypair.publicKey, contracts, start, days);

const signature = await signer.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message,
);

const res = await instance.userDecrypt(
  [{ handle, contractAddress: onlyfhenAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signature.replace("0x", ""),
  contracts,
  await signer.getAddress(),
  start,
  days,
);

const clear = res[handle]; // string/number representation
```

---

## 10) Gotchas & tips

- **Always** re-apply ACLs after modifying an encrypted value:

  ```solidity
  FHE.allowThis(ciphertext);
  FHE.allow(ciphertext, owner);
  ```

- **Operator permission** is required before confidential transfers:

  ```ts
  await token.setOperator(onlyfhenAddress, expiryTimestamp);
  ```

- Keep the “bridge” server running locally (`bun run local-fhe`) when not on Sepolia or all encrypt/decrypt calls will
  fail.
- The frontend relies on the **Ethers UMD** script in `<head>`; don’t remove it.
- On Sepolia, **user decrypt** requires an **EIP-712 signature** consenting to decrypt for specific contracts and a time
  window — the code handles generating and signing this.
- `tasks/OnlyFHEn.ts` includes older task names (e.g., `requestWithdrawal`) that don’t match the current function
  (`requestWithdraw`). Use the **tests** and **frontend** as canonical references.

---

## 11) File map (quick reference)

- **Contracts**
  - `contracts/OnlyFHEn.sol` — main app logic (FHE + confidential token)
  - `contracts/mocks/MockConfidentialFungibleToken.sol` — dev token

- **Deploy**
  - `deploy/01_deploy_onlyfhen.ts` — deployer + frontend config writer

- **Tests**
  - `test/OnlyFHEn.ts`, `test/ERC7984.test.ts`

- **Frontend**
  - Zama SDK hook: `app/lib/useZamaSDK.tsx`
  - Network hook: `app/lib/useNetwork.tsx`
  - ETH helpers (encrypt/decrypt/operator): `app/lib/eth.ts`
  - UI flows: `app/routes/tip.tsx`, `app/routes/dashboard.tsx`, `app/routes/balance.tsx`
  - Addresses: `app/config/contracts.*.json`
  - Root script injection: `app/root.tsx`

- **Local helper (bridge)**
  - expected at `frontend/server/local-fhe.ts` (UI calls its endpoints)

---

## 12) Checklist to reproduce

- [ ] `npx hardhat node`
- [ ] `npx hardhat --network localhost deploy`
- [ ] `bun run local-fhe` (bridge for encrypt/decrypt)
- [ ] Run frontend, connect wallet to **localhost**
- [ ] Register as creator → Tip → Decrypt → Withdraw
- [ ] Switch to Sepolia: deploy, connect, Relayer SDK will load automatically.

---

That’s it—this is the architecture and the exact code paths this project uses to bring **FHE-powered, private tips** to
life. Use the snippets as a starting kit and extend from there.
