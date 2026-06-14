import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthId } from '@/lib/auth-helper'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = checkRateLimit({ key: `extract:${userId}`, limit: 5, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const { text } = await request.json()
    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json({ error: 'Not enough text to extract brand data from' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a brand design expert. Extract structured brand DNA from this brand guideline document text.

Return ONLY valid JSON (no explanation, no markdown):
{
  "primaryFont": "font name",
  "secondaryFont": "font name",
  "headingWeight": "bold|semibold|medium",
  "bodyWeight": "regular|medium",
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "layoutPreference": "minimalist|editorial|corporate|bold|luxury",
  "visualStyle": "photography|illustration|abstract|mixed",
  "shapeLanguage": "geometric|organic|minimal|bold",
  "tone": "professional|friendly|premium|technical|playful",
  "voiceRules": { "avoidWords": ["word1"], "preferredPhrases": ["phrase1"] }
}

Only include fields you can determine with confidence. Document text:
${text.slice(0, 12000)}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'AI did not return a valid response' }, { status: 500 })
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse brand data from document' }, { status: 422 })
    }

    const dna = JSON.parse(jsonMatch[0])
    return NextResponse.json({ dna })
  } catch (err) {
    console.error('Brand DNA extraction error:', err)
    const message = err instanceof Error ? err.message : 'Failed to process document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
