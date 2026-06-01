import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

// Asignar usuario existente a empresa por email
export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { email, empresa_id } = await request.json()
  if (!email || !empresa_id) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  // Buscar el perfil por email
  const { data: perfil } = await supabase!
    .from('perfiles_usuario')
    .select('id, rol')
    .eq('email', email)
    .single()

  if (!perfil) {
    return NextResponse.json({ error: 'No existe ningún usuario con ese email' }, { status: 404 })
  }

  // Asegurarse de que tiene rol empresa
  if (perfil.rol !== 'empresa') {
    return NextResponse.json({ error: 'Ese usuario no tiene rol de empresa' }, { status: 400 })
  }

  // Vincular (upsert para evitar duplicados)
  const { error: dbError } = await supabase!
    .from('usuario_empresa')
    .upsert({ usuario_id: perfil.id, empresa_id }, { onConflict: 'usuario_id,empresa_id' })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// Revocar acceso
export async function DELETE(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { usuario_id, empresa_id } = await request.json()

  const { error: dbError } = await supabase!
    .from('usuario_empresa')
    .delete()
    .eq('usuario_id', usuario_id)
    .eq('empresa_id', empresa_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
