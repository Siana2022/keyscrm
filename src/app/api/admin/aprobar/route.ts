import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

// POST /api/admin/aprobar  { notificacion_id, accion: 'aprobar' | 'rechazar' }
export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { notificacion_id, accion } = await request.json()
  if (!notificacion_id || !accion) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  // Obtener la notificación
  const { data: notif } = await supabase!
    .from('notificaciones_solicitudes')
    .select('*')
    .eq('id', notificacion_id)
    .single()

  if (!notif) return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 })
  if (!notif.entidad_id) return NextResponse.json({ error: 'Sin entidad asociada' }, { status: 400 })

  const nuevoEstadoEntidad = accion === 'aprobar' ? 'active' : 'baja'

  // Actualizar la entidad según el tipo
  let dbError: { message: string } | null = null

  if (notif.tipo === 'alta_empleado' || notif.tipo === 'baja_empleado') {
    const { error: e } = await supabase!
      .from('empleados')
      .update({ estado: nuevoEstadoEntidad })
      .eq('id', notif.entidad_id)
    dbError = e
  } else if (notif.tipo === 'alta_equipo' || notif.tipo === 'baja_equipo') {
    const { error: e } = await supabase!
      .from('equipos')
      .update({ estado: nuevoEstadoEntidad })
      .eq('id', notif.entidad_id)
    dbError = e
  } else if (notif.tipo === 'alta_servicio_externo' || notif.tipo === 'baja_servicio_externo' ||
             notif.tipo === 'alta_encargado' || notif.tipo === 'baja_encargado') {
    const { error: e } = await supabase!
      .from('empresa_encargado')
      .update({ estado: nuevoEstadoEntidad })
      .eq('id', notif.entidad_id)
    dbError = e
  }

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Marcar la notificación como procesada
  await supabase!
    .from('notificaciones_solicitudes')
    .update({ estado: 'enviada' })
    .eq('id', notificacion_id)

  return NextResponse.json({ ok: true })
}
