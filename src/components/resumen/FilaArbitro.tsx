"use client"

import { useState } from "react"
import { Designacion, Descuento } from "@/lib/types"
import { formatARS } from "@/lib/calculos"
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  Square,
  CheckSquare,
  Trash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

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
  const supabase = createClient()

  const handleTogglePagado = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('designaciones')
        .update({ pagado: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      
      toast.success(currentStatus ? "Marcado como pendiente" : "Marcado como pagado")
      // Idealmente refrescar los datos, pero como estamos en un componente hijo sin 'onRefresh', 
      // confiaremos en que el usuario vea el cambio visual o implementaremos un estado local rápido si es necesario.
      // Por ahora, asumimos que el padre recargará o el usuario refrescará si quiere ver el total actualizado si afectara (no afecta al total neto, solo es visual).
    } catch (error) {
      toast.error("Error al actualizar estado de pago")
    }
  }

  const colorAccent = "blue" // Centralizado para facilitar cambios
  const subtotalHonorarios = designaciones.reduce((acc, d) => acc + d.monto_honorarios, 0)
  const subtotalViaticos = designaciones.reduce((acc, d) => acc + d.monto_viatico, 0)
  const totalDescuentos = descuentos.reduce((acc, d) => acc + d.monto, 0)
  const totalAPagar = (subtotalHonorarios + subtotalViaticos) - totalDescuentos
  const neto = totalAPagar; // Renamed for consistency with the provided snippet

  if (designaciones.length === 0 && descuentos.length === 0) return null

  return (
    <div className="border rounded-2xl bg-white overflow-hidden shadow-sm transition-all hover:shadow-md border-zinc-100">
      <div 
        className={cn(
          "p-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer",
          isExpanded ? "bg-blue-50/30" : "hover:bg-zinc-50/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            isExpanded ? "bg-[#003399] text-white" : "bg-blue-50 text-[#003399]"
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
          <div className="text-left md:text-right bg-blue-50/50 md:bg-transparent p-1.5 md:p-0 rounded-xl transition-colors group-hover:bg-blue-50">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-blue-700 block tracking-[0.15em] leading-none mb-1">Neto</span>
            <span className="font-black text-sm sm:text-base text-blue-700">{formatARS(totalAPagar)}</span>
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
                    <th className="pb-2 w-10"></th> {/* New column for checkbox */}
                    <th className="pb-2 font-black text-[9px] uppercase tracking-widest px-1">Fecha</th>
                    <th className="pb-2 font-black text-[9px] uppercase tracking-widest px-1">Detalle (Liga | Rol)</th>
                    <th className="pb-2 text-right font-black text-[9px] uppercase tracking-widest px-1">Honorarios</th>
                    <th className="pb-2 text-right font-black text-[9px] uppercase tracking-widest px-1">Viático</th>
                    <th className="pb-2 text-right font-black text-[9px] uppercase tracking-widest px-1">Total</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {designaciones.map((d, index) => (
                    <tr key={d.id} className={cn(
                      "border-b border-zinc-50 transition-colors animate-in fade-in slide-in-from-top-1 duration-200",
                      d.pagado ? "bg-blue-50/30" : "hover:bg-zinc-50/50"
                    )}>
                      <td className="py-2 px-1">
                        <button 
                          onClick={() => d.id && handleTogglePagado(d.id, !!d.pagado)}
                          className={cn(
                            "p-1 rounded-md transition-all hover:scale-110",
                            d.pagado ? "text-blue-600" : "text-zinc-300 hover:text-blue-400"
                          )}
                          title={d.pagado ? "Marcar como pendiente" : "Marcar como pagado"}
                        >
                          {d.pagado ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-1 text-[10px] text-zinc-400 font-bold uppercase tabular-nums">
                        {new Date(d.fecha + "T12:00:00").toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="py-2 px-1">
                        <span className="font-bold text-zinc-700 text-xs">{d.liga_nombre}</span>
                        <span className="mx-2 text-zinc-200">|</span>
                        <span className={cn(
                          "text-xs uppercase font-black",
                          d.pagado ? "text-blue-400" : "text-zinc-500"
                        )}>{d.rol}</span>
                        {d.cantidad_partidos > 1 && (
                          <span className="ml-2 bg-blue-50 text-blue-500 text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                            {d.cantidad_partidos} Partidos
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-1 text-right text-zinc-600 text-xs tabular-nums">{formatARS(d.monto_honorarios)}</td>
                      <td className="py-2 px-1 text-right text-zinc-600 text-xs tabular-nums">{formatARS(d.monto_viatico)}</td>
                      <td className="py-2 px-2 text-right text-zinc-900 font-black text-xs tabular-nums">
                        {formatARS(d.total)}
                      </td>
                      {!readonly && (
                        <td className="py-2 px-1 text-right">
                          <button 
                            onClick={() => d.id && onRemoveDesignacion?.(d.id)}
                            className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
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

            <div className={cn(
              "bg-zinc-900 text-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col items-center justify-center min-w-[180px] sm:min-w-[240px] border-t-4 border-blue-500 transition-all hover:scale-[1.02]",
              readonly && "mx-auto"
            )}>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Total Final a Liquidar</span>
                <span className="text-3xl sm:text-5xl font-black tabular-nums text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  {formatARS(neto)}
                </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
