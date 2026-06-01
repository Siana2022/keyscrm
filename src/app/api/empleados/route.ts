import { createClient } from '@/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { empresa_id, nombre_completo, dni, cargo, teletrabajo } = body

  if (!empresa_id || !nombre_completo) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('empleados')
    .insert({
      empresa_id,
      nombre_completo,
      dni: dni || null,
      cargo: cargo || null,
      teletrabajo: teletrabajo === 'true' || teletrabajo === true,
      estado: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registrar notificación para envío de email
  await supabase.from('notificaciones_solicitudes').insert({
    tipo: 'alta_empleado',
    empresa_id,
    entidad_id: data.id,
    payload: { nombre_completo, dni, cargo, teletrabajo },
  })

  return NextResponse.json(data, { status: 201 })
}
