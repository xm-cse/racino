"use client";

import { createAAWalletSigner } from "@/lib/wallets";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { useQuery } from "@tanstack/react-query";

export default function Wallet() {
  const { user, jwt } = useAuth();

  const { data: wallet, isLoading } = useQuery({
    queryKey: ["wallet", jwt],
    queryFn: async () => {
      if (!jwt || !user) {
        return null;
      }

      return createAAWalletSigner(jwt);
    },
    enabled: !!jwt && !!user,
  });

  if (!wallet && !isLoading) {
    return null;
  }

  return (
    <div className="p-4 border rounded shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Wallet</h2>
      {isLoading ? (
        <p className="text-sm text-gray-600">Creating wallet...</p>
      ) : (
        <div>
          <p className="text-sm text-gray-600">Your wallet address:</p>
          <p className="font-mono text-sm break-all">{wallet?.address}</p>
        </div>
      )}
    </div>
  );
}
