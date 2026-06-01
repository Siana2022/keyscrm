import { createClient } from '@/supabase/server'
import NuevoUsuarioForm from './NuevoUsuarioForm'
import type { RolUsuario } from '@/types/database'

const ROL_LABELS: Record<RolUsuario, string> = {
  admin: 'Admin',
  gestion_safe: 'Gestor',
  empresa: 'Empresa',
}

const ROL_COLORS: Record<RolUsuario, string> = {
  admin: 'bg-purple-100 text-purple-800',
  gestion_safe: 'bg-blue-100 text-blue-800',
  empresa: 'bg-gray-100 text-gray-700',
}

export default async function UsuariosPage() {
  const supabase = await createClient()

  const { data: usuarios } = await supabase
    .from('perfiles_usuario')
    .select('*')
    .order('created_at', { ascending: false })

  // Para cada usuario empresa, obtener sus empresas asignadas
  const { data: asignaciones } = await supabase
    .from('usuario_empresa')
    .select('usuario_id, empresa_id, empresas(razon_social)')

  const asigPorUsuario: Record<string, string[]> = {}
  for (const a of asignaciones ?? []) {
    if (!asigPorUsuario[a.usuario_id]) asigPorUsuario[a.usuario_id] = []
    const nombre = (a.empresas as unknown as { razon_social: string } | null)?.razon_social
    if (nombre) asigPorUsuario[a.usuario_id].push(nombre)
  }

  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, razon_social')
    .order('razon_social')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{usuarios?.length ?? 0} usuarios</p>
        </div>
        <NuevoUsuarioForm empresas={empresas ?? []} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="px-4 py-3 font-medium text-gray-600">Empresas asignadas</th>
              <th className="px-4 py-3 font-medium text-gray-600">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usuarios?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLORS[u.rol]}`}>
                    {ROL_LABELS[u.rol]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {asigPorUsuario[u.id]?.join(', ') || (u.rol === 'empresa' ? 'Sin asignar' : '—')}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
