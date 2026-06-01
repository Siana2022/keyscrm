import { createClient } from '@/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles_usuario').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin' && perfil?.rol !== 'gestion_safe') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { email, password, rol, empresa_ids } = await request.json()

  // Usar service role para crear usuarios en Auth
  const admin = createAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Actualizar rol en perfiles_usuario (el trigger ya creó el perfil)
  await admin.from('perfiles_usuario').update({ rol, email }).eq('id', newUser.user.id)

  // Asignar empresas si es rol empresa
  if (rol === 'empresa' && empresa_ids?.length) {
    const rows = empresa_ids.map((eid: string) => ({
      usuario_id: newUser.user.id,
      empresa_id: eid,
    }))
    await admin.from('usuario_empresa').insert(rows)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
