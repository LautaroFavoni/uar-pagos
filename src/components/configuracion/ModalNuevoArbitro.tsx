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
import { toast } from "sonner"
import { UserPlus, Loader2 } from "lucide-react"

interface ModalNuevoArbitroProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalNuevoArbitro({ isOpen, onClose, onSuccess }: ModalNuevoArbitroProps) {
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('arbitros')
        .insert([{ nombre: nombre.trim(), activo: true }])

      if (error) throw error

      toast.success("Árbitro creado correctamente")
      setNombre("")
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Error al crear el árbitro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#1B5E20]" />
            Nuevo Árbitro
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre y Apellido</Label>
            <Input 
              id="name" 
              placeholder="Ej: Juan Perez" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar Árbitro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
