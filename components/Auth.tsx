"use client";

import { useAuth, EmbeddedAuthForm } from "@crossmint/client-sdk-react-ui";
import { Button } from "@/components/ui/button";

export default function Auth() {
  const { logout, user, jwt } = useAuth();

  return (
    <div className="flex justify-center items-center min-h-[200px] w-full">
      <div className="max-w-md w-full p-4">
        {user && jwt ? (
          <Button onClick={logout} className="w-full">
            Logout
          </Button>
        ) : (
          <EmbeddedAuthForm />
        )}
      </div>
    </div>
  );
}
