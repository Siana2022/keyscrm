import { createClient } from '@/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import SeccionAccordion from '@/components/empresa/SeccionAccordion'
import TablaEmpleados from '@/components/empresa/TablaEmpleados'
import TablaEncargados from '@/components/empresa/TablaEncargados'
import TablaEquipos from '@/components/empresa/TablaEquipos'
import TablaRevisiones from '@/components/empresa/TablaRevisiones'
import SeccionDocumentos from '@/components/empresa/SeccionDocumentos'

export default async function EmpresaFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: empresa } = await supabase.from('v_empresas_con_dpo').select('*').eq('id', id).single()
  if (!empresa) notFound()

  const [
    { data: empleados },
    { data: encargados },
    { data: equipos },
    { data: revisiones },
    { data: plantillasAsignadas },
    { data: docsManuales },
  ] = await Promise.all([
    supabase.from('empleados').select('*').eq('empresa_id', id).eq('estado', 'active').order('nombre_completo'),
    supabase.from('v_encargados_por_empresa').select('*').eq('empresa_id', id).eq('estado', 'active'),
    supabase.from('equipos').select('*').eq('empresa_id', id).eq('estado', 'active').order('tipo_de_equipo'),
    supabase.from('revisiones').select('*').eq('empresa_id', id).order('fecha', { ascending: false }),
    supabase.from('empresa_plantilla').select('*, plantillas_documento(*)').eq('empresa_id', id).eq('estado', 'active'),
    supabase.from('documentos_manuales').select('*').eq('empresa_id', id).order('categoria'),
  ])

  // Datos de empresa para mostrar
  const datosEmpresa = await supabase.from('empresas').select('*').eq('id', id).single()
  const emp = datosEmpresa.data

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4" style={{ backgroundColor: '#111' }}>
        <Image src="/keys/logo.png" alt="Keys Safe" width={80} height={87} className="object-contain" />
        <Link
          href="/auth/logout"
          className="text-white text-sm font-semibold px-6 py-2 rounded"
          style={{ backgroundColor: '#FF2F92' }}
        >
          Salir de KEYS
        </Link>
      </div>

      {/* ── CABECERA DECORATIVA ── */}
      <div className="flex items-center justify-center gap-0" style={{ backgroundColor: '#111' }}>
        <Image src="/keys/deco-left.png" alt="" width={200} height={142} className="object-contain opacity-80" />
        <Image src="/keys/header-center.jpeg" alt="" width={300} height={213} className="object-contain" />
        <Image src="/keys/deco-right.png" alt="" width={200} height={142} className="object-contain opacity-80" />
      </div>

      {/* ── NOMBRE EMPRESA ── */}
      <div className="text-center py-6" style={{ backgroundColor: '#111' }}>
        <h1 className="text-white text-2xl font-bold tracking-wide uppercase">{empresa.razon_social}</h1>
        {emp && (
          <div className="text-gray-400 text-sm mt-2 space-y-0.5">
            {emp.cifdni && <p>{emp.cifdni}</p>}
            {emp.direccion_fiscal && <p>{emp.direccion_fiscal}</p>}
            {emp.localidad && emp.provincia && <p>{emp.localidad} · {emp.provincia}</p>}
          </div>
        )}
      </div>

      {/* ── CONTENIDO ── */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-0">

        {/* DATA MANAGER */}
        <SeccionBarra titulo="DATA MANAGER" />
        <div className="px-6 py-5" style={{ backgroundColor: '#222' }}>
          <p className="text-gray-400 text-sm mb-4">
            El Data Manager es la persona encargada para supervisar que todas las tareas necesarias se lleven a cabo correctamente.
          </p>
          {emp && (
            <div className="grid grid-cols-3 gap-6">
              <Campo label="Nombre" valor={emp.nombre_data_manager} />
              <Campo label="Apellidos" valor={emp.apellidos_data_manager} />
              <Campo label="DNI" valor={emp.dni_data_manager} />
            </div>
          )}
        </div>

        {/* DPO */}
        <SeccionBarra titulo="DPO" />
        <div className="px-6 py-5" style={{ backgroundColor: '#222' }}>
          {empresa.dpo_nombre ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Campo label="Nombre" valor={empresa.dpo_nombre} />
              <Campo label="Email" valor={empresa.dpo_email} />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sin DPO asignado</p>
          )}
        </div>

        {/* USUARIOS */}
        <SeccionIcono src="/keys/icon-usuarios.png" titulo="USUARIOS" />
        <div className="px-6 py-3" style={{ backgroundColor: '#222' }}>
          <p className="text-gray-400 text-sm mb-4">
            Recuerda que se consideran usuarios todo aquel personal interno de la empresa que tenga acceso a datos de carácter personal.
          </p>
        </div>
        <SeccionAccordion titulo="Lista de usuarios" colorTitulo="#FF2F92">
          <TablaEmpleados empleados={empleados ?? []} empresaId={id} />
        </SeccionAccordion>
        <SeccionAccordion titulo="Añadir nuevo usuario" colorTitulo="#FF2F92">
          <FormAltaEmpleado empresaId={id} />
        </SeccionAccordion>

        {/* SERVICIOS EXTERNOS */}
        <SeccionIcono src="/keys/icon-servext.png" titulo="SERVICIOS EXTERNOS" />
        <div className="px-6 py-3" style={{ backgroundColor: '#222' }}>
          <p className="text-gray-400 text-sm mb-4">
            Recuerda que únicamente debemos registrar los servicios externos que tengan acceso a datos de carácter personal de la empresa.
          </p>
        </div>
        <SeccionAccordion titulo="Lista de encargados/servicios externos" colorTitulo="#FF2F92">
          <TablaEncargados encargados={encargados ?? []} empresaId={id} />
        </SeccionAccordion>
        <SeccionAccordion titulo="Añadir servicio externo" colorTitulo="#FF2F92">
          <FormAltaEncargado empresaId={id} />
        </SeccionAccordion>

        {/* EQUIPOS */}
        <SeccionIcono src="/keys/icon-equipos.png" titulo="EQUIPOS" />
        <div className="px-6 py-3" style={{ backgroundColor: '#222' }}>
          <p className="text-gray-400 text-sm mb-4">
            Recuerda que únicamente debemos registrar los equipos que almacenen o traten datos de carácter personal.
          </p>
        </div>
        <SeccionAccordion titulo="Lista de equipos" colorTitulo="#FF2F92">
          <TablaEquipos equipos={equipos ?? []} empresaId={id} />
        </SeccionAccordion>
        <SeccionAccordion titulo="Añadir equipo" colorTitulo="#FF2F92">
          <FormAltaEquipo empresaId={id} />
        </SeccionAccordion>

        {/* REGISTROS */}
        <SeccionBarra titulo="REGISTROS" />
        <div className="grid grid-cols-2 gap-0" style={{ backgroundColor: '#222' }}>
          {/* Revisión trimestral */}
          <div className="flex gap-4 p-5 border-r border-gray-700">
            <Image src="/keys/revision-trimestral.webp" alt="Revisión" width={80} height={80} className="object-contain flex-shrink-0" />
            <div className="flex-1">
              <SeccionAccordion titulo="Revisiones trimestrales" colorTitulo="#FF2F92" compact>
                <TablaRevisiones
                  revisiones={(revisiones ?? []).filter(r => r.tipo === 'revision_trimestral')}
                  tipo="revision_trimestral"
                  empresaId={id}
                />
              </SeccionAccordion>
              <div className="flex gap-2 mt-3">
                <BotonAccion label="REALIZAR REVISIÓN TRIMESTRAL" empresaId={id} accion="revision_trimestral" />
                <BotonAccion label="SIN CAMBIOS" empresaId={id} accion="sin_cambios" small />
              </div>
            </div>
          </div>
          {/* Auditoría */}
          <div className="flex gap-4 p-5">
            <Image src="/keys/auditoria.webp" alt="Auditoría" width={80} height={80} className="object-contain flex-shrink-0" />
            <div className="flex-1">
              <SeccionAccordion titulo="Auditorías" colorTitulo="#FF2F92" compact>
                <TablaRevisiones
                  revisiones={(revisiones ?? []).filter(r => r.tipo === 'auditoria')}
                  tipo="auditoria"
                  empresaId={id}
                />
              </SeccionAccordion>
              <div className="mt-3">
                <BotonAccion label="REALIZAR AUDITORÍA" empresaId={id} accion="auditoria" />
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENTOS */}
        <div className="flex items-center justify-center gap-6 py-6 mt-4" style={{ backgroundColor: '#111' }}>
          <Image src="/keys/deco-left.png" alt="" width={120} height={85} className="object-contain opacity-60" />
          <h2 className="text-white text-3xl font-bold tracking-widest uppercase">DOCUMENTOS</h2>
          <Image src="/keys/deco-right.png" alt="" width={120} height={85} className="object-contain opacity-60" />
        </div>

        <SeccionDocumentos
          empresaId={id}
          plantillasAsignadas={(plantillasAsignadas ?? []) as any[]}
          docsManuales={docsManuales ?? []}
        />

        {/* MANUALES */}
        <div className="mt-8">
          <h2 className="text-center text-white text-xl font-bold uppercase tracking-wide py-4" style={{ backgroundColor: '#111' }}>
            MANUALES PARA EL DATA MANAGER
          </h2>
          <div className="space-y-3 py-4" style={{ backgroundColor: '#222' }}>
            {[
              { img: '/keys/manual-m1.jpeg', cod: 'M1', titulo: 'Guía para el Data Manager' },
              { img: '/keys/manual-m2.jpeg', cod: 'M2', titulo: 'Cómo crear y gestionar usuarios' },
              { img: '/keys/manual-m3.jpeg', cod: 'M3', titulo: 'Uso correcto de los equipos' },
            ].map(m => (
              <div key={m.cod} className="flex items-center gap-4 px-6 py-3">
                <Image src={m.img} alt={m.titulo} width={100} height={56} className="rounded object-cover flex-shrink-0" />
                <div className="flex items-center gap-3">
                  <Image src="/keys/manual-icon.jpeg" alt="" width={32} height={32} className="rounded-full object-cover" />
                  <p className="text-white text-sm">
                    <span style={{ color: '#FF2F92', fontWeight: 'bold', marginRight: '12px' }}>{m.cod}</span>
                    {m.titulo}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-center text-white text-xl font-bold uppercase tracking-wide py-4 mt-4" style={{ backgroundColor: '#111' }}>
            MANUALES PARA USUARIOS
          </h2>
          <div className="space-y-3 py-4" style={{ backgroundColor: '#222' }}>
            {[
              { img: '/keys/manual-m4.jpeg', cod: 'M4', titulo: 'Manual del usuario' },
              { img: '/keys/manual-m5.jpeg', cod: 'M5', titulo: 'Guía de buenas prácticas' },
              { img: '/keys/manual-m6.jpeg', cod: 'M6', titulo: 'Manual de seguridad' },
            ].map(m => (
              <div key={m.cod} className="flex items-center gap-4 px-6 py-3">
                <Image src={m.img} alt={m.titulo} width={100} height={56} className="rounded object-cover flex-shrink-0" />
                <div className="flex items-center gap-3">
                  <Image src="/keys/manual-icon.jpeg" alt="" width={32} height={32} className="rounded-full object-cover" />
                  <p className="text-white text-sm">
                    <span style={{ color: '#FF2F92', fontWeight: 'bold', marginRight: '12px' }}>{m.cod}</span>
                    {m.titulo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8">
          <Image src="/keys/footer.png" alt="Keys Safe" width={1200} height={395} className="w-full object-contain" />
        </div>

      </div>
    </div>
  )
}

// ── Componentes auxiliares del servidor ──────────────────────────────────────

function SeccionBarra({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center px-6 py-3 mt-4" style={{ backgroundColor: 'rgba(122,122,122,0.37)' }}>
      <h2 className="text-white font-bold text-sm uppercase tracking-widest">{titulo}</h2>
    </div>
  )
}

function SeccionIcono({ src, titulo }: { src: string; titulo: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 mt-4" style={{ backgroundColor: 'rgba(122,122,122,0.37)' }}>
      <Image src={src} alt={titulo} width={32} height={32} className="object-contain" />
      <h2 className="text-white font-bold text-sm uppercase tracking-widest">{titulo}</h2>
    </div>
  )
}

function Campo({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-sm">{valor || '—'}</p>
    </div>
  )
}

function FormAltaEmpleado({ empresaId }: { empresaId: string }) {
  return (
    <form action="/api/empleados" method="POST" className="grid grid-cols-2 gap-3">
      <input type="hidden" name="empresa_id" value={empresaId} />
      <input name="nombre_completo" placeholder="Nombre completo *" required className="input-dark" />
      <input name="dni" placeholder="DNI" className="input-dark" />
      <input name="cargo" placeholder="Cargo" className="input-dark" />
      <label className="flex items-center gap-2 text-gray-300 text-sm">
        <input type="checkbox" name="teletrabajo" value="true" className="rounded" />
        Teletrabajo
      </label>
      <div className="col-span-2">
        <button type="submit" className="w-full py-2 text-sm font-bold text-white rounded" style={{ backgroundColor: '#FF2F92' }}>
          AÑADIR USUARIO
        </button>
      </div>
    </form>
  )
}

function FormAltaEncargado({ empresaId }: { empresaId: string }) {
  return (
    <form action="/api/encargados" method="POST" className="grid grid-cols-2 gap-3">
      <input type="hidden" name="empresa_id" value={empresaId} />
      <input name="razon_social" placeholder="Razón social *" required className="input-dark" />
      <input name="cif" placeholder="CIF" className="input-dark" />
      <input name="nombre_del_servicio" placeholder="Nombre del servicio *" required className="input-dark col-span-2" />
      <input name="direccion" placeholder="Dirección" className="input-dark" />
      <input name="localidad" placeholder="Localidad" className="input-dark" />
      <div className="col-span-2">
        <button type="submit" className="w-full py-2 text-sm font-bold text-white rounded" style={{ backgroundColor: '#FF2F92' }}>
          AÑADIR SERVICIO EXTERNO
        </button>
      </div>
    </form>
  )
}

function FormAltaEquipo({ empresaId }: { empresaId: string }) {
  return (
    <form action="/api/equipos" method="POST" className="grid grid-cols-2 gap-3">
      <input type="hidden" name="empresa_id" value={empresaId} />
      <select name="tipo_de_equipo" required className="input-dark col-span-2">
        <option value="">Tipo de equipo *</option>
        {['Ordenador Portátil','Ordenador Sobremesa','Móvil','Tablet','Servidor','Disco Duro','Otros'].map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input name="codigo_del_equipo" placeholder="Código del equipo" className="input-dark" />
      <input name="responsable" placeholder="Responsable" className="input-dark" />
      <div className="col-span-2">
        <button type="submit" className="w-full py-2 text-sm font-bold text-white rounded" style={{ backgroundColor: '#FF2F92' }}>
          AÑADIR EQUIPO
        </button>
      </div>
    </form>
  )
}

function BotonAccion({ label, empresaId, accion, small }: { label: string; empresaId: string; accion: string; small?: boolean }) {
  return (
    <button
      className={`text-white font-bold rounded px-3 py-2 text-xs ${small ? '' : 'w-full'}`}
      style={{ backgroundColor: '#FF2F92' }}
    >
      {label}
    </button>
  )
}
