import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { empresa_id, nombre_completo, dni, cargo, teletrabajo, estado } = body

  if (!empresa_id || !nombre_completo) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('empleados')
    .insert({
      empresa_id,
      nombre_completo,
      dni: dni || null,
      cargo: cargo || null,
      teletrabajo: teletrabajo === true || teletrabajo === 'true',
      estado: estado ?? 'pending',
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  await supabase!.from('notificaciones_solicitudes').insert({
    tipo: 'alta_empleado',
    empresa_id,
    entidad_id: data.id,
    payload: { nombre_completo, dni, cargo, teletrabajo },
  })

  return NextResponse.json(data, { status: 201 })
}
