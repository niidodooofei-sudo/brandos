import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateSchema } from '@/lib/validate'
import { OUTPUT_TYPES } from '@/types'
import { generateAssetVariations } from '@/lib/storage'
import { scoreBrandCompliance } from '@/lib/ai'

// Default brand DNA used when no DNA has been configured for the active brand
const DEFAULT_DNA = {
  primaryFont: 'Inter',
  secondaryFont: 'Georgia',
  headingWeight: '700',
  bodyWeight: '400',
  colors: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#e94560',
    background: '#ffffff',
    text: '#1a1a2e',
  },
  layoutPreference: 'minimalist' as const,
  visualStyle: 'photography' as const,
  shapeLanguage: 'geometric' as const,
  tone: 'professional' as const,
}

export async function POST(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 20 generations per user per minute
  const { allowed, retryAfterMs } = checkRateLimit({
    key: `generate:${userId}`,
    limit: 20,
    windowMs: 60_000,
  })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before generating again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = generateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { outputType: outputTypeId, contentInputs } = parsed.data

  const outputType = OUTPUT_TYPES.find((t) => t.id === outputTypeId)
  if (!outputType) {
    return NextResponse.json({ error: 'Unknown output type' }, { status: 400 })
  }

  try {
    const variations = await generateAssetVariations(
      contentInputs,
      DEFAULT_DNA,
      outputTypeId,
      outputType.width,
      outputType.height
    )

    const scoredVariations = await Promise.all(
      variations.map(async (v) => {
        const breakdown = await scoreBrandCompliance(contentInputs, DEFAULT_DNA, v.layoutName)
        return { ...v, score: breakdown.total, scoreBreakdown: breakdown }
      })
    )

    const assetId = `asset_${Date.now()}`
    return NextResponse.json({ assetId, variations: scoredVariations, brandDNA: DEFAULT_DNA })
  } catch (err) {
    console.error('Generation error:', err)
    return NextResponse.json({ error: 'Asset generation failed. Please try again.' }, { status: 500 })
  }
}
