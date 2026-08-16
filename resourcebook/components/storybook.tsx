'use client'

import { useState } from 'react'
import type { Story } from '@/lib/resources'

export function Storybook({
  stories,
  hasControlStrip,
  previewImageUrl,
}: {
  stories: Story[]
  hasControlStrip: boolean
  previewImageUrl?: string | null
}) {
  const [activeId, setActiveId] = useState<'default' | 'controls'>('default')
  const controls = [...new Set(stories.flatMap((story) => story.controls))]
  const defaultStory = stories.find((story) => story.id === 'default') ?? stories[0]
  const controlStory = stories.find((story) => story.id === 'controls') ?? stories.find((story) => story.controls.length) ?? defaultStory
  const active = activeId === 'controls' ? controlStory : defaultStory
  const tabs = [
    { id: 'default' as const, title: '기본' },
    { id: 'controls' as const, title: '컨트롤' },
  ]

  const gridBg = {
    backgroundImage:
      'linear-gradient(#f6f8fa 1px, transparent 1px), linear-gradient(90deg, #f6f8fa 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-card">
      <div
        className="flex min-h-[50px] items-center gap-2 overflow-x-auto border-b border-border bg-panel p-3"
        role="tablist"
        aria-label="스토리 상태"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
              className={`whitespace-nowrap rounded-lg border px-[10px] py-[7px] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 ${
                isActive
                  ? 'border-transparent bg-weak text-weak-foreground'
                  : 'border-transparent text-body hover:bg-surface'
              }`}
            >
              {tab.title}
            </button>
          )
        })}
      </div>

      <div className="grid min-h-[300px] place-items-center px-7 py-11" style={gridBg}>
        <div className="flex w-full max-w-[360px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#cfd6dd] bg-card/95 p-7 text-center">
          {previewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImageUrl || "/placeholder.svg"}
              alt="리소스 프리뷰"
              className="mb-1 max-h-[180px] w-auto object-contain"
            />
          ) : (
            <>
              <div className="text-[15px] font-bold text-foreground">블록 이미지 미지정</div>
              <div className="mt-1.5 text-xs text-muted-foreground">
                편집에서 프리뷰 이미지를 업로드하면 이 영역에 표시
              </div>
            </>
          )}

          {activeId === 'controls' && hasControlStrip && controls.length ? (
            <div className="mt-3.5 flex flex-wrap justify-center gap-2">
              {controls.map((c, i) => (
                <span
                  key={i}
                  className="grid h-[34px] min-w-[34px] place-items-center rounded-[9px] bg-weak font-extrabold text-weak-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : activeId === 'controls' ? (
            <p className="mt-3.5 text-xs text-muted-foreground">지정된 컨트롤이 없습니다.</p>
          ) : null}

          <div className="mt-3.5 inline-flex rounded-full bg-surface px-[9px] py-[5px] font-mono text-[11px] font-semibold leading-none text-body">
            {active?.state}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-border px-5 py-[18px] md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-sm font-bold text-foreground">{activeId === 'controls' ? '컨트롤' : '기본'}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {activeId === 'controls' ? '리소스에 연결된 컨트롤 상태를 확인합니다.' : active?.desc}
          </div>
        </div>
        <div className="self-center text-left font-mono text-[11px] font-semibold leading-tight text-body md:text-right">
          {active?.ref}
        </div>
      </div>
    </div>
  )
}
