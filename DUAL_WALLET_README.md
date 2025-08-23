# 🚀 Dual Wallet Manager - Multi-Chain Support

This implementation allows you to create and manage wallets across different Crossmint projects and blockchain networks simultaneously.

## 🎯 **Your Use Case: Polygon Amoy + Curtis**

**Legacy Project:**
- Chain: Polygon Amoy (configurable via `NEXT_PUBLIC_LEGACY_CHAIN`)
- Email: ornella@crossmint.com
- SDK: Legacy version

**New Project:**
- Chain: Curtis (configurable via `NEXT_PUBLIC_LATEST_CHAIN`)
- Email: ornella@crossmint.com
- SDK: Latest version

## 🔧 **How to Use**

### **Method 1: Environment Variables (Recommended)**
```typescript
import { DualWalletManager } from "@/lib/dual-wallet-manager";

// Uses environment variables automatically
const result = await DualWalletManager.getOrCreateDualWallets(jwt);
```

### **Method 2: Convenience Method**
```typescript
// Create wallets on different chains for each project
const result = await DualWalletManager.getOrCreateDualWalletsMultiChain(
  jwt, 
  "polygon-amoy",  // Legacy project chain
  "curtis"         // Latest project chain
);
```

### **Method 3: Object Syntax**
```typescript
const result = await DualWalletManager.getOrCreateDualWallets(jwt, {
  legacyChain: "polygon-amoy",
  latestChain: "curtis"
});
```

### **Method 4: Single Chain (Backward Compatible)**
```typescript
// Both projects use the same chain
const result = await DualWalletManager.getOrCreateDualWallets(jwt, "polygon-amoy");
```

## ⚙️ **Environment Variables**

### **Chain Configuration**
```bash
# Legacy Project Chain
NEXT_PUBLIC_LEGACY_CHAIN=polygon-amoy

# Latest Project Chain  
NEXT_PUBLIC_LATEST_CHAIN=curtis
```

### **Complete Environment Setup**
```bash
# Legacy Project (Existing Setup)
NEXT_PUBLIC_CROSSMINT_API_KEY_LEGACY=your_legacy_api_key_here
NEXT_PUBLIC_CROSSMINT_PROJECT_ID_LEGACY=your_legacy_project_id_here

# New Project (Latest SDK)
NEXT_PUBLIC_CROSSMINT_API_KEY_LATEST=your_new_api_key_here
NEXT_PUBLIC_CROSSMINT_PROJECT_ID_LATEST=your_new_project_id_here

# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
NEXT_PUBLIC_WEB3AUTH_NETWORK=your_web3auth_network_here
NEXT_PUBLIC_WEB3AUTH_VERIFIER_ID=your_verifier_id_here

# Chain Configuration
NEXT_PUBLIC_LEGACY_CHAIN=polygon-amoy
NEXT_PUBLIC_LATEST_CHAIN=curtis

# Amazon Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_cognito_user_pool_id_here
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_cognito_client_id_here
NEXT_PUBLIC_COGNITO_REGION=your_cognito_region_here
```

## 📱 **UI Integration**

The Wallet component now includes a **"Create Multi-Chain Wallets"** button that automatically creates:
- Legacy wallet on the chain specified in `NEXT_PUBLIC_LEGACY_CHAIN`
- Latest SDK wallet on the chain specified in `NEXT_PUBLIC_LATEST_CHAIN`

The button text dynamically shows the configured chains: **"Create Multi-Chain Wallets (polygon-amoy + curtis)"**

## 🔄 **What Happens When You Call It**

1. **JWT Validation** - Checks if your token is valid
2. **Chain Resolution** - Uses environment variables or provided parameters
3. **Web3Auth Signer Creation** - Creates separate signers for each chain
4. **Legacy Wallet Creation** - Creates wallet using legacy project
5. **Latest Wallet Creation** - Creates wallet using new project
6. **Result Return** - Returns both wallet instances

## 📊 **Result Structure**

```typescript
interface DualWalletResult {
  legacyWallet: EVMSmartWallet | null;    // Wallet on legacy chain
  latestWallet: EVMSmartWallet | null;    // Wallet on latest chain
  error?: string;                          // Any error messages
}
```

## 🌐 **Supported Chain Combinations**

### **Polygon Networks**
```typescript
// Legacy: Polygon Amoy, Latest: Polygon Mainnet
await DualWalletManager.getOrCreateDualWalletsMultiChain(
  jwt, "polygon-amoy", "polygon"
);
```

### **Ethereum Networks**
```typescript
// Legacy: Sepolia, Latest: Base Sepolia
await DualWalletManager.getOrCreateDualWalletsMultiChain(
  jwt, "ethereum-sepolia", "base-sepolia"
);
```

### **ApeChain Networks**
```typescript
// Legacy: Curtis (testnet), Latest: ApeChain (mainnet)
await DualWalletManager.getOrCreateDualWalletsMultiChain(
  jwt, "curtis", "apechain"
);
```

## 🚨 **Important Notes**

1. **Environment Variables Take Priority** - If no chains are specified, the system uses `NEXT_PUBLIC_LEGACY_CHAIN` and `NEXT_PUBLIC_LATEST_CHAIN`
2. **Same JWT, Different Projects** - Both wallets will belong to the same user (ornella@crossmint.com)
3. **Different Addresses** - Each wallet will have a different address
4. **Chain-Specific Signers** - Web3Auth creates separate signers for each chain
5. **Error Handling** - If one wallet fails, the other can still succeed

## 🔍 **Console Output**

When you create wallets, you'll see:
```
✅ Web3Auth signer created successfully for legacy chain: polygon-amoy
✅ Web3Auth signer created successfully for latest chain: curtis
✅ Legacy wallet retrieved/created on polygon-amoy: 0x123...
✅ Latest SDK wallet retrieved/created on curtis: 0x456...
```

## 🧪 **Testing**

1. **Set up your environment variables** (see `env.example`)
2. **Run the app** with `pnpm dev`
3. **Click "Create Multi-Chain Wallets"** button
4. **Check console** for detailed logs
5. **Verify both wallets** are created on different chains

## 📁 **Files Modified**

- `lib/config.ts` - Added `legacyChain` and `latestChain` environment variables
- `lib/dual-wallet-manager.ts` - Updated to use environment variables
- `components/Wallet.tsx` - Dynamic button text and environment variable usage
- `examples/dual-wallet-usage.ts` - Updated examples to use environment variables
- `env.example` - New environment variable structure
- `DUAL_WALLET_README.md` - Updated documentation

## 🎉 **You're All Set!**

Now you can easily configure your chains via environment variables:

- **Legacy wallet** on the chain specified in `NEXT_PUBLIC_LEGACY_CHAIN`
- **Latest SDK wallet** on the chain specified in `NEXT_PUBLIC_LATEST_CHAIN`

Both wallets will be accessible from the same interface, and you can switch between them for transactions!

## 🔧 **Easy Chain Changes**

To change chains, simply update your `.env` file:
```bash
# Change to different networks
NEXT_PUBLIC_LEGACY_CHAIN=ethereum-sepolia
NEXT_PUBLIC_LATEST_CHAIN=base-sepolia

# Or use ApeChain networks
NEXT_PUBLIC_LEGACY_CHAIN=curtis
NEXT_PUBLIC_LATEST_CHAIN=apechain
```

No code changes needed - just restart your app! 🚀
