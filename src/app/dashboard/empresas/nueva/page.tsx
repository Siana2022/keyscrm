import { createClient } from '@/supabase/server'
import EmpresaForm from '@/components/dashboard/EmpresaForm'

export default async function NuevaEmpresaPage() {
  const supabase = await createClient()
  const { data: dpos } = await supabase.from('dpos').select('id, nombre').order('nombre')

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Nueva empresa</h1>
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Columna izquierda — Formulario */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Datos de la empresa</h2>
          </div>
          <div className="p-5">
            <EmpresaForm dpos={dpos ?? []} />
          </div>
        </div>

        {/* Columna derecha — Vacía hasta guardar */}
        <div className="bg-white rounded-xl border border-gray-200 border-dashed p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">Guarda primero los datos</p>
          <p className="text-xs text-gray-400">Una vez creada la empresa podrás añadir empleados, encargados, equipos, plantillas y más.</p>
        </div>
      </div>
    </div>
  )
}
