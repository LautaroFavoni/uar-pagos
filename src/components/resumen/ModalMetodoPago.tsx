"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MetodoPagoLiquidacion } from "@/lib/types"

interface ModalMetodoPagoProps {
  arbitroNombre: string | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (metodoPago: MetodoPagoLiquidacion) => void
  loading?: boolean
}

export function ModalMetodoPago({ arbitroNombre, isOpen, onClose, onConfirm, loading }: ModalMetodoPagoProps) {
  const [metodoPago, setMetodoPago] = useState<MetodoPagoLiquidacion | "">("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!metodoPago) return
    onConfirm(metodoPago)
    setMetodoPago("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-t-4 border-blue-500">
        <DialogHeader>
          <DialogTitle className="text-xl">Registrar Pago</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Marcar como pagado a <span className="font-bold text-zinc-900">{arbitroNombre}</span>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPagoLiquidacion)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí el método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="mixto">Mixto</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand hover:bg-brand-hover text-white" disabled={loading || !metodoPago}>
              {loading ? "Guardando..." : "Confirmar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
