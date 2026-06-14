import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    const dna = await db.brandDNA.findUnique({ where: { brandId } })
    return NextResponse.json({ dna })
  } catch {
    return NextResponse.json({ dna: null })
  }
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { brandId } = body
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

    // Explicitly pick only schema fields — never spread the whole body into Prisma
    const data = {
      primaryFont:      body.primaryFont      ?? undefined,
      secondaryFont:    body.secondaryFont    ?? undefined,
      headingWeight:    body.headingWeight    ?? undefined,
      bodyWeight:       body.bodyWeight       ?? undefined,
      typeScale:        body.typeScale        ?? undefined,
      colors:           body.colors           ?? undefined,
      layoutPreference: body.layoutPreference ?? undefined,
      gridSystem:       body.gridSystem       ?? undefined,
      layoutImages:     body.layoutImages     ?? undefined,
      visualStyle:      body.visualStyle      ?? undefined,
      imageTreatment:   body.imageTreatment   ?? undefined,
      shapeLanguage:    body.shapeLanguage    ?? undefined,
      tone:             body.tone             ?? undefined,
      voiceRules:       body.voiceRules       ?? undefined,
      loadedFonts:      body.loadedFonts      ?? undefined,
      logoFiles:        body.logoFiles        ?? undefined,
      logoClearance:    body.logoClearance    ?? undefined,
      isComplete:       body.isComplete       ?? undefined,
    }

    // Remove undefined keys so Prisma doesn't try to set them to null
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))

    const dna = await db.brandDNA.upsert({
      where: { brandId },
      update: { ...clean, updatedAt: new Date() },
      create: { brandId, ...clean },
    })
    return NextResponse.json({ dna })
  } catch (error) {
    console.error('Brand DNA save error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to save Brand DNA'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
