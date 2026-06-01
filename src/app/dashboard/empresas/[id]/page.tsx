import { createClient } from '@/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AdminSection from '@/components/dashboard/AdminSection'
import EmpresaForm from '@/components/dashboard/EmpresaForm'
import EmpleadosAdmin from '@/components/dashboard/EmpleadosAdmin'
import EncargadosAdmin from '@/components/dashboard/EncargadosAdmin'
import EquiposAdmin from '@/components/dashboard/EquiposAdmin'
import RevisionesAdmin from '@/components/dashboard/RevisionesAdmin'
import PlantillasEmpresaAdmin from '@/components/dashboard/PlantillasEmpresaAdmin'
import type { Database } from '@/types/database'

type EmpresaPlantilla = Database['public']['Tables']['empresa_plantilla']['Row']
type Plantilla = Database['public']['Tables']['plantillas_documento']['Row']
// EmpresaPlantilla and Plantilla are used below for type merging

export default async function EmpresaAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: empresa },
    { data: dpos },
    { data: empleados },
    { data: encargadosVinculados },
    { data: equipos },
    { data: revisiones },
    { data: empresaPlantillas },
    { data: todasPlantillas },
    { data: documentosManuales },
  ] = await Promise.all([
    supabase.from('empresas').select('*').eq('id', id).single(),
    supabase.from('dpos').select('id, nombre').order('nombre'),
    supabase.from('empleados').select('*').eq('empresa_id', id).order('nombre_completo'),
    supabase
      .from('v_encargados_por_empresa')
      .select('*')
      .eq('empresa_id', id),
    supabase.from('equipos').select('*').eq('empresa_id', id).order('tipo_de_equipo'),
    supabase.from('revisiones').select('*').eq('empresa_id', id).order('fecha', { ascending: false }),
    supabase
      .from('empresa_plantilla')
      .select('*')
      .eq('empresa_id', id),
    supabase.from('plantillas_documento').select('*').order('titulo'),
    supabase.from('documentos_manuales').select('*').eq('empresa_id', id).order('created_at', { ascending: false }),
  ])

  if (!empresa) notFound()

  // Adaptar encargados vinculados al formato del componente
  const encargadosAdaptados = (encargadosVinculados ?? []).map(enc => ({
    id: enc.encargado_id,
    razon_social: enc.razon_social,
    cif: enc.cif,
    nombre_del_servicio: enc.nombre_del_servicio,
    direccion: null,
    localidad: null,
    codigo_postal: null,
    provincia: null,
    created_at: '',
    updated_at: '',
    empresa_encargado_id: enc.empresa_encargado_id,
    estado: enc.estado,
  }))

  // Merge empresa_plantilla rows with their plantilla data
  const plantillasMap = new Map((todasPlantillas ?? []).map(p => [p.id, p]))
  const plantillasConJoin: (EmpresaPlantilla & { plantilla: Plantilla })[] = (empresaPlantillas ?? [])
    .filter(ep => plantillasMap.has(ep.plantilla_id))
    .map(ep => ({ ...ep, plantilla: plantillasMap.get(ep.plantilla_id)! }))

  const plantillasActivas = (todasPlantillas ?? []).filter(p => p.activo)

  const dpoAsignado = dpos?.find(d => d.id === empresa.dpo_id)

  return (
    <div className="max-w-7xl">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{empresa.razon_social}</h1>
          {empresa.nombre_comercial && (
            <p className="text-sm text-gray-500 mt-0.5">{empresa.nombre_comercial}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${id}`}
            className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            target="_blank"
          >
            Ver ficha empresa
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← Volver
          </Link>
        </div>
      </div>

      {/* Layout dos columnas */}
      <div className="grid grid-cols-[360px_1fr] gap-6 items-start">

        {/* Columna izquierda — Datos de la empresa */}
        <div className="sticky top-6 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Datos de la empresa</h2>
            </div>
            <div className="p-5">
              <EmpresaForm empresa={empresa} dpos={dpos ?? []} />
            </div>
          </div>

          {/* DPO asignado */}
          {dpoAsignado && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">DPO asignado</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                  {dpoAsignado.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800">{dpoAsignado.nombre}</span>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha — Secciones */}
        <div className="space-y-3">
          <AdminSection title={`Empleados (${empleados?.length ?? 0})`}>
            <EmpleadosAdmin empresaId={id} empleadosIniciales={empleados ?? []} />
          </AdminSection>

          <AdminSection title={`Encargados de tratamiento (${encargadosVinculados?.length ?? 0})`}>
            <EncargadosAdmin empresaId={id} encargadosIniciales={encargadosAdaptados} />
          </AdminSection>

          <AdminSection title={`Equipos (${equipos?.length ?? 0})`}>
            <EquiposAdmin empresaId={id} equiposIniciales={equipos ?? []} />
          </AdminSection>

          <AdminSection title={`Revisiones y auditorías (${revisiones?.length ?? 0})`}>
            <RevisionesAdmin empresaId={id} revisionesIniciales={revisiones ?? []} />
          </AdminSection>

          <AdminSection title="Documentos y plantillas">
            <PlantillasEmpresaAdmin
              empresaId={id}
              plantillasAsignadas={plantillasConJoin}
              todasPlantillas={plantillasActivas}
              documentosManuales={documentosManuales ?? []}
            />
          </AdminSection>
        </div>
      </div>
    </div>
  )
}
