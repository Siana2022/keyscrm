-- ============================================================
-- ESQUEMA POSTGRESQL PARA SUPABASE - CRM SAFE LOPD
-- Versión: 1.0
-- Fecha: 2026-06-01
-- ============================================================

-- ============================================================
-- TIPOS ENUM
-- ============================================================

CREATE TYPE estado_registro AS ENUM ('active', 'pending', 'baja');
CREATE TYPE rol_usuario AS ENUM ('empresa', 'gestion_safe', 'admin');
CREATE TYPE tipo_documento AS ENUM (
  'analisis_riesgos',
  'auditoria',
  'certificado',
  'derechos',
  'dpd',
  'consentimiento',
  'evaluaciones_impacto',
  'manuales',
  'procedimientos',
  'registro_actividades',
  'violaciones_seguridad',
  'servicios_externos',
  'textos_informativos',
  'usuarios',
  'varios',
  'web'
);
CREATE TYPE tipo_auditoria AS ENUM ('auditoria', 'revision_trimestral');
CREATE TYPE tipo_notificacion AS ENUM (
  'alta_empleado', 'baja_empleado',
  'alta_equipo', 'baja_equipo',
  'alta_servicio_externo', 'baja_servicio_externo',
  'alta_encargado', 'baja_encargado'
);
CREATE TYPE estado_notificacion AS ENUM ('pendiente', 'enviada', 'error');

-- ============================================================
-- FUNCIÓN AUXILIAR: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLA: dpos
-- ============================================================

CREATE TABLE dpos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  dni        TEXT,
  telefono   TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_dpos_updated_at
  BEFORE UPDATE ON dpos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE dpos IS 'Delegados de Protección de Datos. Son pocos (~4) y compartidos por muchas empresas.';

-- ============================================================
-- TABLA: empresas
-- ============================================================

CREATE TABLE empresas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social             TEXT NOT NULL,
  nombre_comercial         TEXT,
  cifdni                   TEXT,
  direccion_fiscal         TEXT,
  codigo_postal            TEXT,
  localidad                TEXT,
  provincia                TEXT,
  telefono                 TEXT,
  email_principal          TEXT,
  email_data_manager       TEXT,
  nombre_pila_data_manager TEXT,
  pagina_web               TEXT,
  lssi_datos_registrales   TEXT,
  grupo_de_empresas        TEXT,
  dpo_id                   UUID REFERENCES dpos(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empresas_dpo_id      ON empresas(dpo_id);
CREATE INDEX idx_empresas_cifdni      ON empresas(cifdni);
CREATE INDEX idx_empresas_razon_social ON empresas(razon_social);

CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLA: empleados
-- ============================================================

CREATE TABLE empleados (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  dni             TEXT,
  cargo           TEXT,
  teletrabajo     BOOLEAN NOT NULL DEFAULT FALSE,
  estado          estado_registro NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empleados_empresa_id ON empleados(empresa_id);
CREATE INDEX idx_empleados_estado     ON empleados(estado);
CREATE INDEX idx_empleados_dni        ON empleados(dni);

CREATE TRIGGER trg_empleados_updated_at
  BEFORE UPDATE ON empleados FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLA: encargados_tratamiento
-- Unifica los CPT "encargados_tratamien" y los repeaters "servicios_externos"
-- ============================================================

CREATE TABLE encargados_tratamiento (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social        TEXT NOT NULL,
  cif                 TEXT,
  nombre_del_servicio TEXT NOT NULL,
  direccion           TEXT,
  localidad           TEXT,
  codigo_postal       TEXT,
  provincia           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_encargados_razon_social ON encargados_tratamiento(razon_social);
CREATE INDEX idx_encargados_cif          ON encargados_tratamiento(cif);

CREATE TRIGGER trg_encargados_updated_at
  BEFORE UPDATE ON encargados_tratamiento FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE encargados_tratamiento IS
  'Unifica CPT encargados_tratamien y repeater servicios_externos del sistema anterior. '
  'La relación con empresas y metadata se gestiona en empresa_encargado.';

-- ============================================================
-- TABLA PIVOT: empresa_encargado (M2M con metadata)
-- ============================================================

CREATE TABLE empresa_encargado (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  encargado_id        UUID NOT NULL REFERENCES encargados_tratamiento(id) ON DELETE CASCADE,
  estado              estado_registro NOT NULL DEFAULT 'active',
  es_servicio_externo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, encargado_id)
);

CREATE INDEX idx_emp_enc_empresa_id   ON empresa_encargado(empresa_id);
CREATE INDEX idx_emp_enc_encargado_id ON empresa_encargado(encargado_id);

CREATE TRIGGER trg_empresa_encargado_updated_at
  BEFORE UPDATE ON empresa_encargado FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN empresa_encargado.es_servicio_externo IS
  'TRUE si era un "servicio externo" en el sistema anterior (vínculo exclusivo de empresa).';

-- ============================================================
-- TABLA: plantillas_documento
-- ============================================================

CREATE TABLE plantillas_documento (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     TEXT NOT NULL,
  contenido  TEXT NOT NULL DEFAULT '',
  tipo       tipo_documento NOT NULL,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plantillas_tipo   ON plantillas_documento(tipo);
CREATE INDEX idx_plantillas_activo ON plantillas_documento(activo);

CREATE TRIGGER trg_plantillas_updated_at
  BEFORE UPDATE ON plantillas_documento FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN plantillas_documento.contenido IS
  'HTML/Markdown con variables {{nombre_campo}} que se sustituyen al generar el PDF.';

-- ============================================================
-- TABLA PIVOT: empresa_plantilla
-- ============================================================

CREATE TABLE empresa_plantilla (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plantilla_id UUID NOT NULL REFERENCES plantillas_documento(id) ON DELETE CASCADE,
  estado       estado_registro NOT NULL DEFAULT 'active',
  asignado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, plantilla_id)
);

CREATE INDEX idx_emp_pla_empresa_id   ON empresa_plantilla(empresa_id);
CREATE INDEX idx_emp_pla_plantilla_id ON empresa_plantilla(plantilla_id);

CREATE TRIGGER trg_empresa_plantilla_updated_at
  BEFORE UPDATE ON empresa_plantilla FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLA PIVOT: empleado_plantilla
-- ============================================================

CREATE TABLE empleado_plantilla (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id  UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  plantilla_id UUID NOT NULL REFERENCES plantillas_documento(id) ON DELETE CASCADE,
  estado       estado_registro NOT NULL DEFAULT 'active',
  asignado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empleado_id, plantilla_id)
);

CREATE INDEX idx_empl_pla_empleado_id  ON empleado_plantilla(empleado_id);
CREATE INDEX idx_empl_pla_plantilla_id ON empleado_plantilla(plantilla_id);

CREATE TRIGGER trg_empleado_plantilla_updated_at
  BEFORE UPDATE ON empleado_plantilla FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLA PIVOT: empresa_encargado_plantilla (triple relación)
-- ============================================================

CREATE TABLE empresa_encargado_plantilla (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_encargado_id UUID NOT NULL REFERENCES empresa_encargado(id) ON DELETE CASCADE,
  plantilla_id         UUID NOT NULL REFERENCES plantillas_documento(id) ON DELETE CASCADE,
  estado               estado_registro NOT NULL DEFAULT 'active',
  asignado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_encargado_id, plantilla_id)
);

CREATE INDEX idx_eep_empresa_encargado_id ON empresa_encargado_plantilla(empresa_encargado_id);
CREATE INDEX idx_eep_plantilla_id         ON empresa_encargado_plantilla(plantilla_id);

CREATE TRIGGER trg_eep_updated_at
  BEFORE UPDATE ON empresa_encargado_plantilla FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE empresa_encargado_plantilla IS
  'Plantillas para un encargado específico dentro de una empresa concreta. '
  'Referencia empresa_encargado para que el CASCADE borre esto si se desvincula el encargado.';

-- ============================================================
-- TABLA: equipos
-- ============================================================

CREATE TABLE equipos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_de_equipo    TEXT NOT NULL,
  codigo_del_equipo TEXT,
  responsable       TEXT,
  estado            estado_registro NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipos_empresa_id ON equipos(empresa_id);
CREATE INDEX idx_equipos_estado     ON equipos(estado);

CREATE TRIGGER trg_equipos_updated_at
  BEFORE UPDATE ON equipos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLA: revisiones
-- ============================================================

CREATE TABLE revisiones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  fecha      DATE NOT NULL,
  tipo       tipo_auditoria NOT NULL,
  notas      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revisiones_empresa_id ON revisiones(empresa_id);
CREATE INDEX idx_revisiones_fecha      ON revisiones(fecha);
CREATE INDEX idx_revisiones_tipo       ON revisiones(tipo);

CREATE TRIGGER trg_revisiones_updated_at
  BEFORE UPDATE ON revisiones FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLA: perfiles_usuario (extiende auth.users de Supabase)
-- ============================================================

CREATE TABLE perfiles_usuario (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol        rol_usuario NOT NULL DEFAULT 'empresa',
  nombre     TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_perfiles_rol ON perfiles_usuario(rol);

CREATE TRIGGER trg_perfiles_updated_at
  BEFORE UPDATE ON perfiles_usuario FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE perfiles_usuario IS
  'Extiende auth.users. La PK es el mismo UUID de auth.users. No almacenamos contraseñas.';

-- Trigger: crear perfil automáticamente al registrar usuario en Supabase Auth
CREATE OR REPLACE FUNCTION crear_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_usuario (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auth_nuevo_usuario
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION crear_perfil_usuario();

-- ============================================================
-- TABLA PIVOT: usuario_empresa
-- ============================================================

CREATE TABLE usuario_empresa (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles_usuario(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, empresa_id)
);

CREATE INDEX idx_usr_emp_usuario_id ON usuario_empresa(usuario_id);
CREATE INDEX idx_usr_emp_empresa_id ON usuario_empresa(empresa_id);

COMMENT ON TABLE usuario_empresa IS
  'Controla acceso por empresa para rol "empresa". Gestores (admin/gestion_safe) ignoran esta tabla vía RLS.';

-- ============================================================
-- TABLA: notificaciones_solicitudes
-- ============================================================

CREATE TABLE notificaciones_solicitudes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          tipo_notificacion NOT NULL,
  estado        estado_notificacion NOT NULL DEFAULT 'pendiente',
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  payload       JSONB NOT NULL DEFAULT '{}',
  entidad_id    UUID,
  enviado_en    TIMESTAMPTZ,
  error_mensaje TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_empresa_id ON notificaciones_solicitudes(empresa_id);
CREATE INDEX idx_notif_estado     ON notificaciones_solicitudes(estado);
CREATE INDEX idx_notif_tipo       ON notificaciones_solicitudes(tipo);
CREATE INDEX idx_notif_created_at ON notificaciones_solicitudes(created_at DESC);

CREATE TRIGGER trg_notif_updated_at
  BEFORE UPDATE ON notificaciones_solicitudes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN notificaciones_solicitudes.payload IS
  'Snapshot JSON de los datos en el momento de la solicitud. Persiste aunque la entidad cambie.';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Función: ¿el usuario actual es gestor o admin?
CREATE OR REPLACE FUNCTION es_gestor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles_usuario
    WHERE id = auth.uid() AND rol IN ('admin', 'gestion_safe')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función: UUIDs de empresas accesibles para el usuario actual
CREATE OR REPLACE FUNCTION mis_empresas()
RETURNS SETOF UUID AS $$
  SELECT empresa_id FROM usuario_empresa WHERE usuario_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- dpos
ALTER TABLE dpos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dpos_gestores_todo"    ON dpos FOR ALL      TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "dpos_empresa_lectura"  ON dpos FOR SELECT   TO authenticated USING (id IN (SELECT dpo_id FROM empresas WHERE id IN (SELECT mis_empresas())));

-- empresas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresas_gestores_todo"   ON empresas FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "empresas_empresa_lectura" ON empresas FOR SELECT TO authenticated USING (id IN (SELECT mis_empresas()));

-- empleados
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empleados_gestores_todo"       ON empleados FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "empleados_empresa_lectura"     ON empleados FOR SELECT TO authenticated USING (empresa_id IN (SELECT mis_empresas()));
CREATE POLICY "empleados_empresa_escritura"   ON empleados FOR INSERT TO authenticated WITH CHECK (empresa_id IN (SELECT mis_empresas()));
CREATE POLICY "empleados_empresa_actualizacion" ON empleados FOR UPDATE TO authenticated USING (empresa_id IN (SELECT mis_empresas())) WITH CHECK (empresa_id IN (SELECT mis_empresas()));

-- encargados_tratamiento
ALTER TABLE encargados_tratamiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "encargados_gestores_todo"    ON encargados_tratamiento FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "encargados_empresa_lectura"  ON encargados_tratamiento FOR SELECT TO authenticated USING (id IN (SELECT encargado_id FROM empresa_encargado WHERE empresa_id IN (SELECT mis_empresas())));

-- empresa_encargado
ALTER TABLE empresa_encargado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emp_enc_gestores_todo"    ON empresa_encargado FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "emp_enc_empresa_lectura"  ON empresa_encargado FOR SELECT TO authenticated USING (empresa_id IN (SELECT mis_empresas()));

-- plantillas_documento
ALTER TABLE plantillas_documento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plantillas_gestores_todo"   ON plantillas_documento FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "plantillas_empresa_lectura" ON plantillas_documento FOR SELECT TO authenticated USING (
  id IN (
    SELECT plantilla_id FROM empresa_plantilla WHERE empresa_id IN (SELECT mis_empresas())
    UNION
    SELECT plantilla_id FROM empleado_plantilla WHERE empleado_id IN (SELECT id FROM empleados WHERE empresa_id IN (SELECT mis_empresas()))
    UNION
    SELECT plantilla_id FROM empresa_encargado_plantilla WHERE empresa_encargado_id IN (SELECT id FROM empresa_encargado WHERE empresa_id IN (SELECT mis_empresas()))
  )
);

-- empresa_plantilla
ALTER TABLE empresa_plantilla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emp_pla_gestores_todo"    ON empresa_plantilla FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "emp_pla_empresa_lectura"  ON empresa_plantilla FOR SELECT TO authenticated USING (empresa_id IN (SELECT mis_empresas()));

-- empleado_plantilla
ALTER TABLE empleado_plantilla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empl_pla_gestores_todo"   ON empleado_plantilla FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "empl_pla_empresa_lectura" ON empleado_plantilla FOR SELECT TO authenticated USING (empleado_id IN (SELECT id FROM empleados WHERE empresa_id IN (SELECT mis_empresas())));

-- empresa_encargado_plantilla
ALTER TABLE empresa_encargado_plantilla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eep_gestores_todo"    ON empresa_encargado_plantilla FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "eep_empresa_lectura"  ON empresa_encargado_plantilla FOR SELECT TO authenticated USING (empresa_encargado_id IN (SELECT id FROM empresa_encargado WHERE empresa_id IN (SELECT mis_empresas())));

-- equipos
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipos_gestores_todo"         ON equipos FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "equipos_empresa_lectura"       ON equipos FOR SELECT TO authenticated USING (empresa_id IN (SELECT mis_empresas()));
CREATE POLICY "equipos_empresa_escritura"     ON equipos FOR INSERT TO authenticated WITH CHECK (empresa_id IN (SELECT mis_empresas()));
CREATE POLICY "equipos_empresa_actualizacion" ON equipos FOR UPDATE TO authenticated USING (empresa_id IN (SELECT mis_empresas())) WITH CHECK (empresa_id IN (SELECT mis_empresas()));

-- revisiones
ALTER TABLE revisiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revisiones_gestores_todo"   ON revisiones FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "revisiones_empresa_lectura" ON revisiones FOR SELECT TO authenticated USING (empresa_id IN (SELECT mis_empresas()));

-- perfiles_usuario
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfiles_gestores_todo"   ON perfiles_usuario FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "perfiles_propio"          ON perfiles_usuario FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "perfiles_propio_update"   ON perfiles_usuario FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND rol = (SELECT rol FROM perfiles_usuario WHERE id = auth.uid()));

-- usuario_empresa
ALTER TABLE usuario_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usr_emp_gestores_todo"  ON usuario_empresa FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "usr_emp_propio"         ON usuario_empresa FOR SELECT TO authenticated USING (usuario_id = auth.uid());

-- notificaciones_solicitudes
ALTER TABLE notificaciones_solicitudes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_gestores_todo"      ON notificaciones_solicitudes FOR ALL    TO authenticated USING (es_gestor()) WITH CHECK (es_gestor());
CREATE POLICY "notif_empresa_lectura"    ON notificaciones_solicitudes FOR SELECT TO authenticated USING (empresa_id IN (SELECT mis_empresas()));
CREATE POLICY "notif_empresa_insercion"  ON notificaciones_solicitudes FOR INSERT TO authenticated WITH CHECK (empresa_id IN (SELECT mis_empresas()));

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

CREATE VIEW v_empleados_con_empresa AS
SELECT
  e.id, e.nombre_completo, e.dni, e.cargo, e.teletrabajo, e.estado,
  emp.id AS empresa_id, emp.razon_social AS empresa_razon_social,
  emp.nombre_comercial AS empresa_nombre_comercial,
  e.created_at, e.updated_at
FROM empleados e
JOIN empresas emp ON emp.id = e.empresa_id;

CREATE VIEW v_encargados_por_empresa AS
SELECT
  enc.id AS encargado_id, enc.razon_social, enc.nombre_del_servicio, enc.cif,
  ee.empresa_id, emp.razon_social AS empresa_razon_social,
  ee.estado, ee.es_servicio_externo, ee.id AS empresa_encargado_id
FROM encargados_tratamiento enc
JOIN empresa_encargado ee ON ee.encargado_id = enc.id
JOIN empresas emp ON emp.id = ee.empresa_id;

CREATE VIEW v_empresas_con_dpo AS
SELECT
  emp.id, emp.razon_social, emp.nombre_comercial, emp.cifdni, emp.email_principal,
  d.id AS dpo_id, d.nombre AS dpo_nombre, d.email AS dpo_email, d.telefono AS dpo_telefono
FROM empresas emp
LEFT JOIN dpos d ON d.id = emp.dpo_id;

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
