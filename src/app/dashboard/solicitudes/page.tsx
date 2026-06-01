import { createClient } from '@/supabase/server'
import MarcarResueltaButton from './MarcarResueltaButton'
import type { TipoNotificacion } from '@/types/database'

const TIPO_LABELS: Record<TipoNotificacion, string> = {
  alta_empleado: 'Alta empleado',
  baja_empleado: 'Baja empleado',
  alta_equipo: 'Alta equipo',
  baja_equipo: 'Baja equipo',
  alta_servicio_externo: 'Alta servicio externo',
  baja_servicio_externo: 'Baja servicio externo',
  alta_encargado: 'Alta encargado',
  baja_encargado: 'Baja encargado',
}

const TIPO_COLORS: Record<TipoNotificacion, string> = {
  alta_empleado: 'bg-green-100 text-green-800',
  baja_empleado: 'bg-red-100 text-red-800',
  alta_equipo: 'bg-green-100 text-green-800',
  baja_equipo: 'bg-red-100 text-red-800',
  alta_servicio_externo: 'bg-green-100 text-green-800',
  baja_servicio_externo: 'bg-red-100 text-red-800',
  alta_encargado: 'bg-green-100 text-green-800',
  baja_encargado: 'bg-red-100 text-red-800',
}

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado = 'pendiente' } = await searchParams
  const supabase = await createClient()

  const { data: solicitudes } = await supabase
    .from('notificaciones_solicitudes')
    .select('*, empresas(razon_social)')
    .eq('estado', estado as 'pendiente' | 'enviada' | 'error')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: counts } = await supabase
    .from('notificaciones_solicitudes')
    .select('estado')

  const pendientes = counts?.filter(c => c.estado === 'pendiente').length ?? 0
  const enviadas = counts?.filter(c => c.estado === 'enviada').length ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Solicitudes</h1>
        <p className="text-sm text-gray-500 mt-0.5">{pendientes} pendientes · {enviadas} resueltas</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'pendiente', label: 'Pendientes' },
          { value: 'enviada', label: 'Resueltas' },
          { value: 'error', label: 'Con error' },
        ].map(opt => (
          <a
            key={opt.value}
            href={`?estado=${opt.value}`}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              estado === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {solicitudes?.map(s => {
          const empresa = s.empresas as unknown as { razon_social: string } | null
          const payload = s.payload as Record<string, unknown>
          return (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[s.tipo]}`}>
                      {TIPO_LABELS[s.tipo]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {empresa?.razon_social ?? 'Empresa desconocida'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Object.entries(payload)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(s.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                {s.estado === 'pendiente' && (
                  <MarcarResueltaButton id={s.id} />
                )}
              </div>
            </div>
          )
        })}
        {solicitudes?.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No hay solicitudes {estado === 'pendiente' ? 'pendientes' : estado === 'enviada' ? 'resueltas' : 'con error'}
          </div>
        )}
      </div>
    </div>
  )
}
