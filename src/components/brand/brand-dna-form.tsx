'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'

interface BrandDNAFormProps {
  section: string
}

export function BrandDNAForm({ section }: BrandDNAFormProps) {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {section === 'typography' && <TypographySection />}
      {section === 'colors' && <ColorsSection />}
      {section === 'layout' && <LayoutSection />}
      {section === 'visual' && <VisualSection />}
      {section === 'voice' && <VoiceSection />}
      {section === 'logo' && <LogoSection />}

      <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
        <Button onClick={handleSave} className="gap-2">
          {saved && <CheckCircle2 className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Section'}
        </Button>
        <Button variant="outline">Reset to Defaults</Button>
      </div>
    </div>
  )
}

function TypographySection() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Primary Font" placeholder="e.g. Inter, Neue Haas Grotesk" defaultValue="Inter" />
        <Input label="Secondary Font" placeholder="e.g. Georgia, Playfair Display" defaultValue="Georgia" />
        <Select label="Heading Weight" defaultValue="700"
          options={[
            { value: '400', label: 'Regular (400)' },
            { value: '500', label: 'Medium (500)' },
            { value: '600', label: 'Semibold (600)' },
            { value: '700', label: 'Bold (700)' },
            { value: '800', label: 'Extrabold (800)' },
            { value: '900', label: 'Black (900)' },
          ]}
        />
        <Select label="Body Weight" defaultValue="400"
          options={[
            { value: '300', label: 'Light (300)' },
            { value: '400', label: 'Regular (400)' },
            { value: '500', label: 'Medium (500)' },
          ]}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-700 mb-3">Type Scale</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'H1', key: 'h1', default: '64' },
            { label: 'H2', key: 'h2', default: '48' },
            { label: 'H3', key: 'h3', default: '36' },
            { label: 'H4', key: 'h4', default: '28' },
            { label: 'Body', key: 'body', default: '16' },
            { label: 'Small', key: 'small', default: '14' },
            { label: 'Caption', key: 'caption', default: '12' },
          ].map((t) => (
            <div key={t.key}>
              <label className="text-xs text-neutral-500 mb-1 block">{t.label} (px)</label>
              <input
                type="number"
                defaultValue={t.default}
                className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-neutral-700 mb-2 block">Font Preview</label>
        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-6 space-y-2">
          <p className="text-5xl font-bold" style={{ fontFamily: 'Inter' }}>The Quick</p>
          <p className="text-2xl font-normal text-neutral-600">Brown fox jumps over the lazy dog</p>
          <p className="text-base text-neutral-500">The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs.</p>
        </div>
      </div>
    </div>
  )
}

function ColorsSection() {
  const [colors, setColors] = useState({
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#e94560',
    background: '#ffffff',
    text: '#1a1a2e',
  })

  const colorFields = [
    { key: 'primary', label: 'Primary', description: 'Main brand color — used for CTAs, headings' },
    { key: 'secondary', label: 'Secondary', description: 'Supporting brand color' },
    { key: 'accent', label: 'Accent', description: 'Highlight color — promotions, badges' },
    { key: 'background', label: 'Background', description: 'Default background color' },
    { key: 'text', label: 'Text', description: 'Primary text color' },
  ] as const

  return (
    <div className="space-y-4">
      {colorFields.map((field) => (
        <div key={field.key} className="flex items-center gap-4 rounded-xl border border-neutral-100 p-4">
          <div className="relative">
            <input
              type="color"
              value={colors[field.key]}
              onChange={(e) => setColors(prev => ({ ...prev, [field.key]: e.target.value }))}
              className="h-12 w-12 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900">{field.label}</p>
            <p className="text-xs text-neutral-500">{field.description}</p>
          </div>
          <input
            type="text"
            value={colors[field.key]}
            onChange={(e) => setColors(prev => ({ ...prev, [field.key]: e.target.value }))}
            className="w-28 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      ))}

      <div className="rounded-xl border border-neutral-100 p-4">
        <p className="text-xs font-medium text-neutral-500 mb-3">Color Preview</p>
        <div className="flex gap-2">
          {Object.entries(colors).map(([key, hex]) => (
            <div key={key} className="flex-1 text-center">
              <div className="h-10 rounded-lg mb-1 border border-neutral-100" style={{ backgroundColor: hex }} />
              <p className="text-[10px] text-neutral-500 capitalize">{key}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LayoutSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-3">Layout Preference</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: 'minimalist', label: 'Minimalist', desc: 'Clean, whitespace-heavy' },
            { value: 'editorial', label: 'Editorial', desc: 'Magazine-style layouts' },
            { value: 'corporate', label: 'Corporate', desc: 'Structured, professional' },
            { value: 'bold', label: 'Bold', desc: 'High contrast, impact' },
            { value: 'luxury', label: 'Luxury', desc: 'Premium, refined' },
          ].map((opt) => (
            <label key={opt.value} className="relative flex cursor-pointer rounded-xl border-2 border-neutral-200 p-3 hover:border-indigo-300 transition-colors">
              <input type="radio" name="layoutPref" value={opt.value} className="sr-only peer" />
              <div>
                <p className="text-sm font-medium text-neutral-900 peer-checked:text-indigo-700">{opt.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Grid Columns</label>
          <input type="number" defaultValue={12} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Gutter (px)</label>
          <input type="number" defaultValue={24} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Margin (px)</label>
          <input type="number" defaultValue={40} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
      </div>
    </div>
  )
}

function VisualSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-3">Visual Style</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'photography', label: 'Photography Driven', desc: 'Real photos as hero elements' },
            { value: 'illustration', label: 'Illustration Driven', desc: 'Custom illustrations & graphics' },
            { value: 'abstract', label: 'Abstract', desc: 'Shapes, gradients, geometric' },
            { value: 'mixed', label: 'Mixed', desc: 'Combination of styles' },
          ].map((opt) => (
            <label key={opt.value} className="relative flex cursor-pointer rounded-xl border-2 border-neutral-200 p-4 hover:border-indigo-300 transition-colors">
              <input type="radio" name="visualStyle" value={opt.value} defaultChecked={opt.value === 'photography'} className="sr-only" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{opt.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-700 mb-3">Shape Language</p>
        <div className="flex gap-3">
          {[
            { value: 'geometric', label: 'Geometric', preview: 'bg-neutral-900' },
            { value: 'organic', label: 'Organic', preview: 'rounded-full bg-indigo-500' },
            { value: 'minimal', label: 'Minimal', preview: 'border-2 border-neutral-900' },
            { value: 'bold', label: 'Bold', preview: 'rounded-sm bg-orange-500' },
          ].map((opt) => (
            <label key={opt.value} className="flex-1 cursor-pointer">
              <input type="radio" name="shapeLanguage" value={opt.value} className="sr-only peer" />
              <div className="rounded-xl border-2 border-neutral-200 peer-checked:border-indigo-500 p-3 text-center hover:border-neutral-300 transition-colors">
                <div className={`h-8 w-8 mx-auto mb-2 rounded-md ${opt.preview}`} />
                <p className="text-xs font-medium text-neutral-700">{opt.label}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-neutral-700">Image Treatment</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Overlay Opacity (0–1)</label>
            <input type="range" min={0} max={1} step={0.05} defaultValue={0.4}
              className="w-full accent-indigo-600" />
          </div>
          <Select label="Color Filter" defaultValue="none"
            options={[
              { value: 'none', label: 'None' },
              { value: 'warm', label: 'Warm' },
              { value: 'cool', label: 'Cool' },
              { value: 'bw', label: 'Black & White' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function VoiceSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-3">Brand Tone</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'professional', label: 'Professional', desc: 'Authoritative, trustworthy, clear' },
            { value: 'friendly', label: 'Friendly', desc: 'Warm, approachable, conversational' },
            { value: 'premium', label: 'Premium', desc: 'Refined, aspirational, exclusive' },
            { value: 'technical', label: 'Technical', desc: 'Precise, data-driven, expert' },
          ].map((opt) => (
            <label key={opt.value} className="relative flex cursor-pointer rounded-xl border-2 border-neutral-200 p-4 hover:border-indigo-300 transition-colors">
              <input type="radio" name="tone" value={opt.value} defaultChecked={opt.value === 'professional'} className="sr-only" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{opt.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Textarea
        label="Words to Avoid"
        placeholder="e.g. cheap, discount, free (one per line)"
        hint="Words the AI will never use in generated copy"
        rows={3}
      />

      <Textarea
        label="Preferred Phrases"
        placeholder="e.g. Crafted with care, Built to last (one per line)"
        hint="Phrases the AI will prefer when generating copy"
        rows={3}
      />
    </div>
  )
}

function LogoSection() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Primary Logo', desc: 'Full color on light backgrounds', id: 'logo-primary' },
          { label: 'Reversed Logo', desc: 'White/light on dark backgrounds', id: 'logo-dark' },
          { label: 'Icon / Mark', desc: 'Symbol only, no wordmark', id: 'logo-icon' },
          { label: 'Wordmark', desc: 'Text-only logo', id: 'logo-wordmark' },
        ].map((item) => (
          <label key={item.id} className="cursor-pointer">
            <p className="text-sm font-medium text-neutral-700 mb-1.5">{item.label}</p>
            <div className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-colors">
              <input type="file" accept="image/*,.svg" className="sr-only" />
              <div className="text-neutral-300 text-2xl">+</div>
              <p className="text-xs text-neutral-400">{item.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Min Logo Size (px)</label>
          <input type="number" defaultValue={80} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Clear Space Rule</label>
          <input type="text" defaultValue="1× logo height" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
      </div>
    </div>
  )
}
