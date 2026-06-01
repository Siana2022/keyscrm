import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('rol')
    .eq('id', user.id)
    .single()

  // Usuarios con rol empresa se redirigen a su(s) empresa(s)
  if (perfil?.rol === 'empresa') {
    const { data: asignaciones } = await supabase
      .from('usuario_empresa')
      .select('empresa_id')
      .eq('usuario_id', user.id)

    if (asignaciones && asignaciones.length === 1) {
      redirect(`/empresa/${asignaciones[0].empresa_id}`)
    }
    if (asignaciones && asignaciones.length > 1) {
      redirect('/seleccionar-empresa')
    }
  }

  // Admin / gestion_safe: panel de gestión
  const { data: empresas, count } = await supabase
    .from('empresas')
    .select('*', { count: 'exact' })
    .order('razon_social')
    .limit(20)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de gestión</h1>
      <p className="text-gray-500 mb-8">{count ?? 0} empresas registradas</p>

      <div className="grid gap-4">
        {empresas?.map(empresa => (
          <a
            key={empresa.id}
            href={`/empresa/${empresa.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{empresa.razon_social}</p>
                {empresa.nombre_comercial && (
                  <p className="text-sm text-gray-500">{empresa.nombre_comercial}</p>
                )}
              </div>
              <span className="text-sm text-gray-400">{empresa.cifdni}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
