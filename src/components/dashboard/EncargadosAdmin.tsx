'use client'

import { useState, useCallback } from 'react'
import type { Database, EstadoRegistro } from '@/types/database'

type Encargado = Database['public']['Tables']['encargados_tratamiento']['Row']
type EmpresaEncargado = Database['public']['Tables']['empresa_encargado']['Row']

interface EncargadoConVinculo extends Encargado {
  empresa_encargado_id: string
  estado: EstadoRegistro
}

interface EncargadosAdminProps {
  empresaId: string
  encargadosIniciales: EncargadoConVinculo[]
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

type Mode = 'none' | 'buscar' | 'crear'

const emptyNuevo = {
  razon_social: '',
  cif: '',
  nombre_del_servicio: '',
  direccion: '',
  localidad: '',
  codigo_postal: '',
  provincia: '',
}

export default function EncargadosAdmin({ empresaId, encargadosIniciales }: EncargadosAdminProps) {
  const [encargados, setEncargados] = useState<EncargadoConVinculo[]>(encargadosIniciales)
  const [mode, setMode] = useState<Mode>('none')
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Encargado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [nuevo, setNuevo] = useState(emptyNuevo)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscar = useCallback(async (q: string) => {
    if (!q.trim()) { setResultados([]); return }
    setBuscando(true)
    try {
      const res = await fetch(`/api/admin/buscar-encargados?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResultados(data)
      }
    } finally {
      setBuscando(false)
    }
  }, [])

  async function vincular(encargadoId: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/empresa-encargado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id: empresaId, encargado_id: encargadoId }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Error al vincular')
        return
      }
      const data = await res.json()
      // Fetch the encargado details
      const enc = resultados.find(e => e.id === encargadoId)
      if (enc) {
        setEncargados(prev => [...prev, {
          ...enc,
          empresa_encargado_id: data.id,
          estado: data.estado,
        }])
      }
      setMode('none')
      setQuery('')
      setResultados([])
    } finally {
      setSaving(false)
    }
  }

  async function crearYVincular(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/encargados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevo, empresa_id: empresaId }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Error al crear')
        return
      }
      const data = await res.json()
      setEncargados(prev => [...prev, {
        ...data.encargado,
        empresa_encargado_id: data.vinculo.id,
        estado: data.vinculo.estado,
      }])
      setMode('none')
      setNuevo(emptyNuevo)
    } finally {
      setSaving(false)
    }
  }

  async function cambiarEstado(empresaEncargadoId: string, estado: EstadoRegistro) {
    const res = await fetch(`/api/admin/empresa-encargado/${empresaEncargadoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      setEncargados(prev =>
        prev.map(e => e.empresa_encargado_id === empresaEncargadoId ? { ...e, estado } : e)
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{encargados.length} encargado{encargados.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setMode(m => m === 'buscar' ? 'none' : 'buscar'); setError(null) }}
            className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Vincular existente
          </button>
          <button
            type="button"
            onClick={() => { setMode(m => m === 'crear' ? 'none' : 'crear'); setError(null) }}
            className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Crear nuevo
          </button>
        </div>
      </div>

      {/* Buscador */}
      {mode === 'buscar' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Vincular encargado existente</p>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); buscar(e.target.value) }}
            className="input"
            placeholder="Buscar por nombre o CIF..."
          />
          {buscando && <p className="text-xs text-gray-400">Buscando...</p>}
          {resultados.length > 0 && (
            <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white max-h-48 overflow-y-auto">
              {resultados.map(enc => (
                <li key={enc.id} className="px-3 py-2 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{enc.razon_social}</p>
                    <p className="text-xs text-gray-500">{enc.nombre_del_servicio}{enc.cif ? ` · ${enc.cif}` : ''}</p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => vincular(enc.id)}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Vincular
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>}
        </div>
      )}

      {/* Crear nuevo */}
      {mode === 'crear' && (
        <form onSubmit={crearYVincular} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Nuevo encargado de tratamiento</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Razón social *</label>
              <input required value={nuevo.razon_social}
                onChange={e => setNuevo(n => ({ ...n, razon_social: e.target.value }))}
                className="input" placeholder="Empresa S.L." />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">CIF</label>
              <input value={nuevo.cif}
                onChange={e => setNuevo(n => ({ ...n, cif: e.target.value }))}
                className="input" placeholder="B12345678" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nombre del servicio *</label>
              <input required value={nuevo.nombre_del_servicio}
                onChange={e => setNuevo(n => ({ ...n, nombre_del_servicio: e.target.value }))}
                className="input" placeholder="Hosting, Nóminas..." />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dirección</label>
              <input value={nuevo.direccion}
                onChange={e => setNuevo(n => ({ ...n, direccion: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Localidad</label>
              <input value={nuevo.localidad}
                onChange={e => setNuevo(n => ({ ...n, localidad: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Código postal</label>
              <input value={nuevo.codigo_postal}
                onChange={e => setNuevo(n => ({ ...n, codigo_postal: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Provincia</label>
              <input value={nuevo.provincia}
                onChange={e => setNuevo(n => ({ ...n, provincia: e.target.value }))}
                className="input" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear y vincular'}
            </button>
            <button type="button" onClick={() => { setMode('none'); setNuevo(emptyNuevo) }}
              className="text-xs text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {encargados.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Razón social</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">CIF</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Servicio</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Estado</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {encargados.map(enc => (
                <tr key={enc.empresa_encargado_id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-medium text-gray-900">{enc.razon_social}</td>
                  <td className="px-3 py-2.5 text-gray-600">{enc.cif ?? '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{enc.nombre_del_servicio}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${ESTADO_CLASS[enc.estado]}`}>
                      {ESTADO_LABEL[enc.estado]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={enc.estado}
                      onChange={e => cambiarEstado(enc.empresa_encargado_id, e.target.value as EstadoRegistro)}
                      className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600"
                    >
                      {ESTADOS.map(s => (
                        <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-4 text-center">No hay encargados vinculados</p>
      )}
    </div>
  )
}
