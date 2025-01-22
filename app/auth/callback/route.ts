import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { exchangeClerkToken } from "@/lib/services/auth";

export async function GET(request: Request) {
  const { userId } = auth();
  const searchParams = new URL(request.url).searchParams;
  const createdSessionId = searchParams.get("__clerk_created_session");
  
  try {
    // If we have both userId and session, exchange tokens
    if (userId && createdSessionId) {
      try {
        await exchangeClerkToken(createdSessionId, userId);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        console.error("Token exchange error:", error);
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // If we have a userId but no session, just redirect to dashboard
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If something went wrong, redirect to login
    console.error("Auth callback: No userId found");
    return NextResponse.redirect(new URL("/login", request.url));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
} 