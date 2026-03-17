"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Designacion, Arbitro, Liga } from "@/lib/types"
import { getSemanaInfo } from "@/lib/calculos"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Save, Trash2, Plus } from "lucide-react"

interface Props {
  match: any | null // El objeto match con { ternas: Designacion[], ... }
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function ModalEditDesignacion({ match, isOpen, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false)
  const [arbitros, setArbitros] = useState<Arbitro[]>([])
  const [precios, setPrecios] = useState<any[]>([])
  
  // Datos del partido
  const [equipoLocal, setEquipoLocal] = useState("")
  const [equipoVisitante, setEquipoVisitante] = useState("")
  const [hora, setHora] = useState("")
  const [fecha, setFecha] = useState("")
  const [observaciones, setObservaciones] = useState("")
  
  // Lista de ternas (árbitros asignados)
  const [ternasLocales, setTernasLocales] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (isOpen && match) {
      fetchData()
      setEquipoLocal(match.equipo_local !== "S/D" ? match.equipo_local : "")
      setEquipoVisitante(match.equipo_visitante !== "S/D" ? match.equipo_visitante : "")
      setHora(match.hora !== "--:--" ? match.hora : "")
      setFecha(match.fecha || "")
      setObservaciones(match.ternas[0]?.observaciones || "")
      setTernasLocales(match.ternas.map((t: any) => ({ ...t })))
    }
  }, [isOpen, match])

  async function fetchData() {
    if (!match?.ternas?.[0]) return
    // Cargamos TODOS los árbitros para que si uno está inactivo pero asignado, se vea el nombre y no el ID
    const [{ data: arb }, { data: prc }] = await Promise.all([
      supabase.from('arbitros').select('*').order('nombre'),
      supabase.from('precios').select('*').eq('liga_id', match.ternas[0].liga_id)
    ])
    if (arb) setArbitros(arb)
    if (prc) setPrecios(prc)
  }

  const handleUpdateTerna = (index: number, updates: any) => {
    const newTernas = [...ternasLocales]
    newTernas[index] = { ...newTernas[index], ...updates }
    
    // Si cambia el rol, actualizar honorarios
    if (updates.rol) {
      const precio = precios.find(p => p.rol === updates.rol)
      if (precio) {
        newTernas[index].monto_honorarios = precio.monto
      }
    }
    
    setTernasLocales(newTernas)
  }

  const handleAddArbitro = () => {
    if (!match?.ternas?.[0]) return
    const first = match.ternas[0]
    setTernasLocales([...ternasLocales, {
      id: `new-${Date.now()}`,
      arbitro_id: "",
      rol: "asistente_1",
      monto_honorarios: 0,
      monto_viatico: 0,
      cantidad_partidos: 1,
      fecha: first.fecha,
      semana: first.semana,
      anio: first.anio,
      liga_id: first.liga_id,
      equipo_local: equipoLocal,
      equipo_visitante: equipoVisitante,
      hora: hora,
      estado: 'pendiente'
    }])
  }

  const handleRemoveArbitro = (index: number) => {
    setTernasLocales(ternasLocales.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!match) return
    setLoading(true)
    try {
      const { semana: nSemana, anio: nAnio } = getSemanaInfo(new Date(fecha + "T12:00:00"))
      
      // 1. Identificar IDs a borrar (los que estaban originalmente pero ya no están)
      const originalIds = match.ternas.map((t: any) => t.id)
      const currentIds = ternasLocales.filter(t => !t.id.startsWith('new-')).map(t => t.id)
      const toDelete = originalIds.filter((id: string) => !currentIds.includes(id))

      if (toDelete.length > 0) {
        await supabase.from('designaciones').delete().in('id', toDelete)
      }

      // 2. Upsert de los actuales
      const updates = ternasLocales.map(t => {
        const { id, arbitros, ligas, arbitro_nombre, liga_nombre, ...data } = t
        return {
          ...(id.startsWith('new-') ? {} : { id }),
          ...data,
          equipo_local: equipoLocal,
          equipo_visitante: equipoVisitante,
          hora,
          fecha,
          semana: nSemana,
          anio: nAnio,
          total: (data.monto_honorarios * data.cantidad_partidos) + data.monto_viatico,
          observaciones: observaciones
        }
      })

      const { error } = await supabase.from('designaciones').upsert(updates)
      if (error) throw error
      
      toast.success("Designación del partido actualizada")
      onSave()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Error al guardar cambios")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMatch = async () => {
    if (!confirm("¿Borrar TODO el partido y sus designaciones?")) return
    setLoading(true)
    try {
        const ids = match.ternas.map((t: any) => t.id)
        await supabase.from('designaciones').delete().in('id', ids)
        toast.success("Partido eliminado")
        onSave()
        onClose()
    } catch (error) {
        toast.error("Error al borrar partido")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] border-none shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 bg-zinc-50 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-black italic text-[#1B5E20]">Gestionar Partido</DialogTitle>
            <Button variant="ghost" className="text-red-500 font-bold hover:bg-red-50" onClick={handleDeleteMatch} disabled={loading}>
              Borrar Partido
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Datos del partido */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-emerald-700">Fecha</Label>
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-10 rounded-xl" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-emerald-700">Hora</Label>
                <Input value={hora} onChange={(e) => setHora(e.target.value)} className="h-10 rounded-xl" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-emerald-700">Local</Label>
                <Input value={equipoLocal} onChange={(e) => setEquipoLocal(e.target.value)} className="h-10 rounded-xl" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-emerald-700">Visitante</Label>
                <Input value={equipoVisitante} onChange={(e) => setEquipoVisitante(e.target.value)} className="h-10 rounded-xl" />
             </div>
             <div className="col-span-2 md:col-span-4 space-y-1">
                <Label className="text-[10px] font-black uppercase text-emerald-700">Observaciones Generales</Label>
                <Input 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  placeholder="Comentarios del partido..." 
                  className="h-10 rounded-xl" 
                />
             </div>
          </div>

          {/* Lista de Árbitros */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Terna Designada</Label>
                <Button variant="outline" size="sm" className="rounded-full h-8 px-4 font-bold border-[#1B5E20] text-[#1B5E20]" onClick={handleAddArbitro}>
                    + Agregar Árbitro
                </Button>
            </div>

            <div className="space-y-3">
                {ternasLocales.map((t, idx) => (
                    <div key={t.id} className="flex flex-wrap sm:flex-nowrap items-end gap-3 p-4 bg-white border rounded-2xl shadow-sm relative group">
                        <div className="flex-1 min-w-[150px] space-y-1">
                            <Label className="text-[8px] font-black uppercase text-zinc-400">Árbitro</Label>
                            <Select value={t.arbitro_id} onValueChange={(val) => handleUpdateTerna(idx, { arbitro_id: val })}>
                                <SelectTrigger className="h-10 rounded-xl">
                                    <SelectValue>
                                        {arbitros.find(a => a.id === t.arbitro_id)?.nombre || "Seleccionar"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {arbitros.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[120px] space-y-1">
                            <Label className="text-[8px] font-black uppercase text-zinc-400">Rol</Label>
                            <Select value={t.rol} onValueChange={(val) => handleUpdateTerna(idx, { rol: val })}>
                                <SelectTrigger className="h-10 rounded-xl">
                                    <SelectValue placeholder="Rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {precios.map(p => <SelectItem key={p.id} value={p.rol}>{p.rol.replace('_', ' ').toUpperCase()}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[80px] space-y-1">
                            <Label className="text-[8px] font-black uppercase text-zinc-400">Partidos</Label>
                            <Input type="number" value={t.cantidad_partidos} onChange={(e) => handleUpdateTerna(idx, { cantidad_partidos: parseInt(e.target.value) })} className="h-10 rounded-xl" />
                        </div>
                        <button 
                            onClick={() => handleRemoveArbitro(idx)}
                            className="p-2 mb-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-zinc-50 border-t">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold">Cancelar</Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white gap-2 font-bold px-8 h-12 rounded-2xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Cambios del Partido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
