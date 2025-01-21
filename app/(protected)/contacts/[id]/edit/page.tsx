"use client"

import { EditContactClient } from "@/components/contacts/edit-contact-client"
import { useParams } from "next/navigation"

export default function EditContactPage() {
  const params = useParams()
  const id = params?.id as string

  if (!id) {
    return null
  }

  return <EditContactClient id={id} />
} 