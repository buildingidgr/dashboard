"use client"

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { PolarGrid, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ProjectData {
  category: string
  projects: number
  fill: string
}

const chartConfig: ChartConfig = {
  projects: {
    label: "Projects",
  },
  Infrastructure: {
    label: "Infrastructure",
    color: "hsl(var(--neutral-50))",
  },
  Commercial: {
    label: "Commercial",
    color: "hsl(var(--neutral-100))",
  },
  Residential: {
    label: "Residential",
    color: "hsl(var(--neutral-200))",
  },
  Industrial: {
    label: "Industrial",
    color: "hsl(var(--neutral-300))",
  },
  Energy: {
    label: "Energy",
    color: "hsl(var(--neutral-400))",
  },
}

export default function RadialChart() {
  const [chartData, setChartData] = useState<ProjectData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/projects/categories`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data: ProjectData[] = await response.json();
        setChartData(data);
      } catch (err) {
        setError('Error fetching data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData()
  }, [])

  if (isLoading) {
    return <Card className="flex items-center justify-center h-[400px]"><p>Loading...</p></Card>
  }

  if (error) {
    return <Card className="flex items-center justify-center h-[400px]"><p className="text-red-500">{error}</p></Card>
  }

  const totalProjects = chartData.reduce((sum, item) => sum + item.projects, 0)

  return (
    <Card className="w-full">
            <CardHeader className="flex flex-col items-center">
        <CardTitle className="text-base">Projects by Category</CardTitle>
        <CardDescription className="text-sm text-neutral-500 mx-auto">Current Year Overview</CardDescription>
      </CardHeader>
      <CardContent className="mx-auto">
        <ChartContainer
          config={chartConfig}
          className="w-full max-w-[250px] aspect-square mx-auto">
          <RadialBarChart data={chartData} innerRadius={30} outerRadius={100}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="category" />}
            />
            <PolarGrid gridType="circle" />
            <RadialBar dataKey="projects" />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm mx-auto">
        <div className="flex items-center gap-2 font-medium leading-none mx-auto">
          Total Projects: {totalProjects} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground mx-auto">
          Showing project distribution across all categories
        </div>
      </CardFooter>
    </Card>
  )
}

