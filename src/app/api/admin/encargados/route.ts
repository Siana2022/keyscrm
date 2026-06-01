import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { empresa_id, razon_social, cif, nombre_del_servicio, direccion, localidad, codigo_postal, provincia } = body

  if (!razon_social || !nombre_del_servicio || !empresa_id) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Crear encargado
  const { data: encargado, error: errEnc } = await supabase!
    .from('encargados_tratamiento')
    .insert({
      razon_social,
      cif: cif || null,
      nombre_del_servicio,
      direccion: direccion || null,
      localidad: localidad || null,
      codigo_postal: codigo_postal || null,
      provincia: provincia || null,
    })
    .select()
    .single()

  if (errEnc) return NextResponse.json({ error: errEnc.message }, { status: 500 })

  // Vincular a empresa
  const { data: vinculo, error: errVin } = await supabase!
    .from('empresa_encargado')
    .insert({
      empresa_id,
      encargado_id: encargado.id,
      estado: 'pending',
      es_servicio_externo: false,
    })
    .select()
    .single()

  if (errVin) return NextResponse.json({ error: errVin.message }, { status: 500 })

  await supabase!.from('notificaciones_solicitudes').insert({
    tipo: 'alta_encargado',
    empresa_id,
    entidad_id: encargado.id,
    payload: { razon_social, nombre_del_servicio },
  })

  return NextResponse.json({ encargado, vinculo }, { status: 201 })
}
