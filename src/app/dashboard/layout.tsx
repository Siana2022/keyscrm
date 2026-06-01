import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol === 'empresa') redirect('/seleccionar-empresa')

  const nav = [
    { href: '/dashboard', label: 'Empresas' },
    { href: '/dashboard/dpos', label: 'DPOs' },
    { href: '/dashboard/encargados', label: 'Encargados' },
    { href: '/dashboard/plantillas', label: 'Plantillas' },
    { href: '/dashboard/guias', label: 'Guías' },
    { href: '/dashboard/usuarios', label: 'Usuarios' },
    { href: '/dashboard/solicitudes', label: 'Solicitudes' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-bold text-gray-900">Keys Safe</span>
            <nav className="flex gap-1">
              {nav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="w-full px-6 py-8">{children}</main>
    </div>
  )
}
