import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { empresa_id, encargado_id } = body

  if (!empresa_id || !encargado_id) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Verificar que no esté ya vinculado
  const { data: existing } = await supabase!
    .from('empresa_encargado')
    .select('id')
    .eq('empresa_id', empresa_id)
    .eq('encargado_id', encargado_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Este encargado ya está vinculado a la empresa' }, { status: 409 })
  }

  const { data, error: dbError } = await supabase!
    .from('empresa_encargado')
    .insert({
      empresa_id,
      encargado_id,
      estado: 'pending',
      es_servicio_externo: false,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
