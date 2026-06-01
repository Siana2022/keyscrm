'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'

type Empleado = Database['public']['Tables']['empleados']['Row']

export default function TablaEmpleados({ empleados, empresaId }: { empleados: Empleado[]; empresaId: string }) {
  const [lista, setLista] = useState(empleados)

  async function solicitarBaja(empleadoId: string, nombre: string) {
    if (!confirm(`¿Solicitar baja de ${nombre}?`)) return
    await fetch(`/api/empleados/${empleadoId}/baja`, { method: 'POST' })
    setLista(prev => prev.filter(e => e.id !== empleadoId))
  }

  if (!lista.length) return <p className="text-gray-500 text-sm">Sin usuarios registrados</p>

  return (
    <div className="space-y-2">
      {lista.map(emp => (
        <div key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
          <div>
            <p className="text-white text-sm font-medium">{emp.nombre_completo}</p>
            <p className="text-gray-400 text-xs">{emp.cargo ?? '—'} · DNI: {emp.dni ?? '—'}{emp.teletrabajo ? ' · Teletrabajo' : ''}</p>
          </div>
          <button
            onClick={() => solicitarBaja(emp.id, emp.nombre_completo)}
            className="text-xs text-white px-3 py-1 rounded"
            style={{ backgroundColor: '#FF2F92' }}
          >
            Solicitar baja
          </button>
        </div>
      ))}
    </div>
  )
}
