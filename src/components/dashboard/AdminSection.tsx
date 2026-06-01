'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface AdminSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function AdminSection({ title, children, defaultOpen = false }: AdminSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {open && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  )
}
