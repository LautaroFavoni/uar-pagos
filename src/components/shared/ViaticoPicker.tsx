"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
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
import { Viatico } from "@/lib/types"
import { formatARS } from "@/lib/calculos"

interface ViaticoPickerProps {
  viaticos: Viatico[]
  value?: string
  onChange: (value: string) => void
}

export function ViaticoPicker({ viaticos, value, onChange }: ViaticoPickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedViatico = viaticos.find((v) => v.localidad === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-bold text-zinc-700"
        )}
      >
        <span className="truncate flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-500" />
          {selectedViatico ? `${selectedViatico.localidad} (${formatARS(selectedViatico.monto)})` : "Seleccionar localidad..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar localidad..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontró la localidad.</CommandEmpty>
            <CommandGroup>
              {viaticos.map((v) => (
                <CommandItem
                  key={v.id}
                  value={v.localidad}
                  onSelect={() => {
                    onChange(v.localidad)
                    setOpen(false)
                  }}
                  className="font-medium"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-brand",
                      value === v.localidad ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {v.localidad}
                  <span className="ml-auto text-zinc-400 font-normal">
                    {formatARS(v.monto)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
