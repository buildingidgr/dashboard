"use client"

import { useSignIn, useAuth, useSession, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RiAppleFill, RiFacebookFill, RiGoogleFill } from "@remixicon/react";
import { exchangeClerkToken, setTokens } from "@/lib/services/auth";

export function LoginForm() {
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { session } = useSession();

  useEffect(() => {
    if (session?.status === 'active') {
      console.log('Active session found, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleTokenExchange = async (sessionId: string, userId: string) => {
    try {
      const tokens = await exchangeClerkToken(sessionId, userId);
      setTokens(tokens.access_token, tokens.refresh_token);
      return true;
    } catch (err) {
      console.error('Token exchange error:', err);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: err instanceof Error ? err.message : "Failed to complete authentication. Please try again.",
      });
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email.trim(),
      });

      if (result.status === "complete") {
        const sessionId = result.createdSessionId;
        
        if (sessionId && user?.id) {
          const success = await handleTokenExchange(sessionId, user.id);
          if (success) {
            localStorage.removeItem('loginEmail');
            localStorage.removeItem('signInId');
            window.location.href = '/dashboard';
          }
        }
      } else if (result.status === "needs_first_factor") {
        router.push('/password');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorMessage = err?.errors?.[0]?.message || err?.message;
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage || "An error occurred. Please try again later."
      });
    }
  };

  const handleSocialLogin = async (provider: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    try {
      if (!isLoaded) return;
      
      if (session?.status === 'active') {
        router.push('/dashboard');
        return;
      }

      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: `${window.location.origin}/auth/callback`,
        redirectUrlComplete: '/dashboard'
      });
    } catch (err) {
      console.error('Social login error:', err);
      if (err instanceof Error && err.message.includes('single session mode')) {
        router.push('/dashboard');
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Social Login Error",
        description: "An error occurred while trying to log in with social provider."
      });
    }
  };

  return (
    <form onSubmit={handleEmailSubmit}>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Continue with Email
            </Button>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('oauth_google')}
              >
                <RiGoogleFill className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('oauth_facebook')}
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
                onClick={() => handleSocialLogin('oauth_apple')}
              >
                <RiAppleFill
                  className="me-3 text-[#000] dark:text-white/60"
                  size={16}
                  aria-hidden="true"
                />
                Continue with Apple
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
