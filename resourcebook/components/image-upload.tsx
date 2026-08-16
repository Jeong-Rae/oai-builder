'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { uploadResourceImage } from '@/app/actions'

export function ImageUpload({
  label,
  hint,
  slug,
  value,
  onChange,
}: {
  label: string
  hint?: string
  slug: string
  value: string | null | undefined
  onChange: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slug', slug)
      const result = await uploadResourceImage(formData)
      if (result.ok && result.url) {
        onChange(result.url)
      } else {
        setError(result.error ?? '업로드에 실패했습니다.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-border bg-surface">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value || "/placeholder.svg"} alt={`${label} 미리보기`} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-body transition-colors hover:bg-surface disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {value ? '이미지 변경' : '이미지 업로드'}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                제거
              </button>
            ) : null}
          </div>
          {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
