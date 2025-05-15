import {
  chain,
  crossmintApiKey,
  web3AuthClientId,
  web3AuthNetwork,
  web3AuthVerifierId,
} from "@/lib/config";
import {
  type EVMSmartWalletChain,
  type ExternalSigner,
  SmartWalletSDK,
} from "@crossmint/client-sdk-smart-wallet";
import {
  type TORUS_NETWORK_TYPE,
  getWeb3AuthSigner,
  type Web3AuthSignerParams,
} from "@/lib/web3auth";

export const xm = SmartWalletSDK.init({
  clientApiKey: crossmintApiKey,
});

export const createAAWalletSigner = async (jwt: string) => {
  try {
    console.log("creating wallet");

    const signer = await getWeb3AuthSigner({
      clientId: web3AuthClientId,
      web3AuthNetwork: web3AuthNetwork as TORUS_NETWORK_TYPE,
      verifierId: web3AuthVerifierId,
      jwt,
      chain,
    } as Web3AuthSignerParams);

    console.log("config created");

    console.log({ jwt }, chain, signer);

    return xm.getOrCreateWallet({ jwt }, chain as EVMSmartWalletChain, {
      signer: signer as ExternalSigner,
    });
  } catch (error) {
    console.error("Error creating AA wallet signer:", error);
    throw error;
  }
};
