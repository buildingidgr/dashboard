"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
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
import { exchangeClerkToken } from "@/src/services/auth";
import { setTokens } from "@/src/utils/auth";

export default function PasswordPage() {
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

      const result = await signIn.attemptFirstFactor({
        strategy: "password",
        password,
      });

      if (result.status === "complete") {
        const session = await result.createdSessionId;
        if (session) {
          try {
            const tokens = await exchangeClerkToken(session);
            setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
            
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
    } catch (err: any) {
      console.error('Password verification error:', err);
      
      const errorMessage = err?.errors?.[0]?.message || err?.message;
      const errorCode = err?.errors?.[0]?.code || err?.code;

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
    <div className="flex items-center justify-center min-h-screen">
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
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
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
    </div>
  );
}