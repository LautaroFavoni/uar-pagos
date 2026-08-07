-- Preparación para próximas etapas: solo estructura, sin cambios de lógica.

-- Liquidaciones: header por árbitro/semana (fuente única del estado de pago y método)
CREATE TABLE liquidaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  arbitro_id uuid REFERENCES arbitros(id),
  semana int NOT NULL, anio int NOT NULL,
  subtotal_honorarios int NOT NULL,
  subtotal_viaticos int NOT NULL,
  total_descuentos int NOT NULL,
  total_deuda_cobrada int NOT NULL DEFAULT 0,
  neto int NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado')),
  metodo_pago text CHECK (metodo_pago IN ('efectivo','transferencia','mixto')),
  fecha_pago timestamptz,
  UNIQUE(arbitro_id, semana, anio)
);
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth liq" ON liquidaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Movimientos de deuda: trazabilidad de cada cobro parcial
CREATE TABLE deuda_movimientos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  deuda_id uuid REFERENCES deudas_pendientes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('alta','cobro','ajuste')),
  monto integer NOT NULL,
  semana integer, anio integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE deuda_movimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth deuda_mov" ON deuda_movimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vigencia temporal de precios y viáticos
ALTER TABLE precios  ADD COLUMN vigente_desde date NOT NULL DEFAULT current_date;
ALTER TABLE precios  ADD COLUMN vigente_hasta date;
ALTER TABLE viaticos ADD COLUMN vigente_desde date NOT NULL DEFAULT current_date;
ALTER TABLE viaticos ADD COLUMN vigente_hasta date;
