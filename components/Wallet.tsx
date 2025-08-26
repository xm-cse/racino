"use client";

import { Button } from "@/components/ui/button";
import {
  createAAWalletSigner,
  executeERC20Transfer,
  type ExecuteContractResult,
} from "@/lib/wallets";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { type Address, parseUnits } from "viem";

const USDC_AMOY_CONTRACT_ADDRESS =
  "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582" as Address; // USDC Polygon Amoy
const USDC_BASE_SEPOLIA_CONTRACT_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address; // USDC Base Sepolia

export default function Wallet() {
  const { user, jwt } = useAuth();
  const [wallet, setWallet] = useState<EVMSmartWallet | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<ExecuteContractResult | null>(null);

  // Inputs for Amoy flow
  const [amoyRecipient, setAmoyRecipient] = useState<string>("");
  const [amoyAmount, setAmoyAmount] = useState<string>("0.001");

  // Inputs for Base Sepolia flow
  const [baseRecipient, setBaseRecipient] = useState<string>("");
  const [baseAmount, setBaseAmount] = useState<string>("0.001");

  const {
    mutate: transferUSDC,
    isPending: isTransferUSDCPending,
    error: transferUSDCError,
  } = useMutation({
    mutationFn: async (args: {
      recipient: Address;
      amount: string;
      usdcAddress: Address;
      chain: string;
    }) => {
      if (!jwt || !user || !wallet) {
        return null;
      }

      const result = await executeERC20Transfer(
        wallet,
        args.usdcAddress,
        args.recipient,
        parseUnits(args.amount, 6), // USDC has 6 decimals
        { jwt, chain: args.chain } // Pass JWT and chain in options for validation
      );

      return result;
    },
    onSuccess: (result) => {
      setTransactionResult(result);
    },
    onError: (error) => {
      console.error(error);
      setTransactionResult(null);
    },
  });

  const {
    mutate: createWallet,
    isPending: isCreateWalletPending,
    error: createWalletError,
  } = useMutation({
    mutationFn: async (args?: { chain?: string }) => {
      if (!jwt || !user) {
        return null;
      }
      return createAAWalletSigner(jwt, args?.chain);
    },
    onSuccess: (wallet) => {
      setWallet(wallet || null);
    },
    onError: (error) => {
      console.error(error);
      setWallet(null);
    },
  });

  if (!user || !jwt) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <div className="max-w-md w-full p-4">
          <p className="text-sm text-gray-600 mb-2">
            Please log in to create a wallet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[200px] w-full">
      <div className="max-w-md w-full p-4 space-y-4">
        {createWalletError ? (
          <div className="space-y-3">
            <div className="text-red-500 text-sm">
              Error: {createWalletError.message}
            </div>
            <Button onClick={() => createWallet({})} className="w-full">
              Try Again
            </Button>
          </div>
        ) : !wallet ? (
          <Button
            onClick={() => createWallet({})}
            disabled={isCreateWalletPending}
            className="w-full"
          >
            {isCreateWalletPending ? "Creating wallet..." : "Create Wallet"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">Your wallet address:</p>
              <p className="font-mono text-sm break-all bg-gray-100 p-2 rounded">
                {wallet.address}
              </p>
            </div>

            {/* Amoy USDC Transfer */}
            <div className="space-y-2 border rounded-md p-3">
              <div className="font-medium">Send USDC on Amoy</div>
              <input
                type="text"
                placeholder="Recipient address (0x...)"
                value={amoyRecipient}
                onChange={(e) => setAmoyRecipient(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Amount (e.g. 0.001)"
                value={amoyAmount}
                onChange={(e) => setAmoyAmount(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <Button
                onClick={() =>
                  transferUSDC({
                    recipient: amoyRecipient as Address,
                    amount: amoyAmount,
                    usdcAddress: USDC_AMOY_CONTRACT_ADDRESS,
                    chain: "polygon-amoy",
                  })
                }
                disabled={
                  isTransferUSDCPending || !amoyRecipient || !amoyAmount
                }
                className="w-full"
                variant="outline"
              >
                {isTransferUSDCPending ? "Sending..." : "Send USDC (Amoy)"}
              </Button>
            </div>

            {/* Base Sepolia USDC Transfer */}
            <div className="space-y-2 border rounded-md p-3">
              <div className="font-medium">Send USDC on Base Sepolia</div>
              <input
                type="text"
                placeholder="Recipient address (0x...)"
                value={baseRecipient}
                onChange={(e) => setBaseRecipient(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Amount (e.g. 0.001)"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <Button
                onClick={() =>
                  transferUSDC({
                    recipient: baseRecipient as Address,
                    amount: baseAmount,
                    usdcAddress: USDC_BASE_SEPOLIA_CONTRACT_ADDRESS,
                    chain: "base-sepolia",
                  })
                }
                disabled={
                  isTransferUSDCPending || !baseRecipient || !baseAmount
                }
                className="w-full"
                variant="outline"
              >
                {isTransferUSDCPending
                  ? "Sending..."
                  : "Send USDC (Base Sepolia)"}
              </Button>
            </div>

            {transferUSDCError && (
              <div className="text-red-500 text-sm">
                Transfer failed: {transferUSDCError.message}
              </div>
            )}

            {transactionResult && (
              <div
                className={`text-sm ${
                  transactionResult.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {transactionResult.success
                  ? "Transfer successful!"
                  : "Transfer failed!"}
                <div className="space-y-2 mt-2">
                  <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                    <div className="font-semibold mb-1">Transaction Hash:</div>
                    {transactionResult.txHash}
                  </div>

                  {transactionResult.userOpHash && (
                    <div className="font-mono text-xs break-all bg-blue-50 p-2 rounded">
                      <div className="font-semibold mb-1">
                        User Operation Hash:
                      </div>
                      {transactionResult.userOpHash}
                    </div>
                  )}

                  {transactionResult.userOpReceipt && (
                    <div className="bg-green-50 p-2 rounded text-xs">
                      <div className="font-semibold mb-1">
                        User Operation Details:
                      </div>
                      <div>
                        Success:{" "}
                        {transactionResult.userOpReceipt.success ? "Yes" : "No"}
                      </div>
                      <div>
                        Gas Used:{" "}
                        {transactionResult.userOpReceipt.actualGasUsed.toString()}
                      </div>
                      <div>
                        Gas Cost:{" "}
                        {transactionResult.userOpReceipt.actualGasCost.toString()}
                      </div>
                    </div>
                  )}

                  {transactionResult.error && (
                    <div className="bg-red-50 p-2 rounded text-xs">
                      <div className="font-semibold mb-1">Error:</div>
                      {transactionResult.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
