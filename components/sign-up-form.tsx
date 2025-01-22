"use client"

import { useSignUp, useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RiAppleFill, RiFacebookFill, RiGoogleFill } from "@remixicon/react";
import Link from "next/link";

export function SignUpForm() {
  const router = useRouter();
  const { signUp, isLoaded } = useSignUp();
  const { session } = useSession();
  const { toast } = useToast();

  const handleSocialSignUp = async (provider: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    try {
      if (!isLoaded || !signUp) return;

      if (session?.status === 'active') {
        router.push('/dashboard');
        return;
      }

      // Create sign up attempt first
      const signUpAttempt = await signUp.create({
        strategy: provider,
        redirectUrl: `${window.location.origin}/auth/callback`
      });

      // Start OAuth flow
      const signUpResponse = await signUpAttempt.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: `${window.location.origin}/auth/callback`,
        redirectUrlComplete: '/dashboard'
      });

      console.log('Sign up response:', signUpResponse);

    } catch (err) {
      console.error('Social sign up error:', err);
      toast({
        variant: "destructive",
        title: "Sign Up Error",
        description: "An error occurred while trying to sign up. Please try again."
      });
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Choose a method to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialSignUp('oauth_google')}
          >
            <RiGoogleFill className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialSignUp('oauth_facebook')}
          >
            <RiFacebookFill
              className="me-3 text-[#1877f2] dark:text-white/60"
              size={16}
              aria-hidden="true"
            />
            Continue with Facebook
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialSignUp('oauth_apple')}
          >
            <RiAppleFill
              className="me-3 text-[#000] dark:text-white/60"
              size={16}
              aria-hidden="true"
            />
            Continue with Apple
          </Button>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Already have an account?
            </span>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 