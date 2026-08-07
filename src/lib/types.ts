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
}

export interface Viatico {
  id: string;
  localidad: string;
  monto: number;
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
  pagado?: boolean;
  
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
