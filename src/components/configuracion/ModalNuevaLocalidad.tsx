import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { MapPin, Loader2 } from "lucide-react"

interface ModalNuevaLocalidadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalNuevaLocalidad({ isOpen, onClose, onSuccess }: ModalNuevaLocalidadProps) {
  const [localidad, setLocalidad] = useState("")
  const [monto, setMonto] = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!localidad.trim()) {
      toast.error("El nombre de la localidad es obligatorio")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('viaticos')
        .insert([{ 
          localidad: localidad.trim(), 
          monto 
        }])

      if (error) throw error

      toast.success("Localidad agregada correctamente")
      setLocalidad("")
      setMonto(0)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al agregar localidad")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <MapPin className="h-5 w-5 text-brand" />
            Nueva Localidad
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label className="font-bold ml-1">Nombre de Localidad / Sede</Label>
            <Input 
              placeholder="Ej: Totoras" 
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold ml-1">Monto de Viático</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 translate-y-0.5 text-zinc-400 font-bold">$</span>
              <Input 
                type="number"
                value={monto}
                onChange={(e) => setMonto(parseInt(e.target.value) || 0)}
                className="pl-7 h-11 rounded-xl"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl font-bold">
            Cancelar
          </Button>
          <Button 
            className="bg-brand hover:bg-brand-hover text-white rounded-xl font-bold" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar Localidad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
