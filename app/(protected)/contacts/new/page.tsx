"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useSession, useUser } from "@clerk/nextjs"
import { usePageTitle } from "@/components/layouts/client-layout"
import Link from "next/link"
import { ContactCreateForm } from "@/components/contacts/contact-create-form"
import { exchangeClerkToken, getAccessToken, setAccessToken } from "@/lib/services/auth"
import { toast } from "sonner"

export default function NewContactPage() {
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()
  const { setTitle, setDescription } = usePageTitle()

  useEffect(() => {
    setTitle("New Contact")
    setDescription("Create a new contact and add their details")
  }, [setTitle, setDescription])

  useEffect(() => {
    const initializeToken = async () => {
      if (!session) {
        console.log('No session available, skipping initialization')
        return
      }

      try {
        console.log('Checking token state before initialization...')
        const accessToken = getAccessToken()
        
        if (!accessToken) {
          console.log('No token found, initializing...')
          const tokens = await exchangeClerkToken(session.id, user?.id as string)
          console.log('Token exchange successful')
          setAccessToken(tokens.access_token)
        }
      } catch (error) {
        console.error('Failed to initialize token:', error)
        toast.error('Failed to initialize session')
      }
    }

    initializeToken()
  }, [session, user])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/contacts">
            <ArrowLeft className="size-4 mr-2" />
            Back to Contacts
          </Link>
        </Button>
      </div>

      <ContactCreateForm
        onSuccess={() => router.push("/contacts")}
        onCancel={() => router.push("/contacts")}
      />
    </div>
  )
} 