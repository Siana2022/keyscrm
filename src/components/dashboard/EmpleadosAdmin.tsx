'use client'

import { useState } from 'react'
import type { Database, EstadoRegistro } from '@/types/database'

type Empleado = Database['public']['Tables']['empleados']['Row']

interface EmpleadosAdminProps {
  empresaId: string
  empleadosIniciales: Empleado[]
}

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
  nombre_completo: '',
  dni: '',
  cargo: '',
  teletrabajo: false,
  estado: 'pending' as EstadoRegistro,
}

export default function EmpleadosAdmin({ empresaId, empleadosIniciales }: EmpleadosAdminProps) {
  const [empleados, setEmpleados] = useState<Empleado[]>(empleadosIniciales)
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

  function openEdit(emp: Empleado) {
    setEditingId(emp.id)
    setForm({
      nombre_completo: emp.nombre_completo,
      dni: emp.dni ?? '',
      cargo: emp.cargo ?? '',
      teletrabajo: emp.teletrabajo,
      estado: emp.estado,
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
        nombre_completo: form.nombre_completo,
        dni: form.dni || null,
        cargo: form.cargo || null,
        teletrabajo: form.teletrabajo,
        estado: form.estado,
      }
      let res: Response
      if (editingId) {
        res = await fetch(`/api/admin/empleados/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/empleados', {
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
      const saved: Empleado = await res.json()
      if (editingId) {
        setEmpleados(prev => prev.map(e => e.id === editingId ? saved : e))
      } else {
        setEmpleados(prev => [...prev, saved])
      }
      cancelForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleEstado(emp: Empleado, estado: EstadoRegistro) {
    const res = await fetch(`/api/admin/empleados/${emp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      const updated: Empleado = await res.json()
      setEmpleados(prev => prev.map(e => e.id === emp.id ? updated : e))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{empleados.length} empleado{empleados.length !== 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={openNew}
          className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Añadir empleado
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">{editingId ? 'Editar empleado' : 'Nuevo empleado'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nombre completo *</label>
              <input
                required
                value={form.nombre_completo}
                onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))}
                className="input"
                placeholder="Nombre y apellidos"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">DNI</label>
              <input
                value={form.dni}
                onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
                className="input"
                placeholder="00000000A"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cargo</label>
              <input
                value={form.cargo}
                onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                className="input"
                placeholder="Director, Técnico..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoRegistro }))}
                className="input bg-white"
              >
                {ESTADOS.map(s => (
                  <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="teletrabajo"
              checked={form.teletrabajo}
              onChange={e => setForm(f => ({ ...f, teletrabajo: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="teletrabajo" className="text-xs text-gray-700">Teletrabajo</label>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : editingId ? 'Guardar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="text-xs text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {empleados.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Nombre</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">DNI</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Cargo</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Teletrabajo</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Estado</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {empleados.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-medium text-gray-900">{emp.nombre_completo}</td>
                  <td className="px-3 py-2.5 text-gray-600">{emp.dni ?? '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{emp.cargo ?? '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{emp.teletrabajo ? 'Sí' : 'No'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${ESTADO_CLASS[emp.estado]}`}>
                      {ESTADO_LABEL[emp.estado]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(emp)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <select
                        value={emp.estado}
                        onChange={e => handleEstado(emp, e.target.value as EstadoRegistro)}
                        className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600"
                      >
                        {ESTADOS.map(s => (
                          <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-4 text-center">No hay empleados registrados</p>
      )}
    </div>
  )
}
