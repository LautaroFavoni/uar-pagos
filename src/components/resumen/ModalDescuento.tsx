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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Arbitro } from "@/lib/types"

interface ModalDescuentoProps {
  arbitro: Arbitro | null
  isOpen: boolean
  onClose: () => void
  onAdd: (concepto: string, monto: number) => void
  loading?: boolean
}

export function ModalDescuento({ arbitro, isOpen, onClose, onAdd, loading }: ModalDescuentoProps) {
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!concepto || !monto) return
    onAdd(concepto, parseInt(monto))
    setConcepto("")
    setMonto("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-t-4 border-red-500">
        <DialogHeader>
          <DialogTitle className="text-xl">Agregar Descuento</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Aplicar descuento para <span className="font-bold text-zinc-900">{arbitro?.nombre}</span>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto (ej: Adelanto, Multa, Indumentaria)</Label>
            <Input 
              id="concepto" 
              placeholder="Escribe el concepto..." 
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
              className="focus-visible:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monto">Monto ($)</Label>
            <Input 
              id="monto" 
              type="number" 
              placeholder="0" 
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              className="focus-visible:ring-red-500"
            />
          </div>
          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading ? "Agregando..." : "Confirmar Descuento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
