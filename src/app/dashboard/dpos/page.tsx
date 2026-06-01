import { createClient } from '@/supabase/server'
import DpoForm from './DpoForm'

export default async function DposPage() {
  const supabase = await createClient()
  const { data: dpos } = await supabase.from('dpos').select('*').order('nombre')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">DPOs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Delegados de Protección de Datos</p>
        </div>
        <DpoForm mode="create" />
      </div>

      <div className="space-y-3">
        {dpos?.map(dpo => (
          <div key={dpo.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{dpo.nombre}</p>
                <div className="mt-1 flex gap-4 text-sm text-gray-500">
                  {dpo.dni && <span>DNI: {dpo.dni}</span>}
                  {dpo.email && <span>{dpo.email}</span>}
                  {dpo.telefono && <span>{dpo.telefono}</span>}
                </div>
              </div>
              <DpoForm mode="edit" dpo={dpo} />
            </div>
          </div>
        ))}
        {!dpos?.length && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            Sin DPOs registrados
          </div>
        )}
      </div>
    </div>
  )
}
