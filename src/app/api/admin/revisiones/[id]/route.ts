import { NextResponse } from 'next/server'
import { requireAdmin } from '../../_auth'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error
  const { id } = await params

  const { error: dbError } = await supabase!
    .from('revisiones')
    .delete()
    .eq('id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
