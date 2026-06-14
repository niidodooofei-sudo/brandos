import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { Zap, Target, TrendingUp, Clock, ArrowRight, Layers, PlusSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

const quickFormats = [
  { id: 'instagram_post', label: 'Instagram Post', emoji: '📷', desc: '1:1 · 1080×1080' },
  { id: 'instagram_story', label: 'Story', emoji: '📱', desc: '9:16 · 1080×1920' },
  { id: 'linkedin_post', label: 'LinkedIn', emoji: '💼', desc: '1.91:1 · 1200×627' },
  { id: 'flyer', label: 'Flyer', emoji: '📄', desc: 'A4 · 2480×3508' },
  { id: 'hero_banner', label: 'Hero Banner', emoji: '🌐', desc: '16:9 · 1920×1080' },
  { id: 'presentation_slide', label: 'Slide', emoji: '🎤', desc: '16:9 · 1920×1080' },
]

const dnaCategories = [
  { label: 'Typography', icon: '✦', desc: 'Fonts & weights' },
  { label: 'Colors', icon: '◉', desc: 'Palette & hierarchy' },
  { label: 'Voice & Tone', icon: '◎', desc: 'Copy guidelines' },
  { label: 'Logo', icon: '⬡', desc: 'Clearspace & usage' },
  { label: 'Image Style', icon: '▣', desc: 'Photography & art direction' },
]

export default async function DashboardPage() {
  const user = await currentUser().catch(() => null)
  const firstName = user?.firstName || null

  return (
    <div className="max-w-[1360px] space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--fg-subtle)' }}>
            {getTimeLabel()}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
            {firstName ? `Hey, ${firstName} 👋` : 'Welcome to BrandOS'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            Generate on-brand assets in seconds. Start by setting up your Brand DNA.
          </p>
        </div>
        <Link href="/create">
          <Button variant="brand" size="lg" className="gap-2 shadow-md">
            <Zap className="h-4 w-4" />
            Generate Asset
          </Button>
        </Link>
      </div>

      {/* Getting started — shown until first asset is created */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(14,165,233,0.04) 100%)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--fg)' }}>Get started</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Set up Brand DNA', desc: 'Upload your guidelines or fill in typography, colors, and tone manually.', href: '/brand', cta: 'Set up DNA', icon: Layers },
            { step: '2', title: 'Create your first asset', desc: 'Pick a format, write your headline, and let the AI generate layout variations.', href: '/create', cta: 'Create asset', icon: PlusSquare },
            { step: '3', title: 'Add templates', desc: 'Upload custom templates and define photo, text, and logo zones for pixel-perfect output.', href: '/templates', cta: 'Browse templates', icon: Target },
          ].map(({ step, title, desc, href, cta, icon: Icon }) => (
            <Link key={step} href={href}>
              <div
                className="rounded-xl p-4 bg-white transition-all cursor-pointer lift-card h-full"
                style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'var(--brand)' }}
                  >
                    {step}
                  </span>
                  <Icon className="h-4 w-4" style={{ color: 'var(--brand)' }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>{title}</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--fg-muted)' }}>{desc}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>{cta} →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick create */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Quick Create</h2>
          <Link href="/create" className="text-xs flex items-center gap-1 transition-colors hover:opacity-70" style={{ color: 'var(--brand)' }}>
            All formats <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickFormats.map((type) => (
            <Link key={type.id} href={`/create/${type.id}`}>
              <div className="quick-card rounded-xl p-3.5 text-center cursor-pointer bg-white" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                <div className="text-[22px] mb-1.5">{type.emoji}</div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--fg)' }}>{type.label}</p>
                <p className="text-[9px] mt-0.5" style={{ color: 'var(--fg-subtle)' }}>{type.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent assets — empty state */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Recent Assets</h2>
            <Link href="/library" className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--brand)' }}>
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div
            className="rounded-xl p-12 text-center"
            style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}
          >
            <div className="h-12 w-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
              <Zap className="h-6 w-6" style={{ color: 'var(--fg-subtle)' }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>No assets yet</p>
            <p className="text-xs mb-4" style={{ color: 'var(--fg-muted)' }}>Generate your first asset to see it here</p>
            <Link href="/create">
              <Button variant="brand" size="sm">Create your first asset</Button>
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Campaigns empty */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Campaigns</h2>
              <Link href="/campaigns" className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--brand)' }}>
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div
              className="rounded-xl p-8 text-center"
              style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}
            >
              <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>No active campaigns</p>
              <Link href="/campaigns" className="text-xs mt-2 block" style={{ color: 'var(--brand)' }}>Create one →</Link>
            </div>
          </div>

          {/* Brand DNA setup prompt */}
          <div
            className="rounded-xl bg-white p-5"
            style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Brand DNA</h2>
              <Link href="/brand" className="text-xs font-medium" style={{ color: 'var(--brand)' }}>Set up →</Link>
            </div>
            <div className="space-y-3">
              {dnaCategories.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-base shrink-0" style={{ color: 'var(--fg-subtle)' }}>{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium" style={{ color: 'var(--fg)' }}>{item.label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--fg-subtle)' }}>{item.desc}</p>
                  </div>
                  <div className="h-1.5 w-16 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--surface-inset)' }}>
                    <div className="h-full w-0 rounded-full" style={{ background: 'var(--brand)' }} />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/brand"
              className="mt-4 flex items-center gap-1 text-xs font-medium hover:opacity-75 transition-opacity"
              style={{ color: 'var(--brand)' }}
            >
              <Layers className="h-3 w-3" />
              Complete Brand DNA setup
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeLabel() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
