'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface Brand {
  id: string
  name: string
  slug: string
  color: string
  initial: string
  industry?: string
  assetCount?: number
}

interface BrandContextValue {
  brands: Brand[]
  activeBrand: Brand | null
  setActiveBrand: (brand: Brand) => void
  addBrand: (name: string, color: string, industry?: string) => Brand
  updateBrand: (id: string, updates: Partial<Brand>) => void
  deleteBrand: (id: string) => void
}

const BrandContext = createContext<BrandContextValue | null>(null)

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [activeBrand, setActiveBrandState] = useState<Brand | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('brandos:brands-v2')
      if (saved) {
        const { brands: savedBrands, activeId } = JSON.parse(saved)
        if (Array.isArray(savedBrands) && savedBrands.length > 0) {
          setBrands(savedBrands)
          const active = savedBrands.find((b: Brand) => b.id === activeId) ?? savedBrands[0]
          setActiveBrandState(active)
        }
      }
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('brandos:brands-v2', JSON.stringify({ brands, activeId: activeBrand?.id ?? null }))
  }, [brands, activeBrand, hydrated])

  const setActiveBrand = useCallback((brand: Brand) => setActiveBrandState(brand), [])

  const addBrand = useCallback((name: string, color: string, industry?: string): Brand => {
    const newBrand: Brand = {
      id: `brand_${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      color,
      initial: name[0]?.toUpperCase() ?? '?',
      industry,
      assetCount: 0,
    }
    setBrands(prev => [...prev, newBrand])
    setActiveBrandState(newBrand)
    return newBrand
  }, [])

  const updateBrand = useCallback((id: string, updates: Partial<Brand>) => {
    setBrands(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }, [])

  const deleteBrand = useCallback((id: string) => {
    setBrands(prev => {
      const next = prev.filter(b => b.id !== id)
      setActiveBrandState(current => {
        if (current?.id === id) return next[0] ?? null
        return current
      })
      return next
    })
  }, [])

  return (
    <BrandContext.Provider value={{ brands, activeBrand, setActiveBrand, addBrand, updateBrand, deleteBrand }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used inside BrandProvider')
  return ctx
}
