"use client"

import { SignIn } from "@clerk/nextjs";
import { Command } from "@/components/ui/command";

export default function LoginPage() {
  return (
    <div className="container relative flex h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Command className="mr-2 size-8" /> MechLabs
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This platform has transformed how we manage our mechanical projects, making collaboration seamless and efficient.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "shadow-none",
                header: "hidden",
                footer: "hidden"
              }
            }}
            redirectUrl="/auth/callback"
            afterSignInUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  )
} 