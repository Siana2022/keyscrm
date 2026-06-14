'use client'

import { useState } from 'react'

export default function FormAltaEmpleado({ empresaId }: { empresaId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const body = {
      empresa_id: empresaId,
      nombre_completo: fd.get('nombre_completo'),
      dni: fd.get('dni') || null,
      cargo: fd.get('cargo') || null,
      teletrabajo: fd.get('teletrabajo') === 'true',
    }
    const res = await fetch('/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al guardar')
      return
    }
    e.currentTarget.reset()
    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
      <input name="nombre_completo" placeholder="Nombre completo *" required className="input-dark" />
      <input name="dni" placeholder="DNI" className="input-dark" />
      <input name="cargo" placeholder="Cargo" className="input-dark" />
      <label className="flex items-center gap-2 text-gray-600 text-sm">
        <input type="checkbox" name="teletrabajo" value="true" className="rounded" />
        Teletrabajo
      </label>
      {error && <p className="col-span-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
      <div className="col-span-2">
        <button type="submit" disabled={loading} className="w-full py-2 text-sm font-bold text-white rounded disabled:opacity-50" style={{ backgroundColor: '#FF2F92' }}>
          {loading ? 'Guardando...' : 'AÑADIR USUARIO'}
        </button>
      </div>
    </form>
  )
}
