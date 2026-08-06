"use client"

import { useState, useEffect } from "react"
import { Arbitro, Liga, Precio, Viatico, Designacion } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArbitroSelector } from "../shared/ArbitroSelector"
import { ViaticoPicker } from "../shared/ViaticoPicker"
import { formatARS, getSemanaInfo } from "@/lib/calculos"
import { Plus } from "lucide-react"

interface FormularioPrincipalProps {
  liga: Liga
  arbitros: Arbitro[]
  precios: Precio[]
  viaticos: Viatico[]
  onAdd: (designaciones: Designacion[]) => void
}

export function FormularioPrincipal({ liga, arbitros, precios, viaticos, onAdd }: FormularioPrincipalProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [viaticoLocalidad, setViaticoLocalidad] = useState("Sin viatico")
  const [manejaId, setManejaId] = useState<string>("")
  const [seleccion, setSeleccion] = useState<Record<string, string>>({}) // rol -> arbitro_id
  const [errores, setErrores] = useState<Record<string, boolean>>({})

  // Filtrar precios para esta liga
  const preciosLiga = precios.filter(p => p.liga_id === liga.id)
  
  // Villa no tiene el 4to rol usualmente, pero lo sacamos de la tabla precios
  const roles = preciosLiga.map(p => p.rol)

  const handleAdd = () => {
    const newErrores: Record<string, boolean> = {}
    let hasError = false

    // Validar que al menos un árbitro esté seleccionado si hay roles (aunque en principal usualmente van todos)
    // O mejor, validar que los árbitros seleccionados sean válidos
    const entries = Object.entries(seleccion).filter(([_, id]) => id !== "")
    
    if (entries.length === 0) {
      hasError = true
      // Marcar el primer rol como error si nada está seleccionado
      newErrores[roles[0]] = true
    }

    if (hasError) {
      setErrores(newErrores)
      return
    }

    const { semana, anio } = getSemanaInfo(fecha)
    const montoViat = viaticos.find(v => v.localidad === viaticoLocalidad)?.monto || 0

    const designaciones: Designacion[] = entries.map(([rol, arbitroId]) => {
      const precioRol = preciosLiga.find(p => p.rol === rol)?.monto || 0
      const isManejador = arbitroId === manejaId
      const finalViatico = isManejador ? montoViat : 0
      
      return {
        fecha,
        semana,
        anio,
        arbitro_id: arbitroId,
        liga_id: liga.id,
        rol,
        cantidad_partidos: 1,
        viatico_localidad: isManejador ? viaticoLocalidad : null,
        monto_honorarios: precioRol,
        monto_viatico: finalViatico,
        total: precioRol + finalViatico,
        estado: 'pendiente',
        arbitro_nombre: arbitros.find(a => a.id === arbitroId)?.nombre,
        liga_nombre: liga.nombre
      }
    })

    onAdd(designaciones)
    // Resetear selección
    setSeleccion({})
    setManejaId("")
    setErrores({})
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50/50">
        <CardTitle className="text-blue-900 flex justify-between items-center">
          {liga.nombre}
          <span className="text-sm font-normal text-blue-700">{fecha}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Viático (Solo para el que maneja)</Label>
            <ViaticoPicker 
              viaticos={viaticos} 
              value={viaticoLocalidad} 
              onChange={setViaticoLocalidad} 
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <Label className="text-base font-bold">Designación de Árbitros</Label>
          <div className="grid gap-4">
            {preciosLiga.map((p) => (
              <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-lg border bg-white shadow-sm">
                <div className="sm:col-span-4">
                  <span className="font-bold text-sm block">{p.rol}</span>
                  <span className="text-xs text-muted-foreground">{formatARS(p.monto)}</span>
                </div>
                <div className="sm:col-span-6">
                  <ArbitroSelector 
                    arbitros={arbitros} 
                    value={seleccion[p.rol] || ""} 
                    onChange={(val) => {
                      setSeleccion(prev => ({ ...prev, [p.rol]: val }))
                      setErrores(prev => ({ ...prev, [p.rol]: false }))
                    }}
                    error={errores[p.rol]}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 justify-end">
                  {seleccion[p.rol] && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`maneja-${p.id}`} className="text-[10px] font-bold uppercase text-zinc-500">Maneja</Label>
                      <input 
                        id={`maneja-${p.id}`}
                        type="radio" 
                        name="maneja" 
                        className="h-5 w-5 accent-brand"
                        checked={manejaId === seleccion[p.rol]}
                        onChange={() => setManejaId(seleccion[p.rol])}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleAdd}
          className="w-full bg-brand hover:bg-brand-hover text-white gap-2 h-12 text-lg shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Agregar a la lista
        </Button>
      </CardContent>
    </Card>
  )
}
