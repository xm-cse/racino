import { http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { supportedChains } from "@/lib/networks";
import type { BundlerClient } from "viem/account-abstraction";

// Bundler URLs for different chains (Pimlico)
const BUNDLER_URLS: Record<string, string> = {
  "polygon-amoy": "https://public.pimlico.io/v2/80002/rpc",
  "base-sepolia": "https://public.pimlico.io/v2/84532/rpc",
  polygon: "https://public.pimlico.io/v2/137/rpc",
  base: "https://public.pimlico.io/v2/8453/rpc",
  apechain: "https://public.pimlico.io/v2/33139/rpc",
  curtis: "https://public.pimlico.io/v2/33111/rpc",
};

/**
 * Creates a bundler client for a specific chain
 * @param chainId - The chain identifier (e.g., "polygon-amoy", "apechain")
 * @returns BundlerClient for the specified chain
 */
const getBundlerClient = (chainId: string): BundlerClient => {
  const chain = supportedChains[chainId];
  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`);
  }

  // Use custom bundler URL if available, otherwise use default Pimlico format
  const bundlerUrl =
    BUNDLER_URLS[chainId] || `https://public.pimlico.io/v2/${chain.id}/rpc`;

  return createBundlerClient({
    chain,
    transport: http(bundlerUrl),
  });
};

export const bundlerClients: Record<string, BundlerClient> = {};

for (const chain in supportedChains) {
  const bundlerClient = getBundlerClient(chain);
  bundlerClients[chain] = bundlerClient;
}
