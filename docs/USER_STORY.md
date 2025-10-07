# OnlyFHEn — User Stories

## Assumptions

- Site has a landing page with two CTAs: “I am a Creator” and “Support Creators”.
- Primary routes: Home (Landing), Register, Tip, Dashboard. For dev purposes: Mint.
- Two runtime modes: `localhost` (Bun helper for encryption/decryption) and `sepolia` (Relayer SDK in-browser).
- Payment asset: ERC7984 confidential token; hardcoded for demo purposes.

## Global & Shared

```
Global & Shared Context
├── Arrive on any page
│   ├── Wallet not connected → See Connect Wallet prompt (navbar/inline)
│   │   ├── Connect
│   │   │   ├── App fetches address and chainId
│   │   │   └── Network label shown; gated actions enabled
│   │   └── Cancel
│   │       └── Remain disconnected; actions that need signing disabled with tooltips
│   ├── On wrong network (only LocalHost and Sepolia are supported)
│   │   ├── Accept switch → Switches to target; page refreshes context
│   │   └── Decline → Actions needing correct network remain disabled
│   ├── Privacy explainer visible → “Amounts stay encrypted; only creators decrypt totals.”
│   └── Browse without wallet → Public info accessible; gated actions disabled
└── Navbar navigation
    ├── Home → Landing
    ├── Register → Creator Register
    ├── Tip → Supporter Tip (creator selection/param)
    ├── Dashboard → Creator Dashboard
    └── Dev (only visible in localhost network)
        ├── Mint
        └── Local FHE Status
```

## Landing

```
Landing Page (two primary CTAs)
├── Click “I am a Creator” → Go to Register (Creator flow)
└── Click “Support Creators” → Go to Tip (Supporter flow)
```

## Creator Flows

```
Creator Flow
├── Click “I am a Creator” (from Landing)
│   ├── Wallet not connected → Prompt to connect (see Global)
│   ├── Already registered → Redirect to Dashboard
│   └── Not registered → Show Register page
├── Register as Creator
│   ├── Click “Register as Creator” → Call OnlyFHEn.registerCreator()
│   │   ├── Tx succeeds → Success toast; redirect to Dashboard
│   │   ├── Already registered (idempotent) → Info; redirect to Dashboard
│   │   ├── Tx rejected → Stay on page; can retry later
│   │   ├── Wrong network → Prompt to switch; retry
│   │   └── Misconfigured contract address → Config error banner with instructions
│   └── See registration status → “Registered” status pill/banner
├── Dashboard (creator-only decryption)
│   ├── Fetch encrypted balance handle via getEncryptedBalance(creator)
│   ├── Localhost decryption
│   │   ├── FHE server reachable → POST /api/user-decrypt → Show plaintext balance
│   │   └── FHE server down → Banner with steps to start server; retry CTA
│   ├── Sepolia decryption
│   │   ├── Sign EIP‑712 (Relayer SDK) → Show plaintext balance
│   │   └── Reject signature → Keep encrypted; CTA “Decrypt again”
│   ├── Not registered → Prompt to register first
│   └── ACL/Relayer error
│       ├── Retry decryption
│       └── Repair permissions (call reinit) if available
├── Withdraw (confidential amount)
│   ├── Enter amount → Encrypt input
│   ├── Localhost → Encrypt via Bun server; then requestWithdraw(handle, inputProof)
│   │   ├── Success → “Withdrawal requested/executed” confirmation
│   │   └── Server down → Start-instructions banner; retry CTA
│   ├── Sepolia → Encrypt via Relayer SDK; then requestWithdraw
│   │   └── Token-only payout (MVP) → Immediate confirmation
│   ├── Request > balance → Auto-min to available; inform user. Can be 0.
│   ├── Tx rejected → No changes; stay on page
│   ├── Not registered → Should not be accessible
│   └── Operator grant required → One-click grant with expiry before proceeding
└── Share link / presence
    ├── Copy tip link `/tip?creator=0x...`
    └── Supporter visiting link → Tip page pre-filled with creator
```

## Supporter Flows

```
Supporter Flow
├── Click “Support Creators” (from Landing)
│   ├── Browse directory → Select creator → Tip page pre-filled
│   ├── Search/filter → Select creator → Tip page
├── Tip a creator
│   ├── Wallet not connected → Prompt to connect
│   ├── Wrong network → Prompt to switch
│   ├── Token policy requires operator grant
│   │   ├── Approve grant (with expiry) → Proceed
│   │   └── Decline → Cannot tip; explain why approval is needed
│   ├── Enter amount → Encrypt input
│   ├── Localhost → Encrypt via Bun server
│   │   ├── Server reachable → Submit tip → tipCreator(...)
│   │   └── Server down → Start-instructions banner; retry CTA
│   ├── Sepolia → Encrypt via Relayer SDK → Submit tip
│   ├── On success → Success confirmation; optional public handle/message (no amounts)
│   ├── Insufficient confidential tokens → Tip results in 0 transfer/credit; prompt to acquire/mint (Dev: Mint; Prod: faucet/exchange docs)
│   └── Tx rejected → Stay on Tip page; no changes
└── Transparency (no leakage)
    └── Tip amounts are never displayed publicly
```

## Dev / Localhost Specific

```
Localhost Mode
├── Encrypted flows require local FHE helper server
│   ├── Server up → Green status (“Local FHE OK”)
│   └── Server down → Show exact command to start; retry CTA
├── Need test tokens → Dev “Mint” page → Mint confidential tokens
└── Switch to Sepolia → Prompt to restart frontend to apply env changes
```

## Error Handling & Edge Cases

```
Errors & Edge Cases
├── Wallet / network
│   ├── Wallet unavailable/locked → Connect prompts; instructions to install/unlock
│   ├── ChainId mismatch → One-click “Switch Network”; actions disabled until switch
│   └── Account switch mid-flow → Context refresh; prompts may reappear
├── Registration / permissions
│   ├── Register twice → Revert with “OnlyFHEn: already registered”
│   ├── Tip unregistered address → Revert with “OnlyFHEn: creator not registered”
│   ├── Access Withdraw/Balance without registration → Revert/prompt to register
│   └── ACL drift → “Repair permissions” action (reinit) if available; callable by creator or owner only
├── Encryption / decryption failures
│   ├── Localhost Bun server fails → Banner with start steps; retry
│   ├── Sepolia Relayer unavailable → Troubleshooting banner; retry
│   └── User declines EIP‑712 → Keep encrypted state; CTA to decrypt later
├── Token / allowance / operator
│   ├── Requires operator approval → Guided prompt with expiry (no callbacks in MVP)
│   ├── Approval expired/insufficient → Prompt to renew
│   └── Lack of confidential tokens (supporter) → Tip credits 0; Mint/faucet/exchange guidance
└── Withdrawals
    └── Immediate payout (token-only, MVP) → Direct confirmation
```

## Deep Links & Navigation

```
Deep Links
├── /tip?creator=0xCREATOR
│   ├── Registered → Tip form pre-filled
│   ├── Unregistered → Error banner; action blocked
│   └── Wrong network → Prompt to switch before proceeding
└── /balance or /withdraw
    ├── Registered creator → Dashboard pages
    └── Not registered → Prompt to register first
```

## Accessibility & Feedback

```
Accessibility & Feedback
├── Clear success toasts → Registered; Tip sent; Withdrawal requested/executed; Decryption complete
├── Clear error toasts → Network mismatch; Local FHE server down; Relayer unavailable; ACL repair needed
├── Tooltips → Confidential tokens; operator approvals; decryption signatures
└── Privacy notes → Tips are encrypted; only creators decrypt totals client-side
```

## Completion Paths Summary

```
Completion Paths
├── Landing → Creator → Register → Dashboard (Balance → Decrypt) → Withdraw → Share link
└── Landing → Supporters → Browse/Select → Tip → Success receipt

---

## Current Implementation (MVP)

- Contracts
  - `OnlyFHEn` (production):
    - `registerCreator()` initializes per-creator encrypted balance to 0 and grants ACL to contract and creator.
    - `tipCreator(creator, externalEuint64, proof)` pulls tokens via operator-enabled `confidentialTransferFrom`,
      calculates actual transferred encrypted amount by balance delta, credits the creator, emits `TipReceived`.
    - `requestWithdraw(externalEuint64, proof)` transfers `min(requested, credited)` to the creator and decrements the
      credited balance; emits `WithdrawRequested`.
    - `reinit(creator)` re-grants ACL for a creator’s ciphertext; callable by the creator or the contract owner; only for registered creators.
    - `getEncryptedBalance(creator)` returns the encrypted credited balance handle (`euint64`).
    - Events: `CreatorRegistered`, `TipReceived`, `WithdrawRequested`.
  - `MockConfidentialFungibleToken` (dev/test): OpenZeppelin ConfidentialFungibleToken with mint for local testing.

- Access Control & Preconditions
  - Registering twice reverts with `OnlyFHEn: already registered`.
  - Tipping an unregistered creator reverts with `OnlyFHEn: creator not registered`.
  - Withdrawing while unregistered reverts with `OnlyFHEn: creator not registered`.
  - `reinit` is allowed by the creator or owner only; creator must be registered.
  - Operator approval is required for supporters to tip (MVP). Missing operator causes the tip to revert at token level.

- Semantics
  - Tipping with insufficient supporter balance results in 0 actual transfer; credited balance does not change.
  - Withdrawals always send `min(requested, credited)`; credited balance is updated accordingly.
  - No callbacks/KMS gating are used in MVP (operator-based token pulls only). Future versions may add callback/KMS flows.

- Decryption & Privacy
  - The app fetches `euint64` handles and the creator decrypts client-side using the Relayer SDK (Sepolia) or local helper (localhost).
  - Tip amounts are never public; only creators decrypt their totals.

## Contract Touchpoints by Page

- Register: calls `OnlyFHEn.registerCreator()` → `CreatorRegistered` event.
- Tip: ensure operator grant on token to `OnlyFHEn`; encrypt amount → call `OnlyFHEn.tipCreator(...)` → `TipReceived`.
- Balance: call `OnlyFHEn.getEncryptedBalance(creator)` → client-side decrypt to display to creator only.
- Withdraw: encrypt amount → call `OnlyFHEn.requestWithdraw(...)` → `WithdrawRequested`.
- Repair: optional “Repair permissions” triggers `OnlyFHEn.reinit(creator)` when decryption permissions drift.
```

- `frontend/app/config/contracts.<network>.json`
