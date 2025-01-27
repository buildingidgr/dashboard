import { NextRequest } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const interval = searchParams.get("interval") || "weekly";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const baseUrl = process.env.NEXT_PUBLIC_OPPORTUNITY_API_URL;
    const headersList = headers();
    const token = headersList.get("authorization");

    if (!baseUrl) {
      console.error("NEXT_PUBLIC_OPPORTUNITY_API_URL is not configured");
      return new Response("Opportunity API URL not configured", { status: 500 });
    }

    if (!token) {
      console.error("No authorization token provided in headers");
      return new Response("Authorization token is required", { status: 401 });
    }

    // Validate interval
    if (!["hourly", "daily", "weekly", "monthly"].includes(interval)) {
      return new Response(
        JSON.stringify({
          error: "Invalid interval",
          details: "Interval must be one of: hourly, daily, weekly, monthly",
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return new Response(
          JSON.stringify({
            error: "Invalid date format",
            details: "Dates must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)",
          }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      if (start > end) {
        return new Response(
          JSON.stringify({
            error: "Invalid date range",
            details: "startDate must be before or equal to endDate",
          }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    const url = new URL("/opportunities/stats/growth", baseUrl);
    url.search = searchParams.toString();

    console.log('\n🌐 EXTERNAL API REQUEST 🌐')
    console.log('URL:', url.toString())
    console.log('Method: GET')
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': token.substring(0, 20) + '...'
    })
    console.log('----------------------------------------\n')

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    const responseText = await response.text();
    console.log('\n🌐 EXTERNAL API RESPONSE 🌐')
    console.log('Status:', response.status, response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    console.log('Body:', responseText)
    console.log('----------------------------------------\n')

    if (!response.ok) {
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseText,
        url: url.toString(),
      });
      return new Response(responseText, { status: response.status });
    }

    // For development/testing, if the external API is not available,
    // return mock data
    if (process.env.NODE_ENV === 'development' && response.status === 404) {
      const mockData = generateMockData(interval, startDate, endDate);
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(responseText, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in opportunities growth route:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: "Error fetching opportunity growth statistics",
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

function generateMockData(interval: string, startDate?: string | null, endDate?: string | null) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  const data: { date: string; value: number }[] = [];

  let current = new Date(start);
  while (current <= end) {
    let dateStr: string;
    switch (interval) {
      case 'hourly':
        dateStr = current.toISOString();
        current.setHours(current.getHours() + 1);
        break;
      case 'daily':
        dateStr = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        const weekNum = Math.ceil((current.getDate() - current.getDay() + 1) / 7);
        dateStr = `${current.getFullYear()}-${String(weekNum).padStart(2, '0')}`;
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        dateStr = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
    }

    data.push({
      date: dateStr,
      value: Math.floor(Math.random() * 10) + 1, // Random value between 1 and 10
    });
  }

  return {
    data,
    metadata: {
      interval,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalOpportunities: data.reduce((sum, item) => sum + item.value, 0),
    },
  };
} 