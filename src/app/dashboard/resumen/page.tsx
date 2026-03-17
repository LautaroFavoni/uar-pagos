"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Designacion, Descuento, Arbitro } from "@/lib/types"
import { FilaArbitro } from "@/components/resumen/FilaArbitro"
import { ModalDescuento } from "@/components/resumen/ModalDescuento"
import { getSemanaInfo, formatARS } from "@/lib/calculos"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  Download, 
  Share2, 
  RefreshCcw,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

export default function ResumenPagosPage() {
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [designaciones, setDesignaciones] = useState<Designacion[]>([])
  const [descuentos, setDescuentos] = useState<Descuento[]>([])
  const [selectedArbitro, setSelectedArbitro] = useState<Arbitro | null>(null)
  
  const hoy = new Date()
  const { semana: sS, anio: aS } = getSemanaInfo(hoy)
  const [semana, setSemana] = useState(sS)
  const [anio, setAnio] = useState(aS)
  
  const supabase = createClient()

  async function fetchData() {
    setLoading(true)
    try {
      const [
        { data: des }, 
        { data: dct }
      ] = await Promise.all([
        supabase
          .from('designaciones')
          .select('*, arbitros(nombre), ligas(nombre)')
          .eq('semana', semana)
          .eq('anio', anio)
          .eq('estado', 'pendiente'),
        supabase
          .from('descuentos')
          .select('*')
          .eq('semana', semana)
          .eq('anio', anio)
          .eq('estado', 'pendiente')
      ])

      if (des) {
        setDesignaciones(des.map(d => ({
          ...d,
          arbitro_nombre: d.arbitros?.nombre,
          liga_nombre: d.ligas?.nombre
        })))
      } else {
        setDesignaciones([])
      }
      
      if (dct) {
        setDescuentos(dct)
      } else {
        setDescuentos([])
      }
    } catch (error) {
      toast.error("Error al cargar liquidación")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [semana, anio])

  // Agrupar designaciones por Arbitro
  const arbitrosIds = Array.from(new Set([
    ...designaciones.map(d => d.arbitro_id),
    ...descuentos.map(d => d.arbitro_id)
  ]))

  const handleAddDescuento = async (concepto: string, monto: number) => {
    if (!selectedArbitro) return
    
    try {
      const { data, error } = await supabase.from('descuentos').insert({
        arbitro_id: selectedArbitro.id,
        semana,
        anio,
        concepto,
        monto,
        estado: 'pendiente'
      }).select().single()

      if (error) throw error
      
      setDescuentos(prev => [...prev, data])
      toast.success(`Descuento agregado a ${selectedArbitro.nombre}`)
      setSelectedArbitro(null)
    } catch (error) {
      toast.error("error al guardar descuento")
    }
  }

  const handleRemoveDescuento = async (id: string) => {
    const { error } = await supabase.from('descuentos').delete().eq('id', id)
    if (error) {
      toast.error("No se pudo eliminar el descuento")
    } else {
      setDescuentos(prev => prev.filter(d => d.id !== id))
      toast.info("Descuento eliminado")
    }
  }
  
  const handleRemoveDesignacion = async (id: string) => {
    const { error } = await supabase.from('designaciones').delete().eq('id', id)
    if (error) {
      toast.error("No se pudo eliminar la designación")
    } else {
      setDesignaciones(prev => prev.filter(d => d.id !== id))
      toast.info("Designación eliminada")
    }
  }

  const handleCerrarSemana = async () => {
    if (!confirm("¿Estás seguro de cerrar la semana? Esto marcará todo como PAGADO y LIQUIDADO.")) return
    
    setClosing(true)
    try {
      const { error: err1 } = await supabase
        .from('designaciones')
        .update({ estado: 'pagado' })
        .eq('semana', semana)
        .eq('anio', anio)
        .eq('estado', 'pendiente')

      const { error: err2 } = await supabase
        .from('descuentos')
        .update({ estado: 'liquidado' })
        .eq('semana', semana)
        .eq('anio', anio)
        .eq('estado', 'pendiente')

      if (err1 || err2) throw new Error("Error al cerrar registros")

      toast.success("Semana cerrada satisfactoriamente")
      setDesignaciones([])
      setDescuentos([])
    } catch (error) {
      toast.error("Hubo un error al cerrar la semana")
    } finally {
      setClosing(false)
    }
  }

  const totalGeneral = designaciones.reduce((acc, d) => acc + d.total, 0) - descuentos.reduce((acc, d) => acc + d.monto, 0)

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="bg-[#003399] p-3 rounded-2xl shadow-xl shadow-blue-100 italic font-black text-white text-xl">
              UAR
           </div>
           <div>
            <h2 className="text-3xl font-black tracking-tight text-[#003399]"> Resumen de Pagos</h2>
            <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase text-xs mt-1">
              <Calendar className="h-3 w-3" />
              Liquidación Semana {semana} — {anio}
            </div>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSemana(s => s - 1)}>
                  <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 text-center min-w-[90px]">
                  <span className="text-[10px] font-black text-zinc-400 block leading-none">SEMANA</span>
                  <span className="text-xl font-black text-zinc-800">{semana}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSemana(s => s + 1)}>
                  <ChevronRight className="h-4 w-4" />
              </Button>
          </div>

          <div className="flex gap-2">
            <Button 
                variant="outline" 
                className="gap-2 font-bold h-11 px-6 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50" 
                onClick={() => {
                    const url = `${window.location.origin}/p/${btoa(`s${semana}-a${anio}`)}`
                    navigator.clipboard.writeText(url)
                    toast.success("Link público copiado al portapapeles")
                }}
            >
              <Share2 className="h-4 w-4" /> Compartir Link
            </Button>
            <Button 
              className="bg-[#003399] hover:bg-[#003399]/90 text-white gap-2 font-bold h-11 px-6 rounded-xl shadow-lg shadow-blue-200" 
              onClick={handleCerrarSemana}
              disabled={closing || arbitrosIds.length === 0}
            >
              <CheckCircle2 className="h-4 w-4" /> Cerrar y Liquidar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-[#003399] text-blue-50 p-6 rounded-2xl shadow-xl shadow-blue-900/20 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total General de la Semana</span>
          <span className="text-3xl font-black">{formatARS(totalGeneral)}</span>
        </div>
        <div className="bg-white border p-6 rounded-2xl shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Árbitros con Actividad</span>
          <span className="text-3xl font-black text-zinc-800">{arbitrosIds.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {arbitrosIds.length > 0 ? (
          arbitrosIds.map(arbitroId => {
            const arbitroDesignaciones = designaciones.filter(d => d.arbitro_id === arbitroId)
            const arbitroDescuentos = descuentos.filter(d => d.arbitro_id === arbitroId)
            const arbitroNombre = arbitroDesignaciones[0]?.arbitro_nombre || "Árbitro Desconocido"

            return (
              <FilaArbitro 
                key={arbitroId}
                arbitroId={arbitroId}
                arbitroNombre={arbitroNombre}
                designaciones={arbitroDesignaciones}
                descuentos={arbitroDescuentos}
                semana={semana}
                anio={anio}
                onAddDescuento={(id) => {
                  setSelectedArbitro({ id, nombre: arbitroNombre, activo: true })
                }}
                onRemoveDescuento={handleRemoveDescuento}
                onRemoveDesignacion={handleRemoveDesignacion}
              />
            )
          })
        ) : (
          <div className="bg-white border border-dashed rounded-3xl py-20 text-center space-y-4">
            <div className="bg-zinc-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <RefreshCcw className="h-8 w-8 text-zinc-300" />
            </div>
            <p className="text-zinc-500 font-medium">No hay designaciones pendientes de pago para esta semana</p>
            <Button variant="link" className="text-[#1B5E20]" onClick={fetchData}>Recargar datos</Button>
          </div>
        )}
      </div>

      <ModalDescuento 
        arbitro={selectedArbitro}
        isOpen={!!selectedArbitro}
        onClose={() => setSelectedArbitro(null)}
        onAdd={handleAddDescuento}
      />
    </div>
  )
}
