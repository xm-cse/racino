// import { pimlicoApiKey } from "@/lib/config";
import { http } from "viem";
import {
  // entryPoint07Address,
  createBundlerClient,
  // createPaymasterClient,
} from "viem/account-abstraction";
import { supportedChains } from "@/lib/networks";
// import { pimlicoActions } from "permissionless/actions/pimlico";

// dev: see https://viem.sh/account-abstraction/guides/sending-user-operations#7-optional-sponsor-user-operation

const chain = supportedChains["polygon-amoy"];

if (!chain) {
  throw new Error("Chain not supported");
}

export const bundlerClient = createBundlerClient({
  chain,
  transport: http(`https://public.pimlico.io/v2/${chain.id}/rpc`),
});
