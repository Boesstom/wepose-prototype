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

export interface SearchableSelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
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

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
    setSearch("")
  }

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
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
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
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
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100">
          <div className="rounded-md border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 overflow-hidden">
            <Command shouldFilter={false}>
              <CommandInput
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
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
          </div>
        </div>
      )}
    </div>
  )
}
