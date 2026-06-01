import { NextResponse } from 'next/server'
import { requireAdmin } from '../../_auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  const body = await request.json()
  const { nombre_completo, dni, cargo, teletrabajo, estado } = body

  if (!nombre_completo) {
    return NextResponse.json({ error: 'nombre_completo es obligatorio' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('empleados')
    .update({
      nombre_completo,
      dni: dni || null,
      cargo: cargo || null,
      teletrabajo: teletrabajo === true || teletrabajo === 'true',
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
    .from('empleados')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Notificación si es baja
  if (estado === 'baja') {
    await supabase!.from('notificaciones_solicitudes').insert({
      tipo: 'baja_empleado',
      empresa_id: data.empresa_id,
      entidad_id: data.id,
      payload: { nombre_completo: data.nombre_completo },
    })
  }

  return NextResponse.json(data)
}
