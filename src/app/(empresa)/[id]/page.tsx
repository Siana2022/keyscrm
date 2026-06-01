import { createClient } from '@/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EmpleadosTab from '@/components/empresa/EmpleadosTab'
import EquiposTab from '@/components/empresa/EquiposTab'
import EncargadosTab from '@/components/empresa/EncargadosTab'

export default async function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: empresa } = await supabase
    .from('v_empresas_con_dpo')
    .select('*')
    .eq('id', id)
    .single()

  if (!empresa) notFound()

  const [{ data: empleados }, { data: equipos }, { data: encargados }] = await Promise.all([
    supabase.from('empleados').select('*').eq('empresa_id', id).order('nombre_completo'),
    supabase.from('equipos').select('*').eq('empresa_id', id).order('tipo_de_equipo'),
    supabase.from('v_encargados_por_empresa').select('*').eq('empresa_id', id),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Cabecera empresa */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{empresa.razon_social}</h1>
        {empresa.nombre_comercial && (
          <p className="text-gray-500 mt-1">{empresa.nombre_comercial}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
          {empresa.cifdni && <span><strong>CIF/NIF:</strong> {empresa.cifdni}</span>}
          {empresa.email_principal && <span><strong>Email:</strong> {empresa.email_principal}</span>}
          {empresa.dpo_nombre && (
            <span className="col-span-2">
              <strong>DPO:</strong> {empresa.dpo_nombre} — {empresa.dpo_email}
            </span>
          )}
        </div>
      </div>

      {/* Secciones */}
      <div className="space-y-6">
        <EmpleadosTab empresaId={id} empleados={empleados ?? []} />
        <EquiposTab empresaId={id} equipos={equipos ?? []} />
        <EncargadosTab empresaId={id} encargados={encargados ?? []} />
      </div>
    </div>
  )
}
