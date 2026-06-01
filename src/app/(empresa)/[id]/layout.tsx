import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/layout/LogoutButton'

export default async function EmpresaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: empresa } = await supabase
    .from('empresas')
    .select('razon_social')
    .eq('id', id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">Keys Safe</span>
          {empresa && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600 text-sm">{empresa.razon_social}</span>
            </>
          )}
        </div>
        <LogoutButton />
      </header>
      <main>{children}</main>
    </div>
  )
}
