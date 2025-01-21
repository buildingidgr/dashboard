"use client"

import { useEffect } from "react"
import { usePageTitle } from "@/components/layouts/client-layout"
import { ContactsTable } from "@/components/contacts-table"

export default function ContactsPage() {
  const { setTitle, setDescription } = usePageTitle()

  useEffect(() => {
    setTitle("Contacts")
    setDescription("View and manage your contacts")
  }, [setTitle, setDescription])

  return (
    <div className="space-y-6">
      <ContactsTable />
    </div>
  )
} 