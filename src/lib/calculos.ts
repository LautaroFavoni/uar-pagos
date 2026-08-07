import { getISOWeek, getYear } from "date-fns"

/**
 * Calcula el número de semana ISO y el año para una fecha dada.
 */
export function getSemanaInfo(fecha: Date | string) {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  // Ajuste para que el lunes sea el inicio de la semana
  return {
    semana: getISOWeek(date),
    anio: getYear(date)
  }
}

/**
 * Formatea un número como moneda argentina
 */
export function formatARS(monto: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

/**
 * Calcula facturado, cobrado y saldo por liga a partir de sus cargos y cobros.
 */
export function calcularSaldosLigas(
  cargos: { liga_id: string; monto: number }[],
  cobros: { liga_id: string; monto: number }[]
) {
  const facturado: Record<string, number> = {}
  const cobrado: Record<string, number> = {}

  cargos.forEach(c => { facturado[c.liga_id] = (facturado[c.liga_id] || 0) + c.monto })
  cobros.forEach(c => { cobrado[c.liga_id] = (cobrado[c.liga_id] || 0) + c.monto })

  const ligaIds = new Set([...Object.keys(facturado), ...Object.keys(cobrado)])
  const saldos: Record<string, { facturado: number; cobrado: number; saldo: number }> = {}

  ligaIds.forEach(id => {
    const f = facturado[id] || 0
    const c = cobrado[id] || 0
    saldos[id] = { facturado: f, cobrado: c, saldo: f - c }
  })

  return saldos
}

/**
 * Suma los saldos positivos (pendientes de cobro) de todas las ligas.
 */
export function sumaSaldosPendientes(saldos: Record<string, { saldo: number }>) {
  return Object.values(saldos).reduce((acc, s) => acc + Math.max(s.saldo, 0), 0)
}
