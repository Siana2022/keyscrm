import { createClient } from '@/supabase/server'
import EmpresaForm from '@/components/dashboard/EmpresaForm'

export default async function NuevaEmpresaPage() {
  const supabase = await createClient()
  const { data: dpos } = await supabase.from('dpos').select('id, nombre').order('nombre')

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nueva empresa</h1>
      <EmpresaForm dpos={dpos ?? []} />
    </div>
  )
}
