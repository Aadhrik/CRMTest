import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useCrmStore } from '@/store/useCrmStore'

export function DashboardPage() {
  const schemas = useCrmStore((s) => s.schemas)
  const records = useCrmStore((s) => s.records)
  const savedViews = useCrmStore((s) => s.savedViews)
  const proposals = useCrmStore((s) => s.proposals)
  const pendingProposals = proposals.filter((p) => p.status === 'pending')
  const pinnedViews = savedViews.filter((v) => v.pinned)

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-8">
          <div className="mb-8">
            <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">
              Good afternoon, Aadhrik
            </h1>
            <p className="mt-1 text-[13px] text-ink-500">
              Here's what's happening across your CRM.
            </p>
          </div>
          {/* Objects */}
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
                Objects
              </h2>
              <p className="mt-0.5 text-[11.5px] text-ink-500">
                Typed record tables — each property is AI-aware.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {schemas.map((s) => {
              const count = records.filter((r) => r.objectKey === s.key).length
              const varCount = s.variables.length
              return (
                <Link
                  key={s.key}
                  to={`/o/${s.key}`}
                  className="group relative rounded-xl border border-ink-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-elev-2"
                >
                  <div
                    className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 ring-1 ring-inset ring-ink-200"
                    style={{ color: s.color }}
                  >
                    <Icon name={s.icon} size={16} />
                  </div>
                  <div className="text-[15px] font-semibold text-ink-900">
                    {s.plural}
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-500">
                    {s.description}
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[11.5px] font-medium text-ink-600">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="Rows3" size={11} className="text-ink-400" />
                      <span className="tabular-nums">
                        {count.toLocaleString()}
                      </span>
                      <span className="text-ink-400">records</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="Sparkles" size={11} className="text-accent-500" />
                      <span className="tabular-nums">{varCount}</span>
                      <span className="text-ink-400">{varCount === 1 ? 'property' : 'properties'}</span>
                    </span>
                    <Icon
                      name="ArrowRight"
                      size={12}
                      className="ml-auto text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-900"
                    />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pinned views */}
          {pinnedViews.length > 0 && (
            <>
              <div className="mb-3 mt-10 flex items-baseline justify-between">
                <div>
                  <h2 className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
                    Pinned views
                  </h2>
                  <p className="mt-0.5 text-[11.5px] text-ink-500">
                    Saved lenses over your records — pipeline by stage, table
                    filtered by tier, whatever you need.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {pinnedViews.map((v) => {
                  const schema = schemas.find((s) => s.key === v.objectKey)
                  const recordCount = records.filter(
                    (r) => r.objectKey === v.objectKey,
                  ).length
                  return (
                    <Link
                      key={v.id}
                      to={`/o/${v.objectKey}?view=${v.id}`}
                      className="group relative rounded-xl border border-ink-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-elev-2"
                    >
                      <div
                        className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 ring-1 ring-inset ring-ink-200"
                        style={{ color: v.color }}
                      >
                        <Icon
                          name={v.icon ?? (v.layout === 'board' ? 'LayoutGrid' : 'Rows3')}
                          size={16}
                        />
                      </div>
                      <div className="text-[15px] font-semibold text-ink-900">
                        {v.name}
                      </div>
                      <div className="mt-0.5 text-[12px] text-ink-500">
                        {schema?.plural}
                        {v.groupBy && ` · grouped by ${v.groupBy}`}
                      </div>
                      <div className="mt-4 flex items-center gap-3 text-[11.5px] font-medium text-ink-600">
                        <span className="inline-flex items-center gap-1">
                          <Icon
                            name={v.layout === 'board' ? 'LayoutGrid' : 'Rows3'}
                            size={11}
                            className="text-ink-400"
                          />
                          <span className="text-ink-400 capitalize">{v.layout === 'board' ? 'Pipeline' : v.layout}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="Rows3" size={11} className="text-ink-400" />
                          <span className="tabular-nums">{recordCount}</span>
                        </span>
                        <Icon
                          name="ArrowRight"
                          size={12}
                          className="ml-auto text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-900"
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}

          {/* AI activity — compact strip, not a triage destination */}
          <h2 className="mb-3 mt-10 text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            AI activity
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <Stat
              label="Field updates pending"
              value={String(
                pendingProposals.filter((p) => p.kind === 'field_update').length,
              )}
              delta="inline on records"
              icon="Sparkles"
              accent
            />
            <Stat
              label="New properties proposed"
              value={String(
                pendingProposals.filter((p) => p.kind === 'new_variable').length,
              )}
              delta="review per object"
              icon="PlusCircle"
              accent
            />
            <Stat label="Calls logged" value="47" delta="+18%" icon="Phone" />
            <Stat
              label="AI-written fields"
              value={String(
                records.reduce(
                  (n, r) => n + Object.keys(r.aiWritten ?? {}).length,
                  0,
                ),
              )}
              delta="across all records"
              icon="Bot"
              neutral
            />
          </div>
        </div>
      </div>
    </>
  )
}

function Stat({
  label,
  value,
  delta,
  icon,
  neutral,
  accent,
}: {
  label: string
  value: string
  delta: string
  icon: string
  neutral?: boolean
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
        <Icon
          name={icon}
          size={11}
          className={accent ? 'text-accent-500' : 'text-ink-400'}
        />
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[22px] font-semibold tracking-tight text-ink-900">
          {value}
        </span>
        <span
          className={
            neutral || accent
              ? 'text-[11px] font-medium text-ink-500'
              : 'text-[11px] font-medium text-emerald-600'
          }
        >
          {delta}
        </span>
      </div>
    </div>
  )
}
