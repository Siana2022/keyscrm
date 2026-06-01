'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TIPO_DOCUMENTO_LABELS } from '@/lib/utils'
import type { Database, TipoDocumento } from '@/types/database'

type Plantilla = Database['public']['Tables']['plantillas_documento']['Row']

// Variables disponibles para insertar en el contenido
const VARIABLES: { grupo: string; vars: string[] }[] = [
  { grupo: 'Empresa', vars: ['razon_social', 'cifdni', 'direccion_fiscal', 'codigo_postal', 'localidad', 'provincia', 'telefono', 'email_principal', 'pagina_web', 'lssi_datos_registrales', 'nombre_data_manager', 'dni_data_manager'] },
  { grupo: 'Empleado', vars: ['nombre_completo', 'dni', 'cargo_del_usuario', 'teletrabajo'] },
  { grupo: 'DPO', vars: ['nombre_del_delegado', 'dpodni', 'telefono_de_contacto', 'email_de_contacto'] },
  { grupo: 'Encargado', vars: ['etrazon_social', 'cif', 'etdireccion', 'etlocalidad', 'etcodigo_postal', 'etprovincia', 'nombre_del_servicio'] },
  { grupo: 'Equipo', vars: ['tipo_de_equipo', 'codigo_del_equipo', 'responsable_del_equipo'] },
]

const tipos = Object.entries(TIPO_DOCUMENTO_LABELS) as [TipoDocumento, string][]

export default function PlantillaEditor({ plantilla }: { plantilla?: Plantilla }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contenido, setContenido] = useState(plantilla?.contenido ?? '')
  const isEdit = !!plantilla

  function insertarVariable(v: string) {
    const tag = `{{${v}}}`
    const textarea = document.getElementById('contenido') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nuevo = contenido.slice(0, start) + tag + contenido.slice(end)
    setContenido(nuevo)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    const payload = {
      titulo: formData.get('titulo'),
      tipo: formData.get('tipo'),
      activo: formData.get('activo') === 'true',
      contenido,
    }

    const url = isEdit ? `/api/admin/plantillas/${plantilla.id}` : '/api/admin/plantillas'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setLoading(false)
    if (!res.ok) { const e = await res.json(); setError(e.error); return }
    router.push('/dashboard/plantillas')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-[1fr_260px] gap-6 items-start">
      {/* Editor principal */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input name="titulo" required defaultValue={plantilla?.titulo}
              className="input" placeholder="Ej: Contrato de confidencialidad" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select name="tipo" required defaultValue={plantilla?.tipo ?? ''} className="input bg-white">
                <option value="">Selecciona categoría</option>
                {tipos.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select name="activo" defaultValue={String(plantilla?.activo ?? true)} className="input bg-white">
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido
              <span className="ml-2 text-xs text-gray-400 font-normal">Usa {`{{variable}}`} para insertar datos dinámicos</span>
            </label>
            <textarea
              id="contenido"
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              rows={20}
              className="input resize-y font-mono text-xs leading-relaxed"
              placeholder="Escribe el contenido de la plantilla aquí..."
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear plantilla'}
            </button>
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </form>

      {/* Panel de variables */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Variables disponibles</p>
        <p className="text-xs text-gray-400 mb-3">Haz clic para insertar en el cursor</p>
        <div className="space-y-4">
          {VARIABLES.map(grupo => (
            <div key={grupo.grupo}>
              <p className="text-xs font-medium text-gray-600 mb-1.5">{grupo.grupo}</p>
              <div className="flex flex-wrap gap-1">
                {grupo.vars.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertarVariable(v)}
                    className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors font-mono"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
