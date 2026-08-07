export type TipoLiga = 'principal' | 'por_partido' | 'inferiores' | 'femenino';

export interface Arbitro {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Liga {
  id: string;
  nombre: string;
  tipo: TipoLiga;
  activo: boolean;
}

export interface Precio {
  id: string;
  liga_id: string;
  rol: string;
  monto: number;
  vigente_desde: string;
  vigente_hasta: string | null;
}

export interface Viatico {
  id: string;
  localidad: string;
  monto: number;
  vigente_desde: string;
  vigente_hasta: string | null;
}

export interface Designacion {
  id?: string;
  fecha: string;
  semana: number;
  anio: number;
  arbitro_id: string;
  liga_id: string;
  rol: string;
  cantidad_partidos: number;
  viatico_localidad: string | null;
  monto_honorarios: number;
  monto_viatico: number;
  total: number;
  equipo_local?: string;
  equipo_visitante?: string;
  hora?: string;
  observaciones?: string;
  estado: 'pendiente' | 'pagado';

  // Virtual field for UI
  arbitro_nombre?: string;
  liga_nombre?: string;
}

export interface Descuento {
  id?: string;
  semana: number;
  anio: number;
  arbitro_id: string;
  concepto: string;
  monto: number;
  estado: 'pendiente' | 'liquidado';
}

export interface DeudaPendiente {
  id: string;
  arbitro_id: string;
  concepto: string;
  monto_inicial: number;
  monto_actual: number;
  created_at?: string;

  // Virtual field
  arbitro_nombre?: string;
}

export type TipoCargoLiga = 'jornada' | 'partido' | 'arbitro' | 'otro';
export type MetodoPago = 'efectivo' | 'transferencia' | 'cheque';

export interface CargoLiga {
  id?: string;
  liga_id: string;
  tipo: TipoCargoLiga | null;
  concepto: string | null;
  monto: number;
  fecha: string;
  semana?: number | null;
  anio?: number | null;
  created_at?: string;
}

export interface CobroLiga {
  id?: string;
  liga_id: string;
  monto: number;
  fecha_cobro: string;
  metodo_pago: MetodoPago | null;
  observaciones?: string | null;
  created_at?: string;
}

export type EstadoLiquidacion = 'pendiente' | 'pagado';
export type MetodoPagoLiquidacion = 'efectivo' | 'transferencia' | 'mixto';

export interface Liquidacion {
  id?: string;
  arbitro_id: string;
  semana: number;
  anio: number;
  subtotal_honorarios: number;
  subtotal_viaticos: number;
  total_descuentos: number;
  total_deuda_cobrada: number;
  neto: number;
  estado: EstadoLiquidacion;
  metodo_pago: MetodoPagoLiquidacion | null;
  fecha_pago?: string | null;
}

export type TipoMovimientoDeuda = 'alta' | 'cobro' | 'ajuste';

export interface DeudaMovimiento {
  id?: string;
  deuda_id: string;
  tipo: TipoMovimientoDeuda;
  monto: number;
  semana?: number | null;
  anio?: number | null;
  created_at?: string;
}
