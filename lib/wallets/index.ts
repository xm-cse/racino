import {
  chain,
  crossmintApiKey,
  web3AuthClientId,
  web3AuthNetwork,
  web3AuthVerifierId,
} from "@/lib/config";
import {
  getWeb3AuthSigner,
  type TORUS_NETWORK_TYPE,
  type Web3AuthSignerParams,
} from "@/lib/web3auth";
import {
  type Chain,
  CrossmintWallets,
  createCrossmint,
  EVMWallet,
} from "@crossmint/wallets-sdk";
import type { EIP1193Provider } from "viem";

export const createWallet = async (jwt: string, selectedChain?: Chain) => {
  // Use provided chain or default to environment chain
  const targetChain = selectedChain || chain;

  const signer = await getWeb3AuthSigner({
    clientId: web3AuthClientId,
    web3AuthNetwork: web3AuthNetwork as TORUS_NETWORK_TYPE,
    verifierId: web3AuthVerifierId,
    jwt,
    chain: targetChain,
  } as Web3AuthSignerParams);

  console.log(
    "[latest SDK] ✅ Web3Auth signer created successfully for chain:",
    targetChain
  );
  const crossmint = createCrossmint({
    apiKey: crossmintApiKey,  // new project client api key
    jwt,
  });
  const crossmintWallets = CrossmintWallets.from(crossmint);

  const wallet = await crossmintWallets.getOrCreateWallet({
    chain: selectedChain ?? "polygon-amoy",
    signer: {
      type: "external-wallet",
      provider: signer as EIP1193Provider,
    },
  });
  console.log("[latest SDK] ✅ Crossmint wallet created:", wallet.address);
  return EVMWallet.from(wallet);
};
