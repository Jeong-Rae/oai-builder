'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { NavGroup } from '@/lib/resources'

export function Sidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname()

  return (
    <aside
      className="top-0 overflow-auto border-b border-border bg-panel px-4 py-3.5 md:sticky md:h-screen md:border-b-0 md:border-r md:px-[18px] md:py-6"
      aria-label="리소스 탐색"
    >
      <div className="mb-3 flex items-center gap-3 border-b border-border px-2 pb-3.5 md:mb-[18px] md:pb-[22px]">
        <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-primary font-extrabold tracking-tight text-primary-foreground">
          C
        </div>
        <div>
          <div className="text-[15px] font-bold text-foreground">CONTROL Resourcebook</div>
          <div className="mt-px text-xs text-muted-foreground">Prototype Resource Spec</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-1 md:gap-0">
        {groups.map((group) => (
          <div key={group.label} className="md:my-[22px]">
            <div className="px-1.5 pb-2 text-xs font-bold tracking-wide text-muted-foreground md:px-2.5">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === `/${item.slug}`
              return (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 ${
                    isActive
                      ? 'bg-weak text-weak-foreground'
                      : 'text-body hover:bg-surface'
                  }`}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-current opacity-60" />
                  {item.navLabel}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 border-t border-border pt-3 md:mt-0">
        <Link
          href="/new"
          aria-current={pathname === '/new' ? 'page' : undefined}
          className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 ${
            pathname === '/new'
              ? 'bg-weak text-weak-foreground'
              : 'text-primary hover:bg-surface'
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          새 리소스 추가
        </Link>
      </div>
    </aside>
  )
}
