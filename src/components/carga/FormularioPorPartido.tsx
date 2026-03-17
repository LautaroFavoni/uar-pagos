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
  
  // Nuevo estado para carga individual multi-rol
  const [currentArbitroId, setCurrentArbitroId] = useState("")
  const [currentQuantities, setCurrentQuantities] = useState<Record<string, number>>({})
  const [equipoLocal, setEquipoLocal] = useState("")
  const [equipoVisitante, setEquipoVisitante] = useState("")
  const [hora, setHora] = useState("15:30")
  const [observacionesGeneral, setObservacionesGeneral] = useState("")
  const [listaLocal, setListaLocal] = useState<SeleccionadoLocal[]>([])

  const rolesDisponibles = precios.filter(p => p.liga_id === liga.id)
  
  const handleQuantityChange = (rol: string, val: number) => {
    setCurrentQuantities(prev => ({
      ...prev,
      [rol]: Math.max(0, val)
    }))
  }

  const handleAddToList = () => {
    if (!currentArbitroId) return
    
    const arb = arbitros.find(a => a.id === currentArbitroId)
    if (!arb) return

    const nuevasEntradas: SeleccionadoLocal[] = []
    
    Object.entries(currentQuantities).forEach(([rol, cant]) => {
      if (cant > 0) {
        // Evitar duplicados exactos (mismo arb + mismo rol)
        if (!listaLocal.some(sm => sm.arbitroId === currentArbitroId && sm.rol === rol)) {
          const precio = rolesDisponibles.find(p => p.rol === rol)
          if (precio) {
            nuevasEntradas.push({
              arbitroId: currentArbitroId,
              nombre: arb.nombre,
              rol,
              cantidad: cant,
              montoUnitario: precio.monto
            })
          }
        }
      }
    })

    if (nuevasEntradas.length > 0) {
      setListaLocal(prev => [...prev, ...nuevasEntradas])
      toast.success(`Agregadas ${nuevasEntradas.length} funciones para ${arb.nombre}`)
      // Resetear solo el arbitro y cantidades, mantener equipos/fecha
      setCurrentArbitroId("")
      setCurrentQuantities({})
    } else {
      toast.error("Ingresá al menos una cantidad mayor a 0")
    }
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
    <Card className="border-blue-200 shadow-lg bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-blue-50/50 border-b border-blue-100">
        <CardTitle className="text-[#003399] flex justify-between items-center text-2xl font-black italic">
          {liga.nombre.toUpperCase()}
          <span className="text-[10px] font-black bg-[#003399] px-3 py-1 rounded-full text-white tracking-widest">
            CARGA FLEXIBLE
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
        <div className="bg-blue-50/30 p-5 rounded-3xl border border-blue-100/50">
            <Label className="text-[10px] font-black uppercase text-blue-400 mb-3 block text-center tracking-[0.2em]">Sede / Localidad para Viático</Label>
            <ViaticoPicker 
              viaticos={viaticos} 
              value={viaticoLocalidad} 
              onChange={setViaticoLocalidad} 
            />
        </div>

        {/* Carga Individual */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-6 w-1.5 bg-[#003399] rounded-full shadow-[0_0_10px_rgba(0,51,153,0.3)]"></div>
            <h4 className="font-black italic text-zinc-800 tracking-tight">AGREGAR ACTIVIDAD</h4>
          </div>
          
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-blue-50 shadow-xl shadow-blue-100/20 transition-all focus-within:border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-5 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">1. SELECCIONAR ÁRBITRO</Label>
                    <ArbitroSelector 
                        arbitros={arbitros} 
                        value={currentArbitroId} 
                        onChange={setCurrentArbitroId}
                    />
                </div>

                <div className="md:col-span-7 space-y-4">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">2. INGRESAR CANTIDADES POR FUNCIÓN</Label>
                    <div className={cn(
                        "grid gap-3 transition-all",
                        !currentArbitroId && "opacity-30 pointer-events-none grayscale"
                    )}>
                        {rolesDisponibles.map(r => (
                            <div key={r.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl border bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                                <div className="flex-1">
                                    <span className="text-xs font-black text-zinc-700 uppercase">{r.rol}</span>
                                    <span className="block text-[10px] font-bold text-zinc-400">{formatARS(r.monto)} c/u</span>
                                </div>
                                <div className="w-24">
                                    <Input 
                                        type="number" 
                                        min={0}
                                        placeholder="0"
                                        value={currentQuantities[r.rol] || ""} 
                                        onChange={(e) => handleQuantityChange(r.rol, parseInt(e.target.value) || 0)}
                                        className="h-10 rounded-xl border-zinc-200 focus:ring-[#003399] focus:border-[#003399] font-black text-center text-blue-600"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <Button 
                        onClick={handleAddToList}
                        disabled={!currentArbitroId}
                        className="w-full h-14 rounded-2xl bg-[#003399] hover:bg-[#002266] text-white gap-3 font-black shadow-xl shadow-blue-200 transition-all active:scale-95 text-lg italic"
                    >
                        <Plus className="h-5 w-5" /> SUMAR ACTIVIDAD AL PARTIDO
                    </Button>
                </div>
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
                        "flex items-center justify-between p-5 rounded-[2rem] border transition-all animate-in slide-in-from-right-4 duration-300",
                        manejaId === item.arbitroId ? "bg-blue-50/50 border-blue-200" : "bg-white border-zinc-100 shadow-sm"
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
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest",
                            manejaId === item.arbitroId 
                                ? "bg-[#003399] text-white shadow-lg shadow-blue-200" 
                                : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                        )}
                    >
                        {manejaId === item.arbitroId ? "Maneja ✓" : "¿Maneja?"}
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
                    className="w-full bg-[#003399] hover:bg-[#002266] text-white gap-3 h-16 rounded-[2rem] font-black italic shadow-2xl shadow-blue-200 text-xl transition-all active:scale-95"
                >
                    <Save className="h-6 w-6" />
                    CARGAR {listaLocal.length} ACTIVIDADES
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
