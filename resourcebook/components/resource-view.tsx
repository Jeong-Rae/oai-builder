import Link from 'next/link'
import type { Resource, Section } from '@/lib/resources'
import { SpecTable } from '@/components/spec-table'
import { InlineCell } from '@/components/inline-cell'
import { Storybook } from '@/components/storybook'
import { ResourceEditor } from '@/components/resource-editor'
import { FrameViewer } from '@/components/frame-viewer'

function SectionBlock({ section }: { section: Section }) {
  return (
    <section style={{ marginTop: '3.25rem' }}>
      {'title' in section && section.title ? (
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold leading-9 tracking-tight text-foreground">
            {section.title}
          </h2>
        </div>
      ) : null}
      <SectionBody section={section} />
    </section>
  )
}

function SectionBody({ section }: { section: Section }) {
  switch (section.type) {
    case 'table':
      return (
        <SpecTable
          headers={section.headers}
          rows={section.rows}
          firstColumnLabel={section.headers[0] === '속성'}
        />
      )

    case 'relation':
      return (
        <div className="grid grid-cols-1 items-center gap-[18px] rounded-[10px] border border-border p-5 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-[10px] bg-surface px-4 py-3.5">
            <strong className="block text-sm text-foreground">{section.left.strong}</strong>
            <code className="font-mono text-[11px] text-muted-foreground">{section.left.code}</code>
          </div>
          <div className="justify-self-center font-extrabold text-primary md:rotate-0">→</div>
          <div className="rounded-[10px] bg-surface px-4 py-3.5">
            <strong className="block text-sm text-foreground">{section.right.strong}</strong>
            <code className="font-mono text-[11px] text-muted-foreground">{section.right.code}</code>
          </div>
        </div>
      )

    case 'flow':
      return (
        <>
          <div className="grid grid-cols-1 items-stretch gap-3.5 md:grid-cols-[1fr_48px_1fr]">
            <FlowPanel label="Before" nodes={section.before} />
            <div className="grid place-items-center text-[22px] text-muted-foreground">→</div>
            <FlowPanel label="After" nodes={section.after} />
          </div>
          {section.table ? (
            <div className="mt-4">
              <SpecTable headers={section.table.headers} rows={section.table.rows} />
            </div>
          ) : null}
        </>
      )

    case 'refs':
      return (
        <div className="flex flex-wrap gap-2">
          {section.items.map((item, i) =>
            item.route ? (
              <Link
                key={i}
                href={`/${item.route}`}
                className="rounded-lg bg-surface px-[9px] py-[7px] text-xs font-semibold text-body no-underline transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={i}
                className="rounded-lg bg-surface px-[9px] py-[7px] text-xs font-semibold text-body"
              >
                {item.label}
              </span>
            ),
          )}
        </div>
      )

    case 'note':
      return (
        <p className="text-sm leading-6 text-body" style={{ marginTop: '-0.75rem' }}>
          {section.text}
        </p>
      )

    case 'policy':
      return (
        <div className="rounded-r-[10px] border-l-[3px] border-primary bg-[#f8fbff] px-4 py-3.5 text-sm text-body">
          <strong className="text-foreground">{section.strong}</strong>
          {section.lines.map((line, li) => (
            <p key={li} className="mt-2">
              {line.map((part, pi) =>
                typeof part === 'string' ? (
                  <span key={pi}>{part}</span>
                ) : (
                  <code key={pi} className="font-mono text-xs text-foreground">
                    {part.code}
                  </code>
                ),
              )}
            </p>
          ))}
        </div>
      )

    default:
      return null
  }
}

function FlowPanel({ label, nodes }: { label: string; nodes: { kind: 'obj' | 'ctrl'; text: string }[] }) {
  return (
    <div className="min-h-[136px] rounded-xl border border-border bg-card p-[18px]">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-6 flex items-center justify-center gap-2.5 font-bold">
        {nodes.map((n, i) =>
          n.kind === 'obj' ? (
            <div
              key={i}
              className="grid h-12 min-w-16 place-items-center rounded-[10px] bg-surface px-2.5"
            >
              {n.text}
            </div>
          ) : (
            <div
              key={i}
              className="grid h-[38px] w-[38px] place-items-center rounded-[9px] bg-weak font-extrabold text-weak-foreground"
            >
              {n.text}
            </div>
          ),
        )}
      </div>
    </div>
  )
}

export function ResourceView({ resource }: { resource: Resource }) {
  return (
    <article>
      <div className="mb-[18px] flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-weak px-2.5 py-1.5 text-xs font-bold text-primary">
          {resource.group} · {resource.code}
        </span>
        <ResourceEditor resource={resource} />
      </div>
      <h1 className="text-4xl font-bold leading-[54px] tracking-tighter text-foreground text-balance">
        {resource.name}
      </h1>
      <p className="mt-2.5 max-w-[720px] text-[17px] leading-7 text-body text-pretty">
        {resource.lede}
      </p>

      {resource.heroImageUrl ? (
        <div className="mt-6 overflow-hidden rounded-[16px] border border-border bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resource.heroImageUrl || "/placeholder.svg"}
            alt={`${resource.name} 대표 이미지`}
            className="max-h-[360px] w-full object-contain"
          />
        </div>
      ) : null}

      {resource.frames?.length ? <FrameViewer frames={resource.frames} /> : null}

      <div className="mt-[22px] flex flex-wrap gap-2">
        {resource.meta.map((chip, i) => (
          <span
            key={i}
            className="inline-flex min-h-[30px] items-center gap-[7px] rounded-lg border border-border bg-card px-2.5 py-[5px] text-xs font-semibold text-body"
          >
            {chip.label} <code className="font-mono text-[11px] text-foreground">{chip.code}</code>
          </span>
        ))}
      </div>

      <section style={{ marginTop: '3.25rem' }}>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold leading-9 tracking-tight text-foreground">프리뷰</h2>
          <div className="text-[13px] text-muted-foreground">스토리별 상태 확인</div>
        </div>
        <Storybook
          stories={resource.stories}
          hasControlStrip={resource.hasControlStrip}
          previewImageUrl={resource.previewImageUrl}
        />
      </section>

      {resource.sections.map((section, i) => (
        <SectionBlock key={i} section={section} />
      ))}

      <section style={{ marginTop: '3.25rem' }}>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold leading-9 tracking-tight text-foreground">규칙 근거</h2>
        </div>
        <ul className="m-0 list-none border-t border-border p-0">
          {resource.sources.map((source, i) => (
            <li
              key={i}
              className="flex flex-col justify-between gap-1 border-b border-border py-3 text-[13px] text-body md:flex-row md:gap-5"
            >
              <span>{source.book}</span>
              <span className="text-muted-foreground md:text-right">{source.ref}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-[70px] flex justify-between gap-5 border-t border-border pt-[22px] text-xs text-muted-foreground">
        <span>CONTROL Resourcebook</span>
        <span>{resource.code}</span>
      </div>
    </article>
  )
}
