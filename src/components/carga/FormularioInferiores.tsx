"use client"

import { useState } from "react"
import { Arbitro, Liga, Precio, Viatico, Designacion } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArbitroSelector } from "../shared/ArbitroSelector"
import { ViaticoPicker } from "../shared/ViaticoPicker"
import { formatARS, getSemanaInfo } from "@/lib/calculos"
import { Plus } from "lucide-react"

interface FormularioInferioresProps {
  liga: Liga
  arbitros: Arbitro[]
  precios: Precio[]
  viaticos: Viatico[]
  onAdd: (designaciones: Designacion[]) => void
}

export function FormularioInferiores({ liga, arbitros, precios, viaticos, onAdd }: FormularioInferioresProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [viaticoLocalidad, setViaticoLocalidad] = useState("Sin viatico")
  const [manejaId, setManejaId] = useState<string>("")
  const [seleccion, setSeleccion] = useState<Record<string, string>>({}) // rol -> arbitro_id

  const preciosLiga = precios.filter(p => p.liga_id === liga.id)

  const handleAdd = () => {
    const entries = Object.entries(seleccion).filter(([_, id]) => id !== "")
    if (entries.length === 0) return

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
    setSeleccion({})
    setManejaId("")
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-orange-50/50">
        <CardTitle className="text-orange-900 flex justify-between items-center">
          {liga.nombre}
          <span className="text-sm font-normal text-orange-700">Inferiores</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Viático (Maneja)</Label>
            <ViaticoPicker 
              viaticos={viaticos} 
              value={viaticoLocalidad} 
              onChange={setViaticoLocalidad} 
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="grid gap-3">
            {preciosLiga.map((p) => (
              <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-2 rounded-lg border bg-zinc-50">
                <div className="sm:col-span-4">
                  <span className="font-bold text-sm block">{p.rol}</span>
                  <span className="text-[10px] text-zinc-500">{formatARS(p.monto)}</span>
                </div>
                <div className="sm:col-span-6">
                  <ArbitroSelector 
                    arbitros={arbitros} 
                    value={seleccion[p.rol] || ""} 
                    onChange={(val) => setSeleccion(prev => ({ ...prev, [p.rol]: val }))} 
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-end">
                  {seleccion[p.rol] && (
                    <input 
                      type="radio" 
                      name="maneja-inf" 
                      className="h-5 w-5 accent-orange-600"
                      checked={manejaId === seleccion[p.rol]}
                      onChange={() => setManejaId(seleccion[p.rol])}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleAdd}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 h-12"
        >
          <Plus className="h-5 w-5" />
          Agregar a la lista
        </Button>
      </CardContent>
    </Card>
  )
}
