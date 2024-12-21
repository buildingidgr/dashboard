"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { day: "Mon", distance: 11 },
  { day: "Tue", distance: 13 },
  { day: "Wed", distance: 14 },
  { day: "Thu", distance: 12 },
  { day: "Fri", distance: 11 },
  { day: "Sat", distance: 13 },
  { day: "Sun", distance: 15 },
]

const ChartDistance = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Walking Distance</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your daily walking distance over the past week
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis 
              dataKey="day"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}km`}
            />
            <Tooltip />
            <Bar
              dataKey="distance"
              fill="currentColor"
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default ChartDistance

