"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function LoginPage() {
  const { openSignIn } = useClerk();
  const router = useRouter();

  useEffect(() => {
    // Get the base URL from environment variable, fallback to window.location.origin for local development
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    
    openSignIn({
      redirectUrl: `${baseUrl}/auth/callback`,
      afterSignInUrl: `${baseUrl}/dashboard`,
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