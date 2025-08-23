"use client";

import {
  CrossmintAuthProvider,
  CrossmintProvider,
} from "@crossmint/client-sdk-react-ui";
import { crossmintApiKeyLegacy } from "@/lib/config";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CrossmintProvider apiKey={crossmintApiKeyLegacy}>
      <CrossmintAuthProvider>
        {children}
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
