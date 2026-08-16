'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { ResourceFrame } from '@/lib/resources'
import { ImageUpload } from '@/components/image-upload'

export function FrameEditor({
  frames,
  slug,
  onChange,
}: {
  frames: ResourceFrame[]
  slug: string
  onChange: (frames: ResourceFrame[]) => void
}) {
  function update(index: number, patch: Partial<ResourceFrame>) {
    onChange(frames.map((frame, i) => (i === index ? { ...frame, ...patch } : frame)))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= frames.length) return
    const next = [...frames]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">프레임 이미지</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">순서대로 문서 뷰어에 표시됩니다.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...frames, { id: crypto.randomUUID(), label: `프레임 ${frames.length + 1}`, imageUrl: '' }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-body hover:bg-surface"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          프레임 추가
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        {frames.map((frame, index) => (
          <div key={frame.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="mb-3 flex items-center gap-2">
              <input
                value={frame.label}
                onChange={(event) => update(index, { label: event.target.value })}
                aria-label={`${index + 1}번째 프레임 이름`}
                className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              />
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="위로 이동" className="rounded-lg border border-border bg-card p-2 text-body disabled:opacity-40">
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === frames.length - 1} aria-label="아래로 이동" className="rounded-lg border border-border bg-card p-2 text-body disabled:opacity-40">
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onChange(frames.filter((_, i) => i !== index))} aria-label="프레임 삭제" className="rounded-lg border border-border bg-card p-2 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <ImageUpload label="프레임 이미지" slug={`${slug}/frames`} value={frame.imageUrl} onChange={(imageUrl) => update(index, { imageUrl: imageUrl ?? '' })} />
          </div>
        ))}
      </div>
    </section>
  )
}
