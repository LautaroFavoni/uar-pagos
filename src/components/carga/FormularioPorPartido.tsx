"use client"

import { useState } from "react"
import { Arbitro, Liga, Precio, Viatico, Designacion } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ViaticoPicker } from "../shared/ViaticoPicker"
import { ArbitroSelector } from "../shared/ArbitroSelector"
import { formatARS, getSemanaInfo } from "@/lib/calculos"
import { Plus, Trash2, Users, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FormularioPorPartidoProps {
  liga: Liga
  arbitros: Arbitro[]
  precios: Precio[]
  viaticos: Viatico[]
  onAdd: (designaciones: Designacion[]) => void
}

interface SeleccionadoLocal {
  arbitroId: string
  nombre: string
  rol: string
  cantidad: number
  montoUnitario: number
}

export function FormularioPorPartido({ liga, arbitros, precios, viaticos, onAdd }: FormularioPorPartidoProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [viaticoLocalidad, setViaticoLocalidad] = useState("Sin viatico")
  const [manejaId, setManejaId] = useState<string>("")
  
  // Nuevo estado para carga individual
  const [currentArbitroId, setCurrentArbitroId] = useState("")
  const [currentRol, setCurrentRol] = useState("")
  const [currentCantidad, setCurrentCantidad] = useState(1)
  const [equipoLocal, setEquipoLocal] = useState("")
  const [equipoVisitante, setEquipoVisitante] = useState("")
  const [hora, setHora] = useState("15:30")
  const [observacionesGeneral, setObservacionesGeneral] = useState("")
  const [listaLocal, setListaLocal] = useState<SeleccionadoLocal[]>([])

  const rolesDisponibles = precios.filter(p => p.liga_id === liga.id)
  
  // Efecto para poner el primer rol por defecto
  if (!currentRol && rolesDisponibles.length > 0) {
    setCurrentRol(rolesDisponibles[0].rol)
  }

  const handleAddToList = () => {
    if (!currentArbitroId || !currentRol) return
    
    // Permitimos múltiples entradas del mismo árbitro si son roles distintos
    if (listaLocal.some(sm => sm.arbitroId === currentArbitroId && sm.rol === currentRol)) {
      toast.error("Este árbitro ya está cargado con ese rol")
      return
    }

    const arb = arbitros.find(a => a.id === currentArbitroId)
    const precio = rolesDisponibles.find(p => p.rol === currentRol)
    if (!arb || !precio) return

    setListaLocal(prev => [...prev, {
      arbitroId: currentArbitroId,
      nombre: arb.nombre,
      rol: currentRol,
      cantidad: currentCantidad,
      montoUnitario: precio.monto
    }])

    setCurrentArbitroId("")
    setCurrentCantidad(1)
  }

  const handleRemoveFromList = (id: string, rol: string) => {
    setListaLocal(prev => {
      // Si el último que manejaba se borra...
      if (manejaId === id && !prev.some(item => item.arbitroId === id && item.rol !== rol)) {
        setManejaId("")
      }
      return prev.filter(item => !(item.arbitroId === id && item.rol === rol))
    })
  }

  const handleConfirmTotal = () => {
    if (listaLocal.length === 0) return

    const { semana, anio } = getSemanaInfo(fecha)
    const montoViat = viaticos.find(v => v.localidad === viaticoLocalidad)?.monto || 0

    const designaciones: Designacion[] = listaLocal.map(item => {
      const isManejador = item.arbitroId === manejaId
      const finalViatico = isManejador ? montoViat : 0
      const honorarios = item.montoUnitario * item.cantidad

      return {
        fecha,
        semana,
        anio,
        arbitro_id: item.arbitroId,
        liga_id: liga.id,
        rol: item.rol,
        cantidad_partidos: item.cantidad,
        viatico_localidad: isManejador ? viaticoLocalidad : null,
        monto_honorarios: honorarios,
        monto_viatico: finalViatico,
        total: honorarios + finalViatico,
        estado: 'pendiente',
        equipo_local: equipoLocal,
        equipo_visitante: equipoVisitante,
        hora: hora,
        observaciones: observacionesGeneral,
        arbitro_nombre: item.nombre,
        liga_nombre: liga.nombre
      }
    })

    onAdd(designaciones)
    setListaLocal([])
    setManejaId("")
    setObservacionesGeneral("")
  }

  return (
    <Card className="border-emerald-200 shadow-lg">
      <CardHeader className="bg-emerald-50/50">
        <CardTitle className="text-emerald-900 flex justify-between items-center text-2xl font-black">
          {liga.nombre.toUpperCase()}
          <span className="text-xs font-bold bg-white px-3 py-1 rounded-full text-emerald-600 border border-emerald-100">
            POR PARTIDO
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {/* Configuración General */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-zinc-400">Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-zinc-400">Local</Label>
            <Input value={equipoLocal} onChange={(e) => setEquipoLocal(e.target.value)} placeholder="Local" className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-zinc-400">Visitante</Label>
            <Input value={equipoVisitante} onChange={(e) => setEquipoVisitante(e.target.value)} placeholder="Visitante" className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-zinc-400">Hora</Label>
            <Input value={hora} onChange={(e) => setHora(e.target.value)} placeholder="15:30" className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-zinc-400">Observaciones</Label>
            <Input value={observacionesGeneral} onChange={(e) => setObservacionesGeneral(e.target.value)} placeholder="Ej: Final" className="h-10 rounded-xl" />
          </div>
        </div>
        <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50">
            <Label className="text-[10px] font-black uppercase text-zinc-400 mb-2 block text-center">Sede / Localidad para Viático</Label>
            <ViaticoPicker 
              viaticos={viaticos} 
              value={viaticoLocalidad} 
              onChange={setViaticoLocalidad} 
            />
        </div>

        {/* Carga Individual */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
            <h4 className="font-black italic text-zinc-800">CARGAR ÁRBITRO</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-2xl border shadow-sm">
            <div className="md:col-span-4 space-y-2">
              <Label className="text-xs font-bold text-zinc-500">Árbitro</Label>
              <ArbitroSelector 
                arbitros={arbitros} 
                value={currentArbitroId} 
                onChange={setCurrentArbitroId}
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label className="text-xs font-bold text-zinc-500">Rol / Categoría</Label>
              <ViaticoPicker 
                // Reutilizamos el picker pero con roles si no queremos crear otro componente ahora
                // O mejor usamos un select simple para no complicar
                viaticos={rolesDisponibles.map(r => ({ id: r.id, localidad: r.rol, monto: r.monto }))}
                value={currentRol}
                onChange={setCurrentRol}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold text-zinc-500">Cantidad</Label>
              <Input 
                type="number" 
                min={1} 
                value={currentCantidad} 
                onChange={(e) => setCurrentCantidad(parseInt(e.target.value) || 1)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="md:col-span-3">
              <Button 
                onClick={handleAddToList}
                disabled={!currentArbitroId || !currentRol}
                className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-black text-white gap-2 font-bold"
              >
                <Plus className="h-4 w-4" /> AGREGAR
              </Button>
            </div>
          </div>
        </div>
        {/* Lista Temporal */}
        {listaLocal.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Personal Designado ({listaLocal.length})
                </Label>
            </div>
            
            <div className="grid gap-2">
              {listaLocal.map((item) => (
                <div 
                    key={`${item.arbitroId}-${item.rol}`} 
                    className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all",
                        manejaId === item.arbitroId ? "bg-emerald-50 border-emerald-200" : "bg-white border-zinc-100"
                    )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-black text-zinc-400 text-xs text-center leading-tight">
                        {item.rol.substring(0, 3)}
                    </div>
                    <div>
                        <div className="font-black text-zinc-900">{item.nombre}</div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {item.rol} • {item.cantidad} {item.cantidad === 1 ? 'Part.' : 'Parts.'} • Total {formatARS(item.montoUnitario * item.cantidad)}
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                        onClick={() => setManejaId(manejaId === item.arbitroId ? "" : item.arbitroId)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                            manejaId === item.arbitroId 
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                                : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                        )}
                    >
                        {manejaId === item.arbitroId ? "Maneja ✓" : "Maneja?"}
                    </button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        onClick={() => handleRemoveFromList(item.arbitroId, item.rol)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
                <Button 
                    onClick={handleConfirmTotal}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-3 h-14 rounded-2xl font-black italic shadow-xl shadow-emerald-200 text-lg"
                >
                    <Save className="h-5 w-5" />
                    CONFIRMAR CARGA DE {listaLocal.length} ÍTEMS
                </Button>
            </div>
          </div>
        )}

        {listaLocal.length === 0 && (
          <div className="py-12 border-2 border-dashed border-zinc-100 rounded-[2rem] text-center">
            <p className="text-zinc-400 font-bold">Inicia la carga seleccionando un árbitro arriba.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
