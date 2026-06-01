export type EstadoRegistro = 'active' | 'pending' | 'baja'
export type RolUsuario = 'empresa' | 'gestion_safe' | 'admin'
export type TipoDocumento =
  | 'analisis_riesgos' | 'auditoria' | 'certificado' | 'derechos'
  | 'dpd' | 'consentimiento' | 'evaluaciones_impacto' | 'manuales'
  | 'procedimientos' | 'registro_actividades' | 'violaciones_seguridad'
  | 'servicios_externos' | 'textos_informativos' | 'usuarios' | 'varios' | 'web'
export type TipoAuditoria = 'auditoria' | 'revision_trimestral'
export type TipoNotificacion =
  | 'alta_empleado' | 'baja_empleado'
  | 'alta_equipo' | 'baja_equipo'
  | 'alta_servicio_externo' | 'baja_servicio_externo'
  | 'alta_encargado' | 'baja_encargado'
export type EstadoNotificacion = 'pendiente' | 'enviada' | 'error'

type DpoRow = {
  id: string
  nombre: string
  dni: string | null
  telefono: string | null
  email: string | null
  created_at: string
  updated_at: string
}

type EmpresaRow = {
  id: string
  razon_social: string
  nombre_comercial: string | null
  cifdni: string | null
  direccion_fiscal: string | null
  codigo_postal: string | null
  localidad: string | null
  provincia: string | null
  telefono: string | null
  email_principal: string | null
  email_data_manager: string | null
  nombre_pila_data_manager: string | null
  pagina_web: string | null
  lssi_datos_registrales: string | null
  grupo_de_empresas: string | null
  dpo_id: string | null
  created_at: string
  updated_at: string
}

type EmpleadoRow = {
  id: string
  empresa_id: string
  nombre_completo: string
  dni: string | null
  cargo: string | null
  teletrabajo: boolean
  estado: EstadoRegistro
  created_at: string
  updated_at: string
}

type EncargadoRow = {
  id: string
  razon_social: string
  cif: string | null
  nombre_del_servicio: string
  direccion: string | null
  localidad: string | null
  codigo_postal: string | null
  provincia: string | null
  created_at: string
  updated_at: string
}

type EmpresaEncargadoRow = {
  id: string
  empresa_id: string
  encargado_id: string
  estado: EstadoRegistro
  es_servicio_externo: boolean
  created_at: string
  updated_at: string
}

type PlantillaRow = {
  id: string
  titulo: string
  contenido: string
  tipo: TipoDocumento
  activo: boolean
  created_at: string
  updated_at: string
}

type EmpresaPlantillaRow = {
  id: string
  empresa_id: string
  plantilla_id: string
  estado: EstadoRegistro
  asignado_en: string
  created_at: string
  updated_at: string
}

type EmpleadoPlantillaRow = {
  id: string
  empleado_id: string
  plantilla_id: string
  estado: EstadoRegistro
  asignado_en: string
  created_at: string
  updated_at: string
}

type EmpresaEncargadoPlantillaRow = {
  id: string
  empresa_encargado_id: string
  plantilla_id: string
  estado: EstadoRegistro
  asignado_en: string
  created_at: string
  updated_at: string
}

type EquipoRow = {
  id: string
  empresa_id: string
  tipo_de_equipo: string
  codigo_del_equipo: string | null
  responsable: string | null
  estado: EstadoRegistro
  created_at: string
  updated_at: string
}

type RevisionRow = {
  id: string
  empresa_id: string
  fecha: string
  tipo: TipoAuditoria
  notas: string | null
  created_at: string
  updated_at: string
}

type PerfilUsuarioRow = {
  id: string
  rol: RolUsuario
  nombre: string | null
  email: string | null
  created_at: string
  updated_at: string
}

type UsuarioEmpresaRow = {
  id: string
  usuario_id: string
  empresa_id: string
  created_at: string
}

type NotificacionRow = {
  id: string
  tipo: TipoNotificacion
  estado: EstadoNotificacion
  empresa_id: string
  payload: Record<string, unknown>
  entidad_id: string | null
  enviado_en: string | null
  error_mensaje: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      dpos: {
        Row: DpoRow
        Insert: Omit<DpoRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<DpoRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      empresas: {
        Row: EmpresaRow
        Insert: Omit<EmpresaRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmpresaRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: [{ foreignKeyName: 'empresas_dpo_id_fkey'; columns: ['dpo_id']; referencedRelation: 'dpos'; referencedColumns: ['id'] }]
      }
      empleados: {
        Row: EmpleadoRow
        Insert: Omit<EmpleadoRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmpleadoRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: [{ foreignKeyName: 'empleados_empresa_id_fkey'; columns: ['empresa_id']; referencedRelation: 'empresas'; referencedColumns: ['id'] }]
      }
      encargados_tratamiento: {
        Row: EncargadoRow
        Insert: Omit<EncargadoRow, 'id' | 'created_at' | 'updated_at' | 'cif'> & { id?: string; cif?: string | null }
        Update: Partial<Omit<EncargadoRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      empresa_encargado: {
        Row: EmpresaEncargadoRow
        Insert: Omit<EmpresaEncargadoRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmpresaEncargadoRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: [
          { foreignKeyName: 'empresa_encargado_empresa_id_fkey'; columns: ['empresa_id']; referencedRelation: 'empresas'; referencedColumns: ['id'] },
          { foreignKeyName: 'empresa_encargado_encargado_id_fkey'; columns: ['encargado_id']; referencedRelation: 'encargados_tratamiento'; referencedColumns: ['id'] }
        ]
      }
      plantillas_documento: {
        Row: PlantillaRow
        Insert: Omit<PlantillaRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PlantillaRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      empresa_plantilla: {
        Row: EmpresaPlantillaRow
        Insert: Omit<EmpresaPlantillaRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmpresaPlantillaRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      empleado_plantilla: {
        Row: EmpleadoPlantillaRow
        Insert: Omit<EmpleadoPlantillaRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmpleadoPlantillaRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      empresa_encargado_plantilla: {
        Row: EmpresaEncargadoPlantillaRow
        Insert: Omit<EmpresaEncargadoPlantillaRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmpresaEncargadoPlantillaRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      equipos: {
        Row: EquipoRow
        Insert: Omit<EquipoRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EquipoRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: [{ foreignKeyName: 'equipos_empresa_id_fkey'; columns: ['empresa_id']; referencedRelation: 'empresas'; referencedColumns: ['id'] }]
      }
      revisiones: {
        Row: RevisionRow
        Insert: Omit<RevisionRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<RevisionRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: [{ foreignKeyName: 'revisiones_empresa_id_fkey'; columns: ['empresa_id']; referencedRelation: 'empresas'; referencedColumns: ['id'] }]
      }
      perfiles_usuario: {
        Row: PerfilUsuarioRow
        Insert: Omit<PerfilUsuarioRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<PerfilUsuarioRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      usuario_empresa: {
        Row: UsuarioEmpresaRow
        Insert: Omit<UsuarioEmpresaRow, 'id' | 'created_at'> & { id?: string }
        Update: never
        Relationships: []
      }
      notificaciones_solicitudes: {
        Row: NotificacionRow
        Insert: Partial<Omit<NotificacionRow, "id" | "created_at" | "updated_at">> & { id?: string; tipo: TipoNotificacion; empresa_id: string; payload: Record<string, unknown> }
        Update: Partial<Omit<NotificacionRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
    }
    Views: {
      v_empleados_con_empresa: {
        Row: {
          id: string
          nombre_completo: string
          dni: string | null
          cargo: string | null
          teletrabajo: boolean
          estado: EstadoRegistro
          empresa_id: string
          empresa_razon_social: string
          empresa_nombre_comercial: string | null
          created_at: string
          updated_at: string
        }
        Relationships: []
      }
      v_encargados_por_empresa: {
        Row: {
          encargado_id: string
          razon_social: string
          nombre_del_servicio: string
          cif: string | null
          empresa_id: string
          empresa_razon_social: string
          estado: EstadoRegistro
          es_servicio_externo: boolean
          empresa_encargado_id: string
        }
        Relationships: []
      }
      v_empresas_con_dpo: {
        Row: {
          id: string
          razon_social: string
          nombre_comercial: string | null
          cifdni: string | null
          email_principal: string | null
          dpo_id: string | null
          dpo_nombre: string | null
          dpo_email: string | null
          dpo_telefono: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      es_gestor: { Args: Record<never, never>; Returns: boolean }
      mis_empresas: { Args: Record<never, never>; Returns: string[] }
    }
    Enums: {
      estado_registro: EstadoRegistro
      rol_usuario: RolUsuario
      tipo_documento: TipoDocumento
      tipo_auditoria: TipoAuditoria
      tipo_notificacion: TipoNotificacion
      estado_notificacion: EstadoNotificacion
    }
    CompositeTypes: Record<string, never>
  }
}
