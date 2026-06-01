-- ============================================================
-- MIGRACIÓN 003: Tabla de guías/manuales
-- ============================================================

CREATE TABLE IF NOT EXISTS guias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT NOT NULL,               -- M1, M2, M3...
  titulo      TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('data_manager', 'usuario')),
  archivo_url TEXT,                        -- URL del PDF en Supabase Storage
  imagen_url  TEXT,                        -- URL de la imagen de portada
  orden       INT NOT NULL DEFAULT 0,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guias_tipo  ON guias(tipo);
CREATE INDEX IF NOT EXISTS idx_guias_orden ON guias(orden);

CREATE TRIGGER trg_guias_updated_at
  BEFORE UPDATE ON guias FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE guias ENABLE ROW LEVEL SECURITY;

-- Gestores pueden hacer todo
CREATE POLICY "guias_gestores_todo"
  ON guias FOR ALL TO authenticated
  USING (es_gestor()) WITH CHECK (es_gestor());

-- Empresas solo leen guías activas
CREATE POLICY "guias_empresa_lectura"
  ON guias FOR SELECT TO authenticated
  USING (activo = TRUE);

-- Datos iniciales (los 6 manuales actuales)
INSERT INTO guias (codigo, titulo, tipo, orden) VALUES
  ('M1', 'Guía para el Data Manager',       'data_manager', 1),
  ('M2', 'Cómo crear y gestionar usuarios', 'data_manager', 2),
  ('M3', 'Uso correcto de los equipos',     'data_manager', 3),
  ('M4', 'Manual del usuario',              'usuario',      1),
  ('M5', 'Guía de buenas prácticas',        'usuario',      2),
  ('M6', 'Manual de seguridad',             'usuario',      3);
