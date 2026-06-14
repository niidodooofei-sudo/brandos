import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { checkRateLimit } from '@/lib/rate-limit'
import { copySuggestSchema } from '@/lib/validate'
import { generateCopySuggestions } from '@/lib/ai'

export async function POST(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, retryAfterMs } = checkRateLimit({
    key: `copy-suggest:${userId}`,
    limit: 30,
    windowMs: 60_000,
  })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ suggestions: [] })
  }

  const parsed = copySuggestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ suggestions: [] })

  try {
    const suggestions = await generateCopySuggestions(
      parsed.data.headline,
      parsed.data.outputType ?? 'instagram_post',
      'professional',
      50
    )
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('Copy suggest error:', err)
    return NextResponse.json({ suggestions: [] })
  }
}
