import type { EVMBlockchainIncludingTestnet } from "@crossmint/common-sdk-base";

// Extend the blockchain type to include apechain
type ExtendedBlockchain = EVMBlockchainIncludingTestnet | "apechain" | "curtis";

export function getUrlProviderByBlockchain(chain: ExtendedBlockchain) {
  const url = new Map<ExtendedBlockchain, string | null>([
    ["ethereum", "https://eth.llamarpc.com"],
    ["polygon", "https://polygon-rpc.com"],
    ["ethereum-sepolia", "https://ethereum-sepolia.publicnode.com"],
    ["polygon-amoy", "https://rpc-amoy.polygon.technology"],
    ["base-sepolia", "https://base-sepolia-rpc.publicnode.com"],
    ["base", "https://mainnet.base.org"],
    ["apechain", "https://apechain.calderachain.xyz/http"],
    ["curtis", "https://curtis.rpc.caldera.xyz/http"],
  ]).get(chain);

  if (url == null) {
    throw new Error(`Url provider not found for chain ${chain}`);
  }
  return url;
}

export function getBlockExplorerByBlockchain(chain: ExtendedBlockchain) {
  const blockExplorer = new Map<ExtendedBlockchain, string | null>([
    ["ethereum", "https://etherscan.io"],
    ["polygon", "https://polygonscan.com"],
    ["ethereum-sepolia", "https://sepolia.etherscan.io"],
    ["polygon-amoy", "https://www.oklink.com/amoy"],
    ["base-sepolia", "https://sepolia.basescan.org"],
    ["base", "https://basescan.org"],
    ["apechain", "https://apescan.io"],
    ["curtis", "https://curtis.explorer.caldera.xyz"],
  ]).get(chain);

  if (blockExplorer == null) {
    throw new Error(`Block Explorer not found for chain ${chain}`);
  }
  return blockExplorer;
}

export function getTickerByBlockchain(chain: ExtendedBlockchain) {
  const ticker = new Map<ExtendedBlockchain, string | null>([
    ["ethereum", "ETH"],
    ["polygon", "MATIC"],
    ["ethereum-sepolia", "ETH"],
    ["polygon-amoy", "MATIC"],
    ["base-sepolia", "ETH"],
    ["base", "ETH"],
    ["apechain", "APE"],
    ["curtis", "APE"],
  ]).get(chain);

  if (ticker == null) {
    throw new Error(`Ticker project id not found for chain ${chain}`);
  }
  return ticker;
}

export function getTickerNameByBlockchain(chain: ExtendedBlockchain) {
  const tickerName = new Map<ExtendedBlockchain, string | null>([
    ["ethereum", "ETHEREUM"],
    ["polygon", "MATIC"],
    ["ethereum-sepolia", "ETHEREUM"],
    ["polygon-amoy", "MATIC"],
    ["base-sepolia", "ETHEREUM"],
    ["base", "ETHEREUM"],
    ["apechain", "APECOIN"],
    ["curtis", "APECOIN"],
  ]).get(chain);

  if (tickerName == null) {
    throw new Error(`Ticker Name project id not found for chain ${chain}`);
  }
  return tickerName;
}
