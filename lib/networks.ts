import type { EVMBlockchainIncludingTestnet as Blockchain } from "@crossmint/common-sdk-base";
import {
  polygonAmoy,
  baseSepolia,
  polygon,
  base,
  apeChain,
  curtis,
} from "viem/chains";

import type { Chain } from "viem/chains";

export const supportedChains: Partial<Record<Blockchain | string, Chain>> = {
  "polygon-amoy": polygonAmoy,
  "base-sepolia": baseSepolia,
  polygon: polygon,
  base: base,
  apechain: apeChain,
  curtis: curtis,
};
