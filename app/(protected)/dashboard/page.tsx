"use client";

import { Card } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="p-8 max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          We're working on bringing you the best experience possible. Stay tuned for exciting updates!
        </p>
      </Card>
    </div>
  )
}





