import { createClient } from '@/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { empresa_id, razon_social, cif, nombre_del_servicio, direccion, localidad, codigo_postal, provincia } = body

  if (!empresa_id || !razon_social || !nombre_del_servicio) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Buscar si ya existe un encargado con ese CIF
  let encargadoId: string

  if (cif) {
    const { data: existing } = await supabase
      .from('encargados_tratamiento')
      .select('id')
      .eq('cif', cif)
      .single()

    if (existing) {
      encargadoId = existing.id
    } else {
      const { data, error } = await supabase
        .from('encargados_tratamiento')
        .insert({ razon_social, cif, nombre_del_servicio, direccion, localidad, codigo_postal, provincia })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      encargadoId = data.id
    }
  } else {
    const { data, error } = await supabase
      .from('encargados_tratamiento')
      .insert({ razon_social, nombre_del_servicio, direccion, localidad, codigo_postal, provincia })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    encargadoId = data.id
  }

  // Vincular a la empresa
  const { data: vinculo, error: vinculoError } = await supabase
    .from('empresa_encargado')
    .upsert({ empresa_id, encargado_id: encargadoId, estado: 'pending', es_servicio_externo: true }, {
      onConflict: 'empresa_id,encargado_id',
    })
    .select()
    .single()

  if (vinculoError) return NextResponse.json({ error: vinculoError.message }, { status: 500 })

  await supabase.from('notificaciones_solicitudes').insert({
    tipo: 'alta_encargado',
    empresa_id,
    entidad_id: encargadoId,
    payload: { razon_social, cif, nombre_del_servicio },
  })

  return NextResponse.json(vinculo, { status: 201 })
}
