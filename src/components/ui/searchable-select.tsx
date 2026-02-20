"use client"

import * as React from "react"
import { useState, useMemo, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SearchableSelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  onCreate?: (value: string) => void;
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
  /** Whether to reset the value display after selection (useful for "add to list" pattern) */
  resetAfterSelect?: boolean
  icon?: React.ReactNode
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  onCreate,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  triggerClassName,
  disabled = false,
  resetAfterSelect = false,
  icon,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Filter options based on search, show max 5
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options.slice(0, 5)
    const lowerSearch = search.toLowerCase()
    return options
      .filter((opt) => opt.label.toLowerCase().includes(lowerSearch))
      .slice(0, 5)
  }, [options, search])

  const exactMatch = useMemo(() => {
    if (!search.trim() || !onCreate) return true;
    return options.some(opt => opt.label.toLowerCase() === search.trim().toLowerCase());
  }, [options, search, onCreate]);

  const [triggerWidth, setTriggerWidth] = useState<number>(0)

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
    setSearch("")
  }

  useEffect(() => {
     if (open && containerRef.current) {
         setTriggerWidth(containerRef.current.offsetWidth)
     }
  }, [open])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const input = containerRef.current?.querySelector('[data-slot="command-input"]') as HTMLInputElement
        input?.focus()
      }, 50)
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={containerRef as any}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>span]:line-clamp-1",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="shrink-0">{icon}</span>}
          {!resetAfterSelect && selectedOption ? (
            <span className="flex items-center gap-2 truncate">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className={cn(
            "ml-2 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="p-0 overflow-hidden w-auto !w-[var(--trigger-width)]"
        style={{ '--trigger-width': `${triggerWidth}px` } as React.CSSProperties}
      >
        <Command shouldFilter={false} className="w-full">
          <CommandInput
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {onCreate && search.trim() ? (
                 <div 
                   className="p-2 text-sm cursor-pointer hover:bg-muted flex items-center text-primary"
                   onClick={() => {
                     onCreate(search.trim());
                     setOpen(false);
                     setSearch("");
                   }}
                 >
                   Add "{search.trim()}"
                 </div>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  data-checked={!resetAfterSelect && value === option.value}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                </CommandItem>
              ))}
              
              {onCreate && search.trim() && !exactMatch && (
                 <CommandItem
                  value={`create-${search}`}
                  onSelect={() => {
                    onCreate(search.trim());
                    setOpen(false);
                    setSearch("");
                  }}
                  className="text-primary italic font-medium mt-1 border-t rounded-none"
                >
                  <span className="flex items-center gap-2">
                    Add "{search.trim()}"
                  </span>
                </CommandItem>
              )}

              {search.trim() && filteredOptions.length >= 5 && (
                <div className="px-2 py-1.5 text-[10px] text-muted-foreground italic text-center">
                  Refine your search to see more results
                </div>
              )}
              {!search.trim() && options.length > 5 && (
                <div className="px-2 py-1.5 text-[10px] text-muted-foreground italic text-center">
                  Type to search {options.length} items...
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
