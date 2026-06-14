'use client'

import { useState } from 'react'

export default function FormAltaEncargado({ empresaId }: { empresaId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const body = {
      empresa_id: empresaId,
      razon_social: fd.get('razon_social'),
      cif: fd.get('cif') || null,
      nombre_del_servicio: fd.get('nombre_del_servicio'),
      direccion: fd.get('direccion') || null,
      localidad: fd.get('localidad') || null,
    }
    const res = await fetch('/api/encargados', {
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
      <input name="razon_social" placeholder="Razón social *" required className="input-dark" />
      <input name="cif" placeholder="CIF" className="input-dark" />
      <input name="nombre_del_servicio" placeholder="Nombre del servicio *" required className="input-dark col-span-2" />
      <input name="direccion" placeholder="Dirección" className="input-dark" />
      <input name="localidad" placeholder="Localidad" className="input-dark" />
      {error && <p className="col-span-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
      <div className="col-span-2">
        <button type="submit" disabled={loading} className="w-full py-2 text-sm font-bold text-white rounded disabled:opacity-50" style={{ backgroundColor: '#FF2F92' }}>
          {loading ? 'Guardando...' : 'AÑADIR SERVICIO EXTERNO'}
        </button>
      </div>
    </form>
  )
}
