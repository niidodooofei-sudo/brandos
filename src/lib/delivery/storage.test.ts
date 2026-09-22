import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LocalDiskAdapter, getStorageAdapter } from './storage'

describe('LocalDiskAdapter', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  })

  it('writes the file to disk and returns a url pointing at it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'delivery-storage-'))
    dirs.push(dir)
    const adapter = new LocalDiskAdapter(dir)

    const result = await adapter.save('proof.pdf', Buffer.from('hello'), 'application/pdf')

    expect(result.path.endsWith('.pdf')).toBe(true)
    expect(existsSync(join(dir, result.path))).toBe(true)
    expect(readFileSync(join(dir, result.path), 'utf8')).toBe('hello')
    expect(result.url).toContain(result.path)
  })

  it('deletes a file it previously saved', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'delivery-storage-'))
    dirs.push(dir)
    const adapter = new LocalDiskAdapter(dir)
    const { path } = await adapter.save('to-delete.txt', Buffer.from('x'), 'text/plain')

    await adapter.delete(path)

    expect(existsSync(join(dir, path))).toBe(false)
  })
})

describe('getStorageAdapter', () => {
  it('returns a LocalDiskAdapter when STORAGE_DRIVER=local-disk', () => {
    const prev = process.env.STORAGE_DRIVER
    process.env.STORAGE_DRIVER = 'local-disk'
    try {
      expect(getStorageAdapter()).toBeInstanceOf(LocalDiskAdapter)
    } finally {
      process.env.STORAGE_DRIVER = prev
    }
  })
})
