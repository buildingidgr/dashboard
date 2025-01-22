import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { getToken, userId } = auth();
  const searchParams = new URL(request.url).searchParams;
  
  try {
    // If we have a userId, the authentication was successful
    if (userId) {
      // Get the intended destination from the search params or default to dashboard
      const redirectTo = searchParams.get("redirect_url") || "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // If we don't have a userId, something went wrong
    console.error("Auth callback: No userId found");
    return NextResponse.redirect(new URL("/login", request.url));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
} 