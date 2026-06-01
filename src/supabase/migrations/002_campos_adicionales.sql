-- ============================================================
-- MIGRACIÓN 002: Campos adicionales
-- Versión: 2.0
-- Fecha: 2026-06-01
-- ============================================================

-- ============================================================
-- 1. EMPRESAS: nuevos campos
-- ============================================================

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS web_2                  TEXT,
  ADD COLUMN IF NOT EXISTS web_3                  TEXT,
  ADD COLUMN IF NOT EXISTS web_4                  TEXT,
  ADD COLUMN IF NOT EXISTS nombre_data_manager    TEXT,
  ADD COLUMN IF NOT EXISTS apellidos_data_manager TEXT,
  ADD COLUMN IF NOT EXISTS dni_data_manager       TEXT;

-- ============================================================
-- 2. EQUIPOS: renombrar responsable + añadir otro
-- ============================================================

ALTER TABLE equipos
  RENAME COLUMN responsable TO responsable_del_equipo;

ALTER TABLE equipos
  ADD COLUMN IF NOT EXISTS otro TEXT;

-- ============================================================
-- 3. REVISIONES: nuevos campos
-- ============================================================

ALTER TABLE revisiones
  ADD COLUMN IF NOT EXISTS tipo_de_revision TEXT,
  ADD COLUMN IF NOT EXISTS estado_resultado  TEXT;

-- ============================================================
-- 4. PLANTILLAS_DOCUMENTO: campo variables
-- ============================================================

ALTER TABLE plantillas_documento
  ADD COLUMN IF NOT EXISTS variables TEXT[];

-- ============================================================
-- 5. NUEVA TABLA: documentos_manuales
-- ============================================================

CREATE TABLE IF NOT EXISTS documentos_manuales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria   tipo_documento NOT NULL,
  nombre      TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_manuales_empresa_id ON documentos_manuales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_docs_manuales_categoria  ON documentos_manuales(categoria);

CREATE TRIGGER trg_docs_manuales_updated_at
  BEFORE UPDATE ON documentos_manuales FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS para documentos_manuales
ALTER TABLE documentos_manuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_manuales_gestores_todo"
  ON documentos_manuales FOR ALL
  TO authenticated
  USING (es_gestor()) WITH CHECK (es_gestor());

CREATE POLICY "docs_manuales_empresa_lectura"
  ON documentos_manuales FOR SELECT
  TO authenticated
  USING (empresa_id IN (SELECT mis_empresas()));

-- ============================================================
-- FIN DE LA MIGRACIÓN 002
-- ============================================================
