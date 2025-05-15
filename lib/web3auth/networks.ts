import type { EVMBlockchainIncludingTestnet } from "@crossmint/common-sdk-base";

export function getUrlProviderByBlockchain(
  chain: EVMBlockchainIncludingTestnet
) {
  const url = new Map<EVMBlockchainIncludingTestnet, string | null>([
    ["ethereum", "https://eth.llamarpc.com"],
    ["polygon", "https://polygon-rpc.com"],
    ["ethereum-sepolia", "https://ethereum-sepolia.publicnode.com"],
    ["polygon-amoy", "https://rpc-amoy.polygon.technology"],
    ["base-sepolia", "https://base-sepolia-rpc.publicnode.com"],
    ["base", "https://mainnet.base.org"],
  ]).get(chain);

  if (url == null) {
    throw new Error(`Url provider not found for chain ${chain}`);
  }
  return url;
}

export function getBlockExplorerByBlockchain(
  chain: EVMBlockchainIncludingTestnet
) {
  const blockExplorer = new Map<EVMBlockchainIncludingTestnet, string | null>([
    ["ethereum", "https://etherscan.io"],
    ["polygon", "https://polygonscan.com"],
    ["ethereum-sepolia", "https://sepolia.etherscan.io"],
    ["polygon-amoy", "https://www.oklink.com/amoy"],
    ["base-sepolia", "https://sepolia.basescan.org"],
    ["base", "https://basescan.org"],
  ]).get(chain);

  if (blockExplorer == null) {
    throw new Error(`Block Explorer not found for chain ${chain}`);
  }
  return blockExplorer;
}

export function getTickerByBlockchain(chain: EVMBlockchainIncludingTestnet) {
  const ticker = new Map<EVMBlockchainIncludingTestnet, string | null>([
    ["ethereum", "ETH"],
    ["polygon", "MATIC"],
    ["ethereum-sepolia", "ETH"],
    ["polygon-amoy", "MATIC"],
    ["base-sepolia", "ETH"],
    ["base", "ETH"],
  ]).get(chain);

  if (ticker == null) {
    throw new Error(`Ticker project id not found for chain ${chain}`);
  }
  return ticker;
}

export function getTickerNameByBlockchain(
  chain: EVMBlockchainIncludingTestnet
) {
  const tickerName = new Map<EVMBlockchainIncludingTestnet, string | null>([
    ["ethereum", "ETHEREUM"],
    ["polygon", "MATIC"],
    ["ethereum-sepolia", "ETHEREUM"],
    ["polygon-amoy", "MATIC"],
    ["base-sepolia", "ETHEREUM"],
    ["base", "ETHEREUM"],
  ]).get(chain);

  if (tickerName == null) {
    throw new Error(`Ticker Name project id not found for chain ${chain}`);
  }
  return tickerName;
}
