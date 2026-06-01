import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function GET(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json([])
  }

  const { data, error: dbError } = await supabase!
    .from('encargados_tratamiento')
    .select('*')
    .or(`razon_social.ilike.%${q}%,cif.ilike.%${q}%,nombre_del_servicio.ilike.%${q}%`)
    .order('razon_social')
    .limit(20)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
