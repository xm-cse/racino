import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import type {
  ReservoirWallet,
  SignatureStepItem,
  TransactionStepItem,
} from "@reservoir0x/reservoir-sdk";
import type { Address, Hex, WalletClient } from "viem";

export type ReservoirCompatibleWallet = ReservoirWallet | WalletClient;

const ZERO_HEX_VALUES = new Set(["0x", "0x0", "0"]);

const toBigIntOrUndefined = (value?: string): bigint | undefined => {
  if (!value) {
    return undefined;
  }

  if (ZERO_HEX_VALUES.has(value)) {
    return 0n;
  }

  try {
    return BigInt(value);
  } catch (primaryError) {
    try {
      return BigInt(value.startsWith("0x") ? value : `0x${value}`);
    } catch (secondaryError) {
      console.warn(
        "[wallets/client] Failed to parse bigint value from Reservoir step",
        {
          value,
          primaryError,
          secondaryError,
        }
      );
      return undefined;
    }
  }
};

const handleSignatureStep =
  (wallet: EVMSmartWallet) =>
  async (item: SignatureStepItem): Promise<string | undefined> => {
    const signData = item.data?.sign;
    if (!signData) {
      return undefined;
    }

    try {
      if (signData.signatureKind === "eip191") {
        return wallet.client.wallet.signMessage({
          message: signData.message,
        });
      }

      if (signData.signatureKind === "eip712") {
        const typedMessage = signData.value ?? signData.message;
        return wallet.client.wallet.signTypedData({
          domain: signData.domain,
          types: signData.types,
          primaryType: signData.primaryType,
          message: typedMessage,
        });
      }

      console.warn(
        "[wallets/client] Unsupported signature kind received from Reservoir",
        signData.signatureKind
      );
      return undefined;
    } catch (error) {
      console.error(
        "[wallets/client] Failed to handle Reservoir signature step",
        error
      );
      throw error;
    }
  };

const handleTransactionStep =
  (wallet: EVMSmartWallet) =>
  async (
    _chainId: number,
    item: TransactionStepItem
  ): Promise<`0x${string}` | undefined> => {
    const stepData = item.data;
    if (!stepData?.to) {
      console.error(
        "[wallets/client] Missing transaction recipient in Reservoir step",
        item
      );
      throw new Error("Reservoir transaction step missing destination address");
    }

    try {
      const request: {
        to: Address;
        value?: bigint;
        data?: Hex;
      } = {
        to: stepData.to as Address,
      };

      const parsedValue = toBigIntOrUndefined(stepData.value);
      if (parsedValue !== undefined) {
        request.value = parsedValue;
      }

      if (stepData.data) {
        request.data = stepData.data as Hex;
      }

      return wallet.client.wallet.sendTransaction(request);
    } catch (error) {
      console.error(
        "[wallets/client] Failed to handle Reservoir transaction step",
        error
      );
      throw error;
    }
  };

export const createReservoirWallet = (
  wallet: EVMSmartWallet
): ReservoirCompatibleWallet => {
  const reservoirWallet: ReservoirWallet = {
    address: async () => wallet.address,
    handleSignMessageStep: handleSignatureStep(wallet),
    handleSendTransactionStep: handleTransactionStep(wallet),
  };

  return reservoirWallet;
};
