"use client"

import { useEffect, useState } from "react"
import {
  format,
  startOfISOWeek,
  endOfISOWeek,
  setISOWeek,
  setISOWeekYear,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { Arbitro } from "@/lib/types"
import { getSemanaInfo, formatARS, METODO_PAGO_LABEL } from "@/lib/calculos"
import { exportExcel, exportCSV, exportPDF, FilaReporte } from "@/lib/export"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { FileSpreadsheet, FileText, FileDown, BarChart3, RefreshCcw } from "lucide-react"
import { BRAND } from "@/lib/brand"

type TipoPeriodo = "semana" | "mes" | "anio" | "rango"
type FiltroEstado = "todos" | "pendiente" | "pagado"

interface Bucket {
  arbitroId: string
  arbitroNombre: string
  honorarios: number
  viaticos: number
  descuentos: number
  deudaCobrada: number
  neto: number
  cerrada: boolean
  metodos: Set<string>
}

export default function ReportesPage() {
  const supabase = createClient()
  const hoy = new Date()
  const infoHoy = getSemanaInfo(hoy)

  const [arbitros, setArbitros] = useState<Arbitro[]>([])
  const [filtroArbitroId, setFiltroArbitroId] = useState<string>("todos")
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos")
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>("mes")

  const [semana, setSemana] = useState(infoHoy.semana)
  const [anioSemana, setAnioSemana] = useState(infoHoy.anio)
  const [periodoMes, setPeriodoMes] = useState(format(hoy, "yyyy-MM"))
  const [periodoAnio, setPeriodoAnio] = useState(infoHoy.anio)
  const [fechaDesde, setFechaDesde] = useState(format(startOfMonth(hoy), "yyyy-MM-dd"))
  const [fechaHasta, setFechaHasta] = useState(format(endOfMonth(hoy), "yyyy-MM-dd"))

  const [loading, setLoading] = useState(false)
  const [filas, setFilas] = useState<FilaReporte[]>([])
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    supabase.from("arbitros").select("*").order("nombre").then(({ data }) => {
      if (data) setArbitros(data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function computeRango(): { desde: string; hasta: string; label: string } | null {
    if (tipoPeriodo === "semana") {
      if (!semana || !anioSemana) return null
      let d = setISOWeekYear(new Date(), anioSemana)
      d = setISOWeek(d, semana)
      return {
        desde: format(startOfISOWeek(d), "yyyy-MM-dd"),
        hasta: format(endOfISOWeek(d), "yyyy-MM-dd"),
        label: `Semana ${semana} · ${anioSemana}`,
      }
    }
    if (tipoPeriodo === "mes") {
      if (!periodoMes) return null
      const [y, m] = periodoMes.split("-").map(Number)
      const d = new Date(y, m - 1, 1)
      return {
        desde: format(startOfMonth(d), "yyyy-MM-dd"),
        hasta: format(endOfMonth(d), "yyyy-MM-dd"),
        label: format(d, "MMMM yyyy", { locale: es }),
      }
    }
    if (tipoPeriodo === "anio") {
      if (!periodoAnio) return null
      const d = new Date(periodoAnio, 0, 1)
      return {
        desde: format(startOfYear(d), "yyyy-MM-dd"),
        hasta: format(endOfYear(d), "yyyy-MM-dd"),
        label: `Año ${periodoAnio}`,
      }
    }
    // rango
    if (!fechaDesde || !fechaHasta || fechaDesde > fechaHasta) return null
    return {
      desde: fechaDesde,
      hasta: fechaHasta,
      label: `${format(new Date(fechaDesde + "T12:00:00"), "dd/MM/yyyy")} — ${format(new Date(fechaHasta + "T12:00:00"), "dd/MM/yyyy")}`,
    }
  }

  const rango = computeRango()

  async function generarReporte() {
    if (!rango) {
      toast.error("Revisá el período seleccionado")
      return
    }
    setLoading(true)
    try {
      let qDes = supabase
        .from("designaciones")
        .select("*, arbitros(nombre)")
        .gte("fecha", rango.desde)
        .lte("fecha", rango.hasta)
      if (filtroArbitroId !== "todos") qDes = qDes.eq("arbitro_id", filtroArbitroId)
      if (filtroEstado !== "todos") qDes = qDes.eq("estado", filtroEstado)

      const { data: des, error: errDes } = await qDes
      if (errDes) throw errDes

      const claves = new Set<string>()
      des?.forEach(d => claves.add(`${d.arbitro_id}::${d.semana}::${d.anio}`))

      let qDct = supabase.from("descuentos").select("*")
      if (filtroArbitroId !== "todos") qDct = qDct.eq("arbitro_id", filtroArbitroId)
      if (filtroEstado === "pagado") qDct = qDct.eq("estado", "liquidado")
      else if (filtroEstado === "pendiente") qDct = qDct.eq("estado", "pendiente")
      const { data: dct, error: errDct } = await qDct
      if (errDct) throw errDct

      let qLiq = supabase.from("liquidaciones").select("*")
      if (filtroArbitroId !== "todos") qLiq = qLiq.eq("arbitro_id", filtroArbitroId)
      const { data: liq, error: errLiq } = await qLiq
      if (errLiq) throw errLiq

      // Bucket por (arbitro, semana, año): así el neto de una semana ya
      // cerrada usa el desglose autoritativo de liquidaciones, y una semana
      // todavía no cerrada usa un preview (honorarios+viáticos-descuentos).
      const buckets = new Map<string, Bucket>()

      des?.forEach(d => {
        const key = `${d.arbitro_id}::${d.semana}::${d.anio}`
        if (!buckets.has(key)) {
          buckets.set(key, {
            arbitroId: d.arbitro_id,
            arbitroNombre: d.arbitros?.nombre || "Desconocido",
            honorarios: 0,
            viaticos: 0,
            descuentos: 0,
            deudaCobrada: 0,
            neto: 0,
            cerrada: false,
            metodos: new Set(),
          })
        }
        const b = buckets.get(key)!
        b.honorarios += d.monto_honorarios
        b.viaticos += d.monto_viatico
      })

      dct?.forEach(d => {
        const key = `${d.arbitro_id}::${d.semana}::${d.anio}`
        if (claves.has(key)) buckets.get(key)!.descuentos += d.monto
      })

      liq?.forEach(l => {
        const key = `${l.arbitro_id}::${l.semana}::${l.anio}`
        const b = buckets.get(key)
        if (!b) return
        b.cerrada = true
        b.deudaCobrada = l.total_deuda_cobrada
        b.neto = l.neto
        if (l.estado === "pagado" && l.metodo_pago) b.metodos.add(l.metodo_pago)
      })

      buckets.forEach(b => {
        if (!b.cerrada) b.neto = b.honorarios + b.viaticos - b.descuentos
      })

      const porArbitro = new Map<string, FilaReporte & { metodos: Set<string> }>()
      buckets.forEach(b => {
        if (!porArbitro.has(b.arbitroId)) {
          porArbitro.set(b.arbitroId, {
            arbitro: b.arbitroNombre,
            honorarios: 0,
            viaticos: 0,
            descuentos: 0,
            deudaCobrada: 0,
            neto: 0,
            metodoPago: "",
            metodos: new Set(),
          })
        }
        const r = porArbitro.get(b.arbitroId)!
        r.honorarios += b.honorarios
        r.viaticos += b.viaticos
        r.descuentos += b.descuentos
        r.deudaCobrada += b.deudaCobrada
        r.neto += b.neto
        b.metodos.forEach(m => r.metodos.add(m))
      })

      const resultado: FilaReporte[] = Array.from(porArbitro.values())
        .map(r => ({
          arbitro: r.arbitro,
          honorarios: r.honorarios,
          viaticos: r.viaticos,
          descuentos: r.descuentos,
          deudaCobrada: r.deudaCobrada,
          neto: r.neto,
          metodoPago: Array.from(r.metodos).map(m => METODO_PAGO_LABEL[m] || m).join(", ") || "—",
        }))
        .sort((a, b) => a.arbitro.localeCompare(b.arbitro))

      setFilas(resultado)
      if (resultado.length === 0) toast.info("No hay datos para estos filtros")
    } catch (error) {
      toast.error("Error al generar el reporte")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generarReporte()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroArbitroId, filtroEstado, tipoPeriodo, semana, anioSemana, periodoMes, periodoAnio, fechaDesde, fechaHasta])

  const totales = filas.reduce(
    (acc, f) => ({
      honorarios: acc.honorarios + f.honorarios,
      viaticos: acc.viaticos + f.viaticos,
      descuentos: acc.descuentos + f.descuentos,
      deudaCobrada: acc.deudaCobrada + f.deudaCobrada,
      neto: acc.neto + f.neto,
    }),
    { honorarios: 0, viaticos: 0, descuentos: 0, deudaCobrada: 0, neto: 0 }
  )

  const nombreArbitroFiltro = filtroArbitroId === "todos" ? "Todos" : arbitros.find(a => a.id === filtroArbitroId)?.nombre || ""
  const estadoLabel = filtroEstado === "todos" ? "Todos" : filtroEstado === "pagado" ? "Pagado" : "Pendiente"
  const exportMeta = {
    titulo: `Reporte de Liquidaciones — Árbitro: ${nombreArbitroFiltro} · Estado: ${estadoLabel}`,
    periodo: rango?.label || "",
    filename: `reporte_${(rango?.label || "periodo").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
  }

  const handleExport = async (tipo: "excel" | "csv" | "pdf") => {
    if (filas.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }
    setExporting(tipo)
    try {
      if (tipo === "excel") await exportExcel(filas, exportMeta)
      if (tipo === "csv") await exportCSV(filas, exportMeta)
      if (tipo === "pdf") await exportPDF(filas, exportMeta)
    } catch (error) {
      toast.error("Error al exportar")
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-5">
        <div className="bg-brand p-3 rounded-2xl shadow-xl shadow-blue-100 italic font-black text-white text-xl">
          {BRAND.nombre}
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-brand flex items-center gap-2">
            <BarChart3 className="h-7 w-7" /> Reportes
          </h2>
          <p className="text-muted-foreground text-sm">Consultá y exportá liquidaciones por árbitro, mes o año.</p>
        </div>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>El período se agrupa por la fecha de cada designación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Árbitro</Label>
              <Select value={filtroArbitroId} onValueChange={(v) => setFiltroArbitroId(v ?? "todos")}>
                <SelectTrigger className="h-11 rounded-xl w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los árbitros</SelectItem>
                  {arbitros.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Tipo de período</Label>
              <Select value={tipoPeriodo} onValueChange={(v) => setTipoPeriodo(v as TipoPeriodo)}>
                <SelectTrigger className="h-11 rounded-xl w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mes</SelectItem>
                  <SelectItem value="anio">Año</SelectItem>
                  <SelectItem value="rango">Rango de fechas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Estado</Label>
              <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as FiltroEstado)}>
                <SelectTrigger className="h-11 rounded-xl w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            {tipoPeriodo === "semana" && (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Semana</Label>
                  <Input type="number" min={1} max={53} value={semana} onChange={(e) => setSemana(parseInt(e.target.value) || 1)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Año</Label>
                  <Input type="number" value={anioSemana} onChange={(e) => setAnioSemana(parseInt(e.target.value) || infoHoy.anio)} className="h-11 rounded-xl" />
                </div>
              </>
            )}
            {tipoPeriodo === "mes" && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400">Mes</Label>
                <Input type="month" value={periodoMes} onChange={(e) => setPeriodoMes(e.target.value)} className="h-11 rounded-xl" />
              </div>
            )}
            {tipoPeriodo === "anio" && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400">Año</Label>
                <Input type="number" value={periodoAnio} onChange={(e) => setPeriodoAnio(parseInt(e.target.value) || infoHoy.anio)} className="h-11 rounded-xl" />
              </div>
            )}
            {tipoPeriodo === "rango" && (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Desde</Label>
                  <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Hasta</Label>
                  <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="h-11 rounded-xl" />
                </div>
              </>
            )}
            <div className="flex items-end">
              <Button variant="outline" className="h-11 rounded-xl gap-2 w-full md:w-auto" onClick={generarReporte} disabled={loading}>
                <RefreshCcw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-lg">Resumen por Árbitro</CardTitle>
            <CardDescription>{rango?.label || "Seleccioná un período"}</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport("excel")} disabled={!!exporting || filas.length === 0}>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport("csv")} disabled={!!exporting || filas.length === 0}>
              <FileDown className="h-4 w-4 text-zinc-600" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport("pdf")} disabled={!!exporting || filas.length === 0}>
              <FileText className="h-4 w-4 text-red-600" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filas.length > 0 ? (
            <div className="rounded-2xl border overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest">Árbitro</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-right">Honorarios</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-right">Viáticos</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-right">Descuentos</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-right">Deuda Cobrada</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-right">Neto</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest">Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map(f => (
                    <TableRow key={f.arbitro} className="hover:bg-zinc-50/50">
                      <TableCell className="font-bold text-zinc-700">{f.arbitro}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatARS(f.honorarios)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatARS(f.viaticos)}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-500">-{formatARS(f.descuentos)}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-500">-{formatARS(f.deudaCobrada)}</TableCell>
                      <TableCell className="text-right tabular-nums font-black text-blue-700">{formatARS(f.neto)}</TableCell>
                      <TableCell className="text-xs text-zinc-500">{f.metodoPago}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-50 font-black">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right tabular-nums">{formatARS(totales.honorarios)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatARS(totales.viaticos)}</TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">-{formatARS(totales.descuentos)}</TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">-{formatARS(totales.deudaCobrada)}</TableCell>
                    <TableCell className="text-right tabular-nums text-blue-700">{formatARS(totales.neto)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-16 text-center text-zinc-400 font-medium">
              No hay datos para los filtros seleccionados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
