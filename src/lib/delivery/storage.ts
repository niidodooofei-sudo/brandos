import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

export interface DeliveryStorageAdapter {
  save(fileName: string, data: Buffer, contentType: string): Promise<{ url: string; path: string }>
  delete(path: string): Promise<void>
}

function safeFileName(fileName: string): string {
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : ''
  return `${randomUUID()}${ext}`
}

/**
 * Unused in production until a cPanel migration happens (see design spec's
 * "Decisions Resolved During Brainstorming" §1). Kept fully implemented and
 * tested now so switching STORAGE_DRIVER later is a config change, not new code.
 */
export class LocalDiskAdapter implements DeliveryStorageAdapter {
  constructor(private readonly rootDir: string) {}

  async save(fileName: string, data: Buffer, _contentType: string): Promise<{ url: string; path: string }> {
    const path = safeFileName(fileName)
    const fullPath = join(this.rootDir, path)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, data)
    return { url: `/uploads/delivery/${path}`, path }
  }

  async delete(path: string): Promise<void> {
    await unlink(join(this.rootDir, path)).catch(() => {})
  }
}

export class VercelBlobAdapter implements DeliveryStorageAdapter {
  async save(fileName: string, data: Buffer, contentType: string): Promise<{ url: string; path: string }> {
    const { put } = await import('@vercel/blob')
    const path = `delivery/${safeFileName(fileName)}`
    const blob = await put(path, data, { access: 'public', contentType })
    return { url: blob.url, path }
  }

  async delete(path: string): Promise<void> {
    const { del } = await import('@vercel/blob')
    await del(path)
  }
}

export function getStorageAdapter(): DeliveryStorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? 'vercel-blob'
  if (driver === 'local-disk') {
    return new LocalDiskAdapter(process.env.DELIVERY_LOCAL_STORAGE_DIR ?? './storage/delivery')
  }
  return new VercelBlobAdapter()
}
