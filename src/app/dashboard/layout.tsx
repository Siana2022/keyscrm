import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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

  const { count: pendientesCount } = await supabase
    .from('notificaciones_solicitudes')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  const nav = [
    { href: '/dashboard', label: 'Empresas' },
    { href: '/dashboard/dpos', label: 'DPOs' },
    { href: '/dashboard/encargados', label: 'Encargados' },
    { href: '/dashboard/plantillas', label: 'Plantillas' },
    { href: '/dashboard/guias', label: 'Guías' },
    { href: '/dashboard/usuarios', label: 'Usuarios' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ backgroundColor: '#111111' }} className="relative">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <Image src="/keys/logo.png" alt="Keys Safe" width={36} height={36} className="object-contain" />
          </Link>
          <nav className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {nav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-white font-bold hover:opacity-70 transition-opacity"
                  style={{ fontFamily: 'Avenir, "Century Gothic", sans-serif', fontSize: '16px' }}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/dashboard/solicitudes"
                className="px-4 py-2 text-white font-bold hover:opacity-70 transition-opacity flex items-center gap-2"
                style={{ fontFamily: 'Avenir, "Century Gothic", sans-serif', fontSize: '16px' }}
              >
                Solicitudes
                {(pendientesCount ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full" style={{ backgroundColor: '#FF2F92' }}>
                    {pendientesCount}
                  </span>
                )}
              </Link>
            </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
