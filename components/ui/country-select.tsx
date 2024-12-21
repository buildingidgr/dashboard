"use client";

import { Check, ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
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

// Language groups with ISO codes
const languages = [
  {
    region: "English",
    items: [
      { value: "en-US", label: "English (United States)", flag: "🇺🇸" },
      { value: "en-GB", label: "English (United Kingdom)", flag: "🇬🇧" },
      { value: "en-CA", label: "English (Canada)", flag: "🇨🇦" },
      { value: "en-AU", label: "English (Australia)", flag: "🇦🇺" },
    ]
  },
  {
    region: "European",
    items: [
      { value: "de-DE", label: "Deutsch (German)", flag: "🇩🇪" },
      { value: "fr-FR", label: "Français (French)", flag: "🇫🇷" },
      { value: "es-ES", label: "Español (Spanish)", flag: "🇪🇸" },
      { value: "it-IT", label: "Italiano (Italian)", flag: "🇮🇹" },
      { value: "pt-PT", label: "Português (Portugal)", flag: "🇵🇹" },
      { value: "nl-NL", label: "Nederlands (Dutch)", flag: "🇳🇱" },
      { value: "el-GR", label: "Ελληνικά (Greek)", flag: "🇬🇷" },
      { value: "pl-PL", label: "Polski (Polish)", flag: "🇵🇱" },
    ]
  },
  {
    region: "Asian",
    items: [
      { value: "zh-CN", label: "中文 (Chinese Simplified)", flag: "🇨🇳" },
      { value: "ja-JP", label: "日本語 (Japanese)", flag: "🇯🇵" },
      { value: "ko-KR", label: "한국어 (Korean)", flag: "🇰🇷" },
      { value: "hi-IN", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
    ]
  }
];

interface CountrySelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function CountrySelect({ 
  value, 
  onChange,
  placeholder = "Select language" 
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSelect = (currentValue: string) => {
    onChange?.(currentValue);
    setOpen(false);
  };

  const selectedLanguage = value 
    ? languages
        .flatMap(group => group.items)
        .find(item => item.value === value)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedLanguage ? (
            <span className="flex items-center gap-2">
              <span className="text-lg leading-none">{selectedLanguage.flag}</span>
              <span className="truncate">{selectedLanguage.label}</span>
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search language..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            {languages.map((group) => (
              <Fragment key={group.region}>
                <CommandGroup heading={group.region}>
                  {group.items
                    .filter(item => 
                      item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
                      item.value.toLowerCase().includes(searchValue.toLowerCase())
                    )
                    .map((language) => (
                      <CommandItem
                        key={language.value}
                        value={language.value}
                        onSelect={handleSelect}
                      >
                        <span className="text-lg leading-none mr-2">{language.flag}</span>
                        {language.label}
                        {value === language.value && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
