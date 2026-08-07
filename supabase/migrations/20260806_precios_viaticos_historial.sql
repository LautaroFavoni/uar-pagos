-- Etapa 5: usar vigente_desde/vigente_hasta para versionar precios y viáticos
-- (en vez de UPDATE que pisa el histórico, se cierra el vigente y se inserta uno nuevo).
--
-- precios tenía UNIQUE(liga_id, rol) y viaticos UNIQUE(localidad): esto impedía
-- tener una fila histórica (cerrada) y una vigente al mismo tiempo para el mismo
-- rol/localidad. Se reemplaza por un índice único parcial que solo exige unicidad
-- entre las filas vigentes (vigente_hasta IS NULL) — puede haber cualquier
-- cantidad de filas cerradas (historial) para el mismo liga_id+rol / localidad.

ALTER TABLE precios DROP CONSTRAINT IF EXISTS precios_liga_id_rol_key;
CREATE UNIQUE INDEX IF NOT EXISTS precios_liga_id_rol_vigente_key
  ON precios (liga_id, rol) WHERE vigente_hasta IS NULL;

ALTER TABLE viaticos DROP CONSTRAINT IF EXISTS viaticos_localidad_key;
CREATE UNIQUE INDEX IF NOT EXISTS viaticos_localidad_vigente_key
  ON viaticos (localidad) WHERE vigente_hasta IS NULL;
