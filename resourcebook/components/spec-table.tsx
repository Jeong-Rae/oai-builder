import type { Cell } from '@/lib/resources'
import { InlineCell } from '@/components/inline-cell'

export function SpecTable({
  headers,
  rows,
  firstColumnLabel = false,
}: {
  headers: string[]
  rows: Cell[][]
  firstColumnLabel?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="border-b border-border bg-panel px-4 py-3 text-left align-top text-xs font-bold text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`border-b border-border px-4 py-3 text-left align-top last:border-b-0 [tr:last-child_&]:border-b-0 ${
                    firstColumnLabel && ci === 0 ? 'w-[28%] text-body' : ''
                  }`}
                >
                  <InlineCell cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
