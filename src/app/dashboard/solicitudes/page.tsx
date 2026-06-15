import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { TipoNotificacion } from '@/types/database'

const TIPO_LABELS: Record<TipoNotificacion, string> = {
  alta_empleado: 'Alta de usuario',
  baja_empleado: 'Baja de usuario',
  alta_equipo: 'Alta de equipo',
  baja_equipo: 'Baja de equipo',
  alta_servicio_externo: 'Alta de servicio externo',
  baja_servicio_externo: 'Baja de servicio externo',
  alta_encargado: 'Alta de encargado',
  baja_encargado: 'Baja de encargado',
}

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: solicitudes } = await supabase
    .from('notificaciones_solicitudes')
    .select('*')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  // Cargar nombres de empresas por separado
  const empresaIds = [...new Set((solicitudes ?? []).map(s => s.empresa_id))]
  const { data: empresasData } = await supabase
    .from('empresas')
    .select('id, razon_social')
    .in('id', empresaIds.length > 0 ? empresaIds : ['00000000-0000-0000-0000-000000000000'])
  const empresasMap = new Map((empresasData ?? []).map(e => [e.id, e]))

  // Agrupar por empresa
  const porEmpresa = new Map<string, {
    empresa: { id: string; razon_social: string }
    items: NonNullable<typeof solicitudes>
  }>()

  for (const s of solicitudes ?? []) {
    const emp = empresasMap.get(s.empresa_id)
    if (!emp) continue
    if (!porEmpresa.has(emp.id)) porEmpresa.set(emp.id, { empresa: emp, items: [] })
    porEmpresa.get(emp.id)!.items.push(s)
  }

  const grupos = Array.from(porEmpresa.values())
  const total = solicitudes?.length ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Solicitudes pendientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} solicitud{total !== 1 ? 'es' : ''} pendiente{total !== 1 ? 's' : ''} de aprobación
          </p>
        </div>
      </div>

      {grupos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-gray-500 text-sm font-medium">Todo al día</p>
          <p className="text-gray-400 text-xs mt-1">No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(({ empresa, items }) => (
            <div key={empresa.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: '#FF2F92' }}
                  >
                    {items.length}
                  </span>
                  <p className="font-semibold text-gray-900 text-sm">{empresa.razon_social}</p>
                </div>
                <Link
                  href={`/dashboard/empresas/${empresa.id}`}
                  className="text-sm font-medium text-white px-4 py-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: '#FF2F92' }}
                >
                  Ir a ficha para aprobar →
                </Link>
              </div>

              <div className="divide-y divide-gray-50">
                {items.map(s => {
                  const payload = s.payload as Record<string, string>
                  const resumen =
                    payload.nombre_completo ??
                    payload.razon_social ??
                    payload.tipo_de_equipo ??
                    '—'
                  return (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{TIPO_LABELS[s.tipo as TipoNotificacion] ?? s.tipo}</span>
                          {' · '}
                          <span className="text-gray-600">{resumen}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(s.created_at).toLocaleString('es-ES', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
