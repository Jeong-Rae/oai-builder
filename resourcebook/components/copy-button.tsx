'use client'

import { useState } from 'react'

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="h-[30px] shrink-0 rounded-lg bg-surface px-[9px] text-[11px] font-bold text-body transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
    >
      {copied ? '복사됨' : '복사'}
    </button>
  )
}
