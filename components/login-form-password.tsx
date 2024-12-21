"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormPasswordProps {
  email: string;
  onBack: () => void;
}

export default function LoginFormPassword({ email, onBack }: LoginFormPasswordProps) {
  const { signIn, isLoaded } = useSignIn();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const signInId = localStorage.getItem('signInId');
      if (!signInId) {
        throw new Error('No sign in attempt found');
      }

      const result = await signIn.attemptFirstFactor({
        strategy: "password",
        password,
      });

      if (result.status === "complete") {
        localStorage.removeItem('loginEmail');
        localStorage.removeItem('signInId');
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error('Password verification error:', err);
      setError(err.errors?.[0]?.message || "Invalid password");
    }
  };

  const handleForgotPassword = () => {
    const email = localStorage.getItem('loginEmail');
    if (email) {
      router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
    }
  };

  const handleUseAnotherMethod = () => {
    router.push('/');
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Enter Password</CardTitle>
        <CardDescription>
          Enter the password to continue to account {email}.
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
                onClick={toggleShowPassword}
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

          <Button type="submit" className="w-full">
            Sign In
          </Button>
          
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>

          <Button type="button" onClick={handleForgotPassword} variant="link" className="mt-2">
            Forgot your password?
          </Button>

          <Button type="button" onClick={handleUseAnotherMethod} variant="link" className="mt-2">
            Use another method
          </Button>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}