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

  return (
    <div className="space-y-3 max-w-4xl">
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
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Volver
          </Link>
        </div>
      </div>

      {/* Datos empresa */}
      <AdminSection title="Datos de la empresa" defaultOpen={true}>
        <EmpresaForm empresa={empresa} dpos={dpos ?? []} />
      </AdminSection>

      {/* Empleados */}
      <AdminSection title={`Empleados (${empleados?.length ?? 0})`}>
        <EmpleadosAdmin
          empresaId={id}
          empleadosIniciales={empleados ?? []}
        />
      </AdminSection>

      {/* Encargados de tratamiento */}
      <AdminSection title={`Encargados de tratamiento (${encargadosVinculados?.length ?? 0})`}>
        <EncargadosAdmin
          empresaId={id}
          encargadosIniciales={encargadosAdaptados}
        />
      </AdminSection>

      {/* Equipos */}
      <AdminSection title={`Equipos (${equipos?.length ?? 0})`}>
        <EquiposAdmin
          empresaId={id}
          equiposIniciales={equipos ?? []}
        />
      </AdminSection>

      {/* DPO */}
      <AdminSection title="DPO asignado">
        <div className="space-y-2">
          {empresa.dpo_id ? (
            (() => {
              const dpo = dpos?.find(d => d.id === empresa.dpo_id)
              return dpo ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
                    {dpo.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 font-medium">{dpo.nombre}</span>
                </div>
              ) : <p className="text-sm text-gray-400">DPO no encontrado</p>
            })()
          ) : (
            <p className="text-sm text-gray-400">Sin DPO asignado. Asigna uno en &quot;Datos de la empresa&quot;.</p>
          )}
        </div>
      </AdminSection>

      {/* Revisiones y auditorías */}
      <AdminSection title={`Revisiones y auditorías (${revisiones?.length ?? 0})`}>
        <RevisionesAdmin
          empresaId={id}
          revisionesIniciales={revisiones ?? []}
        />
      </AdminSection>

      {/* Plantillas por categoría */}
      <AdminSection title="Documentos y plantillas">
        <PlantillasEmpresaAdmin
          empresaId={id}
          plantillasAsignadas={plantillasConJoin}
          todasPlantillas={plantillasActivas}
          documentosManuales={documentosManuales ?? []}
        />
      </AdminSection>
    </div>
  )
}
