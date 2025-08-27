# Racino Wallets

This reference implementation demonstrates how to migrate from Crossmint's legacy smart wallet SDK (`@crossmint/client-sdk-smart-wallet`) to the latest wallets SDK (`@crossmint/wallets-sdk`) while maintaining backward compatibility. The key is a custom Web3Auth integration that replaces Crossmint's deprecated Web3Auth adapter and allows both SDKs to coexist during the transition.

## Why this approach

- The legacy Web3Auth adapter (`@crossmint/client-sdk-smart-wallet-web3auth-adapter`) is deprecated. This repo rebuilds that integration using `@web3auth/single-factor-auth`, providing an external EIP-1193 provider usable by both the legacy and latest Crossmint SDKs.
- It enables a dual wallet strategy so users can keep using existing wallets while you progressively move traffic to the new SDK, chains, and features.

## Prerequisites

- Node.js 18+ and pnpm
- Two Crossmint projects:
  - Legacy project API key for `@crossmint/client-sdk-smart-wallet`
  - New project API key for `@crossmint/wallets-sdk`
- Web3Auth SFA (Single Factor Auth) configuration: client id, verifier name, and Torus network

## Installation

```bash
pnpm install
pnpm dev
```

## Configuration

Create a `.env` file at the project root with the following variables. These are required at runtime; missing any will throw on startup (see `lib/config.ts`).

```bash
NEXT_PUBLIC_CROSSMINT_API_LEGACY_KEY=cm_legacy_xxxxx        # Legacy Crossmint project client API key
NEXT_PUBLIC_CROSSMINT_API_KEY=cm_latest_xxxxx               # New Crossmint project client API key

NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=web3auth_client_id_xxxxx
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_devnet                # e.g. mainnet | sapphire_devnet | cyan | aqua
NEXT_PUBLIC_WEB3AUTH_VERIFIER_ID=your_web3auth_verifier

NEXT_PUBLIC_BLOCKCHAIN_NETWORK=polygon                      # default chain (e.g. polygon | base | polygon-amoy | base-sepolia | apechain | curtis)
```

Notes
- In this repo, Crossmint Auth is used only to obtain a JWT for demonstration. In the real application, authentication is handled by AWS Cognito; the migration pattern is identical because the wallet creation only requires a valid JWT (OIDC-compatible). This mirrors how Racino currently grabs and passes the JWT into both legacy and new wallet flows.

## Architecture Overview

- `components/Auth.tsx`
  - Embeds Crossmint auth UI to obtain `user` and `jwt`.
- `components/Wallet.tsx`
  - Dual wallet demo UI: initialize wallets, send USDC with legacy and new wallets, and send an NFT via the new wallet.
- `providers/AuthProvider.tsx`
  - Wraps app with Crossmint auth/providers using the legacy API key.
- `lib/wallets/legacy.ts`
  - Integrates `@crossmint/client-sdk-smart-wallet`.
  - Replaces deprecated Web3Auth adapter by injecting the custom Web3Auth external signer as `ExternalSigner`.
  - Adds robust `executeContract` helpers with UserOperation tracking via a bundler.
- `lib/wallets/latest.ts`
  - Integrates `@crossmint/wallets-sdk`.
  - Also uses the custom Web3Auth signer as an external EIP-1193 provider.
- `lib/wallets/index.ts`
  - Orchestrates a dual wallet creation flow, returning `{ legacyWallet, latestWallet }`.
- `lib/web3auth/*`
  - Custom Web3Auth integration rebuilt using `@web3auth/single-factor-auth` and `@web3auth/ethereum-provider`.
  - Extends chain support (adds `apechain` and `curtis`) and maps RPCs/explorers.
  - Validates JWTs before constructing the signer.
- `lib/bundler.ts`, `lib/networks.ts`
  - Pre-configured bundler clients (Pimlico) for chains to fetch UserOp receipts on legacy AA flows.
- `lib/config.ts`
  - Loads and asserts required env vars, including the default `chain`.

## Dual Wallet Strategy (Coexistence)

1. Authenticate with Crossmint (legacy UI) to obtain a JWT.
2. Create both wallets for the target chain using the same JWT:
   - Legacy: `SmartWalletSDK.getOrCreateWallet` with `ExternalSigner` from Web3Auth
   - Latest: `CrossmintWallets.getOrCreateWallet` with `external-wallet` signer
3. Route operations:
   - Keep existing features on the legacy wallet while validating parity on the new wallet
   - Add new features/chains using the new wallet first (e.g., ApeChain)
4. Gradually migrate flows to the new wallet, then remove the legacy SDK once you have full parity

Important
- During migration you will have two Crossmint wallets per user (one per project/SDK). The UI in `components/Wallet.tsx` surfaces both addresses and allows using either flow. Plan user education and data migration (e.g., balances/NFTs) accordingly.

See `components/Wallet.tsx` for examples of:
- USDC transfer with legacy wallet (`executeERC20Transfer`)
- USDC transfer with new wallet (`wallet.send("usdc", amount)`)
- ERC-721 transfer with new wallet via `sendTransaction` and ABI

## Supported Chains

Legacy SDK (`@crossmint/client-sdk-smart-wallet`)
- polygon, base
- polygon-amoy, base-sepolia (testnets)
- Not supported: apechain, curtis (the implementation auto-falls back to the env default for unsupported chains)

Latest SDK (`@crossmint/wallets-sdk`)
- polygon, base
- apechain, curtis
- polygon-amoy, base-sepolia (testnets)

The custom Web3Auth integration extends chain metadata and RPCs for ApeChain and Curtis (see `lib/web3auth/networks.ts`).

## New SDK vs Legacy SDK

### Advantages of the new SDK (`@crossmint/wallets-sdk`)

- Simpler, higher-level token transfers via `wallet.send(to, asset, amount)`
- Viem-like `sendTransaction({ to, functionName, abi, args })` for contract calls
- Broader chain support (e.g., ApeChain, Curtis) with clean signer injection
- Future-proofed API surface; no dependency on deprecated adapters

### Side-by-side examples

- Token transfer (USDC)

New SDK
```ts
await latestWallet.send(
  "0xRecipient",
  "usdc",
  "0.001"
);
```

Legacy SDK
```ts
await executeERC20Transfer(
  legacyWallet,
  "0xUSDCContractAddress",
  "0xRecipient",
  parseUnits("0.001", 6),
  { jwt, chain }
);
```

- Contract call (ERC-721 safeTransferFrom)

New SDK
```ts
await latestWallet.sendTransaction({
  to: "0xErc721Contract",
  functionName: "safeTransferFrom",
  abi: erc721TransferAbi,
  args: [latestWallet.address, "0xRecipient", 1n],
});
```

Legacy SDK
```ts
await executeContract(
  legacyWallet,
  {
    address: "0xErc721Contract",
    abi: erc721TransferAbi,
    functionName: "safeTransferFrom",
    args: [legacyWallet.address, "0xRecipient", 1n],
  },
  { jwt, chain }
);
```

Note: In this repo, `executeERC20Transfer` and `executeContract` are convenience wrappers around the legacy wallet APIs with added UserOperation tracking.

## Usage (Demo)

1. Start the app and log in via the embedded Crossmint auth UI.
2. Click "Initialize Wallets" to create both legacy and new wallets.
3. Try transfers in the Wallet demo:
   - Legacy USDC transfer (Polygon/Base) using `executeERC20Transfer`
   - New wallet USDC transfer (Polygon/Base)
   - New wallet NFT transfer (Polygon/Base/ApeChain)

USDC addresses used in the demo
- Polygon: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
- Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

For test funds, you can use Circle's faucet (`https://faucet.circle.com/`).

## Migration Guide (Step-by-step)

1. Prepare credentials
   - Create/configure a new Crossmint project; keep your legacy project active
   - Configure Web3Auth SFA client, verifier, and Torus network
2. Implement a custom Web3Auth external signer
   - See `lib/web3auth/index.ts` for SFA init and EIP-1193 provider retrieval
3. Wire both SDKs
   - Legacy: inject `ExternalSigner` when calling `SmartWalletSDK.getOrCreateWallet`
   - Latest: pass `{ type: "external-wallet", address, provider }` to `CrossmintWallets.getOrCreateWallet`
4. Introduce dual wallet flows
   - Return both wallets from a single factory (see `lib/wallets/index.ts`)
   - Update UI and services to support both during the transition
5. Migrate features incrementally
   - Start with read-only or low-risk flows on the new wallet
   - Expand to transfers and contract interactions
   - Leverage chains only supported by the latest SDK (e.g., ApeChain)
6. Decommission legacy
   - Once traffic and features are fully migrated, remove legacy packages and code paths

## Common Issues and Troubleshooting

- Missing env vars
  - `lib/config.ts` will throw on startup if any required env var is absent.
- JWT expiration
  - The custom signer validates JWTs (`validateJWTExpiration`); expired/soon-to-expire tokens will cause init or execution to fail. Refresh the session.
- Unsupported chain on legacy
  - Legacy flow excludes `apechain` and `curtis` and will fall back to the default `chain`. Use the latest SDK for those chains.
- Web3Auth config mismatches
  - Ensure `NEXT_PUBLIC_WEB3AUTH_NETWORK`, `NEXT_PUBLIC_WEB3AUTH_VERIFIER_ID`, and `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` align with your Web3Auth setup.
- Bundler RPC issues
  - `lib/bundler.ts` uses Pimlico public endpoints. Network hiccups can delay UserOperation receipts; the legacy executor retries with backoff.
- USDC/NFT addresses
  - The demo hardcodes USDC for Polygon/Base. For other chains or tokens, update addresses and decimals as needed.
- Viem version conflicts
  - This repo pins `viem` via pnpm overrides for AA features. Keep the override in sync with your dependency tree.

## Scripts

```bash
pnpm dev       # start Next.js dev server
pnpm build     # production build
pnpm start     # start production server
pnpm lint      # lint
```

## Key Files to Reference

- `components/Wallet.tsx` – end-to-end demo for legacy/new transfers
- `lib/wallets/legacy.ts` – legacy wallet + execute helpers (with UserOp tracking)
- `lib/wallets/latest.ts` – latest wallet integration
- `lib/web3auth/` – custom Web3Auth integration and network metadata
- `lib/bundler.ts`, `lib/networks.ts` – bundler clients and chain map
- `providers/AuthProvider.tsx` – Crossmint auth wiring

## Security

- Do not commit secrets to git. The `NEXT_PUBLIC_*` vars are exposed to the client; only place non-sensitive values there.
- Use server-side token exchange/storage where applicable for production environments.
