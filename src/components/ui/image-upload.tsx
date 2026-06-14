'use client'

import React, { useCallback, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  label?: string
  hint?: string
  className?: string
}

export function ImageUpload({ value = [], onChange, maxFiles = 3, label, hint, className }: ImageUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return
    setUploading(true)
    const newUrls: string[] = []

    for (let i = 0; i < Math.min(files.length, maxFiles - value.length); i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue

      // Convert to data URL for demo (in production, upload to S3)
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
      newUrls.push(url)
    }

    onChange([...value, ...newUrls])
    setUploading(false)
  }, [value, onChange, maxFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      )}

      {value.length < maxFiles && (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
            dragging ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple={maxFiles > 1}
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading…
            </div>
          ) : (
            <>
              <div className="rounded-full bg-neutral-100 p-3">
                {dragging ? <ImageIcon className="h-5 w-5 text-neutral-600" /> : <Upload className="h-5 w-5 text-neutral-500" />}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-700">
                  {dragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">PNG, JPG up to 20MB · {maxFiles - value.length} remaining</p>
              </div>
            </>
          )}
        </label>
      )}

      {value.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {value.map((url, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Upload ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-neutral-200" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-white border border-neutral-200 p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-neutral-600" />
              </button>
            </div>
          ))}
        </div>
      )}
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
