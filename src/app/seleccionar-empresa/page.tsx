import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function SeleccionarEmpresaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vinculaciones } = await supabase
    .from('usuario_empresa')
    .select('empresa_id, empresas(id, razon_social, nombre_comercial, logo_url)')
    .eq('usuario_id', user.id)

  const empresas = (vinculaciones ?? [])
    .map(v => v.empresas as unknown as { id: string; razon_social: string; nombre_comercial: string | null; logo_url: string | null } | null)
    .filter(Boolean)

  // Si solo tiene una, redirigir directamente
  if (empresas.length === 1) redirect(`/${empresas[0]!.id}`)

  // Si no tiene ninguna, mostrar mensaje
  if (empresas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No tienes empresas asignadas.</p>
          <p className="text-gray-400 text-xs mt-1">Contacta con tu administrador.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/keys/logo.png" alt="Keys Safe" width={80} height={80} className="mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">Selecciona tu empresa</h1>
          <p className="text-sm text-gray-500 mt-1">Tienes acceso a varias empresas</p>
        </div>

        <div className="space-y-3">
          {empresas.map(empresa => (
            <Link
              key={empresa!.id}
              href={`/${empresa!.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-pink-300 hover:shadow-sm transition-all"
            >
              {empresa!.logo_url ? (
                <img src={empresa!.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#FF2F92' }}>
                  {empresa!.razon_social.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{empresa!.razon_social}</p>
                {empresa!.nombre_comercial && (
                  <p className="text-xs text-gray-500">{empresa!.nombre_comercial}</p>
                )}
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
          ))}
        </div>

        <form action="/auth/logout" method="GET" className="mt-6 text-center">
          <button type="submit" className="text-xs text-gray-400 hover:text-gray-600">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
