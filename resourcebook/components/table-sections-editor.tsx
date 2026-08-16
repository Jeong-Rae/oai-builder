'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { Cell, Section, TableSection } from '@/lib/resources'

type EditableCell = { value: string; kind: 'text' | 'code' }

function cellToEditable(cell: Cell): EditableCell {
  if (typeof cell === 'string') return { value: cell, kind: 'text' }
  if (Array.isArray(cell)) return { value: cell.map(cellToEditable).map(({ value }) => value).join(' '), kind: 'text' }
  if ('code' in cell) return { value: cell.code, kind: 'code' }
  return { value: cell.copy, kind: 'code' }
}

function editableToCell(cell: EditableCell): Cell {
  return cell.kind === 'code' ? { code: cell.value } : cell.value
}

export function TableSectionsEditor({
  sections,
  onChange,
}: {
  sections: Section[]
  onChange: (sections: Section[]) => void
}) {
  const tables = sections
    .map((section, index) => ({ section, index }))
    .filter((item): item is { section: TableSection; index: number } => item.section.type === 'table')

  function replace(index: number, table: TableSection) {
    onChange(sections.map((section, i) => (i === index ? table : section)))
  }

  function updateCell(table: TableSection, rowIndex: number, columnIndex: number, patch: Partial<EditableCell>) {
    const rows = table.rows.map((row, i) => {
      if (i !== rowIndex) return row
      return row.map((cell, j) => (j === columnIndex ? editableToCell({ ...cellToEditable(cell), ...patch }) : cell))
    })
    return { ...table, rows }
  }

  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">표 섹션</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">속성·동작·관계·사운드처럼 표 형식의 섹션을 편집합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...sections, { type: 'table', title: '새 섹션', headers: ['항목', '값'], rows: [['', '']] }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-body hover:bg-surface"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          섹션 추가
        </button>
      </div>

      <div className="mt-4 grid gap-5">
        {tables.map(({ section: table, index }) => (
          <div key={index} className="rounded-xl border border-border bg-surface p-3 md:p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                value={table.title}
                onChange={(event) => replace(index, { ...table, title: event.target.value })}
                aria-label="섹션 제목"
                className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              />
              <button type="button" onClick={() => onChange(sections.filter((_, i) => i !== index))} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                삭제
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[520px] space-y-2">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${table.headers.length}, minmax(132px, 1fr))` }}>
                  {table.headers.map((header, columnIndex) => (
                    <div key={columnIndex} className="flex gap-1">
                      <input
                        value={header}
                        onChange={(event) => replace(index, { ...table, headers: table.headers.map((item, i) => (i === columnIndex ? event.target.value : item)) })}
                        aria-label={`${columnIndex + 1}번째 열 제목`}
                        className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2 py-2 text-xs font-semibold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => replace(index, { ...table, headers: table.headers.filter((_, i) => i !== columnIndex), rows: table.rows.map((row) => row.filter((_, i) => i !== columnIndex)) })}
                        disabled={table.headers.length === 1}
                        aria-label="열 삭제"
                        className="rounded-lg border border-border bg-card px-2 text-muted-foreground disabled:opacity-40"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {table.rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    <div className="grid min-w-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${table.headers.length}, minmax(132px, 1fr))` }}>
                      {row.map((cell, columnIndex) => {
                        const editable = cellToEditable(cell)
                        return (
                          <div key={columnIndex} className="flex gap-1">
                            <select
                              value={editable.kind}
                              onChange={(event) => replace(index, updateCell(table, rowIndex, columnIndex, { kind: event.target.value as EditableCell['kind'] }))}
                              aria-label="셀 형식"
                              className="w-[58px] rounded-lg border border-border bg-card px-1 text-[10px] text-body"
                            >
                              <option value="text">텍스트</option>
                              <option value="code">코드</option>
                            </select>
                            <input
                              value={editable.value}
                              onChange={(event) => replace(index, updateCell(table, rowIndex, columnIndex, { value: event.target.value }))}
                              aria-label={`${rowIndex + 1}행 ${columnIndex + 1}열`}
                              className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2 py-2 text-xs text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
                            />
                          </div>
                        )
                      })}
                    </div>
                    <button type="button" onClick={() => replace(index, { ...table, rows: table.rows.filter((_, i) => i !== rowIndex) })} aria-label="행 삭제" className="rounded-lg border border-border bg-card px-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => replace(index, { ...table, rows: [...table.rows, table.headers.map(() => '')] })} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-body hover:bg-card">행 추가</button>
              <button type="button" onClick={() => replace(index, { ...table, headers: [...table.headers, '새 열'], rows: table.rows.map((row) => [...row, '']) })} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-body hover:bg-card">열 추가</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
