import { bundlerClients } from "@/lib/bundler";
import { USER_OP_EVENT_TOPIC, USER_OPERATION_EVENT_ABI } from "@/lib/wallets";
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import type {
  ReservoirWallet,
  SignatureStepItem,
  TransactionStepItem,
} from "@reservoir0x/reservoir-sdk";
import {
  decodeEventLog,
  type Address,
  type Hex,
  type TransactionReceipt,
  type WalletClient,
} from "viem";
import type { GetUserOperationReceiptReturnType } from "viem/account-abstraction";

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
  (wallet: EVMSmartWallet, chainId = "polygon-amoy") =>
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

    // Execute the contract
    let txHash: Hex;

    try {
      txHash = await wallet.client.wallet.sendTransaction(request);
      console.log("[wallet/client] ✅ Transaction sent successfully:", txHash);
    } catch (error) {
      console.error("[wallet/client] ❌ Failed to send transaction:", error);
      throw error;
    }

    let txReceipt: TransactionReceipt | undefined = undefined;
    try {
      console.log("[wallet/client] ⏳ Waiting for transaction confirmation...");

      txReceipt = await wallet.client.public.waitForTransactionReceipt({
        hash: txHash,
      });

      if (txReceipt?.status === "reverted") {
        console.error("[wallet/client] ❌ Transaction reverted", txReceipt);
        throw new Error("Transaction was reverted");
      }

      console.log("[wallet/client] ✅ Transaction confirmed:", txHash);
    } catch (error) {
      console.error(
        "[wallet/client] ❌ Transaction confirmation failed:",
        error
      );
      throw error;
    }

    let userOpHash: Hex | undefined;
    try {
      console.log(
        "[wallet/client] 🔍 Looking for UserOperation hash in transaction logs..."
      );

      // Method 1: Try ABI decoding (more reliable)
      for (const logEntry of txReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: [USER_OPERATION_EVENT_ABI],
            data: logEntry.data,
            topics: logEntry.topics,
          });

          if (decoded.eventName === "UserOperationEvent") {
            userOpHash = decoded.args.userOpHash;
            console.log(
              "[wallet/client] ✅ UserOp hash found via ABI decoding:",
              userOpHash
            );
            break;
          }
        } catch {
          // Continue to next log entry
        }
      }

      // Method 2: Fallback to topic parsing
      if (!userOpHash) {
        const userOpLog = txReceipt.logs.find(
          (logEntry) => logEntry.topics[0] === USER_OP_EVENT_TOPIC
        );

        if (userOpLog?.topics[1]) {
          userOpHash = userOpLog.topics[1];
          console.log(
            "[wallet/client] ✅ UserOp hash found via topic parsing:",
            userOpHash
          );
        }
      }

      if (!userOpHash) {
        console.log(
          "[wallet/client] ⚠️ No UserOperationEvent found in transaction logs"
        );
        console.log(
          "[wallet/client] 📝 Available log topics:",
          txReceipt.logs.map((l) => l.topics[0])
        );
      }
    } catch (error) {
      console.error("[wallet/client] ⚠️ Error extracting UserOp hash:", error);
    }

    let userOpReceipt: GetUserOperationReceiptReturnType | undefined =
      undefined;
    const maxUserOpAttempts = 10;
    const userOpRetryDelay = 2000;
    if (userOpHash) {
      try {
        console.log(
          "[wallet/client] ⏳ Attempting to get UserOperation receipt..."
        );

        // Get the appropriate bundler client for the chain
        // Use the chain from options if provided, otherwise default to polygon-amoy
        const chainBundlerClient = bundlerClients[chainId];

        for (let attempt = 1; attempt <= maxUserOpAttempts; attempt++) {
          try {
            userOpReceipt = await chainBundlerClient.getUserOperationReceipt({
              hash: userOpHash,
            });

            if (userOpReceipt) {
              console.log("[wallet/client] ✅ UserOp receipt found:", {
                success: userOpReceipt.success,
                actualGasCost: userOpReceipt.actualGasCost,
                actualGasUsed: userOpReceipt.actualGasUsed,
              });
              break;
            }
          } catch (receiptError) {
            console.log(
              `[wallet/client] ⏳ Attempt ${attempt}/${maxUserOpAttempts}: UserOp receipt not found yet...`
            );

            if (attempt === maxUserOpAttempts) {
              console.error(
                "[wallet/client] ⚠️ UserOp receipt not found after maximum attempts"
              );
              console.error("[wallet/client] Receipt error:", receiptError);
            } else {
              // Wait before next attempt
              await new Promise((resolve) =>
                setTimeout(resolve, userOpRetryDelay)
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "[wallet/client] ❌ Error getting UserOp receipt:",
          error
        );
      }
    }

    return txHash;
  };

export const createReservoirWallet = (
  wallet: EVMSmartWallet,
  chainId = "polygon-amoy"
): ReservoirCompatibleWallet => {
  const reservoirWallet: ReservoirWallet = {
    address: async () => wallet.address,
    handleSignMessageStep: handleSignatureStep(wallet),
    handleSendTransactionStep: handleTransactionStep(wallet, chainId),
  };

  return reservoirWallet;
};
