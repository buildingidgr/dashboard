'use client'

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalInfo } from "./personal-info"
import { ProfessionalInfo } from "./professional-info"
import { Preferences } from "./preferences"
import { useForm, FormProvider } from "react-hook-form"
import ProjectHeader from "@/components/header"
import { useSession, useUser } from "@clerk/nextjs"
import { getAccessToken, setAccessToken } from "@/src/utils/tokenManager"
import { exchangeClerkToken } from "@/src/services/auth"
import { Toaster } from 'sonner';

export default function ProfilePage() {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobilePhone: '',
      profession: {
        current: ''
      },
      amtee: '',
      workingAddress: '',
      location: {
        timezone: '',
        language: ''
      }
    }
  });

  const { session } = useSession();
  const { user } = useUser();

  useEffect(() => {
    if (!session) return;

    const initializeTokens = async () => {
      const currentToken = getAccessToken();
      
      if (!currentToken) {
        try {
          const tokens = await exchangeClerkToken(session.id, user?.id as string);
          setAccessToken(tokens.accessToken, tokens.expiresIn);
        } catch (err) {
          console.error('Failed to initialize tokens in profile:', err);
        }
      }
    };

    initializeTokens();
  }, [session, user]);

  const handleSave = async (data: any) => {
    console.log('Form data:', data);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Account</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <ProjectHeader title="Account" description="Set up your profile and preferences" />
        <FormProvider {...form}>
          <Tabs defaultValue="personal" className="w-full">
            <div className="ml-6">
              <TabsList>
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="professional">Professional Info</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="personal">
              <PersonalInfo />
            </TabsContent>
            <TabsContent value="professional">
              <ProfessionalInfo />
            </TabsContent>
            <TabsContent value="preferences">
              <Preferences />
            </TabsContent>
          </Tabs>
        </FormProvider>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}



