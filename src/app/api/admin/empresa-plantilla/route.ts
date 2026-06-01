import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { empresa_id, plantilla_id } = body

  if (!empresa_id || !plantilla_id) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase!
    .from('empresa_plantilla')
    .insert({
      empresa_id,
      plantilla_id,
      estado: 'active',
      asignado_en: new Date().toISOString(),
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { empresa_plantilla_id } = body

  if (!empresa_plantilla_id) {
    return NextResponse.json({ error: 'empresa_plantilla_id es obligatorio' }, { status: 400 })
  }

  const { error: dbError } = await supabase!
    .from('empresa_plantilla')
    .delete()
    .eq('id', empresa_plantilla_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
