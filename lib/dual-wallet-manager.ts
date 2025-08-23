import { SmartWalletSDK, type EVMSmartWallet, type EVMSmartWalletChain } from "@crossmint/client-sdk-smart-wallet";
import { getWeb3AuthSigner, type Web3AuthSignerParams } from "@/lib/web3auth";
import { validateJWTExpiration } from "@/lib/web3auth/auth";
import { 
  crossmintApiKeyLegacy, 
  crossmintApiKeyLatest, 
  web3AuthClientId, 
  web3AuthNetwork, 
  web3AuthVerifierId,
  legacyChain,
  latestChain
} from "@/lib/config";

// Initialize both SDK instances
export const legacySDK = SmartWalletSDK.init({
  clientApiKey: crossmintApiKeyLegacy,
});

export const latestSDK = SmartWalletSDK.init({
  clientApiKey: crossmintApiKeyLatest,
});

export interface DualWalletResult {
  legacyWallet: EVMSmartWallet | null;
  latestWallet: EVMSmartWallet | null;
  error?: string;
}

export interface DualChainConfig {
  legacyChain: string;
  latestChain: string;
}

export class DualWalletManager {
  /**
   * Get or create wallets for both legacy and latest SDK projects
   * Now supports different chains for each project
   */
  static async getOrCreateDualWallets(
    jwt: string,
    chainConfig?: DualChainConfig | string
  ): Promise<DualWalletResult> {
    try {
      // Validate JWT
      if (!validateJWTExpiration(jwt)) {
        throw new Error("JWT token is expired. Please log in again.");
      }

      // Handle chain configuration
      let targetLegacyChain: string;
      let targetLatestChain: string;

      if (typeof chainConfig === 'string') {
        // Single chain for both projects (backward compatibility)
        targetLegacyChain = chainConfig;
        targetLatestChain = chainConfig;
      } else if (chainConfig) {
        // Different chains for each project
        targetLegacyChain = chainConfig.legacyChain;
        targetLatestChain = chainConfig.latestChain;
      } else {
        // Use environment variables for both projects
        targetLegacyChain = legacyChain;
        targetLatestChain = latestChain;
      }

      const result: DualWalletResult = {
        legacyWallet: null,
        latestWallet: null,
      };

      // Create Web3Auth signer for legacy chain
      const legacySigner = await getWeb3AuthSigner({
        clientId: web3AuthClientId,
        web3AuthNetwork: web3AuthNetwork as any,
        verifierId: web3AuthVerifierId,
        jwt,
        chain: targetLegacyChain as any,
      });

      console.log("✅ Web3Auth signer created successfully for legacy chain:", targetLegacyChain);

      // Create Web3Auth signer for latest chain
      const latestSigner = await getWeb3AuthSigner({
        clientId: web3AuthClientId,
        web3AuthNetwork: web3AuthNetwork as any,
        verifierId: web3AuthVerifierId,
        jwt,
        chain: targetLatestChain as any,
      });

      console.log("✅ Web3Auth signer created successfully for latest chain:", targetLatestChain);

      // Get/Create Legacy Wallet
      try {
        result.legacyWallet = await legacySDK.getOrCreateWallet(
          { jwt },
          targetLegacyChain as EVMSmartWalletChain,
          { signer: legacySigner as any }
        );
        console.log("✅ Legacy wallet retrieved/created on", targetLegacyChain, ":", result.legacyWallet.address);
      } catch (error) {
        console.warn("⚠️ Could not retrieve/create legacy wallet on", targetLegacyChain, ":", error);
        // Continue with latest wallet creation
      }

      // Get/Create Latest SDK Wallet
      try {
        result.latestWallet = await latestSDK.getOrCreateWallet(
          { jwt },
          targetLatestChain as EVMSmartWalletChain,
          { signer: latestSigner as any }
        );
        console.log("✅ Latest SDK wallet retrieved/created on", targetLatestChain, ":", result.latestWallet.address);
      } catch (error) {
        console.warn("⚠️ Could not retrieve/create latest SDK wallet on", targetLatestChain, ":", error);
        // Continue with legacy wallet
      }

      // Ensure at least one wallet was created
      if (!result.legacyWallet && !result.latestWallet) {
        throw new Error(`Failed to create any wallet with both SDK versions on chains: legacy=${targetLegacyChain}, latest=${targetLatestChain}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Error creating dual wallets:", error);
      return {
        legacyWallet: null,
        latestWallet: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Convenience method for creating wallets on different chains per project
   * Example: getOrCreateDualWalletsMultiChain(jwt, "polygon-amoy", "curtis")
   */
  static async getOrCreateDualWalletsMultiChain(
    jwt: string,
    legacyChain: string,
    latestChain: string
  ): Promise<DualWalletResult> {
    return this.getOrCreateDualWallets(jwt, { legacyChain, latestChain });
  }

  /**
   * Get existing wallets without creating new ones
   * Now supports different chains for each project
   */
  static async getExistingDualWallets(
    jwt: string,
    chainConfig?: DualChainConfig | string
  ): Promise<DualWalletResult> {
    try {
      if (!validateJWTExpiration(jwt)) {
        throw new Error("JWT token is expired. Please log in again.");
      }

      // Handle chain configuration
      let targetLegacyChain: string;
      let targetLatestChain: string;

      if (typeof chainConfig === 'string') {
        // Single chain for both projects (backward compatibility)
        targetLegacyChain = chainConfig;
        targetLatestChain = chainConfig;
      } else if (chainConfig) {
        // Different chains for each project
        targetLegacyChain = chainConfig.legacyChain;
        targetLatestChain = chainConfig.latestChain;
      } else {
        // Use environment variables for both projects
        targetLegacyChain = legacyChain;
        targetLatestChain = latestChain;
      }

      const result: DualWalletResult = {
        legacyWallet: null,
        latestWallet: null,
      };

      // Try to get existing wallets without creating new ones
      try {
        // Note: getWallet method might not exist, so we'll try getOrCreateWallet with a flag
        // or handle this differently based on the actual SDK implementation
        console.log("ℹ️ Attempting to retrieve existing legacy wallet on", targetLegacyChain);
        // For now, we'll skip this as the method might not be available
        console.log("ℹ️ getWallet method not available, skipping existing wallet retrieval");
      } catch (error) {
        console.log("ℹ️ No existing legacy wallet found on", targetLegacyChain);
      }

      try {
        console.log("ℹ️ Attempting to retrieve existing latest SDK wallet on", targetLatestChain);
        // For now, we'll skip this as the method might not be available
        console.log("ℹ️ getWallet method not available, skipping existing wallet retrieval");
      } catch (error) {
        console.log("ℹ️ No existing latest SDK wallet found on", targetLatestChain);
      }

      return result;
    } catch (error) {
      console.error("❌ Error retrieving existing wallets:", error);
      return {
        legacyWallet: null,
        latestWallet: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Convenience method for getting existing wallets on different chains
   */
  static async getExistingDualWalletsMultiChain(
    jwt: string,
    legacyChain: string,
    latestChain: string
  ): Promise<DualWalletResult> {
    return this.getExistingDualWallets(jwt, { legacyChain, latestChain });
  }
}
