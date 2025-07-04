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

const USDC_CONTRACT_ADDRESS =
  "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582" as Address; // USDC Polygon Amoy

export default function Wallet() {
  const { user, jwt } = useAuth();
  const [wallet, setWallet] = useState<EVMSmartWallet | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<ExecuteContractResult | null>(null);

  const {
    mutate: transferUSDC,
    isPending: isTransferUSDCPending,
    error: transferUSDCError,
  } = useMutation({
    mutationFn: async () => {
      if (!jwt || !user || !wallet) {
        return null;
      }

      const result = await executeERC20Transfer(
        wallet,
        USDC_CONTRACT_ADDRESS,
        "0xa064b2E2B6f9CEaC2c60a81369aeC35C0FBe467F", // EOA
        parseUnits("0.001", 6), // USDC has 6 decimals
        { jwt } // Pass JWT in options for validation
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
    mutationFn: async () => {
      if (!jwt || !user) {
        return null;
      }
      return createAAWalletSigner(jwt);
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
            <Button onClick={() => createWallet()} className="w-full">
              Try Again
            </Button>
          </div>
        ) : !wallet ? (
          <Button
            onClick={() => createWallet()}
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

            <Button
              onClick={() => transferUSDC()}
              disabled={isTransferUSDCPending}
              className="w-full"
              variant="outline"
            >
              {isTransferUSDCPending ? "Sending USDC..." : "Send 0.001 USDC"}
            </Button>

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
