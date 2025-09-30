import { openseaApiKey, polygonAlchemyRpcUrl } from "@/lib/config";
import { SignerWrapper } from "@/lib/wallets/signer";
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import { JsonRpcProvider } from "ethers";
import { Chain, OpenSeaSDK } from "opensea-js";

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
  if (!openseaApiKey) {
    throw new Error("Opensea API key is not set");
  }

  const sdk = new OpenSeaSDK(
    SignerWrapper.fromLegacyWallet(aaWallet, polygonProvider),
    {
      chain: Chain.Polygon,
      apiKey: openseaApiKey,
    }
  );

  const listing = {
    accountAddress: aaWallet.address,
    startAmount: listingAmount,
    asset: {
      tokenAddress: tokenAddress,
      tokenId: tokenId,
    },
  };

  try {
    console.log("[opensea] 🚀 Starting listing...");
    const response = await sdk.createListing(listing);
    console.log(
      "[opensea] ✅ Successfully created a listing with orderHash:",
      response.orderHash
    );

    return response.orderHash ?? "";
  } catch (error) {
    console.error("Error in createListing:", error);
    return error as string;
  }
};
