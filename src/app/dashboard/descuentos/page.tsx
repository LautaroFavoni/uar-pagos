"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { toast } from "sonner"
import { 
  Trash2, 
  Calendar as CalendarIcon, 
  Scissors,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getSemanaInfo, formatARS } from "@/lib/calculos"

export default function DescuentosPage() {
  const [loading, setLoading] = useState(true)
  const [descuentos, setDescuentos] = useState<any[]>([])
  const [semana, setSemana] = useState(getSemanaInfo(new Date()).semana)
  const [anio, setAnio] = useState(getSemanaInfo(new Date()).anio)
  
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('descuentos')
        .select(`
          *,
          arbitros(nombre)
        `)
        .eq('semana', semana)
        .eq('anio', anio)
        .order('fecha', { ascending: false })

      if (error) throw error
      setDescuentos(data || [])
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar descuentos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [semana, anio])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este descuento?")) return

    const { error } = await supabase
      .from('descuentos')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("No se pudo eliminar el descuento")
    } else {
      toast.success("Descuento eliminado correctamente")
      setDescuentos(prev => prev.filter(d => d.id !== id))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-brand flex items-center gap-3">
             <Scissors className="h-8 w-8" />
             Gestión de Descuentos
          </h2>
          <p className="text-muted-foreground font-medium">Visualiza y administra todos los descuentos aplicados.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSemana(s => s - 1)}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 text-center min-w-[100px]">
                <span className="text-[10px] font-black text-zinc-400 block leading-none">SEMANA</span>
                <span className="text-lg font-black text-zinc-800">{semana}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSemana(s => s + 1)}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md">
        <CardHeader className="bg-zinc-50/50 border-b p-6">
          <CardTitle className="text-xl font-black text-zinc-800 flex items-center gap-2">
            <Filter className="h-5 w-5 text-brand" />
            Listado de Descuentos - Semana {semana}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando datos...</p>
            </div>
          ) : descuentos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/30 hover:bg-zinc-50/30">
                    <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-wider px-6 py-4">Fecha</TableHead>
                    <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-wider px-6 py-4">Árbitro</TableHead>
                    <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-wider px-6 py-4">Concepto / Motivo</TableHead>
                    <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-wider px-6 py-4">Monto</TableHead>
                    <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-wider px-6 py-4">Estado</TableHead>
                    <TableHead className="w-[80px] px-6 py-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {descuentos.map((d) => (
                    <TableRow key={d.id} className="hover:bg-zinc-50/50 transition-colors border-b border-zinc-100/50">
                      <TableCell className="px-6 py-4 font-bold text-zinc-600">
                        {d.fecha ? format(new Date(d.fecha + "T12:00:00"), "dd/MM/yyyy") : format(new Date(d.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-black text-zinc-900">{d.arbitros?.nombre}</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-zinc-600 italic">"{d.concepto}"</TableCell>
                      <TableCell className="px-6 py-4 text-red-600 font-black">-{formatARS(d.monto)}</TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          d.estado === 'liquidado' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {d.estado}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                          onClick={() => handleDelete(d.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="bg-zinc-50 p-6 rounded-full">
                 <Scissors className="h-10 w-10 text-zinc-200" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-zinc-400 italic">SIN DESCUENTOS</h3>
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    No hay descuentos cargados para esta semana o todos fueron eliminados.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
         <div className="bg-amber-500 text-white p-1 rounded-lg">
            <CalendarIcon className="h-4 w-4" />
         </div>
         <div>
            <p className="text-amber-800 text-xs font-bold leading-relaxed">
               <span className="font-black uppercase tracking-tighter mr-1">Nota:</span> 
               Los descuentos se agrupan por la semana en la que fueron cargados para coincidir con el ciclo de liquidación. Podes navegar entre semanas para encontrar descuentos antiguos.
            </p>
         </div>
      </div>
    </div>
  )
}
