"use client";

import { Button } from "@/components/ui/button";
import { bundlerClient } from "@/lib/bundler";
import { createAAWalletSigner } from "@/lib/wallets";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { type Address, parseUnits } from "viem";

const transferABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const USDC_CONTRACT_ADDRESS =
  "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582" as Address; // USDC Polygon Amoy

export default function Wallet() {
  const { user, jwt } = useAuth();
  const [wallet, setWallet] = useState<EVMSmartWallet | null>(null);
  const [transferTxHash, setTransferTxHash] = useState<string | null>(null);

  const {
    mutate: transferUSDC,
    isPending: isTransferUSDCPending,
    error: transferUSDCError,
  } = useMutation({
    mutationFn: async () => {
      if (!jwt || !user || !wallet) {
        return null;
      }

      const hash = await wallet.executeContract({
        address: USDC_CONTRACT_ADDRESS, // USDC contract
        abi: transferABI,
        functionName: "transfer",
        args: [
          "0xa064b2E2B6f9CEaC2c60a81369aeC35C0FBe467F", // EOA
          parseUnits("0.001", 6), // USDC has 6 decimals
        ],
      });

      // wait for hash to be mined
      await wallet.client.public.waitForTransactionReceipt({
        hash,
      });

      // wait for user operation to be mined
      await bundlerClient.waitForUserOperationReceipt({
        hash,
        timeout: 1000 * 60 * 2, // 2 minutes
      });

      return hash;
    },
    onSuccess: (txHash) => {
      setTransferTxHash(txHash);
    },
    onError: (error) => {
      console.error(error);
      setTransferTxHash(null);
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

            {transferTxHash && (
              <div className="text-green-600 text-sm">
                Transfer successful!
                <div className="font-mono text-xs break-all mt-1 bg-green-50 p-2 rounded">
                  {transferTxHash}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
