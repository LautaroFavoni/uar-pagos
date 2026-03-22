CREATE TABLE IF NOT EXISTS deudas_pendientes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  arbitro_id uuid REFERENCES arbitros(id) ON DELETE CASCADE,
  concepto text NOT NULL,
  monto_inicial integer NOT NULL,
  monto_actual integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE deudas_pendientes ENABLE ROW LEVEL SECURITY;

-- Evitar duplicados si ya existe la política
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir todo en deudas') THEN
        CREATE POLICY "Permitir todo en deudas" ON deudas_pendientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
