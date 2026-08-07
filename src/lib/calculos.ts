import { getISOWeek, getYear } from "date-fns"
import { Precio, Viatico } from "./types"

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

/**
 * Un registro con vigencia (precio o viático) está vigente en `fecha` (yyyy-MM-dd)
 * si fecha >= vigente_desde y (vigente_hasta es null o fecha < vigente_hasta).
 * Las fechas son strings ISO (yyyy-MM-dd), por lo que la comparación lexicográfica
 * coincide con el orden cronológico.
 */
function estaVigente(vigenteDesde: string, vigenteHasta: string | null, fecha: string) {
  return fecha >= vigenteDesde && (vigenteHasta === null || fecha < vigenteHasta)
}

/**
 * Precio vigente de una liga/rol a una fecha dada (ej: la fecha de una designación).
 * Permite que una designación con fecha vieja tome el precio que valía en ese momento.
 */
export function precioVigente(precios: Precio[], ligaId: string, rol: string, fecha: string): Precio | undefined {
  return precios.find(p => p.liga_id === ligaId && p.rol === rol && estaVigente(p.vigente_desde, p.vigente_hasta, fecha))
}

/**
 * Precios vigentes (uno por rol) de una liga a una fecha dada.
 */
export function preciosVigentesDeLiga(precios: Precio[], ligaId: string, fecha: string): Precio[] {
  return precios.filter(p => p.liga_id === ligaId && estaVigente(p.vigente_desde, p.vigente_hasta, fecha))
}

/**
 * Viático vigente de una localidad a una fecha dada.
 */
export function viaticoVigente(viaticos: Viatico[], localidad: string, fecha: string): Viatico | undefined {
  return viaticos.find(v => v.localidad === localidad && estaVigente(v.vigente_desde, v.vigente_hasta, fecha))
}

/**
 * Viáticos vigentes (uno por localidad) a una fecha dada.
 */
export function viaticosVigentes(viaticos: Viatico[], fecha: string): Viatico[] {
  return viaticos.filter(v => estaVigente(v.vigente_desde, v.vigente_hasta, fecha))
}
