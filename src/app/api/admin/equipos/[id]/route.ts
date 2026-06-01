import { NextResponse } from 'next/server'
import { requireAdmin } from '../../_auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  const body = await request.json()
  const { tipo_de_equipo, codigo_del_equipo, responsable_del_equipo, otro, estado } = body

  if (!tipo_de_equipo) {
    return NextResponse.json({ error: 'tipo_de_equipo es obligatorio' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('equipos')
    .update({
      tipo_de_equipo,
      codigo_del_equipo: codigo_del_equipo || null,
      responsable_del_equipo: responsable_del_equipo || null,
      otro: tipo_de_equipo === 'Otros' ? otro || null : null,
      estado: estado ?? 'pending',
    })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  const body = await request.json()
  const { estado } = body

  if (!estado) {
    return NextResponse.json({ error: 'estado es obligatorio' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('equipos')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  if (estado === 'baja') {
    await supabase!.from('notificaciones_solicitudes').insert({
      tipo: 'baja_equipo',
      empresa_id: data.empresa_id,
      entidad_id: data.id,
      payload: { tipo_de_equipo: data.tipo_de_equipo, codigo_del_equipo: data.codigo_del_equipo },
    })
  }

  return NextResponse.json(data)
}
