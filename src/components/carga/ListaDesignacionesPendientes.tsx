"use client"

import { Designacion } from "@/lib/types"
import { formatARS } from "@/lib/calculos"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, CheckCircle2 } from "lucide-react"

interface ListaDesignacionesPendientesProps {
  designaciones: Designacion[]
  onRemove: (index: number) => void
  onConfirm: () => void
  isSubmitting: boolean
}

export function ListaDesignacionesPendientes({ 
  designaciones, 
  onRemove, 
  onConfirm,
  isSubmitting
}: ListaDesignacionesPendientesProps) {
  if (designaciones.length === 0) return null

  const totalGeneral = designaciones.reduce((acc, d) => acc + d.total, 0)

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end bg-zinc-900 p-6 rounded-t-[2rem] text-white">
        <div>
          <h3 className="text-xl font-black italic">LISTA PARA GUARDAR ({designaciones.length})</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Revisá antes de confirmar la liquidación</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Total Acumulado</span>
          <span className="text-3xl font-black text-emerald-400">{formatARS(totalGeneral)}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 translate-y-[1px]">
            <TableRow>
              <TableHead className="font-bold">Árbitro</TableHead>
              <TableHead className="font-bold">Liga</TableHead>
              <TableHead className="font-bold">Rol</TableHead>
              <TableHead className="font-bold text-right">Monto</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designaciones.map((d, index) => (
              <TableRow key={index} className="group">
                <TableCell>
                  <span className="font-bold block">{d.arbitro_nombre}</span>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">{d.fecha}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{d.liga_nombre}</span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 border">
                    {d.rol}
                  </span>
                  {d.monto_viatico > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100">
                      Viat.
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-black">
                  {formatARS(d.total)}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-300 hover:text-red-600 transition-colors"
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button 
        onClick={onConfirm}
        disabled={isSubmitting}
        className="w-full bg-brand hover:bg-brand-hover text-white h-16 text-xl font-bold shadow-2xl shadow-blue-200 gap-3 rounded-2xl"
      >
        <CheckCircle2 className="h-6 w-6" />
        {isSubmitting ? "GUARDANDO..." : "CONFIRMAR TODAS"}
      </Button>
    </div>
  )
}
