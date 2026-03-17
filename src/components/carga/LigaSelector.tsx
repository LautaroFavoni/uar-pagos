"use client"

import { Liga } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface LigaSelectorProps {
  ligas: Liga[]
  selectedId?: string
  onSelect: (liga: Liga) => void
}

const TIPO_COLORS: Record<string, string> = {
  principal: "border-l-blue-600 bg-blue-50/50 hover:bg-blue-50 text-blue-900",
  por_partido: "border-l-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900",
  inferiores: "border-l-orange-600 bg-orange-50/50 hover:bg-orange-50 text-orange-900",
  femenino: "border-l-pink-600 bg-pink-50/50 hover:bg-pink-50 text-pink-900",
}

export function LigaSelector({ ligas, selectedId, onSelect }: LigaSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {ligas.map((liga) => (
        <Card
          key={liga.id}
          className={cn(
            "cursor-pointer p-4 border-l-4 transition-all flex items-center justify-center text-center font-bold text-sm min-h-[80px]",
            TIPO_COLORS[liga.tipo] || "border-l-gray-400",
            selectedId === liga.id ? "ring-2 ring-primary ring-offset-2 scale-[1.02] z-10" : "opacity-80 grayscale-[20%] hover:grayscale-0"
          )}
          onClick={() => onSelect(liga)}
        >
          {liga.nombre}
        </Card>
      ))}
    </div>
  )
}
