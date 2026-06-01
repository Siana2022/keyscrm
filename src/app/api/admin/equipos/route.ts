import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { empresa_id, tipo_de_equipo, codigo_del_equipo, responsable_del_equipo, otro, estado } = body

  if (!empresa_id || !tipo_de_equipo) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('equipos')
    .insert({
      empresa_id,
      tipo_de_equipo,
      codigo_del_equipo: codigo_del_equipo || null,
      responsable_del_equipo: responsable_del_equipo || null,
      otro: tipo_de_equipo === 'Otros' ? otro || null : null,
      estado: estado ?? 'pending',
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  await supabase!.from('notificaciones_solicitudes').insert({
    tipo: 'alta_equipo',
    empresa_id,
    entidad_id: data.id,
    payload: { tipo_de_equipo, codigo_del_equipo },
  })

  return NextResponse.json(data, { status: 201 })
}
