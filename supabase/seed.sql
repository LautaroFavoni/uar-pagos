-- Datos Iniciales (Seed) para el Sistema de Gestión de Pagos

-- 1. Árbitros (32 en total)
INSERT INTO arbitros (nombre) VALUES
('Favoni Lautaro'), ('Salazar Kevin'), ('Salinas Sebastian'), ('Lavaca Tobias'),
('Ocampo Pablo'), ('Ayala Milena'), ('Tejerina Guillermo'), ('Alarcon Juan'),
('Gramajo Tamara'), ('Bosso Gisela'), ('Mercado Hernan'), ('Mamanna Axel'),
('Langelotti Valentino'), ('Cassino Gustavo'), ('Sciretta Gerardo'), ('Adorna Federico'),
('Portillo Alejandro'), ('Blanco Juan'), ('Gonzalez Ignacio'), ('Gauto Sergio'),
('Diaz Adrian'), ('Ruiz Diaz Lautaro'), ('Nieto Ezequiel'), ('Fernando Aranda'),
('Crola Jonatan'), ('Cabral Diego'), ('Cardozo German Ezequiel'), ('Trossero Gabriel Oscar'),
('Di Santo Gonzalo'), ('Diaz Federico'), ('Ojeda Francisco'), ('Sanchez Juan Carlos');

-- 2. Ligas
-- Principales
INSERT INTO ligas (nombre, tipo) VALUES ('Chanarense', 'principal');
INSERT INTO ligas (nombre, tipo) VALUES ('Totorense', 'principal');
INSERT INTO ligas (nombre, tipo) VALUES ('Villa Constitucion', 'principal');
-- Por Partido
INSERT INTO ligas (nombre, tipo) VALUES ('Ovalo', 'por_partido');
INSERT INTO ligas (nombre, tipo) VALUES ('Estancia Ibarlucea', 'por_partido');
INSERT INTO ligas (nombre, tipo) VALUES ('CAF Fisherton', 'por_partido');
-- Inferiores
INSERT INTO ligas (nombre, tipo) VALUES ('Totoras Inferiores', 'inferiores');
INSERT INTO ligas (nombre, tipo) VALUES ('Chanar Inferiores', 'inferiores');
INSERT INTO ligas (nombre, tipo) VALUES ('Villa Inferiores', 'inferiores');
-- Femenino
INSERT INTO ligas (nombre, tipo) VALUES ('Totoras Femenino', 'femenino');

-- 3. Precios
-- Usamos DO block para relacionar por nombre
DO $$
DECLARE
  v_chanarense uuid;
  v_totorense uuid;
  v_villa uuid;
  v_ovalo uuid;
  v_estancia uuid;
  v_fisherton uuid;
  v_tot_inf uuid;
  v_chan_inf uuid;
  v_villa_inf uuid;
  v_tot_fem uuid;
BEGIN
  SELECT id INTO v_chanarense FROM ligas WHERE nombre = 'Chanarense';
  SELECT id INTO v_totorense FROM ligas WHERE nombre = 'Totorense';
  SELECT id INTO v_villa FROM ligas WHERE nombre = 'Villa Constitucion';
  SELECT id INTO v_ovalo FROM ligas WHERE nombre = 'Ovalo';
  SELECT id INTO v_estancia FROM ligas WHERE nombre = 'Estancia Ibarlucea';
  SELECT id INTO v_fisherton FROM ligas WHERE nombre = 'CAF Fisherton';
  SELECT id INTO v_tot_inf FROM ligas WHERE nombre = 'Totoras Inferiores';
  SELECT id INTO v_chan_inf FROM ligas WHERE nombre = 'Chanar Inferiores';
  SELECT id INTO v_villa_inf FROM ligas WHERE nombre = 'Villa Inferiores';
  SELECT id INTO v_tot_fem FROM ligas WHERE nombre = 'Totoras Femenino';

  -- Precios Principales
  INSERT INTO precios (liga_id, rol, monto) VALUES
  (v_chanarense, 'ARB 1RA', 220000), (v_chanarense, 'ARB 2 Y AA', 160000), (v_chanarense, 'AA1 Y AA2', 120000), (v_chanarense, 'AA2 Y 4TO', 120000),
  (v_totorense, 'ARB 1RA', 210000), (v_totorense, 'ARB 2 Y AA', 150000), (v_totorense, 'AA1 Y AA2', 110000), (v_totorense, 'AA2 Y 4TO', 110000),
  (v_villa, 'ARB 1RA', 210000), (v_villa, 'ARB 2 Y AA', 150000), (v_villa, 'AA1 Y AA2', 110000);

  -- Precios Por Partido
  INSERT INTO precios (liga_id, rol, monto) VALUES
  (v_ovalo, 'Arbitro', 28000),
  (v_estancia, 'Arbitro', 30000),
  (v_fisherton, 'Arbitro', 34000);

  -- Precios Inferiores
  INSERT INTO precios (liga_id, rol, monto) VALUES
  (v_tot_inf, '5ta', 140000), (v_tot_inf, '6ta', 110000), (v_tot_inf, '7ma', 80000), (v_tot_inf, '8va', 40000),
  (v_chan_inf, '5ta', 120000), (v_chan_inf, '6ta', 100000), (v_chan_inf, '7ma', 70000),
  (v_villa_inf, 'Sub 18', 130000), (v_villa_inf, 'Sub 16', 110000), (v_villa_inf, '6ta y 7ma', 90000);

  -- Precios Femenino
  INSERT INTO precios (liga_id, rol, monto) VALUES
  (v_tot_fem, 'Arbitro', 110000), (v_tot_fem, 'Asistente', 30000);
END $$;


-- 4. Viáticos
INSERT INTO viaticos (localidad, monto) VALUES
('San Jose', 110000),
('Totoras', 110000),
('Chanar Ladeado', 80000),
('Villa Constitucion', 80000),
('Ibarlucea', 30000),
('Fisherton', 30000),
('Sin viatico', 0);
