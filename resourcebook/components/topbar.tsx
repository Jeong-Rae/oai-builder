'use client'

import { usePathname } from 'next/navigation'

export function Topbar({ nameBySlug }: { nameBySlug: Record<string, string> }) {
  const pathname = usePathname()
  const slug = pathname.replace(/^\//, '')
  const currentName = slug === 'new' ? '새 리소스 추가' : nameBySlug[slug]

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-[18px] backdrop-blur md:px-8">
      <div className="text-[13px] text-muted-foreground">
        Resources / <strong className="font-semibold text-foreground">{currentName ?? '—'}</strong>
      </div>
      <div className="rounded-full bg-surface px-2.5 py-1.5 text-xs font-bold text-body">
        Prototype
      </div>
    </header>
  )
}
