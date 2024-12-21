import './globals.css'
import { Metadata } from 'next'
import localFont from 'next/font/local'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: '--font-geist-sans',
})

export const metadata: Metadata = {
  title: 'MechLabs',
  description: 'MechLabs - Your AI Companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={geistSans.variable}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}