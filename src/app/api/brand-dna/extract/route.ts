import { NextRequest, NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import { getAuthId } from '@/lib/auth-helper'
import { extractBrandDNA } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()

    const parser = new PDFParse({ data: arrayBuffer })
    const result = await parser.getText()
    await parser.destroy()

    const pdfText = result.text
    const pageCount = result.total

    if (!pdfText || pdfText.trim().length < 50) {
      return NextResponse.json({
        error: 'Could not extract text from this PDF. Make sure it contains readable (non-scanned) text.',
      }, { status: 422 })
    }

    const dna = await extractBrandDNA(pdfText)

    return NextResponse.json({ dna, pageCount })
  } catch (err) {
    console.error('PDF extraction error:', err)
    const message = err instanceof Error ? err.message : 'Failed to process PDF'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
