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
import { cn } from "@/lib/utils"
import { formatARS } from "@/lib/calculos"
import { DeudaPendiente } from "@/lib/types"

type Tipo = "cobro" | "ajuste"
type Direccion = "aumenta" | "disminuye"

interface ModalMovimientoDeudaProps {
  deuda: DeudaPendiente | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (tipo: Tipo, montoConSigno: number) => void
  loading?: boolean
}

export function ModalMovimientoDeuda({ deuda, isOpen, onClose, onConfirm, loading }: ModalMovimientoDeudaProps) {
  const [tipo, setTipo] = useState<Tipo>("cobro")
  const [direccion, setDireccion] = useState<Direccion>("disminuye")
  const [monto, setMonto] = useState("")

  const montoNum = parseInt(monto) || 0
  const excedeSaldo = tipo === "cobro" && deuda != null && montoNum > deuda.monto_actual

  const handleClose = () => {
    setTipo("cobro")
    setDireccion("disminuye")
    setMonto("")
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!montoNum || excedeSaldo) return
    const montoConSigno = tipo === "ajuste" && direccion === "disminuye" ? -montoNum : montoNum
    onConfirm(tipo, montoConSigno)
    setMonto("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-t-4 border-red-500">
        <DialogHeader>
          <DialogTitle className="text-xl">Registrar Movimiento</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {deuda?.concepto} — <span className="font-bold text-zinc-900">{deuda?.arbitro_nombre}</span>
            {" · "}Saldo actual: <span className="font-bold text-red-600">{deuda ? formatARS(deuda.monto_actual) : ""}</span>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de movimiento</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo("cobro")}
                className={cn(
                  "h-10 rounded-xl border-2 text-sm font-bold transition-all",
                  tipo === "cobro" ? "border-red-500 bg-red-50 text-red-700" : "border-zinc-100 text-zinc-400"
                )}
              >
                Cobro
              </button>
              <button
                type="button"
                onClick={() => setTipo("ajuste")}
                className={cn(
                  "h-10 rounded-xl border-2 text-sm font-bold transition-all",
                  tipo === "ajuste" ? "border-red-500 bg-red-50 text-red-700" : "border-zinc-100 text-zinc-400"
                )}
              >
                Ajuste
              </button>
            </div>
          </div>

          {tipo === "ajuste" && (
            <div className="space-y-2">
              <Label>Dirección del ajuste</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDireccion("disminuye")}
                  className={cn(
                    "h-10 rounded-xl border-2 text-xs font-bold transition-all",
                    direccion === "disminuye" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-100 text-zinc-400"
                  )}
                >
                  Disminuye la deuda
                </button>
                <button
                  type="button"
                  onClick={() => setDireccion("aumenta")}
                  className={cn(
                    "h-10 rounded-xl border-2 text-xs font-bold transition-all",
                    direccion === "aumenta" ? "border-red-500 bg-red-50 text-red-700" : "border-zinc-100 text-zinc-400"
                  )}
                >
                  Aumenta la deuda
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="monto-movimiento">Monto ($)</Label>
            <Input
              id="monto-movimiento"
              type="number"
              placeholder="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              className="focus-visible:ring-red-500"
            />
            {excedeSaldo && (
              <p className="text-xs font-bold text-red-600">El cobro no puede superar el saldo actual.</p>
            )}
          </div>

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={loading || !montoNum || excedeSaldo}>
              {loading ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
