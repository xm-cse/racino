"use client";

import {
  CrossmintAuthProvider,
  CrossmintProvider,
} from "@crossmint/client-sdk-react-ui";
import { crossmintLegacyApiKey } from "@/lib/config";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CrossmintProvider apiKey={crossmintLegacyApiKey}>
      <CrossmintAuthProvider
        embeddedWallets={{
          createOnLogin: "off",
        }}
      >
        {children}
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
