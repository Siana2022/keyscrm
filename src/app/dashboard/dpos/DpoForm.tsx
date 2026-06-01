'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Dpo = Database['public']['Tables']['dpos']['Row']

export default function DpoForm({ mode, dpo }: { mode: 'create' | 'edit'; dpo?: Dpo }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    const url = mode === 'edit' ? `/api/admin/dpos/${dpo!.id}` : '/api/admin/dpos'
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: data.nombre,
        dni: data.dni || null,
        email: data.email || null,
        telefono: data.telefono || null,
      }),
    })

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
      {mode === 'create' ? '+ Nuevo DPO' : 'Editar'}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {mode === 'create' ? 'Nuevo DPO' : 'Editar DPO'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input name="nombre" required defaultValue={dpo?.nombre}
              className="input" placeholder="Nombre completo del delegado" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
              <input name="dni" defaultValue={dpo?.dni ?? ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="telefono" defaultValue={dpo?.telefono ?? ''} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" defaultValue={dpo?.email ?? ''} className="input" />
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
