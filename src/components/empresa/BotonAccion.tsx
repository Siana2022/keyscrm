'use client'

import { useState } from 'react'

export default function BotonAccion({
  label,
  empresaId,
  accion,
  small,
}: {
  label: string
  empresaId: string
  accion: 'revision_trimestral' | 'sin_cambios' | 'auditoria'
  small?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClick() {
    if (!confirm(`¿Confirmar: ${label}?`)) return
    setLoading(true)

    const hoy = new Date().toISOString().split('T')[0]

    const body: Record<string, string> = {
      empresa_id: empresaId,
      fecha: hoy,
    }

    if (accion === 'revision_trimestral') {
      body.tipo = 'revision_trimestral'
      body.tipo_de_revision = 'RT'
      body.estado_resultado = 'Revisión trimestral realizada'
    } else if (accion === 'sin_cambios') {
      body.tipo = 'revision_trimestral'
      body.tipo_de_revision = 'SC'
      body.estado_resultado = 'Sin cambios'
    } else if (accion === 'auditoria') {
      body.tipo = 'auditoria'
      body.tipo_de_revision = 'A'
      body.estado_resultado = 'Auditoría realizada'
    }

    const res = await fetch('/api/revisiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => { setDone(false); window.location.reload() }, 1200)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || done}
      className={`text-white font-bold rounded px-3 py-2 text-xs disabled:opacity-60 transition-colors ${small ? '' : 'w-full'}`}
      style={{ backgroundColor: done ? '#22c55e' : '#FF2F92' }}
    >
      {done ? '✓ Guardado' : loading ? 'Guardando...' : label}
    </button>
  )
}
