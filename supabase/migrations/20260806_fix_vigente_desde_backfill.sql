-- La migración de etapa 4 (ALTER TABLE ... ADD COLUMN vigente_desde date NOT NULL
-- DEFAULT current_date) backfilleó todas las filas existentes usando current_date
-- del servidor de Postgres (UTC). Corriendo de noche en Argentina (UTC-3), eso
-- dejó vigente_desde un día "adelantado" respecto al calendario real de Buenos
-- Aires (ej: 2026-08-07 en vez de 2026-08-06). Como consecuencia, una designación
-- cargada con la fecha de HOY (hora local) no encontraba ningún precio/viático
-- vigente, porque `fecha >= vigente_desde` daba falso hasta pasada la medianoche UTC.
--
-- Estas filas no representan una fecha de vigencia real (son el precio "de
-- siempre" previo a la etapa 5), así que se las lleva a una fecha centinela muy
-- anterior a cualquier designación real, para que cubran cualquier fecha posible.
UPDATE precios SET vigente_desde = '2000-01-01' WHERE vigente_hasta IS NULL;
UPDATE viaticos SET vigente_desde = '2000-01-01' WHERE vigente_hasta IS NULL;
