"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSignIn } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function CheckYourEmail() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(40);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleComplete = (value: string) => {
    setOtp(value);
    console.log("Completed OTP:", value);
  };

  const handleContinue = async () => {
    if (otp.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter the complete OTP.",
      });
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

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: otp,
      });

      if (result.status === "complete") {
        router.push('/new-password');
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "The OTP you entered is invalid. Please try again.",
        });
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
      });
    }
  };

  const handleResend = () => {
    console.log("Resending OTP...");
    setCanResend(false);
    setTimer(40);
  };

  return (
    <>
      <div className="container relative flex h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              First, enter the code sent to your email address <strong>thebest@gmail.com</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                onComplete={handleComplete}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              <Button onClick={handleContinue} className="w-full">
                Continue
              </Button>

              <div className="mt-4 text-center text-sm text-gray-800">
                <span>Didn&apos;t receive a code? </span>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResend}
                  disabled={!canResend}
                >
                  {canResend ? "Resend" : `Resend in ${timer}s`}
                </Button>
              </div>
            </div>
          </CardContent>
          <div className="mb-4 flex justify-center">
            <Button variant="link" onClick={() => router.push('/')}>
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
      <Toaster />
    </>
  );
}