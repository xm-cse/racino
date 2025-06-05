import {
  chain,
  crossmintApiKey,
  web3AuthClientId,
  web3AuthNetwork,
  web3AuthVerifierId,
} from "@/lib/config";
import {
  type EVMSmartWallet,
  type EVMSmartWalletChain,
  type ExternalSigner,
  SmartWalletSDK,
} from "@crossmint/client-sdk-smart-wallet";
import {
  type TORUS_NETWORK_TYPE,
  getWeb3AuthSigner,
  type Web3AuthSignerParams,
} from "@/lib/web3auth";
import {
  decodeEventLog,
  type Abi,
  type Address,
  type Hex,
  type TransactionReceipt,
} from "viem";
import { bundlerClient } from "@/lib/bundler";
import type { GetUserOperationReceiptReturnType } from "viem/account-abstraction";

export interface ExecuteContractParams<
  TAbi extends Abi,
  TFunctionName extends string
> {
  address: Address;
  abi: TAbi;
  functionName: TFunctionName;
  args?: readonly unknown[];
  value?: bigint;
}

export interface ExecuteContractResult {
  txHash: Hex;
  userOpHash?: Hex;
  userOpReceipt?: GetUserOperationReceiptReturnType;
  success: boolean;
  error?: string;
}

export interface ExecuteContractOptions {
  /** Maximum attempts to find UserOp receipt */
  maxUserOpAttempts?: number;
  /** Delay between UserOp receipt attempts (ms) */
  userOpRetryDelay?: number;
  /** Whether to wait for UserOp receipt or just return after tx confirmation */
  waitForUserOpReceipt?: boolean;
  /** Custom timeout for transaction confirmation (ms) */
  txTimeout?: number;
}

// EntryPoint UserOperationEvent ABI
const USER_OPERATION_EVENT_ABI = {
  anonymous: false,
  inputs: [
    { indexed: true, name: "userOpHash", type: "bytes32" },
    { indexed: true, name: "sender", type: "address" },
    { indexed: true, name: "paymaster", type: "address" },
    { indexed: false, name: "nonce", type: "uint256" },
    { indexed: false, name: "success", type: "bool" },
    { indexed: false, name: "actualGasCost", type: "uint256" },
    { indexed: false, name: "actualGasUsed", type: "uint256" },
  ],
  name: "UserOperationEvent",
  type: "event",
} as const;

const USER_OP_EVENT_TOPIC =
  "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f";

export const xm = SmartWalletSDK.init({
  clientApiKey: crossmintApiKey,
});

export const createAAWalletSigner = async (jwt: string) => {
  try {
    console.log("creating wallet");

    const signer = await getWeb3AuthSigner({
      clientId: web3AuthClientId,
      web3AuthNetwork: web3AuthNetwork as TORUS_NETWORK_TYPE,
      verifierId: web3AuthVerifierId,
      jwt,
      chain,
    } as Web3AuthSignerParams);

    console.log("config created");

    console.log({ jwt }, chain, signer);

    return xm.getOrCreateWallet({ jwt }, chain as EVMSmartWalletChain, {
      signer: signer as ExternalSigner,
    });
  } catch (error) {
    console.error("Error creating AA wallet signer:", error);
    throw error;
  }
};

/**
 * executeContract wrapper with UserOperation tracking and comprehensive error handling
 *
 * @param wallet - The Crossmint EVMSmartWallet instance
 * @param params - Contract execution parameters
 * @param options - Additional options for execution behavior
 * @returns Promise with transaction hash, UserOp hash, receipt, and status
 */
export async function executeContract<
  TAbi extends Abi,
  TFunctionName extends string
>(
  wallet: EVMSmartWallet,
  params: ExecuteContractParams<TAbi, TFunctionName>,
  options: ExecuteContractOptions = {}
): Promise<ExecuteContractResult> {
  const {
    maxUserOpAttempts = 10,
    userOpRetryDelay = 2000,
    waitForUserOpReceipt = true,
  } = options;

  try {
    console.log("🚀 Starting contract execution...");
    console.log("📋 Contract details:", {
      address: params.address,
      function: params.functionName,
      args: params.args,
      value: params.value?.toString(),
    });

    // Step 1: Execute the contract
    let txHash: Hex;

    try {
      txHash = await wallet.executeContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        value: params.value,
      } as Parameters<typeof wallet.executeContract>[0]);
      console.log("✅ Transaction sent successfully:", txHash);
    } catch (error) {
      console.error("❌ Failed to send transaction:", error);
      return {
        txHash: "0x" as Hex,
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown transaction error",
      };
    }

    // Step 2: Wait for transaction confirmation
    let txReceipt: TransactionReceipt | undefined = undefined;
    try {
      console.log("⏳ Waiting for transaction confirmation...");

      txReceipt = await wallet.client.public.waitForTransactionReceipt({
        hash: txHash,
      });

      // Check transaction status
      if (txReceipt?.status === "reverted") {
        console.error("❌ Transaction reverted");
        return {
          txHash,
          success: false,
          error: "Transaction was reverted",
        };
      }

      console.log("✅ Transaction confirmed:", txHash);
    } catch (error) {
      console.error("❌ Transaction confirmation failed:", error);
      return {
        txHash,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Transaction confirmation failed",
      };
    }

    // Step 3: Extract UserOp hash from transaction logs
    let userOpHash: Hex | undefined;
    try {
      console.log("🔍 Looking for UserOperation hash in transaction logs...");

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
            console.log("✅ UserOp hash found via ABI decoding:", userOpHash);
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
          console.log("✅ UserOp hash found via topic parsing:", userOpHash);
        }
      }

      if (!userOpHash) {
        console.log("⚠️ No UserOperationEvent found in transaction logs");
        console.log(
          "📝 Available log topics:",
          txReceipt.logs.map((l) => l.topics[0])
        );
      }
    } catch (error) {
      console.error("⚠️ Error extracting UserOp hash:", error);
    }

    // Step 4: Get UserOp receipt if hash was found and requested
    let userOpReceipt: GetUserOperationReceiptReturnType | undefined =
      undefined;
    if (userOpHash && waitForUserOpReceipt) {
      try {
        console.log("⏳ Attempting to get UserOperation receipt...");

        for (let attempt = 1; attempt <= maxUserOpAttempts; attempt++) {
          try {
            userOpReceipt = await bundlerClient.getUserOperationReceipt({
              hash: userOpHash,
            });

            if (userOpReceipt) {
              console.log("✅ UserOp receipt found:", {
                success: userOpReceipt.success,
                actualGasCost: userOpReceipt.actualGasCost,
                actualGasUsed: userOpReceipt.actualGasUsed,
              });
              break;
            }
          } catch (receiptError) {
            console.log(
              `⏳ Attempt ${attempt}/${maxUserOpAttempts}: UserOp receipt not found yet...`
            );

            if (attempt === maxUserOpAttempts) {
              console.error(
                "⚠️ UserOp receipt not found after maximum attempts"
              );
              console.error("Receipt error:", receiptError);
            } else {
              // Wait before next attempt
              await new Promise((resolve) =>
                setTimeout(resolve, userOpRetryDelay)
              );
            }
          }
        }
      } catch (error) {
        console.error("❌ Error getting UserOp receipt:", error);
      }
    }

    // Step 5: Return comprehensive result
    const result: ExecuteContractResult = {
      txHash,
      userOpHash,
      userOpReceipt,
      success: true,
    };

    console.log("🎉 Contract execution completed successfully!");
    console.log("📊 Final result:", {
      txHash: result.txHash,
      userOpHash: result.userOpHash,
      hasUserOpReceipt: !!result.userOpReceipt,
    });

    return result;
  } catch (error) {
    console.error("💥 Unexpected error during contract execution:", error);
    return {
      txHash: "0x" as Hex,
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

export async function executeERC20Transfer(
  wallet: EVMSmartWallet,
  tokenAddress: Address,
  to: Address,
  amount: bigint,
  options?: ExecuteContractOptions
): Promise<ExecuteContractResult> {
  const ERC20_TRANSFER_ABI = [
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

  return executeContract(
    wallet,
    {
      address: tokenAddress,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [to, amount],
    },
    options
  );
}

export async function executeETHTransfer(
  wallet: EVMSmartWallet,
  to: Address,
  amount: bigint,
  options?: ExecuteContractOptions
): Promise<ExecuteContractResult> {
  const EXECUTE_ABI = [
    {
      inputs: [
        { internalType: "address", name: "dest", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "bytes", name: "func", type: "bytes" },
      ],
      name: "execute",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

  return executeContract(
    wallet,
    {
      address: wallet.address,
      abi: EXECUTE_ABI,
      functionName: "execute",
      args: [to, amount, "0x"],
    },
    options
  );
}
