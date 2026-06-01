'use client'

import { useState } from 'react'
import type { Database, TipoDocumento } from '@/types/database'

type Plantilla = Database['public']['Tables']['plantillas_documento']['Row']
type EmpresaPlantilla = Database['public']['Tables']['empresa_plantilla']['Row']
type DocumentoManual = Database['public']['Tables']['documentos_manuales']['Row']

interface PlantillasEmpresaAdminProps {
  empresaId: string
  plantillasAsignadas: (EmpresaPlantilla & { plantilla: Plantilla })[]
  todasPlantillas: Plantilla[]
  documentosManuales: DocumentoManual[]
}

const CATEGORIAS: { tipo: TipoDocumento; label: string }[] = [
  { tipo: 'analisis_riesgos', label: 'Análisis de riesgos' },
  { tipo: 'auditoria', label: 'Auditoría' },
  { tipo: 'certificado', label: 'Certificados' },
  { tipo: 'derechos', label: 'Derechos de los interesados' },
  { tipo: 'dpd', label: 'DPD / DPO' },
  { tipo: 'consentimiento', label: 'Consentimiento' },
  { tipo: 'evaluaciones_impacto', label: 'Evaluaciones de impacto' },
  { tipo: 'manuales', label: 'Manuales' },
  { tipo: 'procedimientos', label: 'Procedimientos' },
  { tipo: 'registro_actividades', label: 'Registro de actividades' },
  { tipo: 'violaciones_seguridad', label: 'Violaciones de seguridad' },
  { tipo: 'servicios_externos', label: 'Servicios externos' },
  { tipo: 'textos_informativos', label: 'Textos informativos' },
  { tipo: 'usuarios', label: 'Usuarios' },
  { tipo: 'varios', label: 'Varios' },
  { tipo: 'web', label: 'Web' },
]

export default function PlantillasEmpresaAdmin({
  empresaId,
  plantillasAsignadas: iniciales,
  todasPlantillas,
  documentosManuales: manualesIniciales,
}: PlantillasEmpresaAdminProps) {
  const [asignadas, setAsignadas] = useState(iniciales)
  const [manuales, setManuales] = useState(manualesIniciales)
  const [openSelector, setOpenSelector] = useState<TipoDocumento | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState<TipoDocumento | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function asignarPlantilla(plantillaId: string) {
    setError(null)
    const res = await fetch('/api/admin/empresa-plantilla', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id: empresaId, plantilla_id: plantillaId }),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Error al asignar')
      return
    }
    const data = await res.json()
    const plantilla = todasPlantillas.find(p => p.id === plantillaId)!
    setAsignadas(prev => [...prev, { ...data, plantilla }])
    setOpenSelector(null)
  }

  async function desasignarPlantilla(empresaPlantillaId: string) {
    const res = await fetch('/api/admin/empresa-plantilla', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_plantilla_id: empresaPlantillaId }),
    })
    if (res.ok) {
      setAsignadas(prev => prev.filter(a => a.id !== empresaPlantillaId))
    }
  }

  async function subirPdf(tipo: TipoDocumento, file: File) {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('empresa_id', empresaId)
      formData.append('categoria', tipo)
      formData.append('nombre', file.name)
      const res = await fetch('/api/admin/documentos-manuales', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Error al subir')
        return
      }
      const doc: DocumentoManual = await res.json()
      setManuales(prev => [...prev, doc])
    } finally {
      setUploading(false)
      setUploadingPdf(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {CATEGORIAS.map(cat => {
        const plantillasCategoria = asignadas.filter(a => a.plantilla.tipo === cat.tipo)
        const manualesCategoria = manuales.filter(m => m.categoria === cat.tipo)
        const disponibles = todasPlantillas.filter(
          p => p.tipo === cat.tipo && p.activo && !asignadas.find(a => a.plantilla_id === p.id)
        )

        return (
          <CategoriaSection
            key={cat.tipo}
            label={cat.label}
            tipo={cat.tipo}
            plantillasAsignadas={plantillasCategoria}
            disponibles={disponibles}
            manuales={manualesCategoria}
            openSelector={openSelector}
            setOpenSelector={setOpenSelector}
            onAsignar={asignarPlantilla}
            onDesasignar={desasignarPlantilla}
            uploadingPdf={uploadingPdf}
            setUploadingPdf={setUploadingPdf}
            onSubirPdf={subirPdf}
            uploading={uploading}
          />
        )
      })}
    </div>
  )
}

function CategoriaSection({
  label,
  tipo,
  plantillasAsignadas,
  disponibles,
  manuales,
  openSelector,
  setOpenSelector,
  onAsignar,
  onDesasignar,
  uploadingPdf,
  setUploadingPdf,
  onSubirPdf,
  uploading,
}: {
  label: string
  tipo: TipoDocumento
  plantillasAsignadas: (Database['public']['Tables']['empresa_plantilla']['Row'] & { plantilla: Plantilla })[]
  disponibles: Plantilla[]
  manuales: DocumentoManual[]
  openSelector: TipoDocumento | null
  setOpenSelector: (t: TipoDocumento | null) => void
  onAsignar: (id: string) => void
  onDesasignar: (id: string) => void
  uploadingPdf: TipoDocumento | null
  setUploadingPdf: (t: TipoDocumento | null) => void
  onSubirPdf: (tipo: TipoDocumento, file: File) => void
  uploading: boolean
}) {
  const isEmpty = plantillasAsignadas.length === 0 && manuales.length === 0

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpenSelector(openSelector === tipo ? null : tipo)}
            className="text-xs text-blue-600 hover:underline"
          >
            + Plantilla
          </button>
          <button
            type="button"
            onClick={() => setUploadingPdf(uploadingPdf === tipo ? null : tipo)}
            className="text-xs text-gray-600 hover:underline"
          >
            + PDF manual
          </button>
        </div>
      </div>

      {openSelector === tipo && (
        <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
          {disponibles.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-blue-700 font-medium mb-2">Seleccionar plantilla:</p>
              {disponibles.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onAsignar(p.id)}
                  className="block w-full text-left text-xs px-3 py-1.5 rounded hover:bg-blue-100 text-blue-800 transition-colors"
                >
                  {p.titulo}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No hay plantillas disponibles para esta categoría</p>
          )}
        </div>
      )}

      {uploadingPdf === tipo && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <label className="block text-xs text-gray-600 mb-2">Seleccionar PDF:</label>
          <input
            type="file"
            accept=".pdf"
            disabled={uploading}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) onSubirPdf(tipo, file)
            }}
            className="text-xs text-gray-700"
          />
          {uploading && <p className="text-xs text-gray-400 mt-1">Subiendo...</p>}
        </div>
      )}

      {isEmpty ? (
        <p className="text-xs text-gray-400 px-4 py-3">Sin documentos asignados</p>
      ) : (
        <div className="px-4 py-3 space-y-2">
          {plantillasAsignadas.map(a => (
            <div key={a.id} className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-700">{a.plantilla.titulo}</span>
              <button
                type="button"
                onClick={() => onDesasignar(a.id)}
                className="text-xs text-red-500 hover:underline ml-4"
              >
                Quitar
              </button>
            </div>
          ))}
          {manuales.map(m => (
            <div key={m.id} className="flex items-center justify-between py-1">
              <a
                href={m.archivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-700 hover:text-blue-600 hover:underline"
              >
                📄 {m.nombre}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
