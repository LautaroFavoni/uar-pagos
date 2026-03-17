-- Esquema de Base de Datos para el Sistema de Gestión de Pagos del Colegio de Árbitros
-- Ejecutar este archivo en el Editor SQL de Supabase

-- Habilitar extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: arbitros
CREATE TABLE IF NOT EXISTS arbitros (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL UNIQUE,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. TABLA: ligas
CREATE TABLE IF NOT EXISTS ligas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('principal', 'por_partido', 'inferiores', 'femenino')),
  activo boolean DEFAULT true
);

-- 3. TABLA: precios
CREATE TABLE IF NOT EXISTS precios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  liga_id uuid REFERENCES ligas(id) ON DELETE CASCADE,
  rol text NOT NULL,
  monto integer NOT NULL,
  UNIQUE(liga_id, rol)
);

-- 4. TABLA: viaticos
CREATE TABLE IF NOT EXISTS viaticos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  localidad text NOT NULL UNIQUE,
  monto integer NOT NULL
);

-- 5. TABLA: designaciones
CREATE TABLE IF NOT EXISTS designaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha date NOT NULL,
  semana integer NOT NULL, -- número ISO de semana
  anio integer NOT NULL,
  arbitro_id uuid REFERENCES arbitros(id) ON DELETE CASCADE,
  liga_id uuid REFERENCES ligas(id) ON DELETE CASCADE,
  rol text NOT NULL,
  cantidad_partidos integer DEFAULT 1,
  viatico_localidad text,
  monto_honorarios integer NOT NULL,
  monto_viatico integer DEFAULT 0,
  total integer NOT NULL,
  observaciones text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
  created_at timestamptz DEFAULT now()
);

-- 6. TABLA: descuentos
CREATE TABLE IF NOT EXISTS descuentos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  semana integer NOT NULL,
  anio integer NOT NULL,
  arbitro_id uuid REFERENCES arbitros(id) ON DELETE CASCADE,
  concepto text NOT NULL,
  monto integer NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'liquidado')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE arbitros ENABLE ROW LEVEL SECURITY;
ALTER TABLE ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE viaticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE designaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;

-- Políticas Simples (Como es un sistema interno de 1 solo login, permitimos todo al usuario autenticado)
CREATE POLICY "Permitir todo a usuarios autenticados en arbitros" ON arbitros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados en ligas" ON ligas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados en precios" ON precios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados en viaticos" ON viaticos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados en designaciones" ON designaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados en descuentos" ON descuentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permitir lectura pública solo para facilitar inicialización si hiciera falta (opcional)
-- CREATE POLICY "Lectura pública ligas" ON ligas FOR SELECT TO anon USING (true);
