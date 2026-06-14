import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { assetId, variationId, formats } = await request.json()

    // In production: trigger export job, upload to S3, return signed URL
    await new Promise((r) => setTimeout(r, 1000))

    const downloadUrl = `/api/export/download?assetId=${assetId}&variationId=${variationId}&format=${formats[0]}`

    return NextResponse.json({
      jobId: `job_${Date.now()}`,
      status: 'complete',
      downloadUrl,
      formats,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
