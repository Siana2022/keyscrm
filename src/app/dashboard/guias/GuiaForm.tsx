'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Guia = Database['public']['Tables']['guias']['Row']

export default function GuiaForm({ mode, guia }: { mode: 'create' | 'edit'; guia?: Guia }) {
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
      codigo: data.codigo,
      titulo: data.titulo,
      tipo: data.tipo,
      archivo_url: data.archivo_url || null,
      imagen_url: data.imagen_url || null,
      orden: parseInt(data.orden as string) || 0,
      activo: data.activo === 'true',
    }

    const url = mode === 'edit' ? `/api/admin/guias/${guia!.id}` : '/api/admin/guias'
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setLoading(false)
    if (!res.ok) { const e = await res.json(); setError(e.error); return }
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta guía?')) return
    await fetch(`/api/admin/guias/${guia!.id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className={mode === 'create'
        ? 'bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
        : 'text-sm text-blue-600 hover:underline'}>
      {mode === 'create' ? '+ Nueva guía' : 'Editar'}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {mode === 'create' ? 'Nueva guía' : 'Editar guía'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input name="codigo" required defaultValue={guia?.codigo} placeholder="M1, M2..." className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <input name="orden" type="number" defaultValue={guia?.orden ?? 0} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input name="titulo" required defaultValue={guia?.titulo} className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select name="tipo" defaultValue={guia?.tipo ?? 'data_manager'} className="input bg-white">
                <option value="data_manager">Data Manager</option>
                <option value="usuario">Usuario</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select name="activo" defaultValue={String(guia?.activo ?? true)} className="input bg-white">
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del archivo PDF
              <span className="ml-1 text-xs text-gray-400">(Sube el PDF a Supabase Storage y pega la URL pública aquí)</span>
            </label>
            <input name="archivo_url" defaultValue={guia?.archivo_url ?? ''} className="input" placeholder="https://..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de imagen de portada
              <span className="ml-1 text-xs text-gray-400">(opcional)</span>
            </label>
            <input name="imagen_url" defaultValue={guia?.imagen_url ?? ''} className="input" placeholder="https://..." />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            {mode === 'edit' && (
              <button type="button" onClick={handleDelete}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                Eliminar
              </button>
            )}
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
