'use client'

import { TIPO_DOCUMENTO_LABELS } from '@/lib/utils'
import type { TipoDocumento } from '@/types/database'

const TIPOS_ORDEN: TipoDocumento[] = [
  'registro_actividades', 'auditoria', 'certificado', 'analisis_riesgos',
  'consentimiento', 'textos_informativos', 'derechos', 'procedimientos',
  'manuales', 'web', 'evaluaciones_impacto', 'violaciones_seguridad',
  'servicios_externos', 'usuarios', 'varios', 'dpd',
]

export default function SeccionDocumentos({
  empresaId,
  plantillasAsignadas,
  docsManuales,
}: {
  empresaId: string
  plantillasAsignadas: any[]
  docsManuales: any[]
}) {
  return (
    <div className="space-y-0">
      {TIPOS_ORDEN.map(tipo => {
        const plantillas = plantillasAsignadas.filter((p: any) =>
          p.plantillas_documento?.tipo === tipo
        )
        const manuales = docsManuales.filter((d: any) => d.categoria === tipo)

        if (!plantillas.length && !manuales.length) return null

        return (
          <div key={tipo} className="border-b border-gray-700">
            <div className="px-6 py-3" style={{ backgroundColor: '#2a2a2a' }}>
              <p className="text-sm font-bold uppercase tracking-wide" style={{ color: '#FF2F92' }}>
                {TIPO_DOCUMENTO_LABELS[tipo]}
              </p>
            </div>
            <div className="px-6 py-3 space-y-2" style={{ backgroundColor: '#1e1e1e' }}>
              {plantillas.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-white text-sm">{p.plantillas_documento?.titulo}</span>
                  <button
                    onClick={() => window.open(`/api/pdf/${empresaId}/${p.plantilla_id}`, '_blank')}
                    className="text-xs text-white px-3 py-1 rounded"
                    style={{ backgroundColor: '#FF2F92' }}
                  >
                    Descargar PDF
                  </button>
                </div>
              ))}
              {manuales.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between">
                  <span className="text-white text-sm">{d.nombre}</span>
                  <a
                    href={d.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white px-3 py-1 rounded"
                    style={{ backgroundColor: '#555' }}
                  >
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
