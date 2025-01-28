"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowRight, FileUp, Building2 } from "lucide-react"
import { usePublicOpportunities } from "@/hooks/use-public-opportunities"
import { OpportunityGrowthChart } from "@/components/dashboard/opportunity-growth-chart"
import Image from "next/image"
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/services/auth";
import { useProfessionalInfo } from "@/hooks/use-professional-info";
import { calculateDistance } from "@/lib/utils";
import { useOpportunities } from "@/hooks/use-opportunities";

export default function DashboardPage() {
  const { total, loading, error } = usePublicOpportunities();
  const { profile, isLoading: profileLoading } = useProfile();
  const [claimedCount, setClaimedCount] = useState(0);
  const [isLoadingClaimed, setIsLoadingClaimed] = useState(true);
  const [claimedError, setClaimedError] = useState<string | null>(null);
  const { session } = useSession();
  const { professionalInfo } = useProfessionalInfo();
  const { projects } = useOpportunities({
    page: 1,
    limit: 50
  });

  // Get user's location and radius from professional info
  const userLocation = professionalInfo?.areaOfOperation?.coordinates ? {
    lat: professionalInfo.areaOfOperation.coordinates.latitude,
    lng: professionalInfo.areaOfOperation.coordinates.longitude
  } : null;
  const radius = professionalInfo?.areaOfOperation?.radius || 30;

  // Calculate active opportunities in area
  const activeOpportunitiesInArea = userLocation ? 
    projects.filter(p => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        p.data.project.location.coordinates.lat,
        p.data.project.location.coordinates.lng
      );
      return distance <= radius;
    }).length : 0;

  useEffect(() => {
    async function fetchClaimedOpportunities() {
      try {
        setIsLoadingClaimed(true);
        const token = getAccessToken();
        if (!token) {
          throw new Error('No access token available');
        }

        const response = await fetch('/api/opportunities/my-changes?page=1&limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch claimed opportunities');
        }

        const data = await response.json();
        setClaimedCount(Array.isArray(data) ? data.length : 0);
        setClaimedError(null);
      } catch (error) {
        console.error('Error fetching claimed opportunities:', error);
        setClaimedError(error instanceof Error ? error.message : 'Failed to fetch claimed opportunities');
      } finally {
        setIsLoadingClaimed(false);
      }
    }

    if (session) {
      fetchClaimedOpportunities();
    }
  }, [session]);

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
        {/* Claimed Opportunities Stats */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Claimed Opportunities</CardTitle>
              <CardDescription>
                Your active claimed opportunities
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-2">
                  <FileText className="size-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoadingClaimed ? (
                      "..."
                    ) : claimedError ? (
                      "Error"
                    ) : (
                      claimedCount
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Claimed Opportunities
                  </p>
                </div>
              </div>
              {userLocation && (
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <Building2 className="size-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeOpportunitiesInArea}</p>
                    <p className="text-xs text-muted-foreground">
                      Active opportunities within {radius}km
                    </p>
                  </div>
                </div>
              )}
            </div>
            {claimedCount === 0 && !isLoadingClaimed && !claimedError && (
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <Image
                  src="/no-data.svg"
                  alt="No claimed opportunities"
                  width={120}
                  height={120}
                  className="opacity-50"
                />
                <p className="text-sm text-muted-foreground text-center">
                  You haven't claimed any opportunities yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Chart */}
        <OpportunityGrowthChart />
      </div>
    </div>
  )
}





