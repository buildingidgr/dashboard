"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function LoginPage() {
  const { openSignIn } = useClerk();
  const router = useRouter();

  useEffect(() => {
    openSignIn({
      redirectUrl: "/auth/callback",
      afterSignInUrl: "/dashboard",
    });
  }, [openSignIn]);

  return (
    // Show loading state while redirecting
    <div className="container flex h-[800px] items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  );
} 