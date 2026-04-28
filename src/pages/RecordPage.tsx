import { useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Topbar } from '@/components/Topbar'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { FieldValueCell } from '@/components/FieldValue'
import { ProvenancePopover } from '@/components/ProvenancePopover'
import { FieldUpdateChip } from '@/components/FieldUpdateChip'
import { useCrmStore } from '@/store/useCrmStore'
import { formatRelativeTime } from '@/lib/utils'
import type { FieldUpdateProposal, SmartVariable, Record_ } from '@/lib/types'

export function RecordPage() {
  const { objectKey, recordId } = useParams()
  const schemas = useCrmStore((s) => s.schemas)
  const allRecords = useCrmStore((s) => s.records)
  const allActivities = useCrmStore((s) => s.activities)
  const allProposals = useCrmStore((s) => s.proposals)

  const schema = useMemo(
    () => schemas.find((s) => s.key === objectKey),
    [schemas, objectKey],
  )
  const record = useMemo(
    () => allRecords.find((r) => r.id === recordId),
    [allRecords, recordId],
  )
  const activities = useMemo(
    () => allActivities.filter((a) => a.recordId === recordId),
    [allActivities, recordId],
  )
  const pendingProposalsByField = useMemo(() => {
    const map: globalThis.Record<string, FieldUpdateProposal> = {}
    for (const p of allProposals) {
      if (
        p.kind === 'field_update' &&
        p.status === 'pending' &&
        p.recordId === recordId
      ) {
        map[p.fieldKey] = p
      }
    }
    return map
  }, [allProposals, recordId])

  if (!schema || !record) return <Navigate to="/" replace />

  const primaryVar = schema.variables.find((v) => v.pinned) ?? schema.variables[0]
  const name = (record.fields[primaryVar.key] as string) ?? 'Untitled'
  const pinnedVars = schema.variables.filter((v) => v.pinned && v.key !== primaryVar.key)
  const otherVars = schema.variables.filter((v) => !v.pinned)

  return (
    <>
      <Topbar
        title={name}
        subtitle={
          <span className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
            <Link to={`/o/${schema.key}`} className="hover:text-ink-900">
              {schema.plural}
            </Link>
            <Icon name="ChevronRight" size={11} />
            <span>Updated {formatRelativeTime(record.updatedAt)}</span>
          </span>
        }
        icon={schema.icon}
        iconColor={schema.color}
        actions={
          <>
            <Button variant="ghost" size="sm">
              <Icon name="Link2" size={13} />
              Link
            </Button>
            <Button variant="secondary" size="sm">
              <Icon name="MoreHorizontal" size={14} />
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        {/* Left: properties rail */}
        <aside className="w-[340px] shrink-0 overflow-auto border-r border-ink-200 bg-ink-50/30">
          {/* Identity card */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              {schema.key === 'customer' ? (
                <Avatar name={name} size="lg" />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white ring-1 ring-inset ring-ink-200"
                  style={{ color: schema.color }}
                >
                  <Icon name={schema.icon} size={18} />
                </div>
              )}
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[16px] font-semibold text-ink-900">
                  {name}
                </span>
                <span className="text-[11.5px] text-ink-500">
                  {schema.name}
                </span>
              </div>
            </div>
          </div>

          <Section title="Properties">
            {pinnedVars.map((v) => (
              <PropertyRow
                key={v.id}
                variable={v}
                record={record}
                proposal={pendingProposalsByField[v.key]}
              />
            ))}
          </Section>

          <Section title="Details" collapsible>
            {otherVars.map((v) => (
              <PropertyRow
                key={v.id}
                variable={v}
                record={record}
                proposal={pendingProposalsByField[v.key]}
              />
            ))}
          </Section>
        </aside>

        {/* Center: activity stream */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-11 items-center gap-1 border-b border-ink-200 bg-white px-6">
            {['All activity', 'Calls', 'Texts', 'Emails', 'AI updates'].map((t, i) => (
              <button
                key={t}
                className={
                  i === 0
                    ? 'h-7 rounded-md bg-ink-100 px-2.5 text-[12px] font-medium text-ink-900'
                    : 'h-7 rounded-md px-2.5 text-[12px] font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {activities.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100">
                    <Icon name="MessagesSquare" size={16} className="text-ink-500" />
                  </div>
                  <div className="text-[13px] font-medium text-ink-900">
                    No activity yet
                  </div>
                  <p className="mt-1 text-[12px] text-ink-500">
                    Calls, texts, emails, and chatbot interactions will appear
                    here.
                  </p>
                </div>
              </div>
            ) : (
              <ol className="relative mx-auto w-full max-w-2xl px-6 py-6">
                {activities.map((a, i) => (
                  <li key={a.id} className="relative pl-8 pb-5">
                    {i < activities.length - 1 && (
                      <span className="absolute left-[11px] top-5 h-full w-px bg-ink-200" />
                    )}
                    <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-ink-200">
                      <Icon
                        name={
                          a.type === 'call'
                            ? 'Phone'
                            : a.type === 'text'
                            ? 'MessageSquare'
                            : a.type === 'email'
                            ? 'Mail'
                            : 'Bot'
                        }
                        size={11}
                        className="text-ink-600"
                      />
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-medium text-ink-900">
                        {a.summary}
                      </span>
                      <span className="text-[11px] text-ink-400">
                        · {formatRelativeTime(a.at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Right: linked records */}
        <aside className="w-[280px] shrink-0 border-l border-ink-200 bg-white">
          <div className="flex h-11 items-center justify-between border-b border-ink-200 px-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Linked
            </span>
            <button className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-900">
              <Icon name="Plus" size={12} strokeWidth={2.5} />
            </button>
          </div>
          <div className="p-4">
            {(record.links ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink-200 p-5 text-center">
                <Icon
                  name="Link2"
                  size={16}
                  className="mx-auto mb-2 text-ink-400"
                />
                <div className="text-[12px] font-medium text-ink-700">
                  No linked records
                </div>
                <p className="mt-0.5 text-[11px] text-ink-500">
                  Link deals, properties, or any object.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {(record.links ?? []).map((link, i) => (
                  <li key={i} className="text-[12.5px] text-ink-700">
                    {link.objectKey}: {link.recordId}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}

function Section({
  title,
  children,
  collapsible,
}: {
  title: string
  children: React.ReactNode
  collapsible?: boolean
}) {
  return (
    <div className="border-t border-ink-200 py-2">
      <div className="flex h-7 items-center justify-between px-6">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
          {title}
        </span>
        {collapsible && (
          <Icon name="ChevronDown" size={11} className="text-ink-400" />
        )}
      </div>
      <div className="px-3">{children}</div>
    </div>
  )
}

function PropertyRow({
  variable: v,
  record,
  proposal,
}: {
  variable: SmartVariable
  record: Record_
  proposal?: FieldUpdateProposal
}) {
  const provenance = record.aiWritten?.[v.key]
  return (
    <div className="group flex flex-col gap-0.5 rounded-md px-3 py-1.5 hover:bg-white">
      <div className="flex min-h-[24px] items-start gap-2">
        <span className="flex w-[110px] shrink-0 items-center gap-1.5 pt-0.5 text-[11.5px] font-medium text-ink-500">
          {v.icon && <Icon name={v.icon} size={12} className="text-ink-400" />}
          {v.name}
          {v.aiManaged && !provenance && (
            <Icon
              name="Sparkles"
              size={10}
              strokeWidth={2}
              className="text-ink-300"
              title="AI-managed — the AI may propose updates"
            />
          )}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[12.5px]">
          <FieldValueCell variable={v} value={record.fields[v.key] as never} />
          {provenance && (
            <ProvenancePopover variable={v} provenance={provenance} />
          )}
        </span>
      </div>
      {proposal && <FieldUpdateChip proposal={proposal} variable={v} />}
    </div>
  )
}
