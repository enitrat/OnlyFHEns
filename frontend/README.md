# OnlyFHEn Frontend

Privacy-first tipping platform frontend built with React Router, RainbowKit, and Zama FHEVM.

## Prerequisites

- Node.js 20+
- Bun (for local FHE helper): https://bun.sh
- A wallet (e.g., MetaMask)

## Installation

```bash
npm install
# or
bun install
```

## Configuration

Contract addresses are automatically written by the deploy script to:

- `frontend/.env.local` - Environment variables
- `frontend/app/config/contracts.<network>.json` - Network configs

Make sure you've deployed the contracts first (see root README).

### Supabase (Creators Directory)

The app can store creator profiles in Supabase (falls back to localStorage if not configured).

- Set `VITE_PUBLIC_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
- Apply the SQL in `docs/SUPABASE.md` to create the `creators` table and policies.
- Important: do not allow anonymous writes in production. Prefer an authenticated flow (e.g., serverless function
  verifies a wallet signature and writes with a service role) or JWT‑based RLS that ties writes to the caller’s wallet
  address.

## Development

### Localhost (with local FHE helper)

**Terminal 1** - Start the local FHE helper:

```bash
npm run local-fhe
# or
bun run local-fhe
```

This starts a Bun server on `http://127.0.0.1:8787` that handles encryption/decryption for localhost.

**Terminal 2** - Start the frontend:

```bash
npm run dev
```

Then:

1. Connect your wallet to Hardhat network (chainId 31337, RPC: `http://127.0.0.1:8545`)
2. Import a Hardhat account private key to get funded test ETH
3. Navigate to `http://localhost:5173`

### Sepolia

```bash
npm run dev
```

Then:

1. Connect your wallet to Sepolia (chainId 11155111)
2. The app automatically loads Zama's Relayer SDK for encryption/decryption
3. Navigate to `http://localhost:5173`

## Network Switching

The app automatically detects network changes:

- **Localhost**: Uses local FHE helper, localhost contract addresses
- **Sepolia**: Uses Zama Relayer SDK, Sepolia contract addresses

Switch networks in your wallet - the app adapts automatically.

## Features

- 🔐 End-to-end encrypted tipping
- 🌐 Multi-network support (localhost/Sepolia)
- 🔄 Automatic network detection and switching
- 🎨 Tailwind CSS styling
- 🌍 i18n support (EN/FR)
- 💼 RainbowKit wallet integration

## Project Structure

```
frontend/
├── app/
│   ├── components/      # React components
│   ├── lib/            # Utilities, hooks, wallet logic
│   ├── routes/         # Page routes
│   └── utils/          # Network detection
└── server/
    └── local-fhe.ts    # Local FHE helper (Bun server)
```

## Building for Production

```bash
npm run build
```

Output is in `build/` directory.

## Troubleshooting

- **Wrong network**: Switch wallet to Hardhat (31337) or Sepolia (11155111)
- **Local FHE helper down**: Check Terminal 1, restart with `npm run local-fhe`
- **Contract not found**: Redeploy contracts (see root README)
- **Ethers not loaded**: Hard refresh the browser

## Documentation

See root README for:

- Contract deployment
- Environment setup
- Full user flows
- Architecture details
