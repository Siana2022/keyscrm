import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const empresa_id = formData.get('empresa_id') as string | null
  const categoria = formData.get('categoria') as string | null
  const nombre = formData.get('nombre') as string | null

  if (!file || !empresa_id || !categoria || !nombre) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Subir fichero a Supabase Storage
  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `documentos/${empresa_id}/${categoria}/${Date.now()}.${ext}`

  const { error: storageError } = await supabase!.storage
    .from('documentos-manuales')
    .upload(path, file, { contentType: file.type })

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase!.storage
    .from('documentos-manuales')
    .getPublicUrl(path)

  const { data, error: dbError } = await supabase!
    .from('documentos_manuales')
    .insert({
      empresa_id,
      categoria: categoria as import('@/types/database').TipoDocumento,
      nombre,
      archivo_url: publicUrl,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
