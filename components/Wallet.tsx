"use client";

import { Button } from "@/components/ui/button";
import { createAAWalletSigner } from "@/lib/wallets";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export default function Wallet() {
  const { user, jwt } = useAuth();
  const [wallet, setWallet] = useState<string | null>(null);

  const {
    mutate: createWallet,
    isPending,
    error,
  } = useMutation({
    mutationFn: async () => {
      if (!jwt || !user) {
        return null;
      }
      return createAAWalletSigner(jwt);
    },
    onSuccess: (wallet) => {
      setWallet(wallet?.address ?? null);
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
      <div className="max-w-md w-full p-4">
        {error ? (
          <>
            <div className="text-red-500 text-sm mb-4">
              Error: {error.message}
            </div>
            <Button onClick={() => createWallet()} className="w-full">
              Try Again
            </Button>
          </>
        ) : !wallet ? (
          <Button
            onClick={() => createWallet()}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Creating wallet..." : "Create Wallet"}
          </Button>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">Your wallet address:</p>
            <p className="font-mono text-sm break-all">{wallet}</p>
          </div>
        )}
      </div>
    </div>
  );
}
