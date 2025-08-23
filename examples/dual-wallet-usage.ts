// Example usage of the Dual Wallet Manager
// This file demonstrates how to create wallets on different chains for each project

import { DualWalletManager } from "@/lib/dual-wallet-manager";
import { legacyChain, latestChain } from "@/lib/config";

// Example 1: Create wallets using environment variables (recommended)
export async function createWalletsWithEnvVars(jwt: string) {
  try {
    const result = await DualWalletManager.getOrCreateDualWallets(jwt);
    console.log("Environment-based wallets created:", result);
    return result;
  } catch (error) {
    console.error("Error creating environment-based wallets:", error);
    throw error;
  }
}

// Example 2: Create wallets on the same chain for both projects
export async function createWalletsSameChain(jwt: string, chain: string) {
  try {
    const result = await DualWalletManager.getOrCreateDualWallets(jwt, chain);
    console.log("Same chain wallets created:", result);
    return result;
  } catch (error) {
    console.error("Error creating same chain wallets:", error);
    throw error;
  }
}

// Example 3: Create wallets on different chains for each project
export async function createWalletsDifferentChains(jwt: string) {
  try {
    // Use environment variables for different chains
    const result = await DualWalletManager.getOrCreateDualWalletsMultiChain(
      jwt, 
      legacyChain, 
      latestChain
    );
    console.log("Different chain wallets created:", result);
    return result;
  } catch (error) {
    console.error("Error creating different chain wallets:", error);
    throw error;
  }
}

// Example 4: Create wallets using the object syntax
export async function createWalletsObjectSyntax(jwt: string) {
  try {
    const result = await DualWalletManager.getOrCreateDualWallets(jwt, {
      legacyChain: legacyChain,
      latestChain: latestChain
    });
    console.log("Object syntax wallets created:", result);
    return result;
  } catch (error) {
    console.error("Error creating wallets with object syntax:", error);
    throw error;
  }
}

// Example 5: Create wallets on Ethereum networks
export async function createWalletsEthereum(jwt: string) {
  try {
    const result = await DualWalletManager.getOrCreateDualWalletsMultiChain(
      jwt,
      "ethereum-sepolia", // Legacy project on Sepolia
      "base-sepolia"      // Latest project on Base Sepolia
    );
    console.log("Ethereum wallets created:", result);
    return result;
  } catch (error) {
    console.error("Error creating Ethereum wallets:", error);
    throw error;
  }
}

// Example 6: Create wallets on ApeChain networks
export async function createWalletsApeChain(jwt: string) {
  try {
    const result = await DualWalletManager.getOrCreateDualWalletsMultiChain(
      jwt,
      "curtis",    // Legacy project on Curtis (testnet)
      "apechain"   // Latest project on ApeChain (mainnet)
    );
    console.log("ApeChain wallets created:", result);
    return result;
  } catch (error) {
    console.error("Error creating ApeChain wallets:", error);
    throw error;
  }
}

// Example 7: Get existing wallets without creating new ones
export async function getExistingWallets(jwt: string) {
  try {
    const result = await DualWalletManager.getExistingDualWalletsMultiChain(
      jwt,
      legacyChain,
      latestChain
    );
    console.log("Existing wallets retrieved:", result);
    return result;
  } catch (error) {
    console.error("Error retrieving existing wallets:", error);
    throw error;
  }
}

// Example 8: Dynamic chain selection based on user preference
export async function createWalletsDynamicChains(
  jwt: string, 
  userPreference: "polygon" | "ethereum" | "apechain"
) {
  try {
    let targetLegacyChain: string;
    let targetLatestChain: string;

    switch (userPreference) {
      case "polygon":
        targetLegacyChain = "polygon-amoy";
        targetLatestChain = "polygon";
        break;
      case "ethereum":
        targetLegacyChain = "ethereum-sepolia";
        targetLatestChain = "base-sepolia";
        break;
      case "apechain":
        targetLegacyChain = "curtis";
        targetLatestChain = "apechain";
        break;
      default:
        // Use environment variables as fallback
        targetLegacyChain = legacyChain;
        targetLatestChain = latestChain;
    }

    const result = await DualWalletManager.getOrCreateDualWalletsMultiChain(
      jwt,
      targetLegacyChain,
      targetLatestChain
    );
    console.log(`Dynamic ${userPreference} wallets created:`, result);
    return result;
  } catch (error) {
    console.error("Error creating dynamic chain wallets:", error);
    throw error;
  }
}
