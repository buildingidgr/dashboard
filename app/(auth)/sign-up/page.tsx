"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the current origin for the redirect URL
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Redirect to Clerk's hosted sign-up page with redirect parameters
    window.location.href = `https://flowing-lamb-6.accounts.dev/sign-up?redirect_url=${origin}/auth/callback&after_sign_up_url=${origin}/dashboard`;
  }, []);

  return (
    // Show loading state while redirecting
    <div className="container flex h-[800px] items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Redirecting to sign up...</p>
      </div>
    </div>
  );
} 