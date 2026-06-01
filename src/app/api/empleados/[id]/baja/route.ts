import { createClient } from '@/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: emp } = await supabase.from('empleados').select('nombre_completo, empresa_id').eq('id', id).single()

  await supabase.from('empleados').update({ estado: 'pending' }).eq('id', id)

  if (emp) {
    await supabase.from('notificaciones_solicitudes').insert({
      tipo: 'baja_empleado',
      empresa_id: emp.empresa_id,
      entidad_id: id,
      payload: { nombre_completo: emp.nombre_completo },
    })
  }

  return NextResponse.json({ ok: true })
}
