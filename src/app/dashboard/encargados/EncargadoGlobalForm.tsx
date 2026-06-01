'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Encargado = Database['public']['Tables']['encargados_tratamiento']['Row']

export default function EncargadoGlobalForm({ mode, encargado }: { mode: 'create' | 'edit'; encargado?: Encargado }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    const payload = {
      razon_social: data.razon_social,
      cif: data.cif || null,
      nombre_del_servicio: data.nombre_del_servicio,
      direccion: data.direccion || null,
      localidad: data.localidad || null,
      codigo_postal: data.codigo_postal || null,
      provincia: data.provincia || null,
    }

    const url = mode === 'edit' ? `/api/admin/encargados-global/${encargado!.id}` : '/api/admin/encargados-global'
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setLoading(false)
    if (!res.ok) { const e = await res.json(); setError(e.error); return }
    setOpen(false)
    router.refresh()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className={mode === 'create'
        ? 'bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
        : 'text-sm text-blue-600 hover:underline'}>
      {mode === 'create' ? '+ Nuevo encargado' : 'Editar'}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {mode === 'create' ? 'Nuevo encargado de tratamiento' : 'Editar encargado'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón social *</label>
              <input name="razon_social" required defaultValue={encargado?.razon_social} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CIF</label>
              <input name="cif" defaultValue={encargado?.cif ?? ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del servicio *</label>
              <input name="nombre_del_servicio" required defaultValue={encargado?.nombre_del_servicio} className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input name="direccion" defaultValue={encargado?.direccion ?? ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
              <input name="localidad" defaultValue={encargado?.localidad ?? ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
              <input name="codigo_postal" defaultValue={encargado?.codigo_postal ?? ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <input name="provincia" defaultValue={encargado?.provincia ?? ''} className="input" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
