'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/utils'

type Empleado = Database['public']['Tables']['empleados']['Row']

export default function EmpleadosTab({
  empresaId,
  empleados: initialEmpleados,
}: {
  empresaId: string
  empleados: Empleado[]
}) {
  const [empleados] = useState(initialEmpleados)
  const activos = empleados.filter(e => e.estado === 'active')
  const pendientes = empleados.filter(e => e.estado === 'pending')

  return (
    <section className="bg-white rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Empleados</h2>
          <p className="text-sm text-gray-500 mt-0.5">{activos.length} activos · {pendientes.length} pendientes</p>
        </div>
        <AltaEmpleadoForm empresaId={empresaId} />
      </div>

      {empleados.length === 0 ? (
        <p className="text-sm text-gray-400 p-5">Sin empleados registrados</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {empleados.map(empleado => (
            <div key={empleado.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{empleado.nombre_completo}</p>
                <p className="text-xs text-gray-500">
                  {empleado.cargo ?? 'Sin cargo'} · DNI: {empleado.dni ?? '—'}
                  {empleado.teletrabajo && ' · Teletrabajo'}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[empleado.estado]}`}>
                {ESTADO_LABELS[empleado.estado]}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AltaEmpleadoForm({ empresaId }: { empresaId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    const res = await fetch('/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, empresa_id: empresaId }),
    })

    setLoading(false)
    if (res.ok) {
      setOpen(false)
      window.location.reload()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Alta empleado
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-wrap">
      <input name="nombre_completo" required placeholder="Nombre completo" className="border border-gray-300 rounded-lg px-2 py-1 text-sm" />
      <input name="dni" placeholder="DNI" className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-28" />
      <input name="cargo" placeholder="Cargo" className="border border-gray-300 rounded-lg px-2 py-1 text-sm" />
      <label className="flex items-center gap-1 text-sm text-gray-600">
        <input type="checkbox" name="teletrabajo" value="true" /> Teletrabajo
      </label>
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm disabled:opacity-50">
        {loading ? '...' : 'Guardar'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500">
        Cancelar
      </button>
    </form>
  )
}
