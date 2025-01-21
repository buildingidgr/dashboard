"use client";

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
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ForgotPassword() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const handleResetPassword = async () => {
    if (!email) {
      console.error("Email is not provided.");
      return;
    }

    try {
      if (!isLoaded) {
        console.error("Clerk is not loaded.");
        return;
      }

      await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      router.push('/check-your-email');
    } catch (err) {
      console.error('Error sending reset link:', err);
      toast.error("Failed to send reset link. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Click the button below to reset your password for the account {email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button onClick={handleResetPassword} className="w-full">
              Reset your password
            </Button>

            <Button type="button" variant="link" onClick={() => router.push('/')} className="mt-4">
              Back
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}