'use client'

import { useState } from 'react'
import type { Database, EstadoRegistro } from '@/types/database'

type Equipo = Database['public']['Tables']['equipos']['Row']

const TIPOS_EQUIPO = [
  'Ordenador Portátil',
  'Sobremesa',
  'Móvil',
  'Tablet',
  'Servidor',
  'Disco Duro',
  'Otros',
]

const ESTADOS: EstadoRegistro[] = ['active', 'pending', 'baja']
const ESTADO_LABEL: Record<EstadoRegistro, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  baja: 'Baja',
}
const ESTADO_CLASS: Record<EstadoRegistro, string> = {
  active: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  baja: 'bg-red-50 text-red-700',
}

const emptyForm = {
  tipo_de_equipo: TIPOS_EQUIPO[0],
  codigo_del_equipo: '',
  responsable_del_equipo: '',
  otro: '',
  estado: 'pending' as EstadoRegistro,
}

interface EquiposAdminProps {
  empresaId: string
  equiposIniciales: Equipo[]
}

export default function EquiposAdmin({ empresaId, equiposIniciales }: EquiposAdminProps) {
  const [equipos, setEquipos] = useState<Equipo[]>(equiposIniciales)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setError(null)
  }

  function openEdit(eq: Equipo) {
    setEditingId(eq.id)
    setForm({
      tipo_de_equipo: eq.tipo_de_equipo,
      codigo_del_equipo: eq.codigo_del_equipo ?? '',
      responsable_del_equipo: eq.responsable_del_equipo ?? '',
      otro: eq.otro ?? '',
      estado: eq.estado,
    })
    setShowForm(true)
    setError(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        empresa_id: empresaId,
        tipo_de_equipo: form.tipo_de_equipo,
        codigo_del_equipo: form.codigo_del_equipo || null,
        responsable_del_equipo: form.responsable_del_equipo || null,
        otro: form.tipo_de_equipo === 'Otros' ? form.otro || null : null,
        estado: form.estado,
      }
      let res: Response
      if (editingId) {
        res = await fetch(`/api/admin/equipos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/equipos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Error al guardar')
        return
      }
      const saved: Equipo = await res.json()
      if (editingId) {
        setEquipos(prev => prev.map(e => e.id === editingId ? saved : e))
      } else {
        setEquipos(prev => [...prev, saved])
      }
      cancelForm()
    } finally {
      setSaving(false)
    }
  }

  async function cambiarEstado(id: string, estado: EstadoRegistro) {
    const res = await fetch(`/api/admin/equipos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      const updated: Equipo = await res.json()
      setEquipos(prev => prev.map(e => e.id === id ? updated : e))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{equipos.length} equipo{equipos.length !== 1 ? 's' : ''}</p>
        <button type="button" onClick={openNew}
          className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
          + Añadir equipo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">{editingId ? 'Editar equipo' : 'Nuevo equipo'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de equipo *</label>
              <select
                value={form.tipo_de_equipo}
                onChange={e => setForm(f => ({ ...f, tipo_de_equipo: e.target.value }))}
                className="input bg-white"
              >
                {TIPOS_EQUIPO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Código del equipo</label>
              <input value={form.codigo_del_equipo}
                onChange={e => setForm(f => ({ ...f, codigo_del_equipo: e.target.value }))}
                className="input" placeholder="SN-12345" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Responsable</label>
              <input value={form.responsable_del_equipo}
                onChange={e => setForm(f => ({ ...f, responsable_del_equipo: e.target.value }))}
                className="input" placeholder="Nombre del responsable" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Estado</label>
              <select value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoRegistro }))}
                className="input bg-white">
                {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
              </select>
            </div>
            {form.tipo_de_equipo === 'Otros' && (
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Descripción (Otros)</label>
                <input value={form.otro}
                  onChange={e => setForm(f => ({ ...f, otro: e.target.value }))}
                  className="input" placeholder="Descripción del equipo" />
              </div>
            )}
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : editingId ? 'Guardar' : 'Crear'}
            </button>
            <button type="button" onClick={cancelForm}
              className="text-xs text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {equipos.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Tipo</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Código</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Responsable</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Estado</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {equipos.map(eq => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-900">
                    {eq.tipo_de_equipo}{eq.otro ? ` — ${eq.otro}` : ''}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{eq.codigo_del_equipo ?? '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{eq.responsable_del_equipo ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${ESTADO_CLASS[eq.estado]}`}>
                      {ESTADO_LABEL[eq.estado]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEdit(eq)}
                        className="text-xs text-blue-600 hover:underline">Editar</button>
                      <select
                        value={eq.estado}
                        onChange={e => cambiarEstado(eq.id, e.target.value as EstadoRegistro)}
                        className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600">
                        {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-4 text-center">No hay equipos registrados</p>
      )}
    </div>
  )
}
