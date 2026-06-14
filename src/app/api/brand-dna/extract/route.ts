import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthId } from '@/lib/auth-helper'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = checkRateLimit({ key: `extract:${userId}`, limit: 5, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    if (file.size > 32 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 32MB)' }, { status: 400 })

    // Convert to base64 — Claude reads PDFs natively, no parsing library needed
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `You are a brand design expert. Extract structured brand DNA from this brand guideline document.

Return ONLY valid JSON with these exact fields (omit any you cannot determine with confidence):
{
  "primaryFont": "font name",
  "secondaryFont": "font name",
  "headingWeight": "bold|semibold|medium",
  "bodyWeight": "regular|medium",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "layoutPreference": "minimalist|editorial|corporate|bold|luxury",
  "visualStyle": "photography|illustration|abstract|mixed",
  "shapeLanguage": "geometric|organic|minimal|bold",
  "tone": "professional|friendly|premium|technical|playful",
  "voiceRules": {
    "avoidWords": ["word1", "word2"],
    "preferredPhrases": ["phrase1", "phrase2"]
  }
}

Return ONLY the JSON object, no explanation.`,
            },
          ],
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'AI did not return a text response' }, { status: 500 })
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse brand data from document' }, { status: 422 })
    }

    const dna = JSON.parse(jsonMatch[0])
    return NextResponse.json({ dna, pageCount: null })
  } catch (err) {
    console.error('Brand DNA extraction error:', err)
    const message = err instanceof Error ? err.message : 'Failed to process PDF'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
