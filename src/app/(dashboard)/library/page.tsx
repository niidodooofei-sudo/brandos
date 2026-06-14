'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Grid2X2, List, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const categories = ['All', 'Social', 'Print', 'Web', 'Corporate']

export default function LibraryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  return (
    <div className="max-w-[1400px] animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Asset Library</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>All generated assets in one place</p>
        </div>
        <Link href="/create">
          <Button variant="brand" size="sm" className="gap-1.5">
            <span className="text-base font-bold leading-none">+</span> Create New
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--fg-subtle)' }} />
          <input
            type="search"
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
          />
        </div>

        <div className="flex gap-0.5 rounded-lg p-1" style={{ background: 'var(--surface-muted)' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={
                filterCat === cat
                  ? { background: 'white', color: 'var(--fg)', boxShadow: 'var(--shadow-xs)' }
                  : { color: 'var(--fg-muted)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-0.5 rounded-lg p-1 ml-auto" style={{ background: 'var(--surface-muted)' }}>
          {[
            { v: 'grid' as const, Icon: Grid2X2 },
            { v: 'list' as const, Icon: List },
          ].map(({ v, Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="rounded-md p-1.5 transition-all"
              style={view === v ? { background: 'white', boxShadow: 'var(--shadow-xs)' } : {}}
            >
              <Icon className="h-4 w-4" style={{ color: 'var(--fg-muted)' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface-muted)' }}
        >
          <Zap className="h-8 w-8" style={{ color: 'var(--fg-subtle)' }} />
        </div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--fg)' }}>No assets yet</p>
        <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--fg-muted)' }}>
          {search || filterCat !== 'All'
            ? 'No assets match your search or filter.'
            : 'Generate your first asset to start building your library.'}
        </p>
        {!search && filterCat === 'All' && (
          <Link href="/create">
            <Button variant="brand" className="gap-2">
              <Zap className="h-4 w-4" />
              Generate your first asset
            </Button>
          </Link>
        )}
        {(search || filterCat !== 'All') && (
          <Button variant="outline" onClick={() => { setSearch(''); setFilterCat('All') }}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
