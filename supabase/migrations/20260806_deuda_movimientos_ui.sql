-- Etapa 6: exponer la trazabilidad de deuda_movimientos en la UI.
--
-- 1. Backfill: las deudas creadas antes de esta etapa no tienen su movimiento
--    'alta' (esto recién se empieza a insertar desde la app a partir de ahora),
--    así que el saldo no "cuadraba" con la suma de sus movimientos. Se completa
--    una única vez con el monto_inicial y la fecha de creación real de la deuda.
INSERT INTO deuda_movimientos (deuda_id, tipo, monto, created_at)
SELECT dp.id, 'alta', dp.monto_inicial, dp.created_at
FROM deudas_pendientes dp
WHERE NOT EXISTS (
  SELECT 1 FROM deuda_movimientos dm WHERE dm.deuda_id = dp.id AND dm.tipo = 'alta'
);

-- 2. Cobro/ajuste manual de una deuda fuera del cierre de semana: inserta el
-- movimiento y actualiza deudas_pendientes.monto_actual atómicamente, para que
-- el saldo nunca pueda desincronizarse de la suma de sus movimientos.
CREATE OR REPLACE FUNCTION registrar_movimiento_deuda(
  p_deuda_id uuid,
  p_tipo text,
  p_monto int,
  p_semana int DEFAULT NULL,
  p_anio int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_saldo_actual int;
BEGIN
  IF p_tipo NOT IN ('cobro', 'ajuste') THEN
    RAISE EXCEPTION 'tipo de movimiento inválido: %', p_tipo;
  END IF;

  SELECT monto_actual INTO v_saldo_actual FROM deudas_pendientes WHERE id = p_deuda_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'la deuda % no existe', p_deuda_id;
  END IF;

  IF p_tipo = 'cobro' AND p_monto > v_saldo_actual THEN
    RAISE EXCEPTION 'el cobro (%) supera el saldo actual (%)', p_monto, v_saldo_actual;
  END IF;

  INSERT INTO deuda_movimientos (deuda_id, tipo, monto, semana, anio)
  VALUES (p_deuda_id, p_tipo, p_monto, p_semana, p_anio);

  -- 'cobro' siempre reduce el saldo (monto positivo = importe cobrado).
  -- 'ajuste' es un monto con signo: positivo aumenta la deuda, negativo la reduce.
  UPDATE deudas_pendientes
  SET monto_actual = monto_actual + CASE WHEN p_tipo = 'cobro' THEN -p_monto ELSE p_monto END
  WHERE id = p_deuda_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION registrar_movimiento_deuda(uuid, text, int, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION registrar_movimiento_deuda(uuid, text, int, int, int) TO authenticated;
