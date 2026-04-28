// ============================================================================
// Core types — the whole product maps to these primitives.
// ============================================================================

export type SmartVariableType = 'text' | 'number' | 'pick_list' | 'yes_no' | 'date'

export interface PickListOption {
  id: string
  label: string
  color: string // tailwind-compatible token like 'violet' | 'emerald' ...
  order: number
}

export interface SmartVariable {
  id: string
  key: string // machine name, e.g. 'favorite_color'
  name: string // display name
  type: SmartVariableType
  description: string // doubles as the AI prompt
  icon?: string // lucide icon name
  options?: PickListOption[] // for pick_list
  aiManaged: boolean // whether the AI is allowed to propose updates
  locked: boolean // user-locked — AI proposals require approval
  required?: boolean
  pinned?: boolean // show at top of the properties rail
}

export interface ObjectSchema {
  id: string
  key: string // 'customer', 'deal', 'property'
  name: string // singular display, 'Customer'
  plural: string // 'Customers'
  icon: string // lucide icon name
  color: string // brand accent for this object (hex)
  isDefault?: boolean // Customer is default
  variables: SmartVariable[]
  description?: string
}

export type FieldValue =
  | string
  | number
  | boolean
  | { optionId: string } // pick_list
  | null

export interface AIProvenance {
  at: string // ISO
  source: string // human-readable source, e.g. "Call · Apr 10"
  quote?: string // short transcript snippet
  confidence?: number // 0..1
  sourceActivityId?: string
  previousValue?: FieldValue
}

export interface Record_ {
  id: string
  objectKey: string
  createdAt: string // ISO
  updatedAt: string // ISO
  // Field values keyed by smart variable key
  fields: Partial<globalThis.Record<string, FieldValue>>
  // Provenance: which fields were last written by AI, and where from
  aiWritten?: globalThis.Record<string, AIProvenance>
  // Links to other records (by id)
  links?: { objectKey: string; recordId: string }[]
}

export type ActivityType = 'call' | 'text' | 'email' | 'chatbot' | 'ai_update' | 'note'

export interface Activity {
  id: string
  recordId: string
  type: ActivityType
  at: string // ISO
  summary: string
  body?: string
  // For ai_update
  fieldKey?: string
  previousValue?: FieldValue
  newValue?: FieldValue
  sourceActivityId?: string
}

export type InboxProposalKind = 'field_update' | 'new_variable'

export interface FieldUpdateProposal {
  id: string
  kind: 'field_update'
  createdAt: string
  recordId: string
  objectKey: string
  fieldKey: string
  currentValue: FieldValue
  proposedValue: FieldValue
  reason: string
  sourceActivityId?: string
  sourceQuote?: string
  confidence?: number
  status: 'pending' | 'accepted' | 'rejected'
}

export interface NewVariableProposal {
  id: string
  kind: 'new_variable'
  createdAt: string
  objectKey: string
  suggestedKey: string
  suggestedName: string
  suggestedType: SmartVariableType
  suggestedDescription: string
  evidenceCount: number
  exampleQuotes: string[]
  status: 'pending' | 'accepted' | 'rejected'
}

export type InboxProposal = FieldUpdateProposal | NewVariableProposal

// SavedView unifies the "pipeline" and "filter lens" concepts. A view is a
// lens over an object: a layout (table or board), an optional groupBy
// (pick-list variable key, required for board), filters, and sort.
// Pinned views surface in the sidebar under their parent object.
export type ViewLayout = 'table' | 'board'

export interface SavedView {
  id: string
  objectKey: string
  name: string
  layout: ViewLayout
  groupBy?: string // pick-list variable key, required when layout === 'board'
  filters?: FilterCondition[]
  sortBy?: { key: string; dir: 'asc' | 'desc' }
  visibleColumns?: string[]
  icon?: string
  color?: string
  pinned?: boolean
  isDefault?: boolean
  createdAt: string
}

export interface FilterCondition {
  fieldKey: string
  op: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'is_empty' | 'is_not_empty'
  value?: FieldValue
}
