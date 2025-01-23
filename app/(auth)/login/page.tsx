"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the base URL from environment variable, fallback to window.location.origin for local development
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    
    // Construct the callback and after sign-in URLs
    const callbackUrl = `${baseUrl}/auth/callback`;
    const afterSignInUrl = `${baseUrl}/dashboard`;
    
    // Redirect to Clerk's sign-in page with properly encoded URLs
    window.location.href = `https://flowing-lamb-6.accounts.dev/sign-in?` + 
      `redirect_url=${encodeURIComponent(callbackUrl)}` +
      `&after_sign_in_url=${encodeURIComponent(afterSignInUrl)}`;
  }, []);

  return (
    // Show loading state while redirecting
    <div className="container flex h-[800px] items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  );
} 