'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UsuarioAcceso = {
  usuario_id: string
  perfiles_usuario: { id: string; email: string | null; rol: string } | null
}

export default function AccesoEmpresa({
  empresaId,
  usuariosAcceso,
}: {
  empresaId: string
  usuariosAcceso: UsuarioAcceso[]
}) {
  const [modo, setModo] = useState<null | 'crear' | 'asignar'>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msgOk, setMsgOk] = useState<string | null>(null)
  const router = useRouter()

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        rol: 'empresa',
        empresa_ids: [empresaId],
      }),
    })

    setLoading(false)
    if (!res.ok) { const e = await res.json(); setError(e.error); return }
    setMsgOk('Usuario creado correctamente. Ya puede acceder con su email y contraseña.')
    setModo(null)
    router.refresh()
  }

  async function handleAsignar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    const res = await fetch('/api/admin/acceso-empresa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, empresa_id: empresaId }),
    })

    setLoading(false)
    if (!res.ok) { const e = await res.json(); setError(e.error); return }
    setMsgOk('Usuario asignado correctamente.')
    setModo(null)
    router.refresh()
  }

  async function handleRevocar(usuarioId: string) {
    if (!confirm('¿Revocar acceso de este usuario?')) return
    await fetch('/api/admin/acceso-empresa', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId, empresa_id: empresaId }),
    })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Acceso de empresa</p>
        {!modo && (
          <div className="flex gap-2">
            <button onClick={() => { setModo('crear'); setError(null); setMsgOk(null) }}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors">
              + Crear usuario
            </button>
            <button onClick={() => { setModo('asignar'); setError(null); setMsgOk(null) }}
              className="text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
              Asignar existente
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Usuarios actuales */}
        {usuariosAcceso.length > 0 ? (
          <div className="space-y-2">
            {usuariosAcceso.map(u => (
              <div key={u.usuario_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold">
                    {u.perfiles_usuario?.email?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{u.perfiles_usuario?.email ?? 'Usuario desconocido'}</p>
                    <p className="text-xs text-gray-400">Rol: empresa</p>
                  </div>
                </div>
                <button onClick={() => handleRevocar(u.usuario_id)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors">
                  Revocar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin usuarios asignados</p>
        )}

        {/* Mensaje de éxito */}
        {msgOk && (
          <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{msgOk}</p>
        )}

        {/* Formulario crear usuario */}
        {modo === 'crear' && (
          <form onSubmit={handleCrear} className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600">Nuevo usuario para esta empresa</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email *</label>
              <input name="email" type="email" required className="input text-sm" placeholder="usuario@empresa.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contraseña temporal *</label>
              <input name="password" type="text" required minLength={8} className="input text-sm" placeholder="Mínimo 8 caracteres" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Creando...' : 'Crear y asignar'}
              </button>
              <button type="button" onClick={() => setModo(null)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Formulario asignar existente */}
        {modo === 'asignar' && (
          <form onSubmit={handleAsignar} className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600">Asignar usuario existente por email</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email del usuario *</label>
              <input name="email" type="email" required className="input text-sm" placeholder="usuario@empresa.com" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Asignando...' : 'Asignar'}
              </button>
              <button type="button" onClick={() => setModo(null)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
