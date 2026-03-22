"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DeudaPendiente, Arbitro } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trash2, Plus, Wallet, History, AlertCircle } from "lucide-react"
import { formatARS } from "@/lib/calculos"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

interface GestionDeudasProps {
  arbitros: Arbitro[]
}

export function GestionDeudas({ arbitros }: GestionDeudasProps) {
  const [deudas, setDeudas] = useState<DeudaPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  // Form state
  const [selectedArbitroId, setSelectedArbitroId] = useState("")
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")

  const supabase = createClient()

  async function fetchDeudas() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('deudas_pendientes')
        .select('*, arbitros(nombre)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeudas(data.map(d => ({
        ...d,
        arbitro_nombre: d.arbitros?.nombre
      })))
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
      const { error } = await supabase
        .from('deudas_pendientes')
        .insert({
          arbitro_id: selectedArbitroId,
          concepto,
          monto_inicial: montoNum,
          monto_actual: montoNum
        })

      if (error) throw error
      
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
    if (!confirm("¿Borrar esta deuda definitivamente?")) return

    try {
      const { error } = await supabase
        .from('deudas_pendientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDeudas(prev => prev.filter(d => d.id !== id))
      toast.success("Deuda eliminada")
    } catch (error) {
      toast.error("Error al eliminar")
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
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deudas.map((d) => (
                    <TableRow key={d.id} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="font-bold text-zinc-700">{d.arbitro_nombre}</TableCell>
                      <TableCell className="text-zinc-500 text-xs font-medium">{d.concepto}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-red-600 text-sm">{formatARS(d.monto_actual)}</span>
                          {d.monto_actual < d.monto_inicial && (
                            <span className="text-[8px] font-bold text-zinc-400 italic">De original: {formatARS(d.monto_inicial)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteDeuda(d.id)}
                          className="h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
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
            <div className="py-20 flex flex-col items-center justify-center text-zinc-300 space-y-4">
               <Wallet className="h-12 w-12 opacity-20" />
               <p className="font-bold uppercase tracking-widest text-sm">No hay deudas pendientes</p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4 items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed font-medium">
              <p className="font-bold mb-1 uppercase tracking-wider text-[9px]">¿Cómo funciona el cobro automático?</p>
              Al cerrar la semana, el sistema buscará el neto a pagar. Si el árbitro tiene deuda, se le descontará automáticamente (creando un ítem de descuento en esa liquidación) y se reducirá su saldo deudor hasta que llegue a $0.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
