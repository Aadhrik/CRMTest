# Frontdesk CRM — Engineering Spec

The CRM lives as one section inside a larger product (see `AppShellSidebar` —
the dark icon rail that simulates the outer shell). All CRM nav happens inside
the surface itself via `ObjectTabs` (top) and per-page toolbars.

This doc covers the parts that are easy to mis-implement from screenshots alone.

---

## Mental model

Three concepts. That's it.

| Concept       | What it is                                                                          | Where in code               |
| ------------- | ----------------------------------------------------------------------------------- | --------------------------- |
| **Object**    | A type of record (Customer, Deal, Property)                                         | `ObjectSchema`              |
| **Property**  | A typed field on an object. Its `description` doubles as the AI prompt.             | `SmartVariable`             |
| **View**      | A saved lens over an object: layout + optional groupBy + filters + sort             | `SavedView`                 |

**There is no first-class `Pipeline` concept.** A pipeline is just a Board-layout
View where `groupBy` points at a `pick_list` property. The columns of the board
*are* the options of that pick_list.

This collapse is deliberate. It means:

- Creating a "new pipeline" = creating a new SavedView with `layout: 'board'`.
- Renaming a stage in a pipeline ↔ renaming a pick_list option on the property.
- Moving a card across stages ↔ writing a new `optionId` to the record's field.
- The same view can flip to Table layout without losing any data.
- The same property can back multiple pipelines (different filters / sort / etc.).

If an engineer ever feels the urge to add a `Pipeline` table — stop. They're views.

---

## Data model (relevant subset)

```ts
type Property =                                 // aka SmartVariable
  | { type: 'text';      description: string; ... }
  | { type: 'number';    description: string; ... }
  | { type: 'pick_list'; description: string; options: PickListOption[]; ... }
  | { type: 'yes_no';    description: string; ... }
  | { type: 'date';      description: string; ... }

type PickListOption = { id: string; label: string; color: string; order: number }

type SavedView = {
  id, objectKey, name,
  layout: 'table' | 'board',
  groupBy?: string,                 // required when layout === 'board';
                                    // points at a pick_list property key
  filters?: FilterCondition[],
  sortBy?: { key, dir },
  visibleColumns?: string[],
  pinned?: boolean,
  createdAt,
}

type FilterCondition = {
  fieldKey,
  op: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'is_empty' | 'is_not_empty',
  value?,                           // typed by field; UI stores string and parses
}
```

`description` on a property is **the AI prompt**. When the AI processes a
call/text/email, it reads each property's description to decide what to extract.
That's the whole "AI-managed properties" mechanism — there's no separate prompt
field.

---

## User flows

### Picking an object

Top of every CRM page (`ObjectTabs`). Tabs derive from `useCrmStore.schemas`.
The active object comes from the URL (`/o/:objectKey`).

### Picking a view

Inside an object page. View tabs = saved views filtered by `objectKey`. "All"
is the implicit no-view state — no `?view=` query param.

### Switching layouts (Table ↔ Board)

- **If a view is active**: write through to `savedViews[id].layout` via
  `updateSavedView`. Layout is a property of the view.
- **If no view is active ("All")**: use page-local state only.

When switching to Board with no `groupBy`, default to the first `pick_list`
property on the schema. If the object has no `pick_list` properties, the Board
toggle is **disabled** with tooltip "Needs a pick-list property"; an empty-state
CTA prompts the user to add one.

### Creating a view ("new pipeline")

Click `+` in the view tabs strip. An inline input replaces the `+`. Type a name,
press Enter. The view is created with **the current** layout, groupBy, and
filters baked in. Escape cancels.

If created from the filter bar's "Save as view" button, the current filter
state is also baked into the view's `filters` field. Reopening the view
restores those filters.

### Editing a view

- Layout, groupBy, filters: changes write through automatically while the view
  is active. **No "Save" button** — the view is the live state.
- Column header rename (Board): writes to `PickListOption.label` on the
  underlying property. Affects every record using that option, and every other
  view grouped by the same property. (See edge cases.)
- Name, icon, color, pinned, delete: store actions exist (`updateSavedView`,
  `deleteSavedView`); no UI yet.

### Moving records across columns

Drag and drop a card onto a column. Calls
`moveRecordToGroup(recordId, groupByKey, optionId)`. Writes `{ optionId }` to
the record's field; bumps `updatedAt`.

The "no value" column (records with no value for the `groupBy` field) is
**read-only**: you can drop *out* of it but not *into* it. Dropping into the
`__unstaged__` column is silently ignored.

### Filtering

Click `Filter` in the toolbar. A filter bar appears below. Each row is
`[field] [operator] [value]`. Operators per type are defined in `OPS_BY_TYPE`
in `pages/ObjectPage.tsx`. `is_empty` / `is_not_empty` hide the value input.

- Filters apply **live** — no Apply button.
- They stack with the search input: search is a fuzzy across-all-fields filter,
  the filter bar is per-field.
- A filter row with op needing a value but value === '' is **skipped**, not
  applied as "field equals empty string". For empty-checks, use `is_empty`.

### Persistence

Zustand `persist` middleware writes the entire data layer to `localStorage`
(`frontdesk-crm` key) on every state change. Hydrated on page load. Survives
refreshes within the same session. **We do not write to a server** — intentional
for the playground.

---

## AI proposals

Two kinds (`InboxProposal`):

### `field_update`

> "AI suggests setting Status = Active on Anika Rossi based on a call yesterday."

- Rendered inline on `RecordPage` as a chip below the relevant property row.
- Has `confidence` (0..1), `sourceQuote`, `currentValue`, `proposedValue`.
- **Accept** → writes the value; records provenance (source, quote, confidence,
  previousValue) into `record.aiWritten[fieldKey]`.
- **Reject** → marks proposal `rejected`; record unchanged.

### `new_variable`

> "AI noticed customers keep mentioning their dog's name. Want to track that?"

- Rendered as a banner at the top of the relevant `ObjectPage`.
- Has `suggestedName`, `suggestedKey`, `suggestedType`, `suggestedDescription`,
  evidence count, example quotes.
- **Accept** → creates a new property on the object schema with the AI-generated
  description as the prompt. Type comes from `suggestedType`.

### When proposals fire

Out of scope for the playground — proposals are seeded statically in
`data/seed.ts`. In production this would be triggered by ingestion of a
call/text/email; the AI would read each property's description as the prompt
and decide whether to fill an existing property (→ `field_update`) or propose
a new one (→ `new_variable`).

### Provenance

Any property value sourced from the AI has a `record.aiWritten[fieldKey]` entry
with `{ at, source, quote, confidence, previousValue, sourceActivityId? }`.
Surfaced via the sparkle icon next to the field on the record page — click for
a portal-rendered popover with revert / lock-field actions.

---

## Edge cases

| Scenario                                                        | Behavior                                                                                                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pick_list property is deleted                                   | All views grouped by it have their `groupBy` cleared and `layout` reset to `table`. Records lose that field entirely.                               |
| Pick_list option is deleted                                     | Records pointing at that option have their field set to `null`. Other options unaffected; order of remaining options preserved.                     |
| Column header rename (Board)                                    | Writes to `PickListOption.label`. Every record + every other view referencing the property re-renders with the new label.                           |
| Object has no pick_list properties                              | Board toggle disabled. If a view somehow has `layout: 'board'` with no `groupBy`, empty-state CTA renders.                                          |
| User creates a view, then changes layout                        | The change writes through to the view. No separate "draft" state.                                                                                   |
| Filter value === '' with op that needs a value                  | Filter is skipped (treated as unconfigured). Not applied as "equals empty string". Use `is_empty` for that.                                         |
| User on "All" (no view) switches to Board                       | Layout is held in page-local state. Lost on navigation away. To persist: save as a view.                                                            |
| Drop card on `__unstaged__` column                              | Silently ignored. Records can leave that column by being dragged into a real one, but cannot be put back into it from the UI.                       |
| Pinned view's groupBy property gets deleted later               | Auto-coerced to `layout: 'table'` (see "pick_list property deleted").                                                                               |
| LocalStorage shape changes between deploys                      | No migration yet. Bump `version` in the persist config and add a `migrate` fn when shape changes. Until then, treat localStorage as ephemeral.      |

---

## Stubbed surfaces (UI only, no behavior)

- `+ New customer` / `+ New deal` etc. — button renders, no creation form.
- `Sort` button in toolbar — placeholder.
- `+ Add object` in ObjectTabs — placeholder.
- Global search input in ObjectTabs (⌘K) — placeholder. The toolbar's record-filter search **is** wired.
- Bell / notifications icons — placeholder.
- Dummy app shell on the left — entirely visual; only "CRM" is interactive.
- Schema editor: `reorderSmartVariables` store action exists, no drag UI yet.
- Delete view: `deleteSavedView` store action exists, no UI yet.

---

## Code map

```
src/
├── lib/types.ts                    type definitions
├── store/useCrmStore.ts            single Zustand store, persisted
├── components/
│   ├── AppLayout.tsx               composes shell + ObjectTabs + outlet
│   ├── AppShellSidebar.tsx         dummy outer-app rail
│   ├── ObjectTabs.tsx              primary CRM nav (objects)
│   ├── Kanban.tsx                  Board layout; column-header inline edit; DnD
│   ├── SchemaEditorPanel.tsx       no-code property editor (slide-in panel)
│   ├── NewVariableBanner.tsx       new_variable proposal banner
│   ├── FieldUpdateChip.tsx         field_update proposal chip
│   └── ProvenancePopover.tsx       AI provenance, portal-rendered
├── pages/
│   ├── DashboardPage.tsx           CRM home / AI activity overview
│   ├── ObjectPage.tsx              view tabs, layout toggle, filters, save-as-view
│   └── RecordPage.tsx              record detail; provenance + chips
└── data/                            seed data
    ├── schemas.ts
    ├── seed.ts
    └── views.ts
```
