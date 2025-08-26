import { CHAIN_NAMESPACES } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import {
  type TORUS_NETWORK_TYPE,
  Web3Auth,
} from "@web3auth/single-factor-auth";
import type { Address, EIP1193Provider } from "viem";

import {
  type EVMBlockchainIncludingTestnet as Blockchain,
  blockchainToChainId,
  blockchainToDisplayName,
} from "@crossmint/common-sdk-base";

import { parseToken, validateJWTExpiration } from "./auth";
import {
  getBlockExplorerByBlockchain,
  getTickerByBlockchain,
  getTickerNameByBlockchain,
  getUrlProviderByBlockchain,
} from "./networks";

// Extended blockchain type to support apechain
type ExtendedBlockchain = Blockchain | "apechain" | "curtis";

export type { TORUS_NETWORK_TYPE } from "@web3auth/single-factor-auth";
export type Web3AuthSignerParams = {
  clientId: string;
  verifierId: string;
  web3AuthNetwork: TORUS_NETWORK_TYPE;
  jwt: string;
  chain: ExtendedBlockchain;
};

// Helper function to get chain ID for extended blockchains
function getChainId(chain: ExtendedBlockchain): number {
  if (chain === "apechain") return 33139;
  if (chain === "curtis") return 33111;
  return blockchainToChainId(chain as Blockchain);
}

// Helper function to get display name for extended blockchains
function getDisplayName(chain: ExtendedBlockchain): string {
  if (chain === "apechain") return "ApeChain";
  if (chain === "curtis") return "Curtis (ApeChain Testnet)";
  return blockchainToDisplayName(chain as Blockchain);
}

export async function getWeb3AuthSigner({
  chain,
  clientId,
  web3AuthNetwork,
  jwt,
  verifierId,
}: Web3AuthSignerParams): Promise<{
  provider: EIP1193Provider;
  address: Address;
}> {
  // Validate JWT before proceeding
  if (!validateJWTExpiration(jwt)) {
    throw new Error(
      "JWT token is expired or invalid. Please refresh your authentication."
    );
  }

  const chainId = getChainId(chain);
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: `0x${chainId.toString(16)}`,
    rpcTarget: getUrlProviderByBlockchain(chain),
    displayName: getDisplayName(chain),
    blockExplorer: getBlockExplorerByBlockchain(chain),
    ticker: getTickerByBlockchain(chain),
    tickerName: getTickerNameByBlockchain(chain),
  };

  const web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork,
    usePnPKey: false,
    privateKeyProvider: new EthereumPrivateKeyProvider({
      config: { chainConfig },
    }),
  });

  await web3auth.init();
  const { sub } = parseToken(jwt);

  const provider = web3auth.connected
    ? web3auth.provider
    : await web3auth.connect({
        verifier: verifierId,
        verifierId: sub,
        idToken: jwt,
      });

  if (provider == null) {
    throw new Error("Web3auth returned a null signer");
  }

  // Get the address (signer address)
  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[];

  if (accounts.length === 0) {
    throw new Error("No accounts found");
  }

  return {
    provider: provider as EIP1193Provider,
    address: accounts[0],
  };
}
