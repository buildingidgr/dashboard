import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useOpportunityGrowth } from "@/hooks/use-opportunity-growth";
import { useState, useEffect } from "react";
import { format, subMonths, differenceInDays, parse } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DateRangePickerWithPresets } from "@/components/ui/date-range-picker-with-presets";
import { DateRange } from "react-day-picker";
import Image from "next/image";

const chartConfig = {
  value: {
    label: "Opportunities",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type IntervalType = 'hourly' | 'daily' | 'weekly' | 'monthly';

export function OpportunityGrowthChart() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [interval, setInterval] = useState<IntervalType>('daily');

  // Automatically determine the interval based on the date range
  useEffect(() => {
    if (!dateRange.from || !dateRange.to) return;

    const days = differenceInDays(dateRange.to, dateRange.from);
    let newInterval: IntervalType;

    if (days < 1) {
      newInterval = 'hourly';
    } else if (days < 30) {
      newInterval = 'daily';
    } else if (days < 180) {
      newInterval = 'weekly';
    } else {
      newInterval = 'monthly';
    }

    setInterval(newInterval);
  }, [dateRange]);

  const { data, metadata, loading, error } = useOpportunityGrowth({
    interval,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  });

  const calculateTotal = () => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.value, 0);
  };

  const formatDate = (date: string) => {
    try {
      switch (interval) {
        case 'hourly':
          return format(new Date(date), 'HH:mm');
        case 'daily':
          return format(new Date(date), 'MMM d');
        case 'weekly': {
          const [year, week] = date.split('-');
          return `Week ${week}`;
        }
        case 'monthly': {
          const [year, month] = date.split('-');
          const monthDate = parse(`${year}-${month}-01`, 'yyyy-MM-dd', new Date());
          return format(monthDate, 'MMM yyyy');
        }
        default:
          return date;
      }
    } catch (err) {
      console.error('Error formatting date:', err);
      return date;
    }
  };

  // Calculate trend
  const calculateTrend = () => {
    if (!data || data.length < 2) return { percentage: 0, isUp: true };
    const lastValue = data[data.length - 1].value;
    const previousValue = data[data.length - 2].value;
    if (previousValue === 0) return { percentage: 0, isUp: true };
    const percentage = ((lastValue - previousValue) / previousValue) * 100;
    return {
      percentage: Math.abs(Math.round(percentage * 10) / 10),
      isUp: percentage >= 0,
    };
  };

  const trend = calculateTrend();
  const total = calculateTotal();

  const chartData = data.map(item => ({
    date: formatDate(item.date),
    value: item.value,
  }));

  return (
    <Card className="max-w-[800px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Opportunity Growth</CardTitle>
            <CardDescription>
              Number of new public opportunities over time
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">
                {loading ? (
                  "..."
                ) : error ? (
                  "Error"
                ) : (
                  total
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                Total for Period
              </span>
            </div>
          </div>
          <DateRangePickerWithPresets
            date={dateRange}
            onSelect={(newDateRange) => {
              if (newDateRange?.from && newDateRange?.to) {
                setDateRange(newDateRange);
              }
            }}
            className="w-[300px]"
            align="end"
          />
        </div>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading data...</p>
          </div>
        ) : error ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-4">
            <Image
              src="/no-data.svg"
              alt="No data available"
              width={120}
              height={120}
              className="opacity-50"
            />
            <p className="text-sm text-muted-foreground">No data available for the selected period</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <AreaChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
              height={200}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="value"
                type="natural"
                fill="var(--color-value)"
                fillOpacity={0.4}
                stroke="var(--color-value)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      {data.length > 0 && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              {trend.percentage > 0 && (
                <div className="flex items-center gap-2 font-medium leading-none">
                  {trend.isUp ? 'Trending up' : 'Trending down'} by {trend.percentage}% this period{' '}
                  {trend.isUp ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                {formatDate(data[0].date)} - {formatDate(data[data.length - 1].date)}
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 