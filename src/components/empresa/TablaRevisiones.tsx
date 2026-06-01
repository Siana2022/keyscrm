'use client'

import type { Database } from '@/types/database'

type Revision = Database['public']['Tables']['revisiones']['Row']

export default function TablaRevisiones({
  revisiones,
  tipo,
  empresaId,
}: {
  revisiones: Revision[]
  tipo: 'auditoria' | 'revision_trimestral'
  empresaId: string
}) {
  if (!revisiones.length) return <p className="text-gray-500 text-sm">Sin registros</p>

  return (
    <div className="space-y-2">
      {revisiones.map(r => (
        <div key={r.id} className="py-2 border-b border-gray-200 last:border-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#FF2F92', color: 'white' }}>
              {r.tipo_de_revision ?? 'A'}
            </span>
            <p className="text-gray-900 text-sm">{r.fecha}</p>
          </div>
          {r.estado_resultado && (
            <p className="text-gray-500 text-xs mt-1">{r.estado_resultado}</p>
          )}
        </div>
      ))}
    </div>
  )
}
