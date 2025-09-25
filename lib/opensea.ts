import { SignerWrapper } from "@/lib/wallets/signer";
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import { Chain, OpenSeaSDK } from "opensea-js";

export const getOpenseaSDK = (wallet: EVMSmartWallet) => {
  return new OpenSeaSDK(SignerWrapper.fromLegacyWallet(wallet), {
    chain: Chain.Base,
    apiKey: "test",
  });
};
