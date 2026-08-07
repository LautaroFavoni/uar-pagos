"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Liga, CargoLiga, CobroLiga, TipoCargoLiga, MetodoPago } from "@/lib/types"
import { formatARS } from "@/lib/calculos"
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Receipt,
  Landmark,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FilaLigaProps {
  liga: Liga
  cargos: CargoLiga[]
  cobros: CobroLiga[]
  totalDesignaciones: number
  onAddCargo: (payload: { tipo: TipoCargoLiga | null; concepto: string; monto: number; fecha: string }) => void
  onAddCobro: (payload: { monto: number; fecha_cobro: string; metodo_pago: MetodoPago; observaciones: string }) => void
  onDeleteCargo: (id: string) => void
  onDeleteCobro: (id: string) => void
}

const TIPOS_CARGO: { value: TipoCargoLiga; label: string }[] = [
  { value: "jornada", label: "Jornada" },
  { value: "partido", label: "Partido" },
  { value: "arbitro", label: "Árbitro" },
  { value: "otro", label: "Otro" },
]

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "cheque", label: "Cheque" },
]

export function FilaLiga({
  liga,
  cargos,
  cobros,
  totalDesignaciones,
  onAddCargo,
  onAddCobro,
  onDeleteCargo,
  onDeleteCobro
}: FilaLigaProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const [tipoCargo, setTipoCargo] = useState<TipoCargoLiga | "">("")
  const [conceptoCargo, setConceptoCargo] = useState("")
  const [montoCargo, setMontoCargo] = useState("")
  const [fechaCargo, setFechaCargo] = useState(format(new Date(), "yyyy-MM-dd"))

  const [montoCobro, setMontoCobro] = useState("")
  const [fechaCobro, setFechaCobro] = useState(format(new Date(), "yyyy-MM-dd"))
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("")
  const [observacionesCobro, setObservacionesCobro] = useState("")

  const totalFacturado = cargos.reduce((acc, c) => acc + c.monto, 0)
  const totalCobrado = cobros.reduce((acc, c) => acc + c.monto, 0)
  const saldo = totalFacturado - totalCobrado
  const margen = totalFacturado - totalDesignaciones

  const handleSubmitCargo = (e: React.FormEvent) => {
    e.preventDefault()
    const montoNum = parseInt(montoCargo)
    if (!montoNum || montoNum <= 0) return

    onAddCargo({
      tipo: tipoCargo || null,
      concepto: conceptoCargo,
      monto: montoNum,
      fecha: fechaCargo
    })

    setTipoCargo("")
    setConceptoCargo("")
    setMontoCargo("")
  }

  const handleSubmitCobro = (e: React.FormEvent) => {
    e.preventDefault()
    const montoNum = parseInt(montoCobro)
    if (!montoNum || montoNum <= 0 || !metodoPago) return

    onAddCobro({
      monto: montoNum,
      fecha_cobro: fechaCobro,
      metodo_pago: metodoPago,
      observaciones: observacionesCobro
    })

    setMontoCobro("")
    setMetodoPago("")
    setObservacionesCobro("")
  }

  return (
    <div className={cn(
      "bg-white border rounded-[2rem] overflow-hidden shadow-sm transition-all duration-300",
      saldo > 0 ? "hover:border-red-200" : "hover:border-emerald-200"
    )}>
      <div
        className={cn(
          "p-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer",
          isExpanded ? "bg-blue-50/30" : "hover:bg-zinc-50/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-zinc-50 border-2 border-zinc-100 text-zinc-400 flex items-center justify-center">
            <Landmark className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-xl font-black truncate tracking-tight text-zinc-900">{liga.nombre}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none capitalize">
                {liga.tipo.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 flex-1 md:justify-end md:ml-12 items-center">
          <div className="text-left md:text-right border-r border-zinc-50 md:border-none pr-2 md:pr-0">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-zinc-400 block tracking-[0.15em] leading-none mb-1">Facturado</span>
            <span className="font-bold text-[10px] sm:text-xs text-zinc-600">{formatARS(totalFacturado)}</span>
          </div>
          <div className="text-left md:text-right border-r border-zinc-50 md:border-none pr-2 md:pr-0">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-zinc-400 block tracking-[0.15em] leading-none mb-1">Cobrado</span>
            <span className="font-bold text-[10px] sm:text-xs text-zinc-600">{formatARS(totalCobrado)}</span>
          </div>
          <div className="text-left md:text-right border-r border-zinc-50 md:border-none pr-2 md:pr-0">
            <span className="text-[7px] sm:text-[8px] uppercase font-black text-zinc-400 block tracking-[0.15em] leading-none mb-1">Margen</span>
            <span className={cn("font-bold text-[10px] sm:text-xs flex items-center gap-1", margen >= 0 ? "text-emerald-600" : "text-red-500")}>
              {margen >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatARS(margen)}
            </span>
          </div>
          <div className={cn(
            "text-left md:text-right p-1.5 md:p-0 rounded-xl transition-colors",
            saldo > 0 ? "bg-red-50/50 md:bg-transparent" : "bg-emerald-50/50 md:bg-transparent"
          )}>
            <span className={cn("text-[7px] sm:text-[8px] uppercase font-black block tracking-[0.15em] leading-none mb-1", saldo > 0 ? "text-red-700" : "text-emerald-700")}>Saldo</span>
            <span className={cn("font-black text-sm sm:text-base", saldo > 0 ? "text-red-600" : "text-emerald-600")}>
              {formatARS(saldo)}
            </span>
          </div>
        </div>

        <button className="hidden md:flex text-zinc-300 p-1" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 md:p-6 border-t bg-white space-y-8 animate-in slide-in-from-top-2 duration-200">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Columna Formularios */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5" /> Agregar Cargo
                </h4>
                <form onSubmit={handleSubmitCargo} className="space-y-3 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-zinc-400">Tipo (opcional)</Label>
                      <select
                        value={tipoCargo}
                        onChange={(e) => setTipoCargo(e.target.value as TipoCargoLiga | "")}
                        className="w-full h-9 px-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none text-xs font-bold"
                      >
                        <option value="">Sin especificar</option>
                        {TIPOS_CARGO.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-zinc-400">Fecha</Label>
                      <Input
                        type="date"
                        value={fechaCargo}
                        onChange={(e) => setFechaCargo(e.target.value)}
                        className="h-9 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-zinc-400">Concepto</Label>
                    <Input
                      placeholder="Ej: Jornada sábado, Fecha 12"
                      value={conceptoCargo}
                      onChange={(e) => setConceptoCargo(e.target.value)}
                      className="h-9 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-zinc-400">Monto ($)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={montoCargo}
                      onChange={(e) => setMontoCargo(e.target.value)}
                      required
                      className="h-9 rounded-lg font-bold text-sm"
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full bg-brand hover:bg-brand-hover text-white font-bold gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Agregar Cargo
                  </Button>
                </form>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <Landmark className="h-3.5 w-3.5" /> Registrar Cobro
                </h4>
                <form onSubmit={handleSubmitCobro} className="space-y-3 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-zinc-400">Monto ($)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={montoCobro}
                        onChange={(e) => setMontoCobro(e.target.value)}
                        required
                        className="h-9 rounded-lg font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-zinc-400">Fecha</Label>
                      <Input
                        type="date"
                        value={fechaCobro}
                        onChange={(e) => setFechaCobro(e.target.value)}
                        className="h-9 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-zinc-400">Método de Pago</Label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value as MetodoPago | "")}
                      required
                      className="w-full h-9 px-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs font-bold"
                    >
                      <option value="">Seleccionar...</option>
                      {METODOS_PAGO.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-zinc-400">Observaciones (opcional)</Label>
                    <Input
                      placeholder="Ej: Pago parcial, cheque a 30 días"
                      value={observacionesCobro}
                      onChange={(e) => setObservacionesCobro(e.target.value)}
                      className="h-9 rounded-lg text-sm"
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Registrar Cobro
                  </Button>
                </form>
              </div>
            </div>

            {/* Columna Historial */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Historial de Cargos</h4>
                {cargos.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {cargos.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/50 border border-zinc-100">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-800 text-sm truncate">{c.concepto || "Sin concepto"}</span>
                            {c.tipo && (
                              <span className="bg-blue-50 text-blue-600 text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0">{c.tipo}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tabular-nums">
                            {new Date(c.fecha + "T12:00:00").toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-zinc-700">{formatARS(c.monto)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-zinc-200 hover:text-red-600"
                            onClick={() => c.id && onDeleteCargo(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-zinc-400 text-xs italic border border-dashed rounded-lg">
                    Sin cargos registrados
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Historial de Cobros</h4>
                {cobros.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {cobros.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-800 text-sm capitalize">{c.metodo_pago}</span>
                            {c.observaciones && (
                              <span className="text-zinc-400 text-[10px] italic truncate">{c.observaciones}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tabular-nums">
                            {new Date(c.fecha_cobro + "T12:00:00").toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-emerald-700">{formatARS(c.monto)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-emerald-200 hover:text-red-600"
                            onClick={() => c.id && onDeleteCobro(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-zinc-400 text-xs italic border border-dashed rounded-lg">
                    Sin cobros registrados
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
