import { elementApiKey, polygonAlchemyRpcUrl } from "@/lib/config";
import { SignerWrapper } from "@/lib/wallets/signer";
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import { JsonRpcProvider } from "ethers";
import { ElementSDK, Network } from "element-js-sdk";

// generates a provider given an rpc url
export const polygonProvider = new JsonRpcProvider(polygonAlchemyRpcUrl);

export const listNftToken = async ({
  aaWallet,
  tokenAddress,
  tokenId,
  listingAmount,
}: {
  aaWallet: EVMSmartWallet;
  tokenAddress: string;
  tokenId: string;
  listingAmount: string;
}) => {
  if (!elementApiKey) {
    throw new Error("Element API key is not set");
  }

  const sdk = new ElementSDK({
    networkName: Network.Polygon,
    isTestnet: false,
    apiKey: elementApiKey,
    signer: SignerWrapper.fromLegacyWallet(aaWallet, polygonProvider),
  });

  try {
    console.log("[element] 🚀 Starting listing...");
    const response = await sdk.makeSellOrder({
      assetAddress: tokenAddress,
      assetId: tokenId,
      paymentTokenAmount: listingAmount,
    });
    console.log(
      "[element] ✅ Successfully created a listing with orderHash:",
      response.orderId
    );

    return response.orderId ?? "";
  } catch (error) {
    console.error("Error in createListing:", error);
    return error as string;
  }
};
