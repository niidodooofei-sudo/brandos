'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface Brand {
  id: string
  name: string
  slug: string
  orgId: string
  color: string
  initial: string
  industry?: string
  assetCount?: number
  dna?: { isComplete: boolean } | null
}

// Stable color derived from the brand's DB id
const PALETTE = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#9333ea','#16a34a']
function seedColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

interface RawBrand {
  id: string
  name: string
  slug: string
  orgId: string
  dna?: { isComplete: boolean } | null
  _count?: { assets?: number }
}

function mapBrand(b: RawBrand): Brand {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    orgId: b.orgId,
    color: seedColor(b.id),
    initial: b.name[0]?.toUpperCase() ?? '?',
    assetCount: b._count?.assets ?? 0,
    dna: b.dna,
  }
}

interface BrandContextValue {
  brands: Brand[]
  activeBrand: Brand | null
  loading: boolean
  setActiveBrand: (brand: Brand) => void
  addBrand: (name: string, color?: string, industry?: string) => Promise<Brand>
  deleteBrand: (id: string) => Promise<void>
  refreshBrands: () => Promise<void>
}

const BrandContext = createContext<BrandContextValue | null>(null)

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [activeBrand, setActiveBrandState] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)

  const loadBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands')
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data.brands)) return

      const mapped = (data.brands as RawBrand[]).map(mapBrand)
      setBrands(mapped)

      // Restore last-active brand from localStorage, else first brand
      const savedId = localStorage.getItem('brandos:activeBrandId')
      const active = mapped.find(b => b.id === savedId) ?? mapped[0] ?? null
      setActiveBrandState(active)

      // Clear old demo-mode localStorage keys
      localStorage.removeItem('brandos:brands-v2')
    } catch { /* silent — show empty state */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadBrands() }, [loadBrands])

  const setActiveBrand = useCallback((brand: Brand) => {
    setActiveBrandState(brand)
    localStorage.setItem('brandos:activeBrandId', brand.id)
  }, [])

  const addBrand = useCallback(async (name: string): Promise<Brand> => {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to create brand')
    }
    const data = await res.json()
    const brand = mapBrand(data.brand)
    setBrands(prev => [brand, ...prev])
    setActiveBrand(brand)
    return brand
  }, [setActiveBrand])

  const deleteBrand = useCallback(async (id: string) => {
    await fetch(`/api/brands?brandId=${id}`, { method: 'DELETE' })
    setBrands(prev => {
      const next = prev.filter(b => b.id !== id)
      setActiveBrandState(current => {
        if (current?.id === id) {
          const next0 = next[0] ?? null
          if (next0) localStorage.setItem('brandos:activeBrandId', next0.id)
          return next0
        }
        return current
      })
      return next
    })
  }, [])

  return (
    <BrandContext.Provider value={{ brands, activeBrand, loading, setActiveBrand, addBrand, deleteBrand, refreshBrands: loadBrands }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used inside BrandProvider')
  return ctx
}
