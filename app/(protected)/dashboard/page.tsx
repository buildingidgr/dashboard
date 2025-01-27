"use client";

import { Card } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center container">
      <Card className="w-full max-w-2xl p-8 text-center">
        <h1 className="mb-4 text-3xl font-bold">Welcome to Your Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          We&apos;re working on bringing you the best experience possible. Stay tuned for exciting updates!
        </p>
      </Card>
    </div>
  )
}





