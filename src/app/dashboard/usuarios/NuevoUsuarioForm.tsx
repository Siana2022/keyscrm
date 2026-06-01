'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NuevoUsuarioForm({ empresas }: { empresas: { id: string; razon_social: string }[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rol, setRol] = useState('empresa')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const empresasSeleccionadas = form.getAll('empresa_ids')

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
        rol: form.get('rol'),
        empresa_ids: empresasSeleccionadas,
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Error al crear usuario')
      return
    }
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        + Nuevo usuario
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Nuevo usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input name="email" type="email" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal *</label>
            <input name="password" type="text" required minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <select name="rol" value={rol} onChange={e => setRol(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="empresa">Empresa</option>
              <option value="gestion_safe">Gestor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {rol === 'empresa' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresas asignadas</label>
              <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                {empresas.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input type="checkbox" name="empresa_ids" value={emp.id} className="rounded" />
                    {emp.razon_social}
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear usuario'}
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
