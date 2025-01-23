import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { exchangeClerkToken } from "@/lib/services/auth";

export async function GET(request: Request) {
  const { userId } = auth();
  const searchParams = new URL(request.url).searchParams;
  const createdSessionId = searchParams.get("__clerk_created_session");
  
  try {
    console.log('Auth callback received:', {
      userId,
      createdSessionId,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    // If we have both userId and session, exchange tokens
    if (userId && createdSessionId) {
      try {
        await exchangeClerkToken(createdSessionId, userId);
        const baseUrl = new URL(request.url).origin;
        return NextResponse.redirect(`${baseUrl}/dashboard`);
      } catch (error) {
        console.error("Token exchange error:", error);
        const baseUrl = new URL(request.url).origin;
        return NextResponse.redirect(`${baseUrl}/login`);
      }
    }

    // If we have a userId but no session, just redirect to dashboard
    if (userId) {
      const baseUrl = new URL(request.url).origin;
      return NextResponse.redirect(`${baseUrl}/dashboard`);
    }

    // If something went wrong, redirect to login
    console.error("Auth callback: No userId found");
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/login`);
  } catch (error) {
    console.error("Auth callback error:", error);
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/login`);
  }
} 