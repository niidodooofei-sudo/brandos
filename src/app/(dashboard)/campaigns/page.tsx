'use client'

import { useState } from 'react'
import { Megaphone, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OUTPUT_TYPES } from '@/types'

export default function CampaignsPage() {
  const [showNew, setShowNew] = useState(false)

  return (
    <div className="max-w-[1200px] animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Campaigns</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>Generate complete asset suites from a single brief.</p>
        </div>
        <Button variant="brand" size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface-muted)' }}
        >
          <Megaphone className="h-8 w-8" style={{ color: 'var(--fg-subtle)' }} />
        </div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--fg)' }}>No campaigns yet</p>
        <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--fg-muted)' }}>
          Create a campaign to generate a full suite of coordinated assets across multiple formats from a single brief.
        </p>
        <Button variant="brand" className="gap-2" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
          Create your first campaign
        </Button>
      </div>

      {showNew && <NewCampaignModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [brief, setBrief] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const toggle = (id: string) =>
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const handleCreate = () => {
    if (!name.trim() || selectedTypes.length === 0) return
    // TODO: persist to DB via /api/campaigns once DB is connected
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,6,15,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl animate-scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          className="sticky top-0 px-6 py-4 flex items-center justify-between"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>New Campaign</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ color: 'var(--fg-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>Campaign Name</label>
            <input
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' }}
              placeholder="e.g. Summer Sale 2026"
              maxLength={100}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>Campaign Brief</label>
            <textarea
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' }}
              rows={4}
              maxLength={2000}
              placeholder="Describe the campaign goal, key message, and target audience…"
              value={brief}
              onChange={e => setBrief(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--fg-muted)' }}>
              Output Formats ({selectedTypes.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTPUT_TYPES.slice(0, 12).map((type) => (
                <label
                  key={type.id}
                  className="flex items-center gap-2 rounded-lg p-2.5 cursor-pointer transition-colors"
                  style={{
                    border: `1px solid ${selectedTypes.includes(type.id) ? 'var(--brand)' : 'var(--border)'}`,
                    background: selectedTypes.includes(type.id) ? 'var(--brand-bg)' : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={selectedTypes.includes(type.id)} onChange={() => toggle(type.id)} className="hidden" />
                  <span className="text-sm">{type.icon}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--fg)' }}>{type.name}</span>
                  {selectedTypes.includes(type.id) && (
                    <ArrowRight className="h-3 w-3 ml-auto" style={{ color: 'var(--brand)' }} />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              variant="brand"
              className="flex-1"
              onClick={handleCreate}
              disabled={!name.trim() || selectedTypes.length === 0}
            >
              Create Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
