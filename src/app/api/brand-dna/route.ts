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
    const { brandId, ...dnaData } = body
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

    const dna = await db.brandDNA.upsert({
      where: { brandId },
      update: { ...dnaData, updatedAt: new Date() },
      create: { brandId, ...dnaData },
    })
    return NextResponse.json({ dna })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save Brand DNA' }, { status: 500 })
  }
}
