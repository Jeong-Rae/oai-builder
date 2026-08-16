'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { CoreFields, type CoreFieldValues } from '@/components/core-fields'
import { createResource } from '@/app/actions'

export function NewResourceForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<CoreFieldValues>({
    name: '',
    code: '',
    lede: '',
    navLabel: '',
    group: '필드',
    hasControlStrip: false,
  })

  async function handleCreate() {
    if (!values.name.trim() || !values.code.trim()) {
      setError('이름과 식별자는 필수입니다.')
      return
    }
    setSaving(true)
    setError(null)
    const result = await createResource(values)
    if (!result.ok || !result.slug) {
      setError(result.error ?? '생성에 실패했습니다.')
      setSaving(false)
      return
    }
    router.push(`/${result.slug}`)
    router.refresh()
  }

  return (
    <article className="max-w-[640px]">
      <span className="mb-[18px] inline-flex items-center gap-2 rounded-full bg-weak px-2.5 py-1.5 text-xs font-bold text-primary">
        새 리소스
      </span>
      <h1 className="text-4xl font-bold leading-[54px] tracking-tighter text-foreground text-balance">
        리소스 추가
      </h1>
      <p className="mt-2.5 text-[17px] leading-7 text-body text-pretty">
        핵심 정보를 입력하면 새 리소스 페이지가 생성됩니다. 생성 후 이미지와 세부 항목을 편집할 수 있습니다.
      </p>

      <div className="mt-8 rounded-[16px] border border-border bg-card p-5 md:p-6">
        <CoreFields
          values={values}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
        />

        {error ? (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-surface disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            리소스 생성
          </button>
        </div>
      </div>
    </article>
  )
}
