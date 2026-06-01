import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = '', page = '1' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario').select('rol').eq('id', user.id).single()
  if (perfil?.rol === 'empresa') redirect('/seleccionar-empresa')

  const PAGE_SIZE = 25
  const from = (parseInt(page) - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('v_empresas_con_dpo')
    .select('*', { count: 'exact' })
    .order('razon_social')
    .range(from, to)

  if (q) query = query.ilike('razon_social', `%${q}%`)

  const { data: empresas, count } = await query
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registradas</p>
        </div>
        <Link
          href="/dashboard/empresas/nueva"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva empresa
        </Link>
      </div>

      {/* Buscador */}
      <form method="GET" className="mb-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Empresa</th>
              <th className="px-4 py-3 font-medium text-gray-600">CIF/NIF</th>
              <th className="px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 font-medium text-gray-600">DPO</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {empresas?.map(empresa => (
              <tr key={empresa.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{empresa.razon_social}</p>
                  {empresa.nombre_comercial && (
                    <p className="text-xs text-gray-400">{empresa.nombre_comercial}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{empresa.cifdni ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{empresa.email_principal ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{empresa.dpo_nombre ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/dashboard/empresas/${empresa.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/${empresa.id}`}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Ver ficha
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {empresas?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {q ? `Sin resultados para "${q}"` : 'Sin empresas registradas'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Mostrando {from + 1}–{Math.min(to + 1, total)} de {total}
          </p>
          <div className="flex gap-2">
            {parseInt(page) > 1 && (
              <Link
                href={`?q=${q}&page=${parseInt(page) - 1}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Anterior
              </Link>
            )}
            {parseInt(page) < totalPages && (
              <Link
                href={`?q=${q}&page=${parseInt(page) + 1}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
