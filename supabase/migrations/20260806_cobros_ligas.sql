-- Cobros a Ligas: lo que cada liga nos factura (cargos_liga) y lo que efectivamente paga (cobros_liga).
-- Es un monto propio de la liga, independiente de lo que cobran los árbitros.

CREATE TABLE IF NOT EXISTS cargos_liga (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  liga_id uuid REFERENCES ligas(id) ON DELETE CASCADE,
  tipo text CHECK (tipo IN ('jornada', 'partido', 'arbitro', 'otro')),
  concepto text,
  monto integer NOT NULL,
  fecha date NOT NULL DEFAULT current_date,
  semana integer,
  anio integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cobros_liga (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  liga_id uuid REFERENCES ligas(id) ON DELETE CASCADE,
  monto integer NOT NULL,
  fecha_cobro date NOT NULL DEFAULT current_date,
  metodo_pago text CHECK (metodo_pago IN ('efectivo', 'transferencia', 'cheque')),
  observaciones text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cargos_liga ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros_liga ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth cargos') THEN
        CREATE POLICY "auth cargos" ON cargos_liga FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth cobros') THEN
        CREATE POLICY "auth cobros" ON cobros_liga FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
