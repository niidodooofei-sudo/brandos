import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { extractBrandDNA } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  // Disable worker for serverless environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  })

  const pdf = await loadingTask.promise
  const pageCount = pdf.numPages
  const textParts: string[] = []

  const maxPages = Math.min(pageCount, 30)
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    textParts.push(pageText)
    page.cleanup()
  }

  await pdf.destroy()
  return { text: textParts.join('\n'), pageCount }
}

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
    const { text: pdfText, pageCount } = await extractTextFromPDF(arrayBuffer)

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
