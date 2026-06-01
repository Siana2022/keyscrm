'use client'

import type { Database } from '@/types/database'

type Encargado = Database['public']['Views']['v_encargados_por_empresa']['Row']

export default function TablaEncargados({ encargados, empresaId }: { encargados: Encargado[]; empresaId: string }) {
  if (!encargados.length) return <p className="text-gray-500 text-sm">Sin servicios externos registrados</p>

  return (
    <div className="space-y-2">
      {encargados.map(enc => (
        <div key={enc.empresa_encargado_id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
          <div>
            <p className="text-white text-sm font-medium">{enc.razon_social}</p>
            <p className="text-gray-400 text-xs">{enc.nombre_del_servicio} · CIF: {enc.cif ?? '—'}</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">Activo</span>
        </div>
      ))}
    </div>
  )
}
