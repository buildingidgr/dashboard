"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function LoginPage() {
  const { openSignIn } = useClerk();
  const router = useRouter();

  useEffect(() => {
    // Small delay to ensure Clerk is initialized
    const timer = setTimeout(() => {
      try {
        openSignIn({
          redirectUrl: "/auth/callback",
          afterSignInUrl: "/dashboard",
        });
      } catch (error) {
        console.error("Failed to open sign in:", error);
        // Fallback for local development
        window.location.href = "https://flowing-lamb-6.accounts.dev/sign-in?" + 
          `redirect_url=${encodeURIComponent(window.location.origin + "/auth/callback")}` +
          `&after_sign_in_url=${encodeURIComponent(window.location.origin + "/dashboard")}`;
      }
    }, 100);

    return () => clearTimeout(timer);
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