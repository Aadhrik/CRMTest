import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Activity,
  InboxProposal,
  ObjectSchema,
  PickListOption,
  Record_,
  SavedView,
  SmartVariable,
} from '@/lib/types'
import { ALL_SCHEMAS } from '@/data/schemas'
import { SEED } from '@/data/seed'
import { SEED_VIEWS } from '@/data/views'

// ============================================================================
// Single store. Mock DB in memory — everything is reactive.
// ============================================================================

interface CrmState {
  schemas: ObjectSchema[]
  records: Record_[]
  activities: Activity[]
  proposals: InboxProposal[]
  savedViews: SavedView[]

  // Derived
  getSchema: (key: string) => ObjectSchema | undefined
  getRecord: (id: string) => Record_ | undefined
  getSavedView: (id: string) => SavedView | undefined

  // Record mutations
  updateRecordField: (recordId: string, fieldKey: string, value: unknown) => void
  moveRecordToGroup: (recordId: string, groupByKey: string, optionId: string) => void

  // Saved-view CRUD
  createSavedView: (v: SavedView) => void
  updateSavedView: (id: string, patch: Partial<SavedView>) => void
  deleteSavedView: (id: string) => void

  // Schema editor actions
  addSmartVariable: (objectKey: string, variable: SmartVariable) => void
  updateSmartVariable: (objectKey: string, key: string, patch: Partial<SmartVariable>) => void
  deleteSmartVariable: (objectKey: string, key: string) => void
  reorderSmartVariables: (objectKey: string, keysInOrder: string[]) => void
  addPickListOption: (objectKey: string, variableKey: string, option: PickListOption) => void
  updatePickListOption: (
    objectKey: string,
    variableKey: string,
    optionId: string,
    patch: Partial<PickListOption>,
  ) => void
  deletePickListOption: (objectKey: string, variableKey: string, optionId: string) => void

  // Proposals
  acceptProposal: (id: string) => void
  rejectProposal: (id: string) => void
}

// Helper: mutate a variable inside schemas immutably
function mapSchemaVariables(
  schemas: ObjectSchema[],
  objectKey: string,
  fn: (vars: SmartVariable[]) => SmartVariable[],
): ObjectSchema[] {
  return schemas.map((s) => (s.key === objectKey ? { ...s, variables: fn(s.variables) } : s))
}

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get) => ({
  schemas: ALL_SCHEMAS,
  records: SEED.records,
  activities: SEED.activities,
  proposals: SEED.proposals,
  savedViews: SEED_VIEWS,

  getSchema: (key) => get().schemas.find((s) => s.key === key),
  getRecord: (id) => get().records.find((r) => r.id === id),
  getSavedView: (id) => get().savedViews.find((v) => v.id === id),

  updateRecordField: (recordId, fieldKey, value) =>
    set((s) => ({
      records: s.records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              updatedAt: new Date().toISOString(),
              fields: { ...r.fields, [fieldKey]: value as never },
            }
          : r,
      ),
    })),

  moveRecordToGroup: (recordId, groupByKey, optionId) =>
    set((s) => ({
      records: s.records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              updatedAt: new Date().toISOString(),
              fields: { ...r.fields, [groupByKey]: { optionId } as never },
            }
          : r,
      ),
    })),

  createSavedView: (v) => set((s) => ({ savedViews: [...s.savedViews, v] })),
  updateSavedView: (id, patch) =>
    set((s) => ({
      savedViews: s.savedViews.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    })),
  deleteSavedView: (id) =>
    set((s) => ({ savedViews: s.savedViews.filter((v) => v.id !== id) })),

  addSmartVariable: (objectKey, variable) =>
    set((s) => ({
      schemas: mapSchemaVariables(s.schemas, objectKey, (vars) => [...vars, variable]),
    })),

  updateSmartVariable: (objectKey, key, patch) =>
    set((s) => ({
      schemas: mapSchemaVariables(s.schemas, objectKey, (vars) =>
        vars.map((v) => (v.key === key ? { ...v, ...patch } : v)),
      ),
    })),

  deleteSmartVariable: (objectKey, key) =>
    set((s) => ({
      schemas: mapSchemaVariables(s.schemas, objectKey, (vars) =>
        vars.filter((v) => v.key !== key),
      ),
      // Also strip the field from all records
      records: s.records.map((r) => {
        if (r.objectKey !== objectKey || !(key in r.fields)) return r
        const { [key]: _, ...rest } = r.fields
        return { ...r, fields: rest }
      }),
      // And any views grouping/sorting/filtering by this key become generic
      savedViews: s.savedViews.map((v) =>
        v.objectKey === objectKey && v.groupBy === key
          ? { ...v, groupBy: undefined, layout: 'table' as const }
          : v,
      ),
    })),

  reorderSmartVariables: (objectKey, keysInOrder) =>
    set((s) => ({
      schemas: mapSchemaVariables(s.schemas, objectKey, (vars) => {
        const byKey = new Map(vars.map((v) => [v.key, v]))
        const next: SmartVariable[] = []
        for (const k of keysInOrder) {
          const v = byKey.get(k)
          if (v) next.push(v)
        }
        // Append any not included (safety)
        for (const v of vars) if (!keysInOrder.includes(v.key)) next.push(v)
        return next
      }),
    })),

  addPickListOption: (objectKey, variableKey, option) =>
    set((s) => ({
      schemas: mapSchemaVariables(s.schemas, objectKey, (vars) =>
        vars.map((v) =>
          v.key === variableKey
            ? { ...v, options: [...(v.options ?? []), option] }
            : v,
        ),
      ),
    })),

  updatePickListOption: (objectKey, variableKey, optionId, patch) =>
    set((s) => ({
      schemas: mapSchemaVariables(s.schemas, objectKey, (vars) =>
        vars.map((v) =>
          v.key === variableKey
            ? {
                ...v,
                options: (v.options ?? []).map((o) =>
                  o.id === optionId ? { ...o, ...patch } : o,
                ),
              }
            : v,
        ),
      ),
    })),

  deletePickListOption: (objectKey, variableKey, optionId) =>
    set((s) => ({
      schemas: mapSchemaVariables(s.schemas, objectKey, (vars) =>
        vars.map((v) =>
          v.key === variableKey
            ? { ...v, options: (v.options ?? []).filter((o) => o.id !== optionId) }
            : v,
        ),
      ),
      // Clear any record values pointing at the deleted option
      records: s.records.map((r) => {
        if (r.objectKey !== objectKey) return r
        const v = r.fields[variableKey]
        if (v && typeof v === 'object' && 'optionId' in v && v.optionId === optionId) {
          return { ...r, fields: { ...r.fields, [variableKey]: null } }
        }
        return r
      }),
    })),

  acceptProposal: (id) =>
    set((s) => {
      const p = s.proposals.find((x) => x.id === id)
      if (!p) return s
      if (p.kind === 'field_update') {
        return {
          proposals: s.proposals.map((x) =>
            x.id === id ? { ...x, status: 'accepted' } : x,
          ),
          records: s.records.map((r) =>
            r.id === p.recordId
              ? {
                  ...r,
                  updatedAt: new Date().toISOString(),
                  fields: { ...r.fields, [p.fieldKey]: p.proposedValue as never },
                  aiWritten: {
                    ...(r.aiWritten ?? {}),
                    [p.fieldKey]: {
                      at: new Date().toISOString(),
                      source: 'AI proposal (accepted)',
                      quote: p.sourceQuote,
                      confidence: p.confidence,
                      previousValue: p.currentValue,
                    },
                  },
                }
              : r,
          ),
        }
      }
      // new_variable proposal → actually create the smart variable on the object
      const existing = s.schemas
        .find((sc) => sc.key === p.objectKey)
        ?.variables.some((v) => v.key === p.suggestedKey)
      const nextSchemas = existing
        ? s.schemas
        : mapSchemaVariables(s.schemas, p.objectKey, (vars) => [
            ...vars,
            {
              id: `var_${Date.now().toString(36)}`,
              key: p.suggestedKey,
              name: p.suggestedName,
              type: p.suggestedType,
              description: p.suggestedDescription,
              aiManaged: true,
              locked: false,
              ...(p.suggestedType === 'pick_list' ? { options: [] } : {}),
            },
          ])
      return {
        schemas: nextSchemas,
        proposals: s.proposals.map((x) =>
          x.id === id ? { ...x, status: 'accepted' } : x,
        ),
      }
    }),

  rejectProposal: (id) =>
    set((s) => ({
      proposals: s.proposals.map((x) =>
        x.id === id ? { ...x, status: 'rejected' } : x,
      ),
    })),
    }),
    {
      name: 'frontdesk-crm',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemas: state.schemas,
        records: state.records,
        activities: state.activities,
        proposals: state.proposals,
        savedViews: state.savedViews,
      }),
    },
  ),
)
