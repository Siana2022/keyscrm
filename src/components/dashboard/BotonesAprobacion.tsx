'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BotonesAprobacion({ notificacionId }: { notificacionId: string }) {
  const [loading, setLoading] = useState<'aprobar' | 'rechazar' | null>(null)
  const router = useRouter()

  async function handleAccion(accion: 'aprobar' | 'rechazar') {
    setLoading(accion)
    await fetch('/api/admin/aprobar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificacion_id: notificacionId, accion }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAccion('aprobar')}
        disabled={!!loading}
        className="text-xs px-3 py-1 rounded-lg text-white font-medium disabled:opacity-50"
        style={{ backgroundColor: '#22c55e' }}
      >
        {loading === 'aprobar' ? '...' : 'Aprobar'}
      </button>
      <button
        onClick={() => handleAccion('rechazar')}
        disabled={!!loading}
        className="text-xs px-3 py-1 rounded-lg text-white font-medium bg-red-500 disabled:opacity-50"
      >
        {loading === 'rechazar' ? '...' : 'Rechazar'}
      </button>
    </div>
  )
}
