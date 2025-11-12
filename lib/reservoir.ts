import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import {
  type Execute,
  createClient,
  reservoirChains,
} from "@reservoir0x/reservoir-sdk";
import { createReservoirWallet } from "@/lib/wallets/client";

export const NFT_COLLECTION_ADDRESS =
  process.env.NEXT_PUBLIC_CARS_CONTRACT_ADDRESS;

const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
const nodeEnv = process.env.NEXT_PUBLIC_ENV;

export const reservoir = createClient({
  chains: [
    {
      ...(nodeEnv === "dev"
        ? reservoirChains.polygonAmoy
        : reservoirChains.polygon),
      active: true,
      baseApiUrl: "YOUR_RESERVOIR_API_URL",
    },
  ],
  apiKey: "YOUR_RESERVOIR_API_KEY",
  source: "YOUR_SOURCE",
});

// Used to list a token for sale on the marketplace
export const listNftTOken = async ({
  aaWallet,
  token,
  weiPrice,
  endWeiPrice,
  currencyContractAddress,
  expirationTime,
}: {
  aaWallet: EVMSmartWallet;
  token: string;
  weiPrice: string;
  endWeiPrice?: string;
  currencyContractAddress: string;
  expirationTime?: string;
}) => {
  const wallet = createReservoirWallet(aaWallet);

  let resultOrderId = "";

  try {
    await reservoir.actions.listToken({
      wallet,
      listings: [
        {
          token,
          weiPrice,
          endWeiPrice,
          orderbook: "reservoir",
          orderKind: "seaport-v1.5",
          currency: currencyContractAddress,
          expirationTime,
        },
      ],
      onProgress: (steps: Execute["steps"]) => {
        const orderSignatureStep = steps.find(
          (step) => step.id === "order-signature"
        );
        if (orderSignatureStep?.items && orderSignatureStep.items.length > 0) {
          const orderData = orderSignatureStep.items[0]?.orderData;
          if (orderData && Array.isArray(orderData) && orderData.length > 0) {
            resultOrderId = orderData[0]?.orderId ?? "";
          }
        }
      },
    });

    return resultOrderId;
  } catch (error) {
    console.log("Error on Reservoir SDK:", error);
    throw new Error(error as string);
  }
};

// Used to buy a token from the marketplace
export const buyToken = async ({
  aaWallet,
  currencyContractAddress,
  orderId,
}: {
  aaWallet: EVMSmartWallet;
  currencyContractAddress: string;
  orderId: string;
}) => {
  const wallet = createReservoirWallet(aaWallet);

  let txHash = "";
  try {
    const response = await reservoir.actions.buyToken({
      items: [{ orderId: orderId, quantity: 1 }],
      wallet,
      onProgress: (steps: Execute["steps"]) => {
        const saleStep = steps.find((step) => step.id === "sale");
        if (saleStep?.items && saleStep.items.length > 0) {
          txHash = saleStep.items[0]?.txHashes?.[0]?.txHash ?? "";
        }
      },
      options: {
        currencyChainId: Number(chainId),
        currency: currencyContractAddress,
      },
    });

    if (typeof response === "object") {
      console.log("response", response.steps);
    }

    return {
      txHash,
      orderId,
    };
  } catch (error) {
    console.log(error);
    throw new Error(JSON.stringify(JSON.stringify({ error: error })));
  }
};

// Used to place a bid on a token
export const placeBid = async ({
  aaWallet,
  token,
  weiPrice,
}: {
  aaWallet: EVMSmartWallet;
  token: string;
  weiPrice: string;
}) => {
  const wallet = createReservoirWallet(aaWallet);

  try {
    const response = await reservoir.actions.placeBid({
      bids: [
        {
          weiPrice,
          token,
          orderbook: "reservoir",
          orderKind: "seaport-v1.5",
        },
      ],
      wallet,
      onProgress: (steps: Execute["steps"]) => {
        console.log(steps);
      },
    });

    return new Response(JSON.stringify(response));
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify(JSON.stringify({ error: error })));
  }
};

// CANCEL ORDER
export const cancelOrder = async ({
  aaWallet,
  orderId,
}: {
  aaWallet: EVMSmartWallet;
  orderId: string[];
}) => {
  const wallet = createReservoirWallet(aaWallet);

  const resultOrderId = "";

  try {
    await reservoir.actions.cancelOrder({
      ids: orderId,
      wallet,
      onProgress: (steps: Execute["steps"]) => {
        console.log(steps);

        // orderId extracted
        console.log("OrderId:", resultOrderId);
      },
    });

    return resultOrderId;
  } catch (error) {
    console.log("Error on Reservoir SDK:", error);
    throw new Error(error as string);
  }
};
