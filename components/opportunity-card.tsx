"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, ArrowRight, Building2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface ProjectCardProps {
  _id: string
  type: string
  data: {
    project: {
      category: {
        title: string
        description: string
      }
      location: {
        address: string
        coordinates: {
          lat: number
          lng: number
        }
      }
      details: {
        description: string
      }
    }
    contact: {
      fullName: string
      email: string
      phone: {
        countryCode: string
        number: string
      }
    }
    metadata: {
      submittedAt: string
      locale: string
      source: string
      version: string
    }
  }
  status: 'public' | 'private'
  onClaim?: () => void
}

export default function ProjectCard({ _id, data, status, onClaim }: ProjectCardProps) {
  const [isConfirmingClaim, setIsConfirmingClaim] = useState(false);

  if (!data || !data.project) {
    return null;
  }

  const calculateBoundingBox = (lat: number, lng: number, distance: number = 3) => {
    const earthRadius = 6371;
    const latDelta = (distance / earthRadius) * (180 / Math.PI);
    const lngDelta = (distance / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

    return {
      north: lat + latDelta,
      south: lat - latDelta,
      east: lng + lngDelta,
      west: lng - lngDelta
    };
  };

  const { coordinates } = data.project.location;
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return null;
  }

  const boundingBox = calculateBoundingBox(coordinates.lat, coordinates.lng);
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const submittedDate = new Date(data.metadata.submittedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleClaimClick = () => {
    setIsConfirmingClaim(true);
  };

  const handleConfirmClaim = () => {
    setIsConfirmingClaim(false);
    if (onClaim) {
      onClaim();
    }
  };

  return (
    <>
      <Card className="group relative overflow-hidden bg-white transition-all duration-300 hover:shadow-lg border border-gray-100">
        <CardContent className="p-0">
          {/* Map Preview */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=13&size=600x300&path=color:0x00000000|weight:5|fillcolor:0xFFFF0033|${boundingBox.north},${boundingBox.west}|${boundingBox.north},${boundingBox.east}|${boundingBox.south},${boundingBox.east}|${boundingBox.south},${boundingBox.west}|${boundingBox.north},${boundingBox.west}&key=${googleApiKey}`}
              alt="Project location map"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <Badge 
              className="absolute top-4 left-4 bg-white/90 text-gray-900 border-none"
              variant="secondary"
            >
              {data.project.category.title}
            </Badge>
          </div>

          <div className="p-6">
            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{data.project.location.address}</span>
            </div>

            {/* Description */}
            <p className="text-gray-900 line-clamp-3 mb-6">
              {data.project.details.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{submittedDate}</span>
              </div>
              
              <Button
                onClick={handleClaimClick}
                className="group/button relative overflow-hidden bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Claim Project
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claim Confirmation Dialog */}
      <Dialog open={isConfirmingClaim} onOpenChange={setIsConfirmingClaim}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to claim this project? Once claimed, you'll have access to the customer's contact information and the project will be moved to your claimed projects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmingClaim(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClaim}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Confirm Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

