"use client";

import { Button } from "@/components/ui/button";
import { createDualWallets, executeERC20Transfer, type ExecuteContractResult } from "@/lib/wallets";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { type Address, parseUnits } from "viem";
import { legacyChain, latestChain } from "@/lib/config";

const USDC_CONTRACT_ADDRESS =
  "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582" as Address; // USDC Polygon Amoy

export default function Wallet() {
  const { user, jwt } = useAuth();
  const [dualWallets, setDualWallets] = useState<{
    legacyWallet: EVMSmartWallet | null;
    latestWallet: EVMSmartWallet | null;
    error?: string;
  } | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<EVMSmartWallet | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<ExecuteContractResult | null>(null);

  const {
    mutate: transferUSDC,
    isPending: isTransferUSDCPending,
    error: transferUSDCError,
  } = useMutation({
    mutationFn: async () => {
      if (!jwt || !user || !selectedWallet) {
        return null;
      }

      const result = await executeERC20Transfer(
        selectedWallet,
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
    mutate: createDualWalletsMutation,
    isPending: isCreatingWallets,
    error: createWalletsError,
  } = useMutation({
    mutationFn: async () => {
      if (!jwt || !user) {
        return null;
      }
      return createDualWallets(jwt);
    },
    onSuccess: (result) => {
      if (result) {
        setDualWallets(result);
        // Auto-select the first available wallet
        if (result.legacyWallet) {
          setSelectedWallet(result.legacyWallet);
        } else if (result.latestWallet) {
          setSelectedWallet(result.latestWallet);
        }
        console.log("✅ Dual wallets created/retrieved:", result);
      }
    },
    onError: (error) => {
      console.error("❌ Error creating dual wallets:", error);
    },
  });

  // Remove the getExistingWallets mutation since we don't need it anymore

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
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
      <div className="max-w-md w-full p-4 space-y-4">
        <h2 className="text-xl font-bold text-center">Dual Wallet System</h2>
        
        {/* Single Button for Dual Wallets */}
        <div className="space-y-2">
          <Button
            onClick={() => createDualWalletsMutation()}
            disabled={isCreatingWallets}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingWallets ? "Creating Dual Wallets..." : `Create Dual Wallets (${legacyChain} + ${latestChain})`}
          </Button>
        </div>

        {/* Display Wallets */}
        {dualWallets && (
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-semibold">Wallet Status:</h3>
            
            {dualWallets.legacyWallet && (
              <div className={`p-3 rounded cursor-pointer ${
                selectedWallet?.address === dualWallets.legacyWallet?.address 
                  ? 'bg-blue-100 border-2 border-blue-500' 
                  : 'bg-blue-50'
              }`} onClick={() => setSelectedWallet(dualWallets.legacyWallet!)}>
                <p className="text-sm font-medium text-blue-800">Legacy Wallet</p>
                <p className="text-xs text-blue-600 font-mono">
                  {dualWallets.legacyWallet.address}
                </p>
                {selectedWallet?.address === dualWallets.legacyWallet?.address && (
                  <p className="text-xs text-blue-600 mt-1">✓ Selected</p>
                )}
              </div>
            )}
            
            {dualWallets.latestWallet && (
              <div className={`p-3 rounded cursor-pointer ${
                selectedWallet?.address === dualWallets.latestWallet?.address 
                  ? 'bg-green-100 border-2 border-green-500' 
                  : 'bg-green-50'
              }`} onClick={() => setSelectedWallet(dualWallets.latestWallet!)}>
                <p className="text-sm font-medium text-green-800">Latest SDK Wallet</p>
                <p className="text-xs text-green-600 font-mono">
                  {dualWallets.latestWallet.address}
                </p>
                {selectedWallet?.address === dualWallets.latestWallet?.address && (
                  <p className="text-xs text-green-600 mt-1">✓ Selected</p>
                )}
              </div>
            )}
            
            {dualWallets.error && (
              <div className="p-3 bg-red-50 rounded">
                <p className="text-sm text-red-800">Error: {dualWallets.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Wallet Selection Info */}
        {selectedWallet && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium text-gray-800">Selected Wallet:</p>
            <p className="text-xs text-gray-600 font-mono">
              {selectedWallet.address}
            </p>
          </div>
        )}

        {/* USDC Transfer Section */}
        {selectedWallet && (
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-semibold">USDC Transfer</h3>
            <Button
              onClick={() => transferUSDC()}
              disabled={isTransferUSDCPending}
              className="w-full"
            >
              {isTransferUSDCPending ? "Transferring..." : "Transfer 0.001 USDC"}
            </Button>
            
            {transactionResult && (
              <div className={`p-3 rounded ${
                transactionResult.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`text-sm font-medium ${
                  transactionResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {transactionResult.success ? 'Transfer Successful!' : 'Transfer Failed'}
                </p>
                {transactionResult.txHash && (
                  <p className="text-xs text-gray-600 font-mono mt-1">
                    TX: {transactionResult.txHash}
                  </p>
                )}
                {transactionResult.error && (
                  <p className="text-xs text-red-600 mt-1">{transactionResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {(createWalletsError || transferUSDCError) && (
          <div className="p-3 bg-red-50 rounded">
            <p className="text-sm text-red-800">
              Error: {createWalletsError?.message || transferUSDCError?.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
