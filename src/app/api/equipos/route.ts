import { createClient } from '@/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { empresa_id, tipo_de_equipo, codigo_del_equipo, responsable } = body

  if (!empresa_id || !tipo_de_equipo) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('equipos')
    .insert({
      empresa_id,
      tipo_de_equipo,
      codigo_del_equipo: codigo_del_equipo || null,
      responsable_del_equipo: responsable || null,
      estado: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('notificaciones_solicitudes').insert({
    tipo: 'alta_equipo',
    empresa_id,
    entidad_id: data.id,
    payload: { tipo_de_equipo, codigo_del_equipo, responsable },
  })

  return NextResponse.json(data, { status: 201 })
}
