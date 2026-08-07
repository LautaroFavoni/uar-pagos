"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Liga, CargoLiga, CobroLiga, TipoCargoLiga, MetodoPago } from "@/lib/types"
import { FilaLiga } from "@/components/cobros-ligas/FilaLiga"
import { calcularSaldosLigas, sumaSaldosPendientes, formatARS } from "@/lib/calculos"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Landmark, RefreshCcw, Receipt, Wallet } from "lucide-react"

export default function CobrosLigasPage() {
  const [loading, setLoading] = useState(true)
  const [ligas, setLigas] = useState<Liga[]>([])
  const [cargos, setCargos] = useState<CargoLiga[]>([])
  const [cobros, setCobros] = useState<CobroLiga[]>([])
  const [totalesDesignaciones, setTotalesDesignaciones] = useState<Record<string, number>>({})

  const supabase = createClient()

  async function fetchData() {
    setLoading(true)
    try {
      const [
        { data: lig },
        { data: crg },
        { data: cbr },
        { data: des }
      ] = await Promise.all([
        supabase.from('ligas').select('*').order('nombre'),
        supabase.from('cargos_liga').select('*').order('fecha', { ascending: false }),
        supabase.from('cobros_liga').select('*').order('fecha_cobro', { ascending: false }),
        supabase.from('designaciones').select('liga_id, total')
      ])

      setLigas(lig || [])
      setCargos(crg || [])
      setCobros(cbr || [])

      const totales: Record<string, number> = {}
      des?.forEach(d => {
        totales[d.liga_id] = (totales[d.liga_id] || 0) + d.total
      })
      setTotalesDesignaciones(totales)
    } catch (error) {
      toast.error("Error al cargar cobros a ligas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddCargo = async (ligaId: string, payload: { tipo: TipoCargoLiga | null; concepto: string; monto: number; fecha: string }) => {
    try {
      const { data, error } = await supabase
        .from('cargos_liga')
        .insert({
          liga_id: ligaId,
          tipo: payload.tipo,
          concepto: payload.concepto || null,
          monto: payload.monto,
          fecha: payload.fecha
        })
        .select()
        .single()

      if (error) throw error

      setCargos(prev => [data, ...prev])
      toast.success("Cargo agregado")
    } catch (error) {
      toast.error("Error al agregar el cargo")
    }
  }

  const handleAddCobro = async (ligaId: string, payload: { monto: number; fecha_cobro: string; metodo_pago: MetodoPago; observaciones: string }) => {
    try {
      const { data, error } = await supabase
        .from('cobros_liga')
        .insert({
          liga_id: ligaId,
          monto: payload.monto,
          fecha_cobro: payload.fecha_cobro,
          metodo_pago: payload.metodo_pago,
          observaciones: payload.observaciones || null
        })
        .select()
        .single()

      if (error) throw error

      setCobros(prev => [data, ...prev])
      toast.success("Cobro registrado")
    } catch (error) {
      toast.error("Error al registrar el cobro")
    }
  }

  const handleDeleteCargo = async (id: string) => {
    const { error } = await supabase.from('cargos_liga').delete().eq('id', id)
    if (error) {
      toast.error("No se pudo eliminar el cargo")
    } else {
      setCargos(prev => prev.filter(c => c.id !== id))
      toast.info("Cargo eliminado")
    }
  }

  const handleDeleteCobro = async (id: string) => {
    const { error } = await supabase.from('cobros_liga').delete().eq('id', id)
    if (error) {
      toast.error("No se pudo eliminar el cobro")
    } else {
      setCobros(prev => prev.filter(c => c.id !== id))
      toast.info("Cobro eliminado")
    }
  }

  const saldosPorLiga = calcularSaldosLigas(cargos, cobros)
  const totalFacturado = cargos.reduce((acc, c) => acc + c.monto, 0)
  const totalCobrado = cobros.reduce((acc, c) => acc + c.monto, 0)
  const pendienteDeCobro = sumaSaldosPendientes(saldosPorLiga)

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-brand p-3 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-brand">Cobros a Ligas</h2>
            <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase text-xs mt-1">
              <Receipt className="h-3 w-3" />
              Facturación y cobranza por torneo
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2 h-10">
          <RefreshCcw className="h-4 w-4" />
          Recargar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border p-6 rounded-2xl shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Facturado</span>
          <span className="text-3xl font-black text-zinc-800">{formatARS(totalFacturado)}</span>
        </div>
        <div className="bg-white border p-6 rounded-2xl shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Cobrado</span>
          <span className="text-3xl font-black text-zinc-800">{formatARS(totalCobrado)}</span>
        </div>
        <div className="bg-brand text-blue-50 p-6 rounded-2xl shadow-xl shadow-blue-900/20 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Pendiente de Cobro</span>
          <span className="text-3xl font-black">{formatARS(pendienteDeCobro)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {ligas.length > 0 ? (
          ligas.map(liga => (
            <FilaLiga
              key={liga.id}
              liga={liga}
              cargos={cargos.filter(c => c.liga_id === liga.id)}
              cobros={cobros.filter(c => c.liga_id === liga.id)}
              totalDesignaciones={totalesDesignaciones[liga.id] || 0}
              onAddCargo={(payload) => handleAddCargo(liga.id, payload)}
              onAddCobro={(payload) => handleAddCobro(liga.id, payload)}
              onDeleteCargo={handleDeleteCargo}
              onDeleteCobro={handleDeleteCobro}
            />
          ))
        ) : (
          <div className="bg-white border border-dashed rounded-3xl py-20 text-center space-y-4">
            <div className="bg-zinc-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <Wallet className="h-8 w-8 text-zinc-300" />
            </div>
            <p className="text-zinc-500 font-medium">No hay ligas configuradas todavía</p>
          </div>
        )}
      </div>
    </div>
  )
}
