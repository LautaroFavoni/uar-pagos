-- Asegurar que las columnas existen
ALTER TABLE designaciones ADD COLUMN IF NOT EXISTS equipo_local text;
ALTER TABLE designaciones ADD COLUMN IF NOT EXISTS equipo_visitante text;
ALTER TABLE designaciones ADD COLUMN IF NOT EXISTS hora text;

-- Forzar recarga del caché de PostgREST (Supabase)
NOTIFY pgrst, 'reload schema';
