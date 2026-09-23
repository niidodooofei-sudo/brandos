import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { getStorageAdapter } from '@/lib/delivery/storage'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file')
  const deliveryItemId = formData.get('deliveryItemId')

  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })
  if (typeof deliveryItemId !== 'string' || !deliveryItemId) {
    return NextResponse.json({ error: 'deliveryItemId is required' }, { status: 400 })
  }

  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 50MB upload limit' }, { status: 413 })
  }

  const item = await db.deliveryItem.findFirst({ where: { id: deliveryItemId, orgId: scope.orgId } })
  if (!item) return NextResponse.json({ error: 'Unknown deliveryItemId' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const adapter = getStorageAdapter()
  const { url } = await adapter.save(file.name, buffer, file.type || 'application/octet-stream')

  const isImage = (file.type || '').startsWith('image/')
  const record = await db.deliveryFile.create({
    data: {
      deliveryItemId,
      fileName: file.name,
      fileUrl: url,
      fileType: file.type || null,
      thumbnailUrl: isImage ? url : null,
      uploadedById: scope.userId,
    },
  })
  return NextResponse.json({ file: record }, { status: 201 })
}
