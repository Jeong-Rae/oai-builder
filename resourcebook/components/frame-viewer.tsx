'use client'

import { useState } from 'react'
import type { ResourceFrame } from '@/lib/resources'

export function FrameViewer({ frames }: { frames: ResourceFrame[] }) {
  const [activeId, setActiveId] = useState(frames[0]?.id)
  const active = frames.find((frame) => frame.id === activeId) ?? frames[0]

  if (!active) return null

  return (
    <section className="mt-[3.25rem]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold leading-9 tracking-tight text-foreground">프레임</h2>
        <span className="text-[13px] text-muted-foreground">{active.label}</span>
      </div>
      <div className="overflow-hidden rounded-[16px] border border-border bg-panel">
        <div className="grid min-h-[320px] place-items-center p-4 md:p-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active.imageUrl} alt={`${active.label} 이미지`} className="max-h-[580px] w-full object-contain" />
        </div>
        <div className="flex gap-2 overflow-x-auto border-t border-border p-3">
          {frames.map((frame) => {
            const selected = frame.id === active.id
            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => setActiveId(frame.id)}
                aria-pressed={selected}
                className={`shrink-0 overflow-hidden rounded-lg border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 ${selected ? 'border-primary bg-weak' : 'border-border bg-card hover:bg-surface'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={frame.imageUrl} alt="" className="h-14 w-14 rounded object-cover" />
                <span className="mt-1 block px-0.5 text-[11px] font-semibold text-body">{frame.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
