"use client"

import { useState } from "react"
import { Designacion, Descuento } from "@/lib/types"
import { formatARS } from "@/lib/calculos"
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilaArbitroProps {
  arbitroId: string
  arbitroNombre: string
  designaciones: Designacion[]
  descuentos: Descuento[]
  onAddDescuento?: (id: string) => void
  onRemoveDescuento?: (id: string) => void
  onRemoveDesignacion?: (id: string) => void
  readonly?: boolean
}

export function FilaArbitro({
  arbitroId,
  arbitroNombre,
  designaciones,
  descuentos,
  onAddDescuento,
  onRemoveDescuento,
  onRemoveDesignacion,
  readonly = false
}: FilaArbitroProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const subtotalHonorarios = designaciones.reduce((acc, d) => acc + d.monto_honorarios, 0)
  const subtotalViaticos = designaciones.reduce((acc, d) => acc + d.monto_viatico, 0)
  const totalDescuentos = descuentos.reduce((acc, d) => acc + d.monto, 0)
  const totalAPagar = (subtotalHonorarios + subtotalViaticos) - totalDescuentos

  if (designaciones.length === 0 && descuentos.length === 0) return null

  return (
    <div className="border rounded-2xl bg-white overflow-hidden shadow-sm transition-all hover:shadow-md border-zinc-100">
      <div 
        className={cn(
          "p-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer",
          isExpanded ? "bg-emerald-50/30" : "hover:bg-zinc-50/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            isExpanded ? "bg-[#1B5E20] text-white" : "bg-emerald-50 text-[#1B5E20]"
          )}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          <h3 className="text-lg font-black text-zinc-800 tracking-tight">{arbitroNombre}</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 flex-1 md:justify-end md:ml-12 items-center">
          <div className="text-left md:text-right border-r border-zinc-50 md:border-none pr-2 md:pr-0">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-zinc-400 block tracking-[0.15em] leading-none mb-1">Honorarios</span>
            <span className="font-bold text-[10px] sm:text-xs text-zinc-600">{formatARS(subtotalHonorarios)}</span>
          </div>
          <div className="text-left md:text-right border-r border-zinc-50 md:border-none pr-2 md:pr-0">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-zinc-400 block tracking-[0.15em] leading-none mb-1">Viáticos</span>
            <span className="font-bold text-[10px] sm:text-xs text-zinc-600">{formatARS(subtotalViaticos)}</span>
          </div>
          <div className="text-left md:text-right border-r border-zinc-50 md:border-none pr-2 md:pr-0">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-red-400 block tracking-[0.15em] leading-none mb-1">Dctos.</span>
            <span className="font-bold text-[10px] sm:text-xs text-red-500">-{formatARS(totalDescuentos)}</span>
          </div>
          <div className="text-left md:text-right bg-emerald-50/50 md:bg-transparent p-1.5 md:p-0 rounded-xl transition-colors group-hover:bg-emerald-50">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-emerald-700 block tracking-[0.15em] leading-none mb-1">Neto</span>
            <span className="font-black text-sm sm:text-base text-emerald-700">{formatARS(totalAPagar)}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 md:p-6 border-t bg-white space-y-6 animate-in slide-in-from-top-2 duration-200">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Detalle Designaciones</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-400 text-left border-b border-zinc-50">
                    <th className="pb-2 font-black text-[9px] uppercase tracking-widest px-1">Fecha</th>
                    <th className="pb-2 font-black text-[9px] uppercase tracking-widest px-1">Detalle (Liga | Rol)</th>
                    <th className="pb-2 text-right font-black text-[9px] uppercase tracking-widest px-1">Honorarios</th>
                    <th className="pb-2 text-right font-black text-[9px] uppercase tracking-widest px-1">Viático</th>
                    <th className="pb-2 text-right font-black text-[9px] uppercase tracking-widest px-1">Total</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {designaciones.map((d) => (
                    <tr key={d.id} className="group hover:bg-emerald-50/20 transition-colors">
                      <td className="py-2 px-1 text-zinc-500 font-medium text-xs">{d.fecha}</td>
                      <td className="py-2 px-1">
                        <span className="font-bold text-zinc-700 text-xs">{d.liga_nombre}</span>
                        <span className="mx-2 text-zinc-200">|</span>
                        <span className="text-zinc-500 text-xs uppercase font-black">{d.rol}</span>
                        {d.cantidad_partidos > 1 && (
                          <span className="ml-2 bg-zinc-100 text-zinc-500 text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                            {d.cantidad_partidos} Partidos
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-1 text-right text-zinc-600 text-xs">{formatARS(d.monto_honorarios)}</td>
                      <td className="py-2 px-1 text-right text-zinc-600 text-xs">{formatARS(d.monto_viatico)}</td>
                      <td className="py-2 px-1 text-right font-black text-zinc-800 text-xs">{formatARS(d.total)}</td>
                      {!readonly && (
                        <td className="py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-600 transition-all"
                            onClick={() => d.id && onRemoveDesignacion?.(d.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-4 border-t">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Descuentos</h4>
                {!readonly && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold gap-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddDescuento?.(arbitroId)
                    }}
                  >
                    <Plus className="h-3 w-3" /> AGREGAR DESCUENTO
                  </Button>
                )}
              </div>
              
              {descuentos.length > 0 ? (
                <div className="space-y-2">
                  {descuentos.map((dc) => (
                    <div key={dc.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-100">
                      <div>
                        <span className="font-bold text-zinc-800 text-sm">{dc.concepto}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600">-{formatARS(dc.monto)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-red-200 hover:text-red-600"
                          onClick={() => dc.id && onRemoveDescuento?.(dc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-zinc-400 text-xs italic border border-dashed rounded-lg">
                  Sin descuentos aplicados
                </div>
              )}
            </div>

            <div className="bg-zinc-900 text-white p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-inner">
               <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-2">Total Final a Liquidar</span>
               <span className="text-4xl font-black text-emerald-400">{formatARS(totalAPagar)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
