'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Empresa = Database['public']['Tables']['empresas']['Row']
type Dpo = { id: string; nombre: string }

export default function EmpresaForm({
  empresa,
  dpos,
}: {
  empresa?: Empresa
  dpos: Dpo[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!empresa

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    const payload = {
      razon_social: data.razon_social,
      nombre_comercial: data.nombre_comercial || null,
      cifdni: data.cifdni || null,
      direccion_fiscal: data.direccion_fiscal || null,
      codigo_postal: data.codigo_postal || null,
      localidad: data.localidad || null,
      provincia: data.provincia || null,
      telefono: data.telefono || null,
      email_principal: data.email_principal || null,
      email_data_manager: data.email_data_manager || null,
      nombre_pila_data_manager: data.nombre_pila_data_manager || null,
      nombre_data_manager: data.nombre_data_manager || null,
      apellidos_data_manager: data.apellidos_data_manager || null,
      dni_data_manager: data.dni_data_manager || null,
      pagina_web: data.pagina_web || null,
      lssi_datos_registrales: data.lssi_datos_registrales || null,
      grupo_de_empresas: data.grupo_de_empresas || null,
      dpo_id: data.dpo_id || null,
    }

    const url = isEdit ? `/api/empresas/${empresa.id}` : '/api/empresas'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Error al guardar')
      return
    }
    const result = await res.json()
    if (isEdit) {
      router.refresh()
    } else {
      router.push(`/dashboard/empresas/${result.id}`)
    }
  }

  const field = (key: keyof Empresa) => empresa?.[key] as string ?? ''

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

      <div className="grid grid-cols-2 gap-4">
        <Field label="Razón social *" name="razón_social" required>
          <input name="razon_social" required defaultValue={field('razon_social')}
            className="input" placeholder="Empresa S.L." />
        </Field>
        <Field label="Nombre comercial" name="nombre_comercial">
          <input name="nombre_comercial" defaultValue={field('nombre_comercial')}
            className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="CIF / NIF" name="cifdni">
          <input name="cifdni" defaultValue={field('cifdni')} className="input" />
        </Field>
        <Field label="Teléfono" name="telefono">
          <input name="telefono" defaultValue={field('telefono')} className="input" />
        </Field>
      </div>

      <Field label="Dirección fiscal" name="direccion_fiscal">
        <input name="direccion_fiscal" defaultValue={field('direccion_fiscal')} className="input" />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Localidad" name="localidad">
          <input name="localidad" defaultValue={field('localidad')} className="input" />
        </Field>
        <Field label="Código postal" name="codigo_postal">
          <input name="codigo_postal" defaultValue={field('codigo_postal')} className="input" />
        </Field>
        <Field label="Provincia" name="provincia">
          <input name="provincia" defaultValue={field('provincia')} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Email principal" name="email_principal">
          <input name="email_principal" type="email" defaultValue={field('email_principal')} className="input" />
        </Field>
        <Field label="Página web" name="pagina_web">
          <input name="pagina_web" defaultValue={field('pagina_web')} className="input" />
        </Field>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Data Manager (Responsable de datos)</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Nombre" name="nombre_data_manager">
            <input name="nombre_data_manager" defaultValue={field('nombre_data_manager')} className="input" />
          </Field>
          <Field label="Apellidos" name="apellidos_data_manager">
            <input name="apellidos_data_manager" defaultValue={field('apellidos_data_manager')} className="input" />
          </Field>
          <Field label="DNI" name="dni_data_manager">
            <input name="dni_data_manager" defaultValue={field('dni_data_manager')} className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Nombre de pila (para documentos)" name="nombre_pila_data_manager">
            <input name="nombre_pila_data_manager" defaultValue={field('nombre_pila_data_manager')} className="input" />
          </Field>
          <Field label="Email del responsable" name="email_data_manager">
            <input name="email_data_manager" type="email" defaultValue={field('email_data_manager')} className="input" />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="DPO asignado" name="dpo_id">
          <select name="dpo_id" defaultValue={field('dpo_id')} className="input bg-white">
            <option value="">Sin DPO</option>
            {dpos.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </Field>
        <Field label="Grupo de empresas" name="grupo_de_empresas">
          <input name="grupo_de_empresas" defaultValue={field('grupo_de_empresas')} className="input" />
        </Field>
      </div>

      <Field label="Datos registrales LSSI" name="lssi_datos_registrales">
        <textarea name="lssi_datos_registrales" rows={3} defaultValue={field('lssi_datos_registrales')}
          className="input resize-none" />
      </Field>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear empresa'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Field({ label, name, required, children }: {
  label: string; name: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}
