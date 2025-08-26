"use client";

import { Button } from "@/components/ui/button";
import {
  createWallets,
  executeERC20Transfer,
  type ExecuteContractResult,
} from "@/lib/wallets";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import type { Chain, EVMWallet, Transaction } from "@crossmint/wallets-sdk";
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { type Address, parseUnits } from "viem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
// Card and Alert are available; we'll switch to them when we fully card-ify the layout

const USDC_AMOY_CONTRACT_ADDRESS =
  "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582" as Address; // USDC Polygon Amoy
const USDC_BASE_SEPOLIA_CONTRACT_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address; // USDC Base Sepolia

export default function Wallet() {
  const { user, jwt } = useAuth();
  const [wallets, setWallets] = useState<{
    legacyWallet: EVMSmartWallet;
    latestWallet: EVMWallet;
  } | null>(null);
  const [legacyTransactionResult, setLegacyTransactionResult] =
    useState<ExecuteContractResult | null>(null);
  const [latestTransactionResult, setLatestTransactionResult] =
    useState<Transaction | null>(null);

  // Inputs for Legacy flow
  const [legacyRecipient, setLegacyRecipient] = useState<string>("");
  const [legacyAmount, setLegacyAmount] = useState<string>("0.001");
  const [legacyChain, setLegacyChain] = useState<string>("polygon-amoy");

  // Inputs for New SDK flow
  const [newRecipient, setNewRecipient] = useState<string>("");
  const [newAmount, setNewAmount] = useState<string>("0.001");
  const [newChain, setNewChain] = useState<string>("polygon-amoy");

  const {
    mutate: legacyTransferUSDC,
    isPending: isLegacyTransferUSDCPending,
    error: legacyTransferUSDCError,
  } = useMutation({
    mutationFn: async (args: {
      recipient: Address;
      amount: string;
      usdcAddress: Address;
      chain: string;
    }) => {
      if (!jwt || !user || !wallets?.legacyWallet) {
        return null;
      }

      const result = await executeERC20Transfer(
        wallets.legacyWallet,
        args.usdcAddress,
        args.recipient,
        parseUnits(args.amount, 6), // USDC has 6 decimals
        { jwt, chain: args.chain } // Pass JWT and chain in options for validation
      );

      return result;
    },
    onSuccess: (result) => {
      setLegacyTransactionResult(result);
    },
    onError: (error) => {
      console.error(error);
      setLegacyTransactionResult(null);
    },
  });

  const {
    mutate: latestTransferUSDC,
    isPending: isLatestTransferUSDCPending,
    error: latestTransferUSDCError,
  } = useMutation({
    mutationFn: async (args: {
      recipient: Address;
      amount: string;
      chain: string;
    }) => {
      if (!jwt || !user) {
        return null;
      }

      // Ensure latest wallet is created for the selected chain
      const refreshed = await createWallets(jwt, args.chain as Chain);
      if (refreshed) {
        setWallets(refreshed);
      }

      const walletToUse = refreshed?.latestWallet || wallets?.latestWallet;
      if (!walletToUse) return null;

      const result = await walletToUse.send(
        args.recipient,
        "usdc",
        args.amount
      );
      return result;
    },
    onSuccess: (result) => {
      setLatestTransactionResult(result);
    },
    onError: (error) => {
      console.error(error);
      setLatestTransactionResult(null);
    },
  });

  const {
    mutate: getOrCreateWallets,
    isPending: isGetOrCreateWalletsPending,
    error: getOrCreateWalletsError,
  } = useMutation({
    mutationFn: async (args?: { chain?: string }) => {
      if (!jwt || !user) {
        return null;
      }
      return createWallets(jwt, args?.chain as Chain);
    },
    onSuccess: (wallets) => {
      setWallets(wallets || null);
    },
    onError: (error) => {
      console.error(error);
      setWallets(null);
    },
  });

  if (!user || !jwt) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <div className="max-w-md w-full p-4">
          <p className="text-sm text-gray-600 mb-2">
            Please log in to create your wallets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[200px] w-full">
      <div className="max-w-md w-full p-4 space-y-4">
        {getOrCreateWalletsError ? (
          <div className="space-y-3">
            <div className="text-red-500 text-sm">
              Error: {getOrCreateWalletsError.message}
            </div>
            <Button onClick={() => getOrCreateWallets({})} className="w-full">
              Try Again
            </Button>
          </div>
        ) : !wallets ? (
          <Button
            onClick={() => getOrCreateWallets({})}
            disabled={isGetOrCreateWalletsPending}
            className="w-full"
          >
            {isGetOrCreateWalletsPending
              ? "Creating wallets..."
              : "Create Wallets"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Your legacy wallet address:
              </p>
              <p className="font-mono text-sm break-all bg-gray-100 p-2 rounded">
                {wallets.legacyWallet.address}
              </p>
            </div>
            {/* Legacy Transfer */}
            <div className="space-y-2 border rounded-md p-3">
              <div className="font-medium">Send USDC with Legacy Wallet</div>
              <Select value={legacyChain} onValueChange={setLegacyChain}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon-amoy">Polygon Amoy</SelectItem>
                  <SelectItem value="base-sepolia">Base Sepolia</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Recipient address (0x...)"
                value={legacyRecipient}
                onChange={(e) => setLegacyRecipient(e.target.value)}
              />
              <Input
                placeholder="Amount (e.g. 0.001)"
                value={legacyAmount}
                onChange={(e) => setLegacyAmount(e.target.value)}
              />
              <Button
                onClick={() => {
                  const usdcAddress =
                    legacyChain === "base-sepolia"
                      ? USDC_BASE_SEPOLIA_CONTRACT_ADDRESS
                      : USDC_AMOY_CONTRACT_ADDRESS;
                  legacyTransferUSDC({
                    recipient: legacyRecipient as Address,
                    amount: legacyAmount,
                    usdcAddress,
                    chain: legacyChain,
                  });
                }}
                disabled={
                  isLegacyTransferUSDCPending ||
                  !legacyRecipient ||
                  !legacyAmount
                }
                className="w-full"
                variant="outline"
              >
                {isLegacyTransferUSDCPending
                  ? "Sending..."
                  : "Send USDC (Legacy)"}
              </Button>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                Your new wallet address:
              </p>
              <p className="font-mono text-sm break-all bg-gray-100 p-2 rounded">
                {wallets.latestWallet.address}
              </p>
            </div>

            {/* New SDK USDC Transfer */}
            <div className="space-y-2 border rounded-md p-3">
              <div className="font-medium">Send USDC with New Wallet</div>
              <Select value={newChain} onValueChange={setNewChain}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon-amoy">Polygon Amoy</SelectItem>
                  <SelectItem value="base-sepolia">Base Sepolia</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Recipient address (0x...)"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
              />
              <Input
                placeholder="Amount (e.g. 0.001)"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
              <Button
                onClick={() =>
                  latestTransferUSDC({
                    recipient: newRecipient as Address,
                    amount: newAmount,
                    chain: newChain,
                  })
                }
                disabled={
                  isLatestTransferUSDCPending || !newRecipient || !newAmount
                }
                className="w-full"
                variant="outline"
              >
                {isLatestTransferUSDCPending
                  ? "Sending..."
                  : "Send USDC (New Wallet)"}
              </Button>
            </div>

            {legacyTransferUSDCError && (
              <div className="text-red-500 text-sm">
                Transfer failed: {legacyTransferUSDCError.message}
              </div>
            )}

            {legacyTransactionResult && (
              <div
                className={`text-sm ${
                  legacyTransactionResult.success
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {legacyTransactionResult.success
                  ? "Transfer successful!"
                  : "Transfer failed!"}
                <div className="space-y-2 mt-2">
                  <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                    <div className="font-semibold mb-1">Transaction Hash:</div>
                    {legacyTransactionResult.txHash}
                  </div>

                  {legacyTransactionResult.userOpHash && (
                    <div className="font-mono text-xs break-all bg-blue-50 p-2 rounded">
                      <div className="font-semibold mb-1">
                        User Operation Hash:
                      </div>
                      {legacyTransactionResult.userOpHash}
                    </div>
                  )}

                  {legacyTransactionResult.userOpReceipt && (
                    <div className="bg-green-50 p-2 rounded text-xs">
                      <div className="font-semibold mb-1">
                        User Operation Details:
                      </div>
                      <div>
                        Success:{" "}
                        {legacyTransactionResult.userOpReceipt.success
                          ? "Yes"
                          : "No"}
                      </div>
                      <div>
                        Gas Used:{" "}
                        {legacyTransactionResult.userOpReceipt.actualGasUsed.toString()}
                      </div>
                      <div>
                        Gas Cost:{" "}
                        {legacyTransactionResult.userOpReceipt.actualGasCost.toString()}
                      </div>
                    </div>
                  )}

                  {legacyTransactionResult.error && (
                    <div className="bg-red-50 p-2 rounded text-xs">
                      <div className="font-semibold mb-1">Error:</div>
                      {legacyTransactionResult.error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {latestTransferUSDCError && (
              <div className="text-red-500 text-sm">
                New wallet transfer failed: {latestTransferUSDCError.message}
              </div>
            )}

            {latestTransactionResult && (
              <div className="text-sm text-green-600">
                Transfer submitted with new wallet!
                <div className="space-y-2 mt-2">
                  <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                    <div className="font-semibold mb-1">Transaction Hash:</div>
                    {latestTransactionResult.hash}
                  </div>
                  <a
                    href={latestTransactionResult.explorerLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline text-xs break-all"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
