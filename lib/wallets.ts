import {
  chain,
  crossmintApiKey,
  web3AuthClientId,
  web3AuthNetwork,
  web3AuthVerifierId,
} from "@/lib/config";
import {
  type EVMSmartWalletChain,
  SmartWalletSDK,
} from "@crossmint/client-sdk-smart-wallet";
import {
  type TORUS_NETWORK_TYPE,
  getWeb3AuthSigner,
  type Web3AuthSignerParams,
} from "@crossmint/client-sdk-smart-wallet-web3auth-adapter";

export const xm = SmartWalletSDK.init({
  clientApiKey: crossmintApiKey,
});

export const createAAWalletSigner = async (jwt: string) => {
  try {
    console.log("creating wallet");

    const walletConfig = {
      signer: await getWeb3AuthSigner({
        clientId: web3AuthClientId,
        web3AuthNetwork: web3AuthNetwork as TORUS_NETWORK_TYPE,
        verifierId: web3AuthVerifierId,
        jwt,
        chain,
      } as Web3AuthSignerParams),
    };
    console.log("config created");

    console.log({ jwt }, chain, walletConfig);

    return xm.getOrCreateWallet(
      { jwt },
      chain as EVMSmartWalletChain,
      walletConfig
    );
  } catch (error) {
    console.error("Error creating AA wallet signer:", error);
    throw error;
  }
};
