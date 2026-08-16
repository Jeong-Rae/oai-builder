'use client'

import { GROUPS } from '@/lib/resources'

export interface CoreFieldValues {
  name: string
  code: string
  lede: string
  navLabel: string
  group: '필드' | '오브젝트'
  hasControlStrip: boolean
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 placeholder:text-muted-foreground'

export function CoreFields({
  values,
  onChange,
}: {
  values: CoreFieldValues
  onChange: (patch: Partial<CoreFieldValues>) => void
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-foreground">이름</span>
          <input
            className={inputClass}
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="예: 벽"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-foreground">식별자 (코드)</span>
          <input
            className={`${inputClass} font-mono`}
            value={values.code}
            onChange={(e) => onChange({ code: e.target.value })}
            placeholder="예: FIELD-WALL"
          />
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-foreground">설명</span>
        <textarea
          className={`${inputClass} min-h-[76px] resize-y leading-6`}
          value={values.lede}
          onChange={(e) => onChange({ lede: e.target.value })}
          placeholder="이 리소스의 역할을 한 문장으로 설명"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-foreground">네비게이션 라벨</span>
          <input
            className={inputClass}
            value={values.navLabel}
            onChange={(e) => onChange({ navLabel: e.target.value })}
            placeholder="사이드바에 표시될 짧은 이름"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-foreground">그룹</span>
          <select
            className={inputClass}
            value={values.group}
            onChange={(e) => onChange({ group: e.target.value as '필드' | '오브젝트' })}
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2.5 rounded-[10px] border border-border bg-surface px-3 py-2.5">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={values.hasControlStrip}
          onChange={(e) => onChange({ hasControlStrip: e.target.checked })}
        />
        <span className="text-sm text-body">
          프리뷰에 컨트롤 스트립 표시 <span className="text-muted-foreground">(오브젝트류)</span>
        </span>
      </label>
    </div>
  )
}
