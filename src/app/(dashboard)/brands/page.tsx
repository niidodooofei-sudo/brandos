'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Dna, MoreHorizontal, Trash2, Edit3, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBrand, type Brand } from '@/contexts/brand-context'

const BRAND_COLORS = [
  '#7c3aed', '#6d28d9', '#0ea5e9', '#0284c7',
  '#10b981', '#059669', '#f59e0b', '#d97706',
  '#f43f5e', '#e11d48', '#f97316', '#ea580c',
  '#6366f1', '#4f46e5', '#14b8a6', '#0d9488',
]

const INDUSTRIES = [
  'Fashion & Beauty', 'Food & Beverage', 'Sports & Fitness', 'Tech & SaaS',
  'Creative Agency', 'Health & Wellness', 'Real Estate', 'Education',
  'Entertainment', 'Non-profit', 'Retail', 'Other',
]

function NewBrandModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, color: string, industry: string) => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#7c3aed')
  const [industry, setIndustry] = useState('')

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), color, industry)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,6,15,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
      >
        <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--fg)' }}>Add New Brand</h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>
              Brand Name
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Athletics"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--fg-muted)' }}>
              Brand Color
            </label>
            <div className="flex flex-wrap gap-2">
              {BRAND_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ background: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }}
                >
                  {color === c && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>
              Industry (optional)
            </label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] appearance-none"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: industry ? 'var(--fg)' : 'var(--fg-subtle)' }}
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          {/* Preview */}
          {name && (
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0"
                style={{ background: color }}
              >
                {name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{name}</p>
                {industry && <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>{industry}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1" onClick={handleSave} disabled={!name.trim()}>
            Create Brand
          </Button>
        </div>
      </div>
    </div>
  )
}

function BrandCard({ brand }: { brand: Brand }) {
  const { activeBrand, setActiveBrand, deleteBrand } = useBrand()
  const [menuOpen, setMenuOpen] = useState(false)
  const isActive = brand.id === activeBrand?.id

  return (
    <div
      className="rounded-xl bg-white flex flex-col gap-0 overflow-hidden lift-card relative"
      style={{
        border: isActive ? `2px solid ${brand.color}` : '1px solid var(--border)',
        boxShadow: isActive ? `0 0 0 4px ${brand.color}18, var(--shadow-sm)` : 'var(--shadow-sm)',
      }}
    >
      {/* Color band */}
      <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${brand.color}cc, ${brand.color}88)` }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ background: brand.color }}
          >
            {brand.initial}
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--fg-subtle)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-9 w-40 rounded-xl py-1 z-10 animate-slide-down"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
              >
                <button
                  onClick={() => { setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                  style={{ color: 'var(--fg-muted)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <Edit3 className="h-3.5 w-3.5" /> Rename
                </button>
                <button
                  onClick={() => { deleteBrand(brand.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                  style={{ color: '#f43f5e' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff1f2' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--fg)' }}>{brand.name}</p>
        {brand.industry && <p className="text-xs mb-3" style={{ color: 'var(--fg-muted)' }}>{brand.industry}</p>}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3" style={{ color: 'var(--fg-subtle)' }} />
            <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>{brand.assetCount ?? 0} assets</span>
          </div>
          {isActive
            ? <Badge variant="brand" dot>Active</Badge>
            : (
              <button
                onClick={() => setActiveBrand(brand)}
                className="text-xs font-medium transition-colors px-2 py-1 rounded-md"
                style={{ color: 'var(--brand)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-bg)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                Switch to →
              </button>
            )
          }
        </div>
      </div>

      <div
        className="px-5 py-3 flex gap-3"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-muted)' }}
      >
        <Link href="/brand" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--brand)' }}>
          <Dna className="h-3 w-3 inline mr-1" />Edit DNA
        </Link>
        <Link href="/create" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--fg-muted)' }}>
          Create asset →
        </Link>
      </div>
    </div>
  )
}

export default function BrandsPage() {
  const { brands, addBrand } = useBrand()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="max-w-[1100px] animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Brands</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            Manage all your brands. Switch between them to generate assets with the right identity.
          </p>
        </div>
        <Button variant="brand" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          New Brand
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {brands.map(brand => (
          <BrandCard key={brand.id} brand={brand} />
        ))}

        {/* Add card */}
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl flex flex-col items-center justify-center gap-3 min-h-[180px] transition-all lift-card"
          style={{
            border: '2px dashed var(--border)',
            background: 'transparent',
            color: 'var(--fg-subtle)',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-light)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--brand)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-bg)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-subtle)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <div className="h-10 w-10 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'currentColor' }}>
            <Plus className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium">Add Brand</p>
        </button>
      </div>

      {showModal && (
        <NewBrandModal
          onClose={() => setShowModal(false)}
          onSave={(name, color, industry) => addBrand(name, color, industry)}
        />
      )}
    </div>
  )
}
