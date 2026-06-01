import { createClient } from '@/supabase/server'
import { notFound } from 'next/navigation'
import EmpresaForm from '@/components/dashboard/EmpresaForm'

export default async function EditarEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: empresa }, { data: dpos }] = await Promise.all([
    supabase.from('empresas').select('*').eq('id', id).single(),
    supabase.from('dpos').select('id, nombre').order('nombre'),
  ])

  if (!empresa) notFound()

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Editar empresa</h1>
      <EmpresaForm empresa={empresa} dpos={dpos ?? []} />
    </div>
  )
}
