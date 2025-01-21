import ClientLayout from "@/components/layouts/client-layout"
import { GoogleMapsProvider } from '@/lib/contexts/google-maps-context'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GoogleMapsProvider>
      <ClientLayout>{children}</ClientLayout>
    </GoogleMapsProvider>
  )
} 