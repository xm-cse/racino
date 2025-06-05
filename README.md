# Racino Wallets

## Key Implementation

### Custom Web3Auth Adapter (`/lib/web3auth`)

- Ported Web3Auth integration for Crossmint SDK compatibility
- Handles authentication and signer generation
- Custom network configurations

### Bundler Integration (`/lib/bundler.ts`)

- User operation hash tracking and management
- Transaction timeout handling
- Comprehensive receipt processing
- Error handling for failed user operations

### Features

- Smart wallet creation via Crossmint SDK
- ERC20 transfers with detailed transaction feedback
- Transaction hash + UserOp hash tracking

## Testing

Get test USDC from Circle's faucet: https://faucet.circle.com/

## Getting Started

1. Install dependencies

    ```bash
    pnpm install
    ```

2. Create a `.env` file

    ```bash
    cp .env.example .env
    ```

3. Run the development server

    ```bash
    pnpm dev
    ```
