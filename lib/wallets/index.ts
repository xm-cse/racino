import { createWallet } from "@/lib/wallets/latest";
import { createLegacyWallet } from "@/lib/wallets/legacy";
import type { Chain } from "@crossmint/wallets-sdk";

export const createWallets = async (jwt: string, selectedChain?: Chain) => {
  const legacyWallet = await createLegacyWallet(jwt, selectedChain);
  const latestWallet = await createWallet(jwt, selectedChain);
  return { legacyWallet, latestWallet };
};

export * from "./legacy";
export * from "./latest";
