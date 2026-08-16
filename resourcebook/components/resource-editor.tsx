'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Loader2, X } from 'lucide-react'
import type { Resource } from '@/lib/resources'
import { CoreFields, type CoreFieldValues } from '@/components/core-fields'
import { ImageUpload } from '@/components/image-upload'
import {
  updateResourceCore,
  updateResourceImages,
  deleteResource,
} from '@/app/actions'

export function ResourceEditor({ resource }: { resource: Resource }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [values, setValues] = useState<CoreFieldValues>({
    name: resource.name,
    code: resource.code,
    lede: resource.lede,
    navLabel: resource.navLabel,
    group: resource.group,
    hasControlStrip: resource.hasControlStrip,
  })
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(
    resource.heroImageUrl ?? null,
  )
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(
    resource.previewImageUrl ?? null,
  )

  function openEditor() {
    setValues({
      name: resource.name,
      code: resource.code,
      lede: resource.lede,
      navLabel: resource.navLabel,
      group: resource.group,
      hasControlStrip: resource.hasControlStrip,
    })
    setHeroImageUrl(resource.heroImageUrl ?? null)
    setPreviewImageUrl(resource.previewImageUrl ?? null)
    setError(null)
    setOpen(true)
  }

  async function handleSave() {
    if (!values.name.trim() || !values.code.trim()) {
      setError('이름과 식별자는 필수입니다.')
      return
    }
    setSaving(true)
    setError(null)
    const coreResult = await updateResourceCore(resource.slug, values)
    if (!coreResult.ok) {
      setError(coreResult.error ?? '저장에 실패했습니다.')
      setSaving(false)
      return
    }
    const imgResult = await updateResourceImages(resource.slug, {
      heroImageUrl,
      previewImageUrl,
    })
    setSaving(false)
    if (!imgResult.ok) {
      setError(imgResult.error ?? '이미지 저장에 실패했습니다.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`"${resource.name}" 리소스를 삭제할까요? 되돌릴 수 없습니다.`)) return
    setDeleting(true)
    const result = await deleteResource(resource.slug)
    if (!result.ok) {
      setError(result.error ?? '삭제에 실패했습니다.')
      setDeleting(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-body transition-colors hover:bg-surface"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        편집
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm md:items-center md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${resource.name} 편집`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setOpen(false)
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[20px] bg-card md:rounded-[20px]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-bold text-foreground">리소스 편집</h2>
              <button
                type="button"
                onClick={() => !saving && setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface"
                aria-label="닫기"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <CoreFields
                values={values}
                onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
              />

              <div className="mt-6 grid gap-5 border-t border-border pt-5">
                <ImageUpload
                  label="대표 이미지"
                  hint="헤더에 표시"
                  slug={resource.slug}
                  value={heroImageUrl}
                  onChange={setHeroImageUrl}
                />
                <ImageUpload
                  label="프리뷰 이미지"
                  hint="스토리북 미리보기 영역에 표시"
                  slug={resource.slug}
                  value={previewImageUrl}
                  onChange={setPreviewImageUrl}
                />
              </div>

              {error ? (
                <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                삭제
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-surface disabled:opacity-60"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
