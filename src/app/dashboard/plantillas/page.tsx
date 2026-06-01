import { createClient } from '@/supabase/server'
import Link from 'next/link'
import { TIPO_DOCUMENTO_LABELS } from '@/lib/utils'
import type { TipoDocumento } from '@/types/database'

export default async function PlantillasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string }>
}) {
  const { tipo = '', q = '' } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('plantillas_documento').select('*').order('titulo')
  if (tipo) query = query.eq('tipo', tipo as TipoDocumento)
  if (q) query = query.ilike('titulo', `%${q}%`)

  const { data: plantillas } = await query

  const tipos = Object.entries(TIPO_DOCUMENTO_LABELS) as [TipoDocumento, string][]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Plantillas de documentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{plantillas?.length ?? 0} plantillas</p>
        </div>
        <Link href="/dashboard/plantillas/nueva"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Nueva plantilla
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <form method="GET" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Buscar por título..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select name="tipo" defaultValue={tipo}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todas las categorías</option>
            {tipos.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button type="submit" className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200">
            Filtrar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Título</th>
              <th className="px-4 py-3 font-medium text-gray-600">Categoría</th>
              <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {plantillas?.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.titulo}</td>
                <td className="px-4 py-3 text-gray-500">{TIPO_DOCUMENTO_LABELS[p.tipo]}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {p.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/plantillas/${p.id}`}
                    className="text-sm text-blue-600 hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!plantillas?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin plantillas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
