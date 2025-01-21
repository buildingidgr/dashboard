"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import zxcvbn from "zxcvbn";
import { useClerk, useUser } from "@clerk/nextjs";

export default function SetNewPassword() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signOutDevices, setSignOutDevices] = useState(false);
  const [strength, setStrength] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    const result = zxcvbn(password);
    setStrength(result.score); // Set strength score (0-4)
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);

      if (newPassword.length < 8) {
        toast({
          variant: "destructive",
          title: "Password Error",
          description: "Your password must contain 8 or more characters."
        });
        return;
      }
      if (strength < 3) {
        toast({
          variant: "destructive",
          title: "Password Error",
          description: "Your password is too weak. Please choose a stronger password."
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Password Error",
          description: "Passwords do not match."
        });
        return;
      }

      // Update password using Clerk
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "No user found. Please try signing in again."
        });
        return;
      }

      await user.updatePassword({
        newPassword: newPassword
      });

      // Sign out of all other devices if the checkbox is checked
      if (signOutDevices) {
        await signOut({
          sessionId: "*" // This signs out all other sessions except the current one
        });
        toast({
          title: "Success",
          description: "You have been signed out of all other devices."
        });
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully."
      });
      
      // Redirect after successful password reset
      router.push('/');
      
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset password. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
              />
              {newPassword && (
                <p className={`text-sm ${
                  strength === 0 ? "text-red-600" : 
                  strength === 1 ? "text-orange-500" : 
                  strength === 2 ? "text-yellow-500" : 
                  strength === 3 ? "text-green-500" : 
                  "text-emerald-600"
                }`}>
                  Password strength: {
                    strength === 0 ? "Very Weak" : 
                    strength === 1 ? "Weak" : 
                    strength === 2 ? "Fair" : 
                    strength === 3 ? "Good" : 
                    "Strong"
                  }
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center">
              <Checkbox
                id="sign-out-devices"
                checked={signOutDevices}
                onCheckedChange={(checked) => setSignOutDevices(checked as boolean)}
              />
              <Label htmlFor="sign-out-devices" className="ml-2">
                Sign out of all other devices
              </Label>
            </div>
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>
            <Button 
              variant="link" 
              onClick={handleBack} 
              className="mt-2"
              disabled={isLoading}
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}