'use client'

import { useState } from 'react'
import type { Database, TipoAuditoria } from '@/types/database'

type Revision = Database['public']['Tables']['revisiones']['Row']

interface RevisionesAdminProps {
  empresaId: string
  revisionesIniciales: Revision[]
}

const TIPO_LABEL: Record<TipoAuditoria, string> = {
  auditoria: 'Auditoría',
  revision_trimestral: 'Revisión trimestral',
}

const emptyForm = {
  fecha: '',
  tipo: 'auditoria' as TipoAuditoria,
  notas: '',
  estado_resultado: '',
}

export default function RevisionesAdmin({ empresaId, revisionesIniciales }: RevisionesAdminProps) {
  const [revisiones, setRevisiones] = useState<Revision[]>(revisionesIniciales)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const auditorias = revisiones.filter(r => r.tipo === 'auditoria')
  const trimestrales = revisiones.filter(r => r.tipo === 'revision_trimestral')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/revisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: empresaId,
          fecha: form.fecha,
          tipo: form.tipo,
          notas: form.notas || null,
          estado_resultado: form.estado_resultado || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Error al guardar')
        return
      }
      const saved: Revision = await res.json()
      setRevisiones(prev => [saved, ...prev])
      setShowForm(false)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta revisión?')) return
    const res = await fetch(`/api/admin/revisiones/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRevisiones(prev => prev.filter(r => r.id !== id))
    }
  }

  function formatFecha(f: string) {
    return new Date(f).toLocaleDateString('es-ES')
  }

  function RevisionTable({ items, titulo }: { items: Revision[]; titulo: string }) {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{titulo}</p>
        {items.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Fecha</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Notas</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Resultado</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-900 whitespace-nowrap">{formatFecha(r.fecha)}</td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-xs truncate">{r.notas ?? '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-xs truncate">{r.estado_resultado ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button type="button" onClick={() => eliminar(r.id)}
                        className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
            Sin registros
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button type="button" onClick={() => { setShowForm(s => !s); setError(null) }}
          className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
          + Añadir revisión
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Nueva revisión / auditoría</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha *</label>
              <input type="date" required value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoAuditoria }))}
                className="input bg-white">
                <option value="auditoria">Auditoría</option>
                <option value="revision_trimestral">Revisión trimestral</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Notas</label>
              <textarea value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                className="input resize-none" rows={2} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Estado / Resultado</label>
              <textarea value={form.estado_resultado}
                onChange={e => setForm(f => ({ ...f, estado_resultado: e.target.value }))}
                className="input resize-none" rows={2} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }}
              className="text-xs text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <RevisionTable items={auditorias} titulo="Auditorías" />
      <RevisionTable items={trimestrales} titulo="Revisiones trimestrales" />
    </div>
  )
}
