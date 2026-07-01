import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'

const AVENIR = { fontFamily: 'Avenir, "Century Gothic", sans-serif', fontSize: '14px' }

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
    <div style={{ ...AVENIR, minHeight: '100vh', backgroundColor: 'rgba(255,47,146,0.08)' }} className="p-6 rounded-xl">

      {/* Cabecera: título + buscador + botón en una sola fila */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0">
          <h1 className="font-bold text-gray-900" style={{ ...AVENIR, fontSize: '22px' }}>Empresas</h1>
          <p style={{ ...AVENIR, color: '#666' }}>{total} registradas</p>
        </div>

        <form method="GET" className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre..."
              style={AVENIR}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white"
            />
          </div>
        </form>

        <Link
          href="/dashboard/empresas/nueva"
          className="flex-shrink-0 px-5 py-2 rounded-lg uppercase hover:opacity-80 transition-opacity"
          style={{ ...AVENIR, backgroundColor: '#111', color: '#fff', fontWeight: 'bold', letterSpacing: '0.05em' }}
        >
          + Nueva empresa
        </Link>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden border border-pink-200">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#FF2F92' }}>
              <th className="px-4 py-3 text-left font-bold text-white" style={AVENIR}>Empresa</th>
              <th className="px-4 py-3 text-left font-bold text-white" style={AVENIR}>CIF/NIF</th>
              <th className="px-4 py-3 text-left font-bold text-white" style={AVENIR}>Email</th>
              <th className="px-4 py-3 text-left font-bold text-white" style={AVENIR}>DPO</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {empresas?.map((empresa, i) => (
              <tr
                key={empresa.id}
                style={{ backgroundColor: i % 2 === 0 ? 'rgba(255,47,146,0.06)' : 'rgba(255,47,146,0.12)' }}
                className="hover:brightness-95 transition-all"
              >
                <td className="px-4 py-3" style={AVENIR}>
                  <p className="font-semibold text-gray-900">{empresa.razon_social}</p>
                  {empresa.nombre_comercial && (
                    <p style={{ ...AVENIR, fontSize: '12px', color: '#888' }}>{empresa.nombre_comercial}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700" style={AVENIR}>{empresa.cifdni ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700" style={AVENIR}>{empresa.email_principal ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600" style={AVENIR}>{empresa.dpo_nombre ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-3 justify-end">
                    <Link href={`/dashboard/empresas/${empresa.id}`}
                      style={{ ...AVENIR, color: '#FF2F92', fontWeight: 'bold' }}
                      className="hover:opacity-70">
                      Editar
                    </Link>
                    <Link href={`/${empresa.id}`}
                      style={{ ...AVENIR, color: '#555' }}
                      className="hover:opacity-70">
                      Ver ficha
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {empresas?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400" style={AVENIR}>
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
          <p style={{ ...AVENIR, color: '#666' }}>
            Mostrando {from + 1}–{Math.min(to + 1, total)} de {total}
          </p>
          <div className="flex gap-2">
            {parseInt(page) > 1 && (
              <Link href={`?q=${q}&page=${parseInt(page) - 1}`}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                style={AVENIR}>
                Anterior
              </Link>
            )}
            {parseInt(page) < totalPages && (
              <Link href={`?q=${q}&page=${parseInt(page) + 1}`}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                style={AVENIR}>
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
