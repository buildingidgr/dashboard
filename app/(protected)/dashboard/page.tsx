"use client";

import { Card } from "@/components/ui/card"
import { FileText, ArrowRight, FileUp, Building2 } from "lucide-react"
import { usePublicOpportunities } from "@/hooks/use-public-opportunities"
import { OpportunityGrowthChart } from "@/components/dashboard/opportunity-growth-chart"
import Image from "next/image"
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { total, loading, error } = usePublicOpportunities();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isLoaded: isSessionLoaded } = useSession();

  if (!isSessionLoaded) {
    return (
      <div className="container space-y-8 py-8">
        {/* Welcome Section Skeleton */}
        <div className="rounded-lg border bg-card p-8">
          <div className="space-y-4">
            <div>
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="p-6">
                  <div className="flex gap-6 h-full">
                    <Skeleton className="h-[75px] w-[75px] flex-shrink-0" />
                    <div className="flex flex-col justify-between py-1 flex-1">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <Skeleton className="h-6 w-32 mt-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Content Skeleton */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-[200px] w-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Welcome Section */}
      <div className="rounded-lg border bg-card p-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {profileLoading ? (
                "Welcome back!"
              ) : profile?.firstName ? (
                `Welcome back, ${profile.firstName}!`
              ) : (
                "Welcome back!"
              )}
            </h1>
            <p className="text-muted-foreground">
              Discover and manage business opportunities efficiently
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Feature Cards */}
            {[
              {
                icon: Building2,
                title: "Find & Claim",
                description: "Browse opportunities and claim them to access customer location and contact details.",
                action: "Browse opportunities",
                image: "/find-opportunities.svg",
                alt: "Find opportunities"
              },
              {
                icon: FileText,
                title: "Track Growth",
                description: "Monitor opportunity trends and analyze growth patterns over time.",
                action: "View analytics",
                image: "/analytics.svg",
                alt: "Analytics"
              },
              {
                icon: FileUp,
                title: "Manage Documents",
                description: "Create and organize documents related to your business opportunities.",
                action: "Create document",
                image: "/documents.svg",
                alt: "Documents"
              },
              {
                icon: FileText,
                title: "Customer Data",
                description: "Access detailed customer information for your claimed opportunities.",
                action: "View contacts",
                image: "/customer-data.svg",
                alt: "Customer data"
              }
            ].map((feature, index) => (
              <div key={index} className="p-6">
                <div className="flex gap-6 h-full">
                  <div className="flex-shrink-0">
                    <Image
                      src={feature.image}
                      alt={feature.alt}
                      width={75}
                      height={75}
                      className="opacity-90"
                    />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <feature.icon className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{feature.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <Button variant="link" className="px-0 text-primary justify-start" size="sm">
                      {feature.action} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Public Opportunities Stats */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-muted p-2">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Public Opportunities
              </p>
              <div className="flex items-center gap-2">
                {loading ? (
                  <h3 className="text-2xl font-bold">Loading...</h3>
                ) : error ? (
                  <h3 className="text-2xl font-bold text-red-500">Error</h3>
                ) : (
                  <h3 className="text-2xl font-bold">{total}</h3>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Growth Chart */}
        <OpportunityGrowthChart />
      </div>
    </div>
  )
}





