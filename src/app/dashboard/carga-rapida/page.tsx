"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Arbitro, Liga, Precio, Viatico, Designacion } from "@/lib/types"
import { LigaSelector } from "@/components/carga/LigaSelector"
import { FormularioDinamico } from "@/components/carga/FormularioDinamico"
import { FormularioPorPartido } from "@/components/carga/FormularioPorPartido"
import { ListaDesignacionesPendientes } from "@/components/carga/ListaDesignacionesPendientes"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function CargaRapidaPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [arbitros, setArbitros] = useState<Arbitro[]>([])
  const [ligas, setLigas] = useState<Liga[]>([])
  const [precios, setPrecios] = useState<Precio[]>([])
  const [viaticos, setViaticos] = useState<Viatico[]>([])
  
  const [selectedLiga, setSelectedLiga] = useState<Liga | null>(null)
  const [pendientes, setPendientes] = useState<Designacion[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: arb }, 
          { data: lig }, 
          { data: pre }, 
          { data: via }
        ] = await Promise.all([
          supabase.from('arbitros').select('*').eq('activo', true).order('nombre'),
          supabase.from('ligas').select('*').eq('activo', true).order('nombre'),
          supabase.from('precios').select('*'),
          supabase.from('viaticos').select('*').order('localidad')
        ])

        if (arb) setArbitros(arb)
        if (lig) setLigas(lig)
        if (pre) setPrecios(pre)
        if (via) setViaticos(via)
      } catch (error) {
        toast.error("Error al cargar datos maestros")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAddDesignaciones = (newDesignaciones: Designacion[]) => {
    setPendientes(prev => [...prev, ...newDesignaciones])
    setSelectedLiga(null)
    toast.success(`Agregadas ${newDesignaciones.length} designaciones a la lista`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRemovePendiente = (index: number) => {
    setPendientes(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirmAll = async () => {
    if (pendientes.length === 0) return
    setSubmitting(true)

    try {
      // Limpiamos los campos virtuales y aseguramos tipos correctos antes de guardar
      const toSave = pendientes.map((p) => {
        const { id, arbitro_nombre, liga_nombre, ...data } = p
        return {
          ...data,
          fecha: data.fecha,
          semana: Number(data.semana),
          anio: Number(data.anio),
          cantidad_partidos: Number(data.cantidad_partidos),
          monto_honorarios: Math.round(data.monto_honorarios),
          monto_viatico: Math.round(data.monto_viatico),
          total: Math.round(data.total)
        }
      })
      
      console.log("Intentando guardar:", toSave)
      const { error } = await supabase.from('designaciones').insert(toSave)

      if (error) {
        console.error("Error de Supabase:", error)
        throw error
      }

      toast.success("Designaciones guardadas correctamente", {
        description: `Se han cargado ${pendientes.length} registros.`
      })
      setPendientes([])
    } catch (error: any) {
      toast.error("Error al guardar designaciones", {
        description: error.message
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-[2rem] border shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#003399] italic">CARGA UAR</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Dashboard de Designaciones</p>
        </div>
        
        <div className="min-w-[300px]">
          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">LIGA / TORNEO SELECCIONADO</Label>
          <LigaSelector 
            ligas={ligas} 
            onSelect={setSelectedLiga} 
            selectedId={selectedLiga?.id}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {selectedLiga && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            {selectedLiga.tipo === 'principal' ? (
              <FormularioDinamico 
                liga={selectedLiga} 
                arbitros={arbitros} 
                precios={precios} 
                viaticos={viaticos}
                onAdd={handleAddDesignaciones}
              />
            ) : (
              <FormularioPorPartido 
                liga={selectedLiga} 
                arbitros={arbitros} 
                precios={precios} 
                viaticos={viaticos}
                onAdd={handleAddDesignaciones}
              />
            )}
          </div>
        )}

        <div className={cn("transition-all duration-500", !selectedLiga && "opacity-50 grayscale")}>
          <ListaDesignacionesPendientes 
            designaciones={pendientes}
            onRemove={handleRemovePendiente}
            onConfirm={handleConfirmAll}
            isSubmitting={submitting}
          />
        </div>
      </div>
    </div>
  )
}
