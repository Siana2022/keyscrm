import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { empresa_id, fecha, tipo, notas, estado_resultado } = body

  if (!empresa_id || !fecha || !tipo) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('revisiones')
    .insert({
      empresa_id,
      fecha,
      tipo,
      tipo_de_revision: null,
      notas: notas || null,
      estado_resultado: estado_resultado || null,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
