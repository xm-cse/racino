"use client";

import {
  CrossmintAuthProvider,
  CrossmintProvider,
} from "@crossmint/client-sdk-react-ui";
import { crossmintLegacyApiKey } from "@/lib/config";

// to replace with your own auth provider
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CrossmintProvider apiKey={crossmintLegacyApiKey}>
      <CrossmintAuthProvider>{children}</CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
