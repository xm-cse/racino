import { pimlicoApiKey } from "@/lib/config";
import { http } from "viem";
import {
  entryPoint07Address,
  createBundlerClient,
} from "viem/account-abstraction";
import { supportedChains } from "@/lib/networks";
import { pimlicoActions } from "permissionless/actions/pimlico";

// dev: see https://viem.sh/account-abstraction/guides/sending-user-operations#7-optional-sponsor-user-operation

const chain = supportedChains["polygon-amoy"];

if (!chain) {
  throw new Error("Chain not supported");
}

export const bundlerClient = createBundlerClient({
  chain,
  transport: http(
    `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${pimlicoApiKey}`
  ),
}).extend(
  pimlicoActions({
    entryPoint: { address: entryPoint07Address, version: "0.7" },
  })
);
