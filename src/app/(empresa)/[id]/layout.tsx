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

  return <>{children}</>

}
