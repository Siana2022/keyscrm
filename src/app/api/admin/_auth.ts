import { createClient } from '@/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { supabase: null, user: null, error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }
  }
  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('rol')
    .eq('id', user.id)
    .single()
  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'gestion_safe')) {
    return { supabase: null, user: null, error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) }
  }
  return { supabase, user, error: null }
}
