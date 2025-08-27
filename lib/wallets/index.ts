import { getOrCreateWallet } from "@/lib/wallets/latest";
import { getOrCreateLegacyWallet } from "@/lib/wallets/legacy";
import type { Chain } from "@crossmint/wallets-sdk";

export const getOrCreateWallets = async (
  jwt: string,
  selectedChain?: Chain
) => {
  const legacyWallet = await getOrCreateLegacyWallet(jwt, selectedChain);
  const latestWallet = await getOrCreateWallet(jwt, selectedChain);
  return { legacyWallet, latestWallet };
};

export * from "./legacy";
export * from "./latest";
