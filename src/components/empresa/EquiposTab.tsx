'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/utils'

type Equipo = Database['public']['Tables']['equipos']['Row']

export default function EquiposTab({
  empresaId,
  equipos: initialEquipos,
}: {
  empresaId: string
  equipos: Equipo[]
}) {
  const [equipos] = useState(initialEquipos)
  const activos = equipos.filter(e => e.estado === 'active')

  return (
    <section className="bg-white rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Equipos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{activos.length} activos</p>
        </div>
        <AltaEquipoForm empresaId={empresaId} />
      </div>

      {equipos.length === 0 ? (
        <p className="text-sm text-gray-400 p-5">Sin equipos registrados</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {equipos.map(equipo => (
            <div key={equipo.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{equipo.tipo_de_equipo}</p>
                <p className="text-xs text-gray-500">
                  Código: {equipo.codigo_del_equipo ?? '—'} · Responsable: {equipo.responsable ?? '—'}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[equipo.estado]}`}>
                {ESTADO_LABELS[equipo.estado]}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AltaEquipoForm({ empresaId }: { empresaId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    const res = await fetch('/api/equipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, empresa_id: empresaId }),
    })

    setLoading(false)
    if (res.ok) { setOpen(false); window.location.reload() }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
        + Alta equipo
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-wrap">
      <input name="tipo_de_equipo" required placeholder="Tipo de equipo" className="border border-gray-300 rounded-lg px-2 py-1 text-sm" />
      <input name="codigo_del_equipo" placeholder="Código" className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-28" />
      <input name="responsable" placeholder="Responsable" className="border border-gray-300 rounded-lg px-2 py-1 text-sm" />
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm disabled:opacity-50">
        {loading ? '...' : 'Guardar'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500">Cancelar</button>
    </form>
  )
}
