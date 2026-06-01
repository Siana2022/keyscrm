'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarcarResueltaButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    await fetch(`/api/solicitudes/${id}`, { method: 'PATCH' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 disabled:opacity-50 whitespace-nowrap transition-colors"
    >
      {loading ? '...' : 'Marcar resuelta'}
    </button>
  )
}
