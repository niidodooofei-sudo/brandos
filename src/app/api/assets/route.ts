import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where = brandId ? { brandId } : {}
    const [assets, total] = await Promise.all([
      db.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { createdBy: { select: { name: true, avatarUrl: true } } },
      }),
      db.asset.count({ where }),
    ])
    return NextResponse.json({ assets, total, page, pages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ assets: [], total: 0, page: 1, pages: 0 })
  }
}
