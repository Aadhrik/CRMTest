# Frontdesk CRM — UI / UX Spec

> This repo is a **UI demo**, not a technical spec. The production CRM has its
> own stack, data model, and backend. Treat this doc + the running app as
> guidance for how the surface should *look, work, and move* — not how to
> implement it.

The intent of the demo is to show:

- The visual layout and information density we want
- The interaction model (especially around pipelines, views, and pick-lists)
- The AI integration pattern (proposals + provenance)
- The edge cases that matter to users

---

## Mental model

Three concepts. That's it.

| Concept       | What it is                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **Object**    | A type of record. Default is Customer; users can add more (Deal, Property, etc.).                   |
| **Property**  | A typed field on an object (text, number, pick-list, yes/no, date). Each has a description.        |
| **View**      | A saved lens over an object: a layout (table or board) + optional grouping + filters + sort.       |

**There is no separate "Pipeline" concept.** A pipeline is just a Board-layout
View grouped by a pick-list property. The columns of the board *are* the
options of that pick-list.

This collapse is intentional. It means:

- Creating a "new pipeline" = creating a new View with Board layout.
- Renaming a stage in a pipeline = renaming a pick-list option on the property.
- Moving a card across stages = changing that record's pick-list value.
- The same view flips to Table layout without losing any data.
- The same property can back multiple pipelines (different filters / sort).

If anyone proposes adding a separate Pipelines feature: stop. They're views.

### Property descriptions are AI prompts

When you describe a property ("The customer's favorite color, if mentioned in
conversation"), that description is what the AI reads to decide what to extract
from calls / texts / emails. There is no separate prompt field. We label it
"AI prompt" in the schema editor to make this explicit.

---

## Surface layout

```
┌────┬──────────────────────────────────────────────────────────┐
│    │  Home  Customers  Deals  Properties   +     [Search ⌘K]  │  ← Object tabs
│    ├──────────────────────────────────────────────────────────┤
│    │                                                          │
│ A  │  [page content]                                          │
│ p  │                                                          │
│ p  │                                                          │
│    │                                                          │
│    │                                                          │
└────┴──────────────────────────────────────────────────────────┘
```

- **Outer app rail** (left, dark, narrow): simulates the CRM living inside a
  larger product. In production this is whatever the real product's chrome is.
  In the demo it's a dummy nav (Inbox / Calendar / **CRM** / Tasks / Reports /
  Files / Notifications / Settings) with only "CRM" interactive.
- **Object tabs** (top): primary CRM navigation. One tab per object, plus a
  "Home" tab and a `+` to add new objects. Counts shown next to the tab name.
  This is how users switch between Customers / Deals / Properties.
- **Page content**: object pages, record pages, the home overview.

The constraint we're designing for: **no luxury of a wide left sidebar** for
CRM-internal nav, because that real estate belongs to the host app.

---

## Object pages

Inside an object (e.g. `/Customers`), the toolbar has, from left to right:

1. **View tabs** — All, then each saved view, then a `+` to create a new one.
2. **Layout toggle** — Table / Board.
3. **Group by selector** — only shown when Board is active.
4. **Search input** — fuzzy filter across all fields of the current view.
5. **Filter / Sort / Properties / + New record** — secondary actions.

Below the toolbar: the records, rendered as either a Table or a Board.

### Switching layouts

- **If a view is active**: changing layout writes to the view. The view *is*
  the live state — there's no "Save" button. Reopening the view later restores
  exactly this configuration.
- **If on "All" (no view)**: layout is held in page-local state and lost on
  navigation. To persist, save it as a view.

When switching to Board with no group-by yet, default to the first pick-list
property on the object. If the object has no pick-list properties, the Board
toggle is **disabled** with a tooltip ("Needs a pick-list property") and a CTA
in the empty state to add one.

---

## Views

### Creating a view ("new pipeline")

1. Click `+` in the view tabs strip.
2. The `+` becomes an inline name input (autofocused).
3. Type a name, press Enter. Escape cancels.
4. The new view is created with the current layout, group-by, and filters
   baked in. The view tab activates immediately.

Pinned by default — pinned views also surface on the Home page.

### Editing a view

There is no edit dialog. The view is the live state:

- Switch layout → saves to the view.
- Change group-by → saves to the view.
- Add/edit/remove filters → saves to the view.
- Rename a column header (Board) → renames the underlying pick-list option.

### "Save as view" from filters

When the filter bar has at least one configured filter, a primary "Save as
view" button appears next to "+ Add filter". Clicking it triggers the same
inline-name flow as `+`, but the resulting view *also* has those filters
baked in. Reopening the view later restores them.

---

## Pipelines (Board views)

A Board view has one column per pick-list option (in option order). Each card
is a record, dragged into the column matching its current pick-list value.

### Column headers

- Display the option label, color dot, count of cards, and (for objects with
  amount/price) a column total.
- **Click a header to rename** — it becomes an inline input. Enter to commit,
  Escape to cancel. Renaming writes to the pick-list option, so:
  - Every other view grouped by this property updates instantly.
  - Every record in the column re-renders with the new label on its badge.
  - The change persists like any other property edit.

### "No value" column

If any record has no value for the group-by field, a final column appears
labeled "No \<property\>" (e.g. "No status"). It exists so those records are
still visible.

- You can drag *out* of it (record gets a value).
- You **cannot** drag *into* it. Drops onto this column are silently ignored.
  To clear a record's value, edit the field on the record page directly.

### Moving cards

Drag and drop. As soon as the card lands in a new column, the record's
pick-list value is updated. The card animates into place and the activity
feed on the record gets a "Stage changed" entry.

### Cards

Each card shows: the primary identifier (avatar + name for people, icon for
others), up to 3 secondary fields with values, a sparkle icon if any field on
the record is AI-written, link count, and last-updated date. Clicking the
card opens the full record page.

---

## Filtering

Click **Filter** in the toolbar. A filter bar slides in below.

Each filter row is `[field] [operator] [value]`:

- **Field**: any property on the object.
- **Operator**: depends on the field type. For text: contains, is, is not,
  is empty, is not empty. For number: =, ≠, >, <, is empty, is not empty.
  For pick-list: is, is not, is empty, is not empty. Etc.
- **Value**: typed appropriately. For pick-list, a dropdown of the actual
  options. For yes/no, a Yes/No dropdown. For date, a date picker.
  For "is empty" / "is not empty" operators, the value input is hidden.

Filters apply **live** — no Apply button. The Filter button in the toolbar
shows a count badge of active filters.

A row whose value is blank (and whose operator needs a value) is silently
**skipped**, not applied as "= empty string". Use "is empty" to match empty.

Filters and search stack: search is the fuzzy across-all-fields box; filter
rows are per-field constraints. Both apply.

---

## Property editing (schema editor)

Click **Properties** in the object's toolbar. A side panel slides in from the
right.

- Lists every property on the object: name, type badge, description preview.
- Click any property to expand it inline:
  - Rename
  - Edit description (labeled "AI PROMPT" — make this explicit)
  - For pick-list: add / rename / recolor / delete options inline
  - Toggles: AI-managed, Pinned, Required, Locked
  - Delete property
- Bottom of the list: "+ Add property" expands an inline form (name, type,
  description with the same AI PROMPT label).

Renames and deletes cascade — see Edge cases.

---

## Records

The record page (clicking a row or card) shows:

- **Left rail**: the property values, grouped (Properties, Details, etc.).
  Each property has a sparkle icon if the value is AI-written — click for
  provenance (see below).
- **Center**: activity feed (calls, texts, emails, AI updates) with filter
  tabs. Each entry shows source, time, summary; AI updates show before/after.
- **Right rail**: linked records.

### AI proposals on a record

If the AI has a pending suggestion for a field on this record, a chip renders
inline below the field's row:

> ✨ AI suggests **blue** · Why? · Dismiss · Accept

- Why? expands to show: confidence %, source quote, reason.
- Accept writes the value and records provenance.
- Dismiss removes the chip; the record is unchanged.

### Provenance

Click the sparkle next to any AI-written value:

- Source ("Call · pricing discussion, 3w ago")
- Confidence bar (color-coded: green ≥ 80%, accent ≥ 60%, amber otherwise)
- Quote that drove the inference
- Previous value (if any)
- Actions: **Revert** (restore previous value) and **Lock field** (prevent
  AI from rewriting it in the future).

The popover floats over the page (renders to body) so it can extend past the
property rail's edge. Don't clip it inside the rail.

---

## "New property" proposals (object level)

When the AI sees a pattern that no existing property captures (e.g. customers
keep mentioning their dog's name), a banner appears at the top of the object
page:

> AI wants to track **N new properties** on Customers · based on patterns in recent conversations
> [card: Pet name · TEXT · "The name of the customer's pet, if they mention one." · 18 evidence · Why? · Dismiss · Add]

- Each card shows the proposed name, type, description (will be the AI prompt),
  evidence count, and a Why? expand for example quotes.
- **Add** creates the property on the object schema.
- **Dismiss** removes the proposal.
- The whole banner can be collapsed.

---

## Home

The home page is a CRM-level overview, not a navigation surface. It shows:

- **Greeting** (timestamp-aware).
- **Objects** grid: one card per object with record count, property count
  (with sparkle icon to imply AI-aware), and description.
- **Pinned views** grid: cards linking to each pinned view across objects.
- **AI activity** stat strip: pending field updates, new properties proposed,
  calls logged this week, AI-written fields total.

In production this might also include team-level activity, recent records
edited, or whatever the host app surfaces.

---

## Edge cases

| Scenario                                                   | Expected UX                                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| User deletes a pick-list property                          | Any view grouped by it auto-resets to Table layout. Records lose that field. No confirmation lost; deletion is a property-level action.    |
| User deletes a pick-list option                            | Records pointing at that option get their field cleared (null). Other options unaffected; column disappears from any board view.           |
| User renames a column header                               | Affects every record + every view referencing that property. Single source of truth.                                                       |
| Object has zero pick-list properties                       | Board layout disabled with tooltip. CTA in empty state to add a pick-list property.                                                        |
| User sets up a filter, then changes the field              | Operator resets to the default for the new field type; value clears. Don't try to coerce values across types.                              |
| Filter row value is blank and op needs a value             | Filter is skipped silently. Don't apply as "= empty string". Use "is empty" for that.                                                      |
| User on "All" switches layout                              | Held in local state, lost on navigation. Save as a view to persist.                                                                        |
| User creates view, then immediately changes it             | Changes write through. There's no "draft" or unsaved state.                                                                                |
| User accepts an AI field update                            | Value writes; sparkle appears next to the field; provenance popover shows source/quote/confidence/previous value, with Revert + Lock.      |
| User locks a field                                         | The AI never rewrites that value. Surfaced visually (small lock icon next to the sparkle).                                                 |
| User opens a board view but the group-by property was deleted earlier | The view has already been auto-coerced to Table. They land in Table layout.                                                       |

---

## What's intentionally not in the demo

These are placeholders to indicate "this should exist in production" without
building the full flow. Don't read too much into the absence of behavior:

- **+ New customer / + New deal** — button only; the creation form is real-product territory.
- **Sort** button — placeholder.
- **+ Add object** in object tabs — placeholder.
- **Global search** in the top tab strip (⌘K) — placeholder. The toolbar's
  record-filter search **is** wired and shows the intended fuzzy behavior.
- **Notifications bell** — placeholder.
- The **dummy app rail** on the left — entirely visual. Only "CRM" is interactive.
- **Delete view** — flow not designed yet; please add via right-click on a view tab or a kebab in the view tab.
- **Reorder properties** in the schema editor — drag handles not built; design needed.

---

## Persistence note

The demo persists state in the browser's localStorage so the playground
survives refreshes. **This is not the prescription** — production should
persist to whatever the real CRM persists to. The point of the demo's
persistence is just to show that all these edits (renaming a stage, creating
a view, accepting an AI suggestion) are real state mutations and should
behave accordingly in the real product.
