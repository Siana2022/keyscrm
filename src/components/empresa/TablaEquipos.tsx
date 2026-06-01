'use client'

import type { Database } from '@/types/database'

type Equipo = Database['public']['Tables']['equipos']['Row']

export default function TablaEquipos({ equipos, empresaId }: { equipos: Equipo[]; empresaId: string }) {
  if (!equipos.length) return <p className="text-gray-500 text-sm">Sin equipos registrados</p>

  return (
    <div className="space-y-2">
      {equipos.map(eq => (
        <div key={eq.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
          <div>
            <p className="text-gray-900 text-sm font-medium">{eq.tipo_de_equipo}{eq.otro ? ` — ${eq.otro}` : ''}</p>
            <p className="text-gray-500 text-xs">Código: {eq.codigo_del_equipo ?? '—'} · Responsable: {eq.responsable_del_equipo ?? '—'}</p>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Activo</span>
        </div>
      ))}
    </div>
  )
}
