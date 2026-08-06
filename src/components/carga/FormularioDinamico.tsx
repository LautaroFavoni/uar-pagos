"use client"

import { useState } from "react"
import { Arbitro, Liga, Precio, Viatico, Designacion } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArbitroSelector } from "@/components/shared/ArbitroSelector"
import { ViaticoPicker } from "@/components/shared/ViaticoPicker"
import { Calendar } from "lucide-react"
import { format } from "date-fns"

interface FormularioDinamicoProps {
  liga: Liga
  arbitros: Arbitro[]
  precios: Precio[]
  viaticos: Viatico[]
  onAdd: (designaciones: Designacion[]) => void
}

import { getSemanaInfo } from "@/lib/calculos"

export function FormularioDinamico({ liga, arbitros, precios, viaticos, onAdd }: FormularioDinamicoProps) {
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"))
  // Usamos una variable local para evitar usar el estado antes del primer render en getSemanaInfo si fuera necesario, 
  // pero aquí getSemanaInfo se llama en el cuerpo del componente.
  const infoInicial = getSemanaInfo(new Date(fecha + "T12:00:00"))
  
  const [semana, setSemana] = useState(infoInicial.semana)
  const [anio, setAnio] = useState(infoInicial.anio)
  const [equipoLocal, setEquipoLocal] = useState("")
  const [equipoVisitante, setEquipoVisitante] = useState("")
  const [hora, setHora] = useState("15:30")
  const [observacionesGeneral, setObservacionesGeneral] = useState("")
  const [selectedArbitros, setSelectedArbitros] = useState<Record<string, string>>({})
  const [viaticoLocalidad, setViaticoLocalidad] = useState("Sin viatico")
  const [viaticoArbitroId, setViaticoArbitroId] = useState("")

  // Actualizar semana si cambia la fecha manualmente
  const handleFechaChange = (nuevaFecha: string) => {
    setFecha(nuevaFecha)
    const info = getSemanaInfo(new Date(nuevaFecha + "T12:00:00"))
    setSemana(info.semana)
    setAnio(info.anio)
  }

  const rolesDeLiga = precios.filter(p => p.liga_id === liga.id)

  const handleAdd = () => {
    const designaciones: Designacion[] = []
    
    // Obtener el monto del viático seleccionado
    const vMonto = viaticos.find(v => v.localidad === viaticoLocalidad)?.monto || 0

    rolesDeLiga.forEach(p => {
      const arbId = selectedArbitros[p.rol]
      const arb = arbitros.find(a => a.id === arbId)
      if (arbId && arb) {
        designaciones.push({
          fecha,
          semana: Number(semana),
          anio: Number(anio),
          arbitro_id: arbId,
          liga_id: liga.id,
          rol: p.rol,
          cantidad_partidos: 1,
          viatico_localidad: arbId === viaticoArbitroId ? viaticoLocalidad : null,
          monto_honorarios: p.monto,
          monto_viatico: arbId === viaticoArbitroId ? vMonto : 0,
          total: p.monto + (arbId === viaticoArbitroId ? vMonto : 0),
          estado: 'pendiente',
          equipo_local: equipoLocal,
          equipo_visitante: equipoVisitante,
          hora: hora,
          observaciones: observacionesGeneral,
          // Campos virtuales para la UI
          arbitro_nombre: arb.nombre,
          liga_nombre: liga.nombre
        })
      }
    })

    if (designaciones.length > 0) {
      onAdd(designaciones)
      // Reset pero mantenemos fecha/semana/equipos/hora para facilitar carga rápida de otro partido si fuera necesario, 
      // o limpiamos equipos si es lo esperado. El usuario pidió equipos y horarios. 
      // Si carga el mismo partido para otra liga (ej: Intermedia), le sirve que se mantengan.
      setSelectedArbitros({})
      setViaticoLocalidad("Sin viatico")
      setViaticoArbitroId("")
      setObservacionesGeneral("")
    }
  }

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-zinc-500 font-bold ml-1">Fecha del Partido</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-blue-500 z-10" />
              <Input 
                type="date" 
                value={fecha} 
                onChange={(e) => handleFechaChange(e.target.value)}
                className="pl-10 h-12 rounded-2xl border-zinc-200 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-500 font-bold ml-1">Local</Label>
            <Input 
              value={equipoLocal} 
              onChange={(e) => setEquipoLocal(e.target.value)}
              placeholder="Ej: Rivadavia"
              className="h-12 rounded-2xl border-zinc-200 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-500 font-bold ml-1">Visitante</Label>
            <Input 
              value={equipoVisitante} 
              onChange={(e) => setEquipoVisitante(e.target.value)}
              placeholder="Ej: Jockey"
              className="h-12 rounded-2xl border-zinc-200 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-500 font-bold ml-1">Hora</Label>
            <Input 
              value={hora} 
              onChange={(e) => setHora(e.target.value)}
              placeholder="15:30"
              className="h-12 rounded-2xl border-zinc-200 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-500 font-bold ml-1">Observaciones</Label>
            <Input 
              value={observacionesGeneral} 
              onChange={(e) => setObservacionesGeneral(e.target.value)}
              placeholder="Ej: Final de torneo"
              className="h-12 rounded-2xl border-zinc-200 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="font-extrabold text-brand flex items-center gap-2 text-lg italic">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Designación de Roles
            </h3>
            <div className="grid gap-4">
              {rolesDeLiga.map((p) => (
                <div key={p.id} className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Label className="text-zinc-600 font-bold ml-1 capitalize">{p.rol}</Label>
                  <ArbitroSelector 
                    arbitros={arbitros} 
                    value={selectedArbitros[p.rol] || ""} 
                    onChange={(val) => setSelectedArbitros(prev => ({ ...prev, [p.rol]: val }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-extrabold text-brand flex items-center gap-2 text-lg italic">
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
              Viáticos (Maneja?)
            </h3>
            <div className="space-y-4 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
              <div className="space-y-2">
                <Label className="text-zinc-600 font-bold ml-1">Localidad</Label>
                <ViaticoPicker 
                  viaticos={viaticos} 
                  value={viaticoLocalidad} 
                  onChange={setViaticoLocalidad} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-600 font-bold ml-1">¿Quién maneja?</Label>
                <div className="grid gap-2">
                  {rolesDeLiga.map((p) => (
                    <Button
                      key={p.id}
                      variant={viaticoArbitroId === selectedArbitros[p.rol] ? "default" : "outline"}
                      className={viaticoArbitroId === selectedArbitros[p.rol] ? "bg-brand text-white rounded-xl h-10 shadow-lg shadow-blue-100" : "rounded-xl h-10 border-zinc-100"}
                      disabled={!selectedArbitros[p.rol]}
                      onClick={() => setViaticoArbitroId(selectedArbitros[p.rol])}
                    >
                      {p.rol}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button 
          className="w-full bg-brand hover:bg-brand-hover text-white h-16 rounded-[2rem] font-black text-xl italic shadow-2xl shadow-blue-200 transition-all active:scale-95"
          onClick={handleAdd}
        >
          {liga.nombre.toLowerCase().includes('partido') ? 'AGREGAR PARTIDO A LA LISTA' : 'GUARDAR DESIGNACIÓN'}
        </Button>
      </CardContent>
    </Card>
  )
}
