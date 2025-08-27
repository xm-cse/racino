"use client";

import { Button } from "@/components/ui/button";
import {
  getOrCreateWallets,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { chain } from "@/lib/config";

const USDC_POLYGON_CONTRACT_ADDRESS =
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as Address; // USDC Polygon
const USDC_BASE_CONTRACT_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address; // USDC Base

const erc721TransferAbi = [
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

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
  const [legacyChain, setLegacyChain] = useState<Chain>(chain);

  // Inputs for New SDK flow
  const [newRecipient, setNewRecipient] = useState<string>("");
  const [newAmount, setNewAmount] = useState<string>("0.001");
  const [newChain, setNewChain] = useState<Chain>(chain);
  // Inputs for New SDK NFT transfer
  const [nftRecipient, setNftRecipient] = useState<string>("");
  const [nftContract, setNftContract] = useState<string>("");
  const [nftTokenId, setNftTokenId] = useState<string>("");
  const [nftChain, setNftChain] = useState<Chain>(chain);

  const {
    mutate: legacyTransferUSDC,
    isPending: isLegacyTransferUSDCPending,
    error: legacyTransferUSDCError,
  } = useMutation({
    mutationFn: async (args: {
      recipient: Address;
      amount: string;
      usdcAddress: Address;
      chain: Chain;
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
      chain: Chain;
    }) => {
      if (!jwt || !user) {
        return null;
      }

      // Ensure latest wallet is created for the selected chain
      const refreshed = await getOrCreateWallets(jwt, args.chain);
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
      // Cast to concrete Transaction<false>; sendTransaction returns non-prepare by default
      setLatestTransactionResult(result as Transaction<false>);
    },
    onError: (error) => {
      console.error(error);
      setLatestTransactionResult(null);
    },
  });

  const {
    mutate: latestTransferNFT,
    isPending: isLatestTransferNFTPending,
    error: latestTransferNFTError,
  } = useMutation({
    mutationFn: async (args: {
      recipient: Address;
      contract: Address;
      tokenId: string;
      chain: Chain;
    }) => {
      if (!jwt || !user) return null;
      const refreshed = await getOrCreateWallets(jwt, args.chain);
      if (refreshed) setWallets(refreshed);
      const walletToUse = refreshed?.latestWallet || wallets?.latestWallet;
      if (!walletToUse) return null;
      // ERC-721 safeTransferFrom(from, to, tokenId)
      return walletToUse.sendTransaction({
        to: args.contract,
        functionName: "safeTransferFrom",
        abi: erc721TransferAbi,
        args: [walletToUse.address, args.recipient, BigInt(args.tokenId)],
      });
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
    mutate: initWallets,
    isPending: isInitWalletsPending,
    error: initWalletsError,
  } = useMutation({
    mutationFn: async () => {
      if (!jwt || !user) {
        return null;
      }
      return getOrCreateWallets(jwt);
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
        {initWalletsError ? (
          <div className="space-y-3">
            <div className="text-red-500 text-sm">
              Error: {initWalletsError.message}
            </div>
            <Button onClick={() => initWallets()} className="w-full">
              Try Again
            </Button>
          </div>
        ) : !wallets ? (
          <Button
            onClick={() => initWallets()}
            disabled={isInitWalletsPending}
            className="w-full"
          >
            {isInitWalletsPending
              ? "Initializing wallets..."
              : "Initialize Wallets"}
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
              <Select
                value={legacyChain}
                onValueChange={(value) => setLegacyChain(value as Chain)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
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
                    legacyChain === "base"
                      ? USDC_BASE_CONTRACT_ADDRESS
                      : USDC_POLYGON_CONTRACT_ADDRESS;
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
              <Select
                value={newChain}
                onValueChange={(value) => setNewChain(value as Chain)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
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

            {/* New SDK NFT Transfer */}
            <Card>
              <CardHeader>
                <CardTitle>NFT Transfer (New Wallet)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select
                  value={nftChain}
                  onValueChange={(value) => setNftChain(value as Chain)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a chain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="apechain">ApeChain</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Recipient address (0x...)"
                  value={nftRecipient}
                  onChange={(e) => setNftRecipient(e.target.value)}
                />
                <Input
                  placeholder="Contract address (0x...)"
                  value={nftContract}
                  onChange={(e) => setNftContract(e.target.value)}
                />
                <Input
                  placeholder="Token ID (e.g. 1)"
                  value={nftTokenId}
                  onChange={(e) => setNftTokenId(e.target.value)}
                />
                <Button
                  onClick={() =>
                    latestTransferNFT({
                      recipient: nftRecipient as Address,
                      contract: nftContract as Address,
                      tokenId: nftTokenId,
                      chain: nftChain,
                    })
                  }
                  disabled={
                    isLatestTransferNFTPending ||
                    !nftRecipient ||
                    !nftContract ||
                    !nftTokenId
                  }
                  className="w-full"
                  variant="outline"
                >
                  {isLatestTransferNFTPending ? "Sending..." : "Send NFT"}
                </Button>
                {latestTransferNFTError && (
                  <Alert variant="destructive">
                    <AlertTitle>NFT transfer failed</AlertTitle>
                    <AlertDescription>
                      {latestTransferNFTError.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

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
