import { createClient } from '@/supabase/server'
import EncargadoGlobalForm from './EncargadoGlobalForm'

export default async function EncargadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('encargados_tratamiento')
    .select('*', { count: 'exact' })
    .order('razon_social')
    .limit(50)

  if (q) query = query.ilike('razon_social', `%${q}%`)

  const { data: encargados, count } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Encargados de tratamiento</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count ?? 0} registrados</p>
        </div>
        <EncargadoGlobalForm mode="create" />
      </div>

      <form method="GET" className="mb-4">
        <input name="q" defaultValue={q} placeholder="Buscar por razón social..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Razón social</th>
              <th className="px-4 py-3 font-medium text-gray-600">CIF</th>
              <th className="px-4 py-3 font-medium text-gray-600">Nombre del servicio</th>
              <th className="px-4 py-3 font-medium text-gray-600">Localidad</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {encargados?.map(enc => (
              <tr key={enc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{enc.razon_social}</td>
                <td className="px-4 py-3 text-gray-500">{enc.cif ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{enc.nombre_del_servicio}</td>
                <td className="px-4 py-3 text-gray-500">{enc.localidad ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <EncargadoGlobalForm mode="edit" encargado={enc} />
                </td>
              </tr>
            ))}
            {!encargados?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {q ? `Sin resultados para "${q}"` : 'Sin encargados registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
