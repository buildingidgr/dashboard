"use client";

import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimezoneSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function TimezoneSelect({ 
  value, 
  onChange, 
  placeholder = "Select timezone"
}: TimezoneSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState("");

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch (error) {
      console.error('Error getting timezones:', error);
      return [];
    }
  }, []);

  const formattedTimezones = useMemo(() => {
    if (!timezones?.length) return [];
    
    return timezones
      .map((timezone) => {
        try {
          const formatter = new Intl.DateTimeFormat("en", {
            timeZone: timezone,
            timeZoneName: "shortOffset",
          });
          const parts = formatter.formatToParts(new Date());
          const offset = parts.find((part) => part.type === "timeZoneName")?.value || "";
          const modifiedOffset = offset === "GMT" ? "GMT+0" : offset;

          return {
            value: timezone,
            label: `(${modifiedOffset}) ${timezone.replace(/_/g, " ")}`,
            numericOffset: parseInt(offset.replace("GMT", "").replace("+", "") || "0"),
          };
        } catch (error) {
          console.error(`Error formatting timezone ${timezone}:`, error);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.numericOffset - b.numericOffset);
  }, [timezones]);

  const handleSelect = (currentValue: string) => {
    onChange?.(currentValue);
    setOpen(false);
  };

  const selectedTimezone = value ? formattedTimezones.find((tz) => tz.value === value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedTimezone ? selectedTimezone.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search timezone..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {formattedTimezones
                .filter(timezone => 
                  timezone.label.toLowerCase().includes(searchValue.toLowerCase())
                )
                .map((timezone) => (
                  <CommandItem
                    key={timezone.value}
                    value={timezone.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === timezone.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {timezone.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
