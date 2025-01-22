"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useUser } from "@clerk/nextjs";
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
import { Eye, EyeOff } from "lucide-react";
import { exchangeClerkToken } from "@/lib/services/auth";
import { Command } from "@/components/ui/command";

interface AuthError {
  errors?: Array<{ message: string; code: string }>;
  message?: string;
  code?: string;
}

export default function PasswordPage() {
  return (
    <div className="container relative flex h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Command className="mr-2 size-6" /> MechLabs
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <LoginFormPassword />
        </div>
      </div>
    </div>
  );
}

function LoginFormPassword() {
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;

    try {
      setIsLoading(true);
      const signInId = localStorage.getItem('signInId');
      const email = localStorage.getItem('loginEmail');

      if (!signInId || !email) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Session expired. Please try signing in again.",
        });
        router.push('/');
        return;
      }

      if (!signIn) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication service not available.",
        });
        return;
      }

      const result = await signIn.attemptFirstFactor({
        strategy: "password",
        password,
      });

      if (result.status === "complete") {
        const sessionId = result.createdSessionId;
        if (sessionId && user) {
          try {
            await exchangeClerkToken(sessionId, user.id);
            
            localStorage.removeItem('loginEmail');
            localStorage.removeItem('signInId');
            window.location.href = '/dashboard';
          } catch (err) {
            console.error('Token exchange error:', err);
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: "Failed to complete authentication. Please try again.",
            });
          }
        }
      }
    } catch (err: unknown) {
      console.error('Password verification error:', err);
      
      const error = err as AuthError;
      const errorMessage = error?.errors?.[0]?.message || error?.message;
      const errorCode = error?.errors?.[0]?.code || error?.code;

      switch(errorCode) {
        case "form_password_incorrect":
          toast({
            variant: "destructive",
            title: "Invalid Password",
            description: "The password you entered is incorrect. Please try again.",
          });
          break;
        case "form_identifier_not_found":
          toast({
            variant: "destructive",
            title: "Account Not Found",
            description: "No account found with this email. Please sign up first.",
          });
          break;
        default:
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage || "An error occurred. Please try again later.",
          });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const email = localStorage.getItem('loginEmail');
    if (email) {
      router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Enter Password</CardTitle>
        <CardDescription>
          Enter your password to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <Button
            type="button"
            variant="link"
            onClick={handleForgotPassword}
            className="mt-2"
          >
            Forgot password?
          </Button>

          <Button
            type="button"
            variant="link"
            onClick={() => router.push('/')}
            className="mt-2"
          >
            Use another method
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}