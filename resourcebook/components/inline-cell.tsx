import type { Cell, Inline } from '@/lib/resources'
import { CopyButton } from '@/components/copy-button'

function InlinePart({ part }: { part: Inline }) {
  if (typeof part === 'string') return <>{part}</>
  return <code className="font-mono text-xs text-foreground">{part.code}</code>
}

export function InlineCell({ cell }: { cell: Cell }) {
  if (cell && typeof cell === 'object' && 'copy' in cell) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <code className="font-mono text-xs text-foreground">{cell.copy}</code>
        <CopyButton value={cell.copy} />
      </div>
    )
  }

  if (Array.isArray(cell)) {
    return (
      <>
        {cell.map((part, i) => (
          <InlinePart key={i} part={part} />
        ))}
      </>
    )
  }

  return <InlinePart part={cell as Inline} />
}
