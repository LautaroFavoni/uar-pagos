"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
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
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Trophy, Loader2, Plus, Minus } from "lucide-react"
import { TipoLiga } from "@/lib/types"

interface ModalNuevoTorneoProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalNuevoTorneo({ isOpen, onClose, onSuccess }: ModalNuevoTorneoProps) {
  const [nombre, setNombre] = useState("")
  const [roles, setRoles] = useState<string[]>(["Arbitro"])
  const [tipo, setTipo] = useState<TipoLiga>("principal")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const addRol = () => {
    if (roles.length < 4) setRoles([...roles, `Rol ${roles.length + 1}`])
  }

  const removeRol = () => {
    if (roles.length > 1) setRoles(roles.slice(0, -1))
  }

  const updateRolName = (index: number, newName: string) => {
    const newRoles = [...roles]
    newRoles[index] = newName
    setRoles(newRoles)
  }

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre del torneo es obligatorio")
      return
    }

    setLoading(true)
    try {
      // 1. Crear la liga
      const { data: liga, error: errorLiga } = await supabase
        .from('ligas')
        .insert([{
          nombre: nombre.trim(),
          tipo,
          activo: true
        }])
        .select()
        .single()

      if (errorLiga) throw errorLiga

      // 2. Crear precios base para los roles definidos
      const preciosInsert = roles.map(rol => ({
        liga_id: liga.id,
        rol: rol.trim() || "Arbitro",
        monto: 0
      }))

      const { error: errorPrecios } = await supabase
        .from('precios')
        .insert(preciosInsert)

      if (errorPrecios) throw errorPrecios

      toast.success("Torneo creado con roles personalizados")
      setNombre("")
      setRoles(["Arbitro"])
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al crear el torneo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand" />
            Configuración de Nuevo Torneo
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold">Nombre del Torneo / Liga</Label>
            <Input
              id="name"
              placeholder="Ej: Liga Totorense"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-bold">Definición de Roles / Árbitros</Label>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" onClick={removeRol} className="h-8 w-8 rounded-full">
                  <Minus className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={addRol} className="h-8 w-8 rounded-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              {roles.map((rol, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                    {index + 1}
                  </div>
                  <Input
                    value={rol}
                    onChange={(e) => updateRolName(index, e.target.value)}
                    placeholder={`Nombre del rol ${index + 1}`}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Modo de Carga</Label>
            <Select value={tipo} onValueChange={(val) => setTipo(val as TipoLiga)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Seleccionar modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="principal">Carga Estándar (Por terna/semana)</SelectItem>
                <SelectItem value="por_partido">Carga por Cantidad (Estilo Ovalo/CAF)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            className="bg-brand hover:bg-brand-hover text-white rounded-xl"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Crear Torneo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
