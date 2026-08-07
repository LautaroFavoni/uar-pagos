import { BRAND } from "./brand"

export interface FilaReporte {
  arbitro: string
  honorarios: number
  viaticos: number
  descuentos: number
  deudaCobrada: number
  neto: number
  metodoPago: string
}

export interface ExportMeta {
  titulo: string
  periodo: string
  filename: string
}

const HEADERS = ["Árbitro", "Honorarios", "Viáticos", "Descuentos", "Deuda Cobrada", "Neto", "Método de Pago"]

function filaTotal(filas: FilaReporte[]): FilaReporte {
  return filas.reduce(
    (acc, f) => ({
      arbitro: "TOTAL",
      honorarios: acc.honorarios + f.honorarios,
      viaticos: acc.viaticos + f.viaticos,
      descuentos: acc.descuentos + f.descuentos,
      deudaCobrada: acc.deudaCobrada + f.deudaCobrada,
      neto: acc.neto + f.neto,
      metodoPago: "",
    }),
    { arbitro: "TOTAL", honorarios: 0, viaticos: 0, descuentos: 0, deudaCobrada: 0, neto: 0, metodoPago: "" }
  )
}

function filaToRow(f: FilaReporte): (string | number)[] {
  return [f.arbitro, f.honorarios, f.viaticos, f.descuentos, f.deudaCobrada, f.neto, f.metodoPago]
}

function buildSheet(filas: FilaReporte[]) {
  const conTotal = [...filas, filaTotal(filas)]
  return [HEADERS, ...conTotal.map(filaToRow)]
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Los valores numéricos van como number (no texto formateado) para que se
// puedan sumar/pivotear directamente en una planilla de contabilidad.
export async function exportExcel(filas: FilaReporte[], meta: ExportMeta) {
  const XLSX = await import("xlsx")
  const aoa = buildSheet(filas)
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws["!cols"] = [{ wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Reporte")
  XLSX.writeFile(wb, `${meta.filename}.xlsx`)
}

export async function exportCSV(filas: FilaReporte[], meta: ExportMeta) {
  const XLSX = await import("xlsx")
  const ws = XLSX.utils.aoa_to_sheet(buildSheet(filas))
  const csv = XLSX.utils.sheet_to_csv(ws)
  // BOM para que Excel detecte UTF-8 y las tildes no se rompan al abrirlo
  downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), `${meta.filename}.csv`)
}

// Formato de moneda "plano" (sin espacio unicode no-rompible del Intl
// currency formatter) para que se vea bien con las fuentes estándar de jsPDF.
function formatMoneyPlain(n: number) {
  return `$ ${Math.round(n).toLocaleString("es-AR")}`
}

export async function exportPDF(filas: FilaReporte[], meta: ExportMeta) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF()
  const conTotal = [...filas, filaTotal(filas)]
  const totalIndex = conTotal.length - 1

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(BRAND.colores.primario)
  doc.text(BRAND.nombreLargo, 14, 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor("#52525b")
  doc.text(meta.titulo, 14, 26)
  doc.text(meta.periodo, 14, 32)

  autoTable(doc, {
    startY: 38,
    head: [HEADERS],
    body: conTotal.map(f => [
      f.arbitro,
      formatMoneyPlain(f.honorarios),
      formatMoneyPlain(f.viaticos),
      formatMoneyPlain(f.descuentos),
      formatMoneyPlain(f.deudaCobrada),
      formatMoneyPlain(f.neto),
      f.metodoPago,
    ]),
    headStyles: { fillColor: BRAND.colores.primario, textColor: "#ffffff" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" },
      4: { halign: "right" }, 5: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === totalIndex && data.section === "body") {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = "#eef2ff"
      }
    },
  })

  doc.save(`${meta.filename}.pdf`)
}
