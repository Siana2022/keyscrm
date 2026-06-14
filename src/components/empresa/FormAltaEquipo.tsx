'use client'

import { useState } from 'react'

const TIPOS_EQUIPO = ['Ordenador Portátil', 'Ordenador Sobremesa', 'Móvil', 'Tablet', 'Servidor', 'Disco Duro', 'Otros']

export default function FormAltaEquipo({ empresaId }: { empresaId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const body = {
      empresa_id: empresaId,
      tipo_de_equipo: fd.get('tipo_de_equipo'),
      codigo_del_equipo: fd.get('codigo_del_equipo') || null,
      responsable: fd.get('responsable') || null,
    }
    const res = await fetch('/api/equipos', {
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
      <select name="tipo_de_equipo" required className="input-dark col-span-2">
        <option value="">Tipo de equipo *</option>
        {TIPOS_EQUIPO.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input name="codigo_del_equipo" placeholder="Código del equipo" className="input-dark" />
      <input name="responsable" placeholder="Responsable" className="input-dark" />
      {error && <p className="col-span-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
      <div className="col-span-2">
        <button type="submit" disabled={loading} className="w-full py-2 text-sm font-bold text-white rounded disabled:opacity-50" style={{ backgroundColor: '#FF2F92' }}>
          {loading ? 'Guardando...' : 'AÑADIR EQUIPO'}
        </button>
      </div>
    </form>
  )
}
