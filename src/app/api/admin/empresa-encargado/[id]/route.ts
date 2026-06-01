import { NextResponse } from 'next/server'
import { requireAdmin } from '../../_auth'

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
    .from('empresa_encargado')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
