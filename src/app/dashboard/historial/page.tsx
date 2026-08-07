"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { History, Search, FileSpreadsheet, FileText, FileDown } from "lucide-react"
import { getSemanaInfo, METODO_PAGO_LABEL } from "@/lib/calculos"
import { FilaArbitro } from "@/components/resumen/FilaArbitro"
import { exportExcel, exportCSV, exportPDF, FilaReporte } from "@/lib/export"
import { Liquidacion } from "@/lib/types"

interface ArbitroAgrupado {
  id: string
  nombre: string
  designaciones: { monto_honorarios: number; monto_viatico: number }[]
  descuentos: { monto: number }[]
  liquidacion: Liquidacion | null
}

export default function HistorialPage() {
  const [loading, setLoading] = useState(false)
  const hoy = new Date()
  const { semana: semActual, anio: anioActual } = getSemanaInfo(hoy)
  
  const [semana, setSemana] = useState(semActual - 1)
  const [anio, setAnio] = useState(anioActual)
  const [data, setData] = useState<any[]>([])
  const [exporting, setExporting] = useState<string | null>(null)

  const supabase = createClient()

  const fetchHistorial = async () => {
    setLoading(true)
    try {
      const [
        { data: des, error: errDes },
        { data: dct, error: errDct },
        { data: liq, error: errLiq }
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
          .eq('estado', 'liquidado'),
        supabase
          .from('liquidaciones')
          .select('*')
          .eq('semana', semana)
          .eq('anio', anio)
      ])

      if (errDes || errDct || errLiq) throw errDes || errDct || errLiq

      // Agrupar por árbitro (similar a resumen)
      const agrupado: any = {}

      des?.forEach((d: any) => {
        const id = d.arbitro_id
        if (!agrupado[id]) {
          agrupado[id] = {
            id,
            nombre: d.arbitros?.nombre || "Desconocido",
            designaciones: [],
            descuentos: [],
            liquidacion: null
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
            descuentos: [],
            liquidacion: null
          }
        }
        agrupado[id].descuentos.push(d)
      })

      liq?.forEach((l: any) => {
        const id = l.arbitro_id
        if (agrupado[id]) {
          agrupado[id].liquidacion = l
        }
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

  const filasReporte: FilaReporte[] = (data as ArbitroAgrupado[]).map((arb) => {
    const honorarios = arb.designaciones.reduce((acc, d) => acc + d.monto_honorarios, 0)
    const viaticos = arb.designaciones.reduce((acc, d) => acc + d.monto_viatico, 0)
    const descuentos = arb.descuentos.reduce((acc, d) => acc + d.monto, 0)
    const deudaCobrada = arb.liquidacion?.total_deuda_cobrada ?? 0
    const neto = arb.liquidacion?.neto ?? (honorarios + viaticos - descuentos)
    const metodoPago = arb.liquidacion?.estado === 'pagado' && arb.liquidacion?.metodo_pago
      ? (METODO_PAGO_LABEL[arb.liquidacion.metodo_pago] || arb.liquidacion.metodo_pago)
      : "—"
    return { arbitro: arb.nombre, honorarios, viaticos, descuentos, deudaCobrada, neto, metodoPago }
  })

  const exportMeta = {
    titulo: "Liquidación Semanal",
    periodo: `Semana ${semana} · ${anio}`,
    filename: `liquidacion_sem${semana}_${anio}`,
  }

  const handleExport = async (tipo: 'excel' | 'csv' | 'pdf') => {
    if (filasReporte.length === 0) return
    setExporting(tipo)
    try {
      if (tipo === 'excel') await exportExcel(filasReporte, exportMeta)
      if (tipo === 'csv') await exportCSV(filasReporte, exportMeta)
      if (tipo === 'pdf') await exportPDF(filasReporte, exportMeta)
    } catch (error) {
      toast.error("Error al exportar")
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-brand">Historial</h2>
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
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h3 className="font-bold text-lg text-zinc-700">Liquidación Sem. {semana} - {anio}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('excel')} disabled={!!exporting}>
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('csv')} disabled={!!exporting}>
                <FileDown className="h-4 w-4 text-zinc-600" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('pdf')} disabled={!!exporting}>
                <FileText className="h-4 w-4 text-red-600" /> PDF
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {data.map((arb: any) => (
              <FilaArbitro 
                key={arb.id}
                arbitroId={arb.id}
                arbitroNombre={arb.nombre}
                designaciones={arb.designaciones}
                descuentos={arb.descuentos}
                liquidacion={arb.liquidacion}
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
