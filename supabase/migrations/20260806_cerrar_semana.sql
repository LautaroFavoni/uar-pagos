-- Cierre de semana atómico: reemplaza el loop de awaits sueltos en el cliente
-- (cobro de deudas + bulk update de estados) por una única función Postgres,
-- y elimina el doble estado de "pagado" (designaciones.pagado vs designaciones.estado).

CREATE OR REPLACE FUNCTION cerrar_semana(p_semana int, p_anio int)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_arbitro record;
  v_deuda record;
  v_subtotal_honorarios int;
  v_subtotal_viaticos int;
  v_bruto int;
  v_total_descuentos int;
  v_neto_parcial int;
  v_disponible int;
  v_total_deuda_cobrada int;
  v_neto_final int;
  v_monto_a_cobrar int;
BEGIN
  FOR v_arbitro IN
    SELECT DISTINCT arbitro_id
    FROM designaciones
    WHERE semana = p_semana AND anio = p_anio AND estado = 'pendiente'
  LOOP
    -- Subtotales de honorarios/viáticos y bruto, a partir de las designaciones pendientes
    SELECT
      COALESCE(SUM(monto_honorarios), 0),
      COALESCE(SUM(monto_viatico), 0)
    INTO v_subtotal_honorarios, v_subtotal_viaticos
    FROM designaciones
    WHERE arbitro_id = v_arbitro.arbitro_id
      AND semana = p_semana AND anio = p_anio AND estado = 'pendiente';

    v_bruto := v_subtotal_honorarios + v_subtotal_viaticos;

    -- Descuentos manuales pendientes de ese árbitro/semana/año
    SELECT COALESCE(SUM(monto), 0)
    INTO v_total_descuentos
    FROM descuentos
    WHERE arbitro_id = v_arbitro.arbitro_id
      AND semana = p_semana AND anio = p_anio AND estado = 'pendiente';

    v_neto_parcial := v_bruto - v_total_descuentos;
    v_disponible := v_neto_parcial;
    v_total_deuda_cobrada := 0;

    -- Cobro automático de deudas pendientes, más viejas primero, hasta agotar el neto disponible
    IF v_disponible > 0 THEN
      FOR v_deuda IN
        SELECT id, monto_actual
        FROM deudas_pendientes
        WHERE arbitro_id = v_arbitro.arbitro_id AND monto_actual > 0
        ORDER BY created_at ASC, id ASC
        FOR UPDATE
      LOOP
        EXIT WHEN v_disponible <= 0;

        v_monto_a_cobrar := LEAST(v_deuda.monto_actual, v_disponible);

        IF v_monto_a_cobrar > 0 THEN
          INSERT INTO deuda_movimientos (deuda_id, tipo, monto, semana, anio)
          VALUES (v_deuda.id, 'cobro', v_monto_a_cobrar, p_semana, p_anio);

          UPDATE deudas_pendientes
          SET monto_actual = monto_actual - v_monto_a_cobrar
          WHERE id = v_deuda.id;

          v_total_deuda_cobrada := v_total_deuda_cobrada + v_monto_a_cobrar;
          v_disponible := v_disponible - v_monto_a_cobrar;
        END IF;
      END LOOP;
    END IF;

    v_neto_final := v_neto_parcial - v_total_deuda_cobrada;

    INSERT INTO liquidaciones (
      arbitro_id, semana, anio,
      subtotal_honorarios, subtotal_viaticos, total_descuentos,
      total_deuda_cobrada, neto, estado
    ) VALUES (
      v_arbitro.arbitro_id, p_semana, p_anio,
      v_subtotal_honorarios, v_subtotal_viaticos, v_total_descuentos,
      v_total_deuda_cobrada, v_neto_final, 'pendiente'
    )
    ON CONFLICT (arbitro_id, semana, anio) DO NOTHING;

    UPDATE designaciones
    SET estado = 'pagado'
    WHERE arbitro_id = v_arbitro.arbitro_id
      AND semana = p_semana AND anio = p_anio AND estado = 'pendiente';

    UPDATE descuentos
    SET estado = 'liquidado'
    WHERE arbitro_id = v_arbitro.arbitro_id
      AND semana = p_semana AND anio = p_anio AND estado = 'pendiente';
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION cerrar_semana(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cerrar_semana(int, int) TO authenticated;

-- Eliminar el doble estado de pago: la fuente única ahora es liquidaciones.estado
ALTER TABLE designaciones DROP COLUMN IF EXISTS pagado;

-- El link público (/p/[id], rol anon) ya puede leer designaciones/descuentos;
-- ahora también necesita leer liquidaciones para mostrar el estado/método de pago.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liquidaciones' AND policyname = 'Lectura pública liquidaciones') THEN
        CREATE POLICY "Lectura pública liquidaciones" ON liquidaciones FOR SELECT TO anon USING (true);
    END IF;
END $$;
