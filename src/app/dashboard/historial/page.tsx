"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { History, Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { getSemanaInfo, formatARS } from "@/lib/calculos"
import { FilaArbitro } from "@/components/resumen/FilaArbitro"

export default function HistorialPage() {
  const [loading, setLoading] = useState(false)
  const hoy = new Date()
  const { semana: semActual, anio: anioActual } = getSemanaInfo(hoy)
  
  const [semana, setSemana] = useState(semActual - 1)
  const [anio, setAnio] = useState(anioActual)
  const [data, setData] = useState<any[]>([])

  const supabase = createClient()

  const fetchHistorial = async () => {
    setLoading(true)
    try {
      const [
        { data: des, error: errDes },
        { data: dct, error: errDct }
      ] = await Promise.all([
        supabase
          .from('designaciones')
          .select('*, arbitros(nombre)')
          .eq('semana', semana)
          .eq('anio', anio)
          .eq('estado', 'pagado'),
        supabase
          .from('descuentos')
          .select('*, arbitros(nombre)')
          .eq('semana', semana)
          .eq('anio', anio)
          .eq('estado', 'liquidado')
      ])

      if (errDes || errDct) throw errDes || errDct

      // Agrupar por árbitro (similar a resumen)
      const agrupado: any = {}
      
      des?.forEach((d: any) => {
        const id = d.arbitro_id
        if (!agrupado[id]) {
          agrupado[id] = {
            id,
            nombre: d.arbitros?.nombre || "Desconocido",
            designaciones: [],
            descuentos: []
          }
        }
        agrupado[id].designaciones.push(d)
      })

      dct?.forEach((d: any) => {
        const id = d.arbitro_id
        if (!agrupado[id]) {
          agrupado[id] = {
            id,
            nombre: d.arbitros?.nombre || "Desconocido",
            designaciones: [],
            descuentos: []
          }
        }
        agrupado[id].descuentos.push(d)
      })

      setData(Object.values(agrupado))
      
      if (Object.keys(agrupado).length === 0) {
        toast.info("No se encontraron registros cerrados para esta semana")
      }
    } catch (error) {
      console.error("Error fetching historial:", error)
      toast.error("Error al cargar el historial")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistorial()
  }, [])

  const handleDeleteDesignacion = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas borrar esta designación?")) return

    const { error } = await supabase
      .from('designaciones')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Error al borrar designación")
    } else {
      toast.success("Designación eliminada")
      fetchHistorial() // Recargamos para actualizar subtotales
    }
  }

  const handleDeleteDescuento = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas borrar este descuento?")) return

    const { error } = await supabase
      .from('descuentos')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Error al borrar descuento")
    } else {
      toast.success("Descuento eliminado")
      fetchHistorial()
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1B5E20]">Historial</h2>
          <p className="text-muted-foreground">Consulta de pagos realizados en semanas anteriores.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">Semana</Label>
            <Input 
              type="number" 
              className="w-16 h-8" 
              value={semana} 
              onChange={(e) => setSemana(parseInt(e.target.value))} 
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">Año</Label>
            <Input 
              type="number" 
              className="w-24 h-8" 
              value={anio} 
              onChange={(e) => setAnio(parseInt(e.target.value))} 
            />
          </div>
          <Button size="sm" onClick={fetchHistorial} disabled={loading} className="bg-zinc-900 text-white">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <History className="h-12 w-12 animate-spin text-zinc-300" />
        </div>
      ) : data.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-zinc-700">Liquidación Sem. {semana} - {anio}</h3>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Exportar / Imprimir
            </Button>
          </div>
          
          <div className="grid gap-4">
            {data.map((arb: any) => (
              <FilaArbitro 
                key={arb.id}
                arbitroId={arb.id}
                arbitroNombre={arb.nombre}
                designaciones={arb.designaciones}
                descuentos={arb.descuentos}
                semana={semana}
                anio={anio}
                onRemoveDesignacion={handleDeleteDesignacion}
                onRemoveDescuento={handleDeleteDescuento}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="bg-zinc-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Sin resultados</p>
            <p className="text-sm">Prueba buscando una semana distinta o verifica que haya sido cerrada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
