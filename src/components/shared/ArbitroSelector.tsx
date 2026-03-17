"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Arbitro } from "@/lib/types"

interface ArbitroSelectorProps {
  arbitros: Arbitro[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
  className?: string
}

export function ArbitroSelector({ 
  arbitros, 
  value, 
  onChange, 
  placeholder = "Seleccionar árbitro...",
  error,
  className
}: ArbitroSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const selectedArbitro = arbitros.find((a) => a.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 ring-red-500",
          className
        )}
      >
        <span className="truncate">
          {selectedArbitro ? selectedArbitro.nombre : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar por nombre..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontró el árbitro.</CommandEmpty>
            <CommandGroup>
              {arbitros.map((arbitro) => (
                <CommandItem
                  key={arbitro.id}
                  value={arbitro.nombre}
                  onSelect={() => {
                    onChange(arbitro.id)
                    setOpen(false)
                  }}
                  className="font-medium"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-[#1B5E20]",
                      value === arbitro.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {arbitro.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
