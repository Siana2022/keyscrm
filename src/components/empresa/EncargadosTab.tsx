'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/utils'

type Encargado = Database['public']['Views']['v_encargados_por_empresa']['Row']

export default function EncargadosTab({
  empresaId,
  encargados,
}: {
  empresaId: string
  encargados: Encargado[]
}) {
  const activos = encargados.filter(e => e.estado === 'active')

  return (
    <section className="bg-white rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Encargados de tratamiento</h2>
          <p className="text-sm text-gray-500 mt-0.5">{activos.length} activos</p>
        </div>
        <AltaEncargadoForm empresaId={empresaId} />
      </div>

      {encargados.length === 0 ? (
        <p className="text-sm text-gray-400 p-5">Sin encargados registrados</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {encargados.map(enc => (
            <div key={enc.empresa_encargado_id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{enc.razon_social}</p>
                <p className="text-xs text-gray-500">
                  {enc.nombre_del_servicio} · CIF: {enc.cif ?? '—'}
                  {enc.es_servicio_externo && ' · Servicio externo'}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[enc.estado]}`}>
                {ESTADO_LABELS[enc.estado]}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AltaEncargadoForm({ empresaId }: { empresaId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    const res = await fetch('/api/encargados', {
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
        + Alta encargado
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-wrap">
      <input name="razon_social" required placeholder="Razón social" className="border border-gray-300 rounded-lg px-2 py-1 text-sm" />
      <input name="cif" placeholder="CIF" className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-28" />
      <input name="nombre_del_servicio" required placeholder="Nombre del servicio" className="border border-gray-300 rounded-lg px-2 py-1 text-sm" />
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm disabled:opacity-50">
        {loading ? '...' : 'Guardar'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500">Cancelar</button>
    </form>
  )
}
