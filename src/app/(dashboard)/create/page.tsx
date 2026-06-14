'use client'

import { useState } from 'react'
import Link from 'next/link'
import { OUTPUT_TYPES } from '@/types'
import { getCategoryLabel } from '@/lib/utils'

const categories = ['SOCIAL', 'PRINT', 'WEB', 'CORPORATE'] as const

export default function CreatePage() {
  const [activeCategory, setActiveCategory] = useState<string>('SOCIAL')

  const filtered = OUTPUT_TYPES.filter(t => t.category === activeCategory)

  return (
    <div className="max-w-[1000px]">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Create Asset</h1>
        <p className="text-sm text-neutral-500 mt-1">Choose an output format to get started.</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-neutral-100 rounded-xl w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Output type grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((type) => (
          <Link key={type.id} href={`/create/${type.id}`}>
            <div className="group rounded-2xl border border-neutral-200 bg-white p-5 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer">
              {/* Canvas preview mock */}
              <div className="rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center mb-4 overflow-hidden border border-neutral-100"
                style={{ aspectRatio: type.width / type.height, maxHeight: 120 }}>
                <span className="text-3xl">{type.icon}</span>
              </div>
              <p className="text-sm font-semibold text-neutral-900 group-hover:text-indigo-700 transition-colors">{type.name}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{type.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
