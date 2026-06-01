'use client'

import { useState } from 'react'

export default function SeccionAccordion({
  titulo,
  colorTitulo = '#FF2F92',
  children,
  compact = false,
}: {
  titulo: string
  colorTitulo?: string
  children: React.ReactNode
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: open ? 'rgba(255,47,146,0.15)' : '#2a2a2a' }}
      >
        <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: colorTitulo }}>
          {titulo}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: colorTitulo }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={`${compact ? 'px-4 py-3' : 'px-6 py-5'}`} style={{ backgroundColor: '#1e1e1e' }}>
          {children}
        </div>
      )}
    </div>
  )
}
