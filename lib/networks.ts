import type { EVMBlockchainIncludingTestnet as Blockchain } from "@crossmint/common-sdk-base";
import { polygonAmoy, baseSepolia, polygon, base } from "viem/chains";

import type { Chain } from "viem/chains";

export const supportedChains: Partial<Record<Blockchain, Chain>> = {
  "polygon-amoy": polygonAmoy,
  "base-sepolia": baseSepolia,
  polygon: polygon,
  base: base,
};
