"use client";

import { useEffect } from "react";
import { useSession, useAuth, useUser } from "@clerk/nextjs";
import { getAccessToken, setAccessToken } from "@/src/utils/tokenManager";
import { exchangeClerkToken } from "@/src/services/auth";

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import ArticlesCreated from "@/components/articles-created";
import BackgroundCard from "@/components/background-card";
import ArticleCard from "@/components/article-card";
export default function Page() {
  const { session } = useSession();
  const { getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!session) {
      console.log('No session available, skipping token initialization');
      return;
    }

    const initializeTokens = async () => {
      console.log('Starting token initialization...');
      const currentToken = getAccessToken();
      console.log('Current token state:', {
        exists: !!currentToken,
        preview: currentToken ? `${currentToken.substring(0, 10)}...` : 'null'
      });
      
      if (!currentToken) {
        console.log('No current token found, exchanging Clerk token...');
        try {
          console.log('Exchanging token with session ID:', session.id);
          const tokens = await exchangeClerkToken(session.id, user?.id as string);
          console.log('Token exchange successful:', {
            accessTokenPreview: tokens.accessToken ? `${tokens.accessToken.substring(0, 10)}...` : 'null',
            expiresIn: tokens.expiresIn
          });
          setAccessToken(tokens.accessToken, tokens.expiresIn);
        } catch (err) {
          console.error('Failed to initialize tokens:', {
            error: err instanceof Error ? err.message : 'Unknown error',
            sessionId: session.id,
            userId: user?.id
          });
        }
      } else {
        console.log('Token already exists, skipping initialization');
      }
    };

    initializeTokens();
  }, [session, user]);

  useEffect(() => {
    const logSessionDetails = async () => {
      if (session) {
        const clerkToken = await getToken();
        const serviceToken = getAccessToken();

        console.log('Dashboard - Session Details:', {
          clerkSession: {
            sessionId: session.id,
            userId: user?.id,
            status: session.status,
            lastUpdated: session.lastActiveAt,
            expireAt: session.expireAt
          },
          tokens: {
            clerkToken: clerkToken?.substring(0, 20) + '...',
            serviceToken: serviceToken ? serviceToken.substring(0, 20) + '...' : 'Not found',
            serviceTokenExists: !!serviceToken
          }
        });

        console.log('Token Storage State:', {
          inMemoryToken: {
            exists: !!serviceToken,
            preview: serviceToken ? `${serviceToken.substring(0, 10)}...` : 'null'
          },
          localStorage: {
            hasAccessToken: !!localStorage.getItem('accessToken'),
            hasRefreshToken: !!localStorage.getItem('refreshToken'),
            hasTokenExpiry: !!localStorage.getItem('tokenExpiry'),
            tokenExpiry: localStorage.getItem('tokenExpiry') ? new Date(parseInt(localStorage.getItem('tokenExpiry') || '0')).toISOString() : null
          }
        });
      } else {
        console.log('No active session found');
      }
    };

    logSessionDetails();
  }, [session, getToken, user]);


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
                  <BreadcrumbLink href="#">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <BackgroundCard />
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
          <ArticleCard 
            title="Article 1"
            subtitle="Learn the basics of React and start building your first application"
            authorName="Jane Doe"
            readTime="5 min read"
            authorImage="/jane.png"
            backgroundImage="https://images.unsplash.com/photo-1544077960-604201fe74bc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1651&q=80"
          />
             <ArticleCard 
              title="Article 2"
              subtitle="Card with Author avatar, complete name and time to read - most suitable for blogs."
              authorName="Manu Arora"
              readTime="2 min read"
              authorImage="/manu.png"
              backgroundImage="https://images.unsplash.com/photo-1581093196867-ca3dba3c721b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            />
                  <ArticleCard 
            title="Article 3"
            subtitle="Learn the basics of React and start building your first application"
            authorName="Jane Doe"
            readTime="5 min read"
            authorImage="/jane.png"
            backgroundImage="https://images.unsplash.com/photo-1544077960-604201fe74bc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1651&q=80"
          />
                <ArticleCard 
            title="Article 4"
            subtitle="Learn the basics of React and start building your first application"
            authorName="Jane Doe"
            readTime="5 min read"
            authorImage="/jane.png"
            backgroundImage="https://images.unsplash.com/photo-1581091878330-f5cf2a3b1564?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          />
            </div>
            <ArticlesCreated/>
          </div>
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
          </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
