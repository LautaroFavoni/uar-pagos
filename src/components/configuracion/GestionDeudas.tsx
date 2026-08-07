"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DeudaPendiente, DeudaMovimiento, Arbitro, TipoMovimientoDeuda } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trash2, Plus, Wallet, History, AlertCircle, ChevronDown, ArrowUpCircle, ArrowDownCircle, PlusCircle } from "lucide-react"
import { formatARS } from "@/lib/calculos"
import { cn } from "@/lib/utils"
import { ModalMovimientoDeuda } from "@/components/configuracion/ModalMovimientoDeuda"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

const TIPO_MOVIMIENTO_LABEL: Record<TipoMovimientoDeuda, string> = {
  alta: "Alta",
  cobro: "Cobro",
  ajuste: "Ajuste",
}

const TIPO_MOVIMIENTO_ICON: Record<TipoMovimientoDeuda, typeof ArrowUpCircle> = {
  alta: PlusCircle,
  cobro: ArrowDownCircle,
  ajuste: ArrowUpCircle,
}

function formatFechaHora(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface GestionDeudasProps {
  arbitros: Arbitro[]
}

export function GestionDeudas({ arbitros }: GestionDeudasProps) {
  const [deudas, setDeudas] = useState<DeudaPendiente[]>([])
  const [movimientos, setMovimientos] = useState<DeudaMovimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [savingMovimiento, setSavingMovimiento] = useState(false)
  const [deudaParaMovimiento, setDeudaParaMovimiento] = useState<DeudaPendiente | null>(null)

  // Form state
  const [selectedArbitroId, setSelectedArbitroId] = useState("")
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")

  const supabase = createClient()

  async function fetchDeudas() {
    setLoading(true)
    try {
      const [{ data: deu, error: errDeu }, { data: mov, error: errMov }] = await Promise.all([
        supabase.from('deudas_pendientes').select('*, arbitros(nombre)').order('created_at', { ascending: false }),
        supabase.from('deuda_movimientos').select('*').order('created_at')
      ])

      if (errDeu) throw errDeu
      if (errMov) throw errMov

      setDeudas(deu.map(d => ({
        ...d,
        arbitro_nombre: d.arbitros?.nombre
      })))
      setMovimientos(mov || [])
    } catch (error) {
      toast.error("Error al cargar deudas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeudas()
  }, [])

  const handleAddDeuda = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedArbitroId || !concepto || !monto) {
      toast.error("Completar todos los campos")
      return
    }

    setAdding(true)
    try {
      const montoNum = parseInt(monto)
      const { data: nuevaDeuda, error } = await supabase
        .from('deudas_pendientes')
        .insert({
          arbitro_id: selectedArbitroId,
          concepto,
          monto_inicial: montoNum,
          monto_actual: montoNum
        })
        .select()
        .single()

      if (error) throw error

      // Toda deuda nace con su movimiento 'alta' para que el saldo siempre
      // cuadre con la suma de sus movimientos.
      const { error: errMov } = await supabase
        .from('deuda_movimientos')
        .insert({ deuda_id: nuevaDeuda.id, tipo: 'alta', monto: montoNum })
      if (errMov) throw errMov

      toast.success("Deuda cargada correctamente")
      setConcepto("")
      setMonto("")
      fetchDeudas()
    } catch (error) {
      toast.error("Error al cargar deuda")
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteDeuda = async (id: string) => {
    if (!confirm("¿Borrar esta deuda definitivamente? Se pierde también su historial de movimientos.")) return

    try {
      const { error } = await supabase
        .from('deudas_pendientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDeudas(prev => prev.filter(d => d.id !== id))
      setMovimientos(prev => prev.filter(m => m.deuda_id !== id))
      toast.success("Deuda eliminada")
    } catch (error) {
      toast.error("Error al eliminar")
    }
  }

  const handleConfirmMovimiento = async (tipo: 'cobro' | 'ajuste', montoConSigno: number) => {
    if (!deudaParaMovimiento) return
    setSavingMovimiento(true)
    try {
      const { error } = await supabase.rpc('registrar_movimiento_deuda', {
        p_deuda_id: deudaParaMovimiento.id,
        p_tipo: tipo,
        p_monto: montoConSigno,
      })
      if (error) throw error

      toast.success("Movimiento registrado")
      setDeudaParaMovimiento(null)
      fetchDeudas()
    } catch (error) {
      toast.error("Error al registrar el movimiento")
    } finally {
      setSavingMovimiento(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-12">
      <Card className="md:col-span-4 border-t-4 border-t-red-500 shadow-xl rounded-3xl overflow-hidden h-fit sticky top-4">
        <CardHeader>
          <CardTitle className="text-xl font-black italic flex items-center gap-2">
            <Plus className="h-5 w-5 text-red-500" /> CARGAR DEUDA
          </CardTitle>
          <CardDescription>
            Registrá una deuda que se cobrará en la próxima liquidación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDeuda} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Árbitro</Label>
              <select
                value={selectedArbitroId}
                onChange={(e) => setSelectedArbitroId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-bold"
              >
                <option value="">Seleccionar...</option>
                {arbitros.filter(a => a.activo).map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Concepto</Label>
              <Input
                placeholder="Ej: Multa, Adelanto, Equipamiento"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Monto ($)</Label>
              <Input
                type="number"
                placeholder="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="h-10 rounded-xl font-bold text-red-600 focus-visible:ring-red-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 font-black italic"
              disabled={adding}
            >
              {adding ? "CARGANDO..." : "CARGAR DEUDA"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="md:col-span-8 shadow-xl rounded-3xl overflow-hidden border-none bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <History className="h-5 w-5 text-zinc-400" /> DEUDAS VIGENTES
          </CardTitle>
          <CardDescription>
            Saldos pendientes de cobro por árbitro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-20 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                Cargando deudas...
            </div>
          ) : deudas.length > 0 ? (
            <div className="rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest">Árbitro</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest">Concepto</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-right">Saldo Actual</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deudas.map((d) => (
                    <FilaDeuda
                      key={d.id}
                      deuda={d}
                      movimientos={movimientos.filter(m => m.deuda_id === d.id)}
                      onDelete={() => handleDeleteDeuda(d.id)}
                      onRegistrarMovimiento={() => setDeudaParaMovimiento(d)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-300 space-y-4">
               <Wallet className="h-12 w-12 opacity-20" />
               <p className="font-bold uppercase tracking-widest text-sm">No hay deudas pendientes</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4 items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed font-medium">
              <p className="font-bold mb-1 uppercase tracking-wider text-[9px]">¿Cómo funciona el cobro automático?</p>
              Al cerrar la semana, el sistema buscará el neto a pagar. Si el árbitro tiene deuda, se le descontará automáticamente y se reducirá su saldo deudor hasta que llegue a $0.
            </div>
          </div>
        </CardContent>
      </Card>

      <ModalMovimientoDeuda
        deuda={deudaParaMovimiento}
        isOpen={!!deudaParaMovimiento}
        onClose={() => setDeudaParaMovimiento(null)}
        onConfirm={handleConfirmMovimiento}
        loading={savingMovimiento}
      />
    </div>
  )
}

function FilaDeuda({ deuda, movimientos, onDelete, onRegistrarMovimiento }: {
  deuda: DeudaPendiente
  movimientos: DeudaMovimiento[]
  onDelete: () => void
  onRegistrarMovimiento: () => void
}) {
  const [showHistorial, setShowHistorial] = useState(false)

  // Línea de tiempo con saldo corriente: alta suma, cobro resta, ajuste suma
  // (ya viene con signo). El saldo final debe coincidir con deuda.monto_actual.
  const ordenados = [...movimientos].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))
  const timeline = ordenados.reduce<Array<DeudaMovimiento & { saldoLuego: number }>>((acc, m) => {
    const saldoPrevio = acc.length > 0 ? acc[acc.length - 1].saldoLuego : 0
    const saldoLuego = saldoPrevio + (m.tipo === 'cobro' ? -m.monto : m.monto)
    return [...acc, { ...m, saldoLuego }]
  }, [])

  return (
    <>
      <TableRow className="hover:bg-zinc-50/50 transition-colors">
        <TableCell className="font-bold text-zinc-700">{deuda.arbitro_nombre}</TableCell>
        <TableCell className="text-zinc-500 text-xs font-medium">{deuda.concepto}</TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end">
            <span className="font-black text-red-600 text-sm">{formatARS(deuda.monto_actual)}</span>
            {deuda.monto_actual < deuda.monto_inicial && (
              <span className="text-[8px] font-bold text-zinc-400 italic">De original: {formatARS(deuda.monto_inicial)}</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegistrarMovimiento}
              className="h-8 px-2 text-[9px] font-black uppercase text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              Movimiento
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistorial(v => !v)}
              className="h-8 w-8 text-zinc-300 hover:text-brand hover:bg-blue-50 rounded-lg"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", showHistorial && "rotate-180")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {showHistorial && (
        <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
          <TableCell colSpan={4} className="py-3">
            {timeline.length > 0 ? (
              <div className="space-y-1.5">
                {timeline.map(m => {
                  const Icon = TIPO_MOVIMIENTO_ICON[m.tipo]
                  const efectivo = m.tipo === 'cobro' ? -m.monto : m.monto
                  return (
                    <div key={m.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white border border-zinc-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", efectivo < 0 ? "text-emerald-500" : "text-red-500")} />
                        <span className="font-black uppercase text-[9px] text-zinc-500 tracking-wider">{TIPO_MOVIMIENTO_LABEL[m.tipo]}</span>
                        <span className="text-zinc-400">{formatFechaHora(m.created_at || "")}</span>
                        {m.semana && m.anio && (
                          <span className="text-zinc-300">· Sem {m.semana}/{m.anio}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("font-bold", efectivo < 0 ? "text-emerald-600" : "text-red-600")}>
                          {efectivo < 0 ? "-" : "+"}{formatARS(Math.abs(efectivo))}
                        </span>
                        <span className="text-zinc-400 font-medium">Saldo: {formatARS(m.saldoLuego)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic px-3">Sin movimientos registrados.</p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
