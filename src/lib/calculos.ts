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
