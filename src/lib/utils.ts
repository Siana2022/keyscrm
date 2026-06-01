import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EstadoRegistro, TipoDocumento } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ESTADO_LABELS: Record<EstadoRegistro, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  baja: 'Baja',
}

export const ESTADO_COLORS: Record<EstadoRegistro, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  baja: 'bg-red-100 text-red-800',
}

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  analisis_riesgos: 'Análisis de Riesgos',
  auditoria: 'Auditoría',
  certificado: 'Certificado',
  derechos: 'Derechos',
  dpd: 'DPD',
  consentimiento: 'Documentos para Consentimiento',
  evaluaciones_impacto: 'Evaluaciones de Impacto',
  manuales: 'Manuales',
  procedimientos: 'Procedimientos y Políticas Internas',
  registro_actividades: 'Registro de Actividades',
  violaciones_seguridad: 'Violaciones de Seguridad',
  servicios_externos: 'Servicios Externos',
  textos_informativos: 'Textos Informativos',
  usuarios: 'Usuarios',
  varios: 'Varios',
  web: 'Web',
}
