import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";

interface DateRangePickerWithPresetsProps {
  date?: DateRange;
  onSelect: (date?: DateRange) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

export function DateRangePickerWithPresets({
  date,
  onSelect,
  className,
  align = "start",
}: DateRangePickerWithPresetsProps) {
  const today = new Date();
  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  };
  const last7Days = {
    from: subDays(today, 6),
    to: today,
  };
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  };
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  };
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  };
  const yearToDate = {
    from: startOfYear(today),
    to: today,
  };
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  };
  const [month, setMonth] = useState(date?.from || today);

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex max-h-[500px] flex-col">
            <div className="flex max-sm:flex-col">
              <div className="relative border-border py-4 max-sm:order-1 max-sm:border-t sm:w-32">
                <div className="h-full border-border sm:border-e">
                  <div className="flex flex-col px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const newDate = {
                          from: today,
                          to: today,
                        };
                        onSelect(newDate);
                        setMonth(today);
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onSelect(yesterday);
                        setMonth(yesterday.to);
                      }}
                    >
                      Yesterday
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onSelect(last7Days);
                        setMonth(last7Days.to);
                      }}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onSelect(last30Days);
                        setMonth(last30Days.to);
                      }}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onSelect(monthToDate);
                        setMonth(monthToDate.to);
                      }}
                    >
                      Month to date
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onSelect(lastMonth);
                        setMonth(lastMonth.to);
                      }}
                    >
                      Last month
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onSelect(yearToDate);
                        setMonth(yearToDate.to);
                      }}
                    >
                      Year to date
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onSelect(lastYear);
                        setMonth(lastYear.to);
                      }}
                    >
                      Last year
                    </Button>
                  </div>
                </div>
              </div>
              <Calendar
                mode="range"
                selected={date}
                onSelect={onSelect}
                month={month}
                onMonthChange={setMonth}
                className="p-2"
                disabled={[
                  { after: today },
                ]}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 