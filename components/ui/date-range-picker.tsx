import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  date?: DateRange;
  onSelect: (date?: DateRange) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({ 
  date,
  onSelect,
  className,
  placeholder = "Select date range"
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "group w-[300px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20",
            !date && "text-muted-foreground",
            className
          )}
        >
          <span className={cn("truncate", !date && "text-muted-foreground")}>
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              placeholder
            )}
          </span>
          <CalendarIcon
            size={16}
            strokeWidth={2}
            className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="range"
          selected={date}
          onSelect={onSelect}
          numberOfMonths={2}
          defaultMonth={date?.from}
        />
      </PopoverContent>
    </Popover>
  );
} 