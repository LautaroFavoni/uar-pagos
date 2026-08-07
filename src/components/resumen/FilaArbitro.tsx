"use client"

import { useState, useEffect } from "react"
import { Designacion, Descuento, DeudaPendiente, Liquidacion, MetodoPagoLiquidacion } from "@/lib/types"
import { formatARS, METODO_PAGO_LABEL } from "@/lib/calculos"
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Square,
  CheckSquare,
  Trash,
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ModalMetodoPago } from "@/components/resumen/ModalMetodoPago"

interface FilaArbitroProps {
  arbitroId: string
  arbitroNombre: string
  designaciones: Designacion[]
  descuentos: Descuento[]
  onAddDescuento?: (id: string) => void
  onRemoveDescuento?: (id: string) => void
  onRemoveDesignacion?: (id: string) => void
  deudas?: DeudaPendiente[]
  liquidacion?: Liquidacion | null
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
  deudas = [],
  liquidacion = null,
  readonly = false,
}: FilaArbitroProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localLiquidacion, setLocalLiquidacion] = useState<Liquidacion | null>(liquidacion)
  const [showMetodoModal, setShowMetodoModal] = useState(false)
  const [savingPago, setSavingPago] = useState(false)

  useEffect(() => {
    setLocalLiquidacion(liquidacion)
  }, [liquidacion])

  const supabase = createClient()

  const localIsPaid = localLiquidacion?.estado === 'pagado'

  const handleTogglePagadoMasivo = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (readonly) return // SEGURIDAD: No permitir cambios en vista pública
    if (!localLiquidacion?.id) return // No se puede marcar pago sin cerrar la semana primero

    if (localIsPaid) {
      // Revertir a pendiente
      void marcarPago(null)
    } else {
      setShowMetodoModal(true)
    }
  }

  const marcarPago = async (metodoPago: MetodoPagoLiquidacion | null) => {
    if (!localLiquidacion?.id) return
    const previo = localLiquidacion
    const optimista: Liquidacion = {
      ...localLiquidacion,
      estado: metodoPago ? 'pagado' : 'pendiente',
      metodo_pago: metodoPago,
      fecha_pago: metodoPago ? new Date().toISOString() : null,
    }
    setSavingPago(true)
    setLocalLiquidacion(optimista)

    try {
      const { error } = await supabase
        .from('liquidaciones')
        .update({
          estado: optimista.estado,
          metodo_pago: optimista.metodo_pago,
          fecha_pago: optimista.fecha_pago,
        })
        .eq('id', localLiquidacion.id)

      if (error) throw error
      toast.success(metodoPago ? `Pago registrado para ${arbitroNombre}` : `Pago pendiente para ${arbitroNombre}`)
      setShowMetodoModal(false)
    } catch (error) {
      setLocalLiquidacion(previo) // Rollback UI if error
      toast.error("Error al actualizar estado de pago")
    } finally {
      setSavingPago(false)
    }
  }

  const colorAccent = "blue" // Centralizado para facilitar cambios
  // Una vez cerrada la semana, el desglose autoritativo vive en liquidaciones
  // (incluye la deuda cobrada, que ya no se representa como un descuento más).
  // Antes del cierre no hay liquidacion todavía: se muestra un preview calculado en el cliente.
  const subtotalHonorarios = localLiquidacion?.subtotal_honorarios ?? designaciones.reduce((acc, d) => acc + d.monto_honorarios, 0)
  const subtotalViaticos = localLiquidacion?.subtotal_viaticos ?? designaciones.reduce((acc, d) => acc + d.monto_viatico, 0)
  const totalDescuentos = localLiquidacion?.total_descuentos ?? descuentos.reduce((acc, d) => acc + d.monto, 0)
  const totalDeudaCobrada = localLiquidacion?.total_deuda_cobrada ?? 0
  const totalAPagar = subtotalHonorarios + subtotalViaticos - totalDescuentos
  const neto = localLiquidacion?.neto ?? totalAPagar
  const totalDeudaPendiente = deudas.reduce((acc, d) => acc + d.monto_actual, 0)
  // Proyección de lo que cerrar_semana va a cobrar de deuda esta semana: el
  // mínimo entre el saldo deudor y el neto disponible (no se puede cobrar más
  // de lo que se le paga, ni más de lo que debe). Solo aplica antes de cerrar.
  const proyeccionCobroDeuda = Math.min(totalDeudaPendiente, Math.max(totalAPagar, 0))

  if (designaciones.length === 0 && descuentos.length === 0) return null

  return (
    <div className={cn(
      "bg-white border rounded-[2rem] overflow-hidden shadow-sm transition-all duration-300",
      localIsPaid ? "border-blue-200/50 opacity-80" : "hover:border-blue-200"
    )}>
      <div 
        className={cn(
          "p-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer",
          isExpanded ? "bg-blue-50/30" : "hover:bg-zinc-50/50",
          localIsPaid && "bg-blue-50/10"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0 group">
          <button
                onClick={handleTogglePagadoMasivo}
                disabled={readonly || !localLiquidacion?.id || savingPago}
                title={!localLiquidacion?.id ? "Cerrá la semana para poder registrar el pago" : undefined}
                className={cn(
                  "p-2 rounded-xl transition-all shadow-sm flex items-center justify-center",
                  localIsPaid ? "bg-blue-600 text-white shadow-blue-200" : "bg-white border-2 border-zinc-100 text-zinc-300",
                  !readonly && localLiquidacion?.id && (localIsPaid ? "" : "hover:border-blue-200 hover:text-blue-500"),
                  (readonly || !localLiquidacion?.id) && "cursor-default opacity-80"
                )}
              >
                {localIsPaid ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-base sm:text-xl font-black truncate tracking-tight",
              localIsPaid ? "text-blue-800" : "text-zinc-900"
            )}>{arbitroNombre}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
               <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", localIsPaid ? "bg-blue-600" : "bg-blue-400")} />
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                 {localIsPaid
                   ? "Liquidación Pagada"
                   : localLiquidacion?.id
                     ? "Pago Pendiente"
                     : "Pendiente de Cierre"}
               </span>
               {localIsPaid && localLiquidacion?.metodo_pago && (
                 <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm border border-blue-100">
                   {METODO_PAGO_LABEL[localLiquidacion.metodo_pago]}
                 </span>
               )}
               {!localIsPaid && totalDeudaPendiente > 0 && (
                 <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[9px] font-black animate-bounce shadow-sm border border-red-100">
                   <AlertCircle className="h-2.5 w-2.5" /> DEUDA: {formatARS(totalDeudaPendiente)}
                 </span>
               )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 flex-1 md:justify-end md:ml-12 items-center">
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
          {totalDeudaCobrada > 0 && (
            <div className="text-left md:text-right border-r border-zinc-50 md:border-none pr-2 md:pr-0">
              <span className="text-[7px] sm:text-[8px] uppercase font-black text-red-400 block tracking-[0.15em] leading-none mb-1">Deuda Cobrada</span>
              <span className="font-bold text-[10px] sm:text-xs text-red-500">-{formatARS(totalDeudaCobrada)}</span>
            </div>
          )}
          <div className="text-left md:text-right bg-blue-50/50 md:bg-transparent p-1.5 md:p-0 rounded-xl transition-colors group-hover:bg-blue-50">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-blue-700 block tracking-[0.15em] leading-none mb-1">Neto</span>
            <span className="font-black text-sm sm:text-base text-blue-700">{formatARS(neto)}</span>
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
                  {designaciones.map((d, index) => (
                    <tr key={d.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                      <td className="py-2 px-1 text-[10px] text-zinc-400 font-bold uppercase tabular-nums">
                        {new Date(d.fecha + "T12:00:00").toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="py-2 px-1">
                        <span className="font-bold text-zinc-700 text-xs">{d.liga_nombre}</span>
                        <span className="mx-2 text-zinc-200">|</span>
                        <span className="text-zinc-500 text-xs uppercase font-black">{d.rol}</span>
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
                        {!readonly && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-200 hover:text-red-600"
                            onClick={() => dc.id && onRemoveDescuento?.(dc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                  ) : (
                    <div className="py-4 text-center text-zinc-400 text-xs italic border border-dashed rounded-lg">
                      Sin descuentos aplicados
                    </div>
                  )}
                  
                  {totalDeudaPendiente > 0 && !localIsPaid && (
                    <div className="mt-4 p-4 bg-red-50/30 border border-red-100 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-4 w-4 text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Saldos Deudores Pendientes</span>
                      </div>
                      <div className="space-y-1">
                        {deudas.map(d => (
                          <div key={d.id} className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">{d.concepto}</span>
                            <span className="font-bold text-red-600">{formatARS(d.monto_actual)}</span>
                          </div>
                        ))}
                      </div>
                      {!localLiquidacion?.id && (
                        <>
                          {proyeccionCobroDeuda > 0 ? (
                            <div className="mt-3 flex justify-between items-center px-3 py-2 rounded-xl bg-red-100/60 border border-red-200">
                              <span className="text-[10px] font-black uppercase tracking-widest text-red-700">Se cobrará al cerrar esta semana</span>
                              <span className="font-black text-red-700 text-sm">{formatARS(proyeccionCobroDeuda)}</span>
                            </div>
                          ) : (
                            <p className="mt-3 text-[9px] text-red-400 italic font-medium leading-tight">
                              * El neto disponible esta semana no alcanza para cobrar deuda.
                            </p>
                          )}
                        </>
                      )}
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

      <ModalMetodoPago
        arbitroNombre={arbitroNombre}
        isOpen={showMetodoModal}
        onClose={() => setShowMetodoModal(false)}
        onConfirm={(metodo) => void marcarPago(metodo)}
        loading={savingPago}
      />
    </div>
  )
}
