'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Keys Safe</h1>
          <p className="mt-2 text-sm text-gray-600">Recuperar contraseña</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-2xl">✉️</p>
              <p className="font-semibold text-gray-900">Revisa tu correo</p>
              <p className="text-sm text-gray-500">
                Te hemos enviado un enlace a <strong>{email}</strong> para restablecer tu contraseña.
              </p>
              <Link href="/auth/login" className="block mt-4 text-sm text-blue-600 hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="tu@email.com"
                />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#FF2F92' }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <p className="text-center text-xs text-gray-500">
                <Link href="/auth/login" className="hover:underline">Volver al inicio de sesión</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
