import type { Activity, InboxProposal, Record_ } from '@/lib/types'

// ============================================================================
// Seed data. Hand-authored + programmatic. Values are realistic and varied
// so the UI never looks fake. Edge cases included: missing fields, long names,
// recent AI updates with provenance.
// ============================================================================

const FIRST_NAMES = [
  'Andraisa', 'John', 'Lou', 'Scott', 'Brian', 'Marco', 'Ben', 'Ruchir',
  'Priya', 'Kenji', 'Sofia', 'Amara', 'Dmitri', 'Yuki', 'Fatima', 'Luca',
  'Elena', 'Malik', 'Chen', 'Aditi', 'Tomas', 'Nadia', 'Oskar', 'Maya',
  'Ravi', 'Zara', 'Hiroshi', 'Isabela', 'Marcus', 'Anika', 'Diego', 'Leilani',
  'Arjun', 'Mei', 'Rafael', 'Tariq', 'Noa', 'Lars', 'Ingrid', 'Pablo',
  'Asha', 'Felix', 'Rania', 'Theo', 'Viv', 'Wren', 'Xiu', 'Yara', 'Zane',
]

const LAST_NAMES = [
  'Landa', 'Riley', 'Gargiulo', 'Cruze', 'Payne', 'Vartanian', 'Holding',
  'Baronia', 'Chen', 'Patel', 'Nakamura', 'Okonkwo', 'Volkov', 'Silva',
  'Martinez', 'Hassan', 'Rossi', 'Petrov', 'Kim', 'Singh', 'Novak', 'Reyes',
  'Berg', 'Haidari', 'Kowalski', 'Tanaka', 'Adeyemi', 'Moreno', 'Dubois',
  'Schmidt', 'Andersen', 'Rahimi', 'Alvarez', 'Nguyen', 'Okafor', 'Larsen',
]

const COMPANIES = [
  'Veritas Property Management',
  'Acme Realty',
  'Northwind Holdings',
  'Cascade Ventures',
  'Harbor & Crest',
  'Bluebird Capital',
  'Meridian Group',
  'Evergreen Partners',
  'Summit Residential',
  'Linden Equity',
  'Porter & Co',
  'Westbrook Estates',
  'Prairie Housing Trust',
  'Redline Logistics',
  'Arcadia Studios',
  'Foxfire Analytics',
  'Juniper Health',
  'Solstice Financial',
  'Tidepool Software',
  'Granite State Advisors',
]

const CITIES = [
  'Atlanta', 'Exeter', 'Salt Lake City', 'Newport Beach', 'Fort Lauderdale',
  'Seattle', 'Boston', 'Austin', 'Denver', 'Portland', 'Brooklyn', 'Miami',
  'Chicago', 'San Francisco', 'Nashville', 'Providence', 'Minneapolis',
  'Charleston', 'Asheville', 'Burlington',
]

const COLORS_LIKED = ['blue', 'forest green', 'burgundy', 'navy', 'charcoal', 'ivory']

// Deterministic PRNG so seed is stable
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(42)
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const maybe = (prob: number) => rand() < prob

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function hoursAgo(n: number): string {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

// ----- CUSTOMERS -----
function genCustomers(count: number): Record_[] {
  const records: Record_[] = []
  const statusOptions = ['opt_new', 'opt_qualified', 'opt_active', 'opt_dormant', 'opt_churned']
  const tierOptions = ['opt_t1', 'opt_t2', 'opt_t3']

  for (let i = 0; i < count; i++) {
    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    const name = `${first} ${last}`
    const company = maybe(0.85) ? pick(COMPANIES) : null
    const createdDaysAgo = Math.floor(rand() * 200) + 1
    const updatedDaysAgo = Math.floor(rand() * createdDaysAgo)

    const fields: Record_['fields'] = {
      name,
      phone: `+1 (${200 + Math.floor(rand() * 799)}) ${100 + Math.floor(rand() * 899)}-${1000 + Math.floor(rand() * 8999)}`,
      email: maybe(0.9)
        ? `${first.toLowerCase()}.${last.toLowerCase()}@${(company ?? 'example').toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}.com`
        : null,
      status: { optionId: pick(statusOptions) },
      tier: maybe(0.7) ? { optionId: pick(tierOptions) } : null,
      company,
      annual_revenue: maybe(0.6) ? Math.floor(rand() * 50_000_000) + 500_000 : null,
      employees: maybe(0.7) ? Math.floor(rand() * 500) + 5 : null,
      city: maybe(0.85) ? pick(CITIES) : null,
      is_decision_maker: maybe(0.7) ? maybe(0.55) : null,
      favorite_color: maybe(0.25) ? pick(COLORS_LIKED) : null,
      birthday: maybe(0.3)
        ? new Date(1960 + Math.floor(rand() * 40), Math.floor(rand() * 12), Math.floor(rand() * 28) + 1).toISOString()
        : null,
    }

    const aiWritten: Record_['aiWritten'] = {}
    if (fields.favorite_color) {
      aiWritten.favorite_color = {
        at: hoursAgo(Math.floor(rand() * 72)),
        source: 'Call · inbound, pricing discussion',
        quote: `…I was just telling my wife, we should repaint the office — maybe ${fields.favorite_color}.`,
        confidence: 0.72 + rand() * 0.22,
        previousValue: null,
      }
    }
    if (fields.is_decision_maker === true) {
      aiWritten.is_decision_maker = {
        at: hoursAgo(Math.floor(rand() * 120)),
        source: 'Email · contract questions',
        quote: 'I sign off on vendor contracts for our team.',
        confidence: 0.88 + rand() * 0.1,
        previousValue: null,
      }
    }
    if (fields.status) {
      aiWritten.status = {
        at: daysAgo(Math.floor(rand() * 14)),
        source: 'Call · latest follow-up',
        confidence: 0.75 + rand() * 0.2,
      }
    }

    records.push({
      id: `cust_${i.toString().padStart(4, '0')}`,
      objectKey: 'customer',
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(updatedDaysAgo),
      fields,
      aiWritten,
    })
  }

  // One intentionally sparse record to test empty states
  records.push({
    id: 'cust_sparse',
    objectKey: 'customer',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    fields: {
      name: 'Unknown Caller',
      phone: '+1 (555) 867-5309',
    },
  })

  return records
}

// ----- DEALS -----
function genDeals(count: number, customerIds: string[]): Record_[] {
  const records: Record_[] = []
  const stageOpts = ['opt_s1', 'opt_s2', 'opt_s3', 'opt_s4', 'opt_s5', 'opt_s6']
  const srcOpts = ['opt_src_inbound', 'opt_src_outbound', 'opt_src_referral', 'opt_src_event']
  const dealTitles = [
    'Annual contract renewal',
    'Q2 expansion',
    'Platform upgrade',
    'Multi-year license',
    'Pilot program',
    'Strategic partnership',
    'Enterprise rollout',
    'Premium add-on',
    'Professional services engagement',
    'White-label integration',
  ]

  for (let i = 0; i < count; i++) {
    const customerId = pick(customerIds)
    const createdDaysAgo = Math.floor(rand() * 120) + 1
    const closeInDays = Math.floor(rand() * 90) - 10

    records.push({
      id: `deal_${i.toString().padStart(4, '0')}`,
      objectKey: 'deal',
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(Math.floor(rand() * createdDaysAgo)),
      fields: {
        name: pick(dealTitles),
        stage: { optionId: pick(stageOpts) },
        amount: Math.floor(rand() * 500_000) + 5_000,
        close_date: new Date(Date.now() + closeInDays * 86400000).toISOString(),
        source: { optionId: pick(srcOpts) },
      },
      links: [{ objectKey: 'customer', recordId: customerId }],
    })
  }
  return records
}

// ----- PROPERTIES -----
function genProperties(count: number, customerIds: string[]): Record_[] {
  const records: Record_[] = []
  const typeOpts = ['opt_p_single', 'opt_p_multi', 'opt_p_condo', 'opt_p_comm']
  const statusOpts = ['opt_ls_active', 'opt_ls_pending', 'opt_ls_sold', 'opt_ls_off']
  const streets = [
    'Maple St', 'Oak Ave', 'Birch Ln', 'Cedar Ct', 'Elm Dr', 'Park Blvd',
    'Sunset Way', 'Lakeview Rd', 'Summit Pl', 'Harbor Cir',
  ]

  for (let i = 0; i < count; i++) {
    const num = Math.floor(rand() * 9000) + 100
    const createdDaysAgo = Math.floor(rand() * 150) + 1

    records.push({
      id: `prop_${i.toString().padStart(4, '0')}`,
      objectKey: 'property',
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(Math.floor(rand() * createdDaysAgo)),
      fields: {
        address: `${num} ${pick(streets)}, ${pick(CITIES)}`,
        type: { optionId: pick(typeOpts) },
        listing_status: { optionId: pick(statusOpts) },
        price: Math.floor(rand() * 2_000_000) + 200_000,
        bedrooms: Math.floor(rand() * 5) + 1,
        bathrooms: Math.floor(rand() * 4) + 1,
        square_feet: Math.floor(rand() * 4000) + 600,
      },
      links: maybe(0.7)
        ? [{ objectKey: 'customer', recordId: pick(customerIds) }]
        : [],
    })
  }
  return records
}

// ----- ACTIVITIES -----
function genActivities(customers: Record_[]): Activity[] {
  const activities: Activity[] = []
  const types: Activity['type'][] = ['call', 'text', 'email', 'chatbot']
  const summaries: Record<Activity['type'], string[]> = {
    call: [
      'Inbound call — discussed pricing',
      'Outbound call — follow-up on proposal',
      'Missed call',
      'Inbound call — left voicemail',
      'Scheduled a demo',
    ],
    text: [
      'Replied to SMS about meeting time',
      'Texted link to proposal',
      'Confirmed appointment',
    ],
    email: [
      'Sent proposal draft',
      'Reply: questions about contract',
      'Follow-up email',
    ],
    chatbot: ['Chatbot captured intent to buy', 'Chatbot answered FAQ'],
    ai_update: [],
    note: [],
  }

  for (const c of customers.slice(0, 40)) {
    const n = Math.floor(rand() * 6) + 1
    for (let i = 0; i < n; i++) {
      const t = pick(types)
      activities.push({
        id: `act_${c.id}_${i}`,
        recordId: c.id,
        type: t,
        at: daysAgo(Math.floor(rand() * 60)),
        summary: pick(summaries[t]),
      })
    }
  }

  return activities.sort((a, b) => (a.at < b.at ? 1 : -1))
}

// ----- INBOX PROPOSALS -----
function genProposals(customers: Record_[]): InboxProposal[] {
  const proposals: InboxProposal[] = []

  // Field update proposals
  const samples = customers.slice(0, 12)
  samples.forEach((c, i) => {
    proposals.push({
      id: `prop_field_${i}`,
      kind: 'field_update',
      createdAt: hoursAgo(Math.floor(rand() * 48)),
      recordId: c.id,
      objectKey: 'customer',
      fieldKey: 'favorite_color',
      currentValue: (c.fields.favorite_color as string) ?? null,
      proposedValue: pick(COLORS_LIKED),
      reason: 'Mentioned preference during recent call',
      sourceQuote: 'I\'ve always been partial to a deep navy on the walls — classy.',
      confidence: 0.68 + rand() * 0.25,
      status: 'pending',
    })
  })

  customers.slice(12, 20).forEach((c, i) => {
    proposals.push({
      id: `prop_tier_${i}`,
      kind: 'field_update',
      createdAt: hoursAgo(Math.floor(rand() * 24)),
      recordId: c.id,
      objectKey: 'customer',
      fieldKey: 'tier',
      currentValue: null,
      proposedValue: { optionId: 'opt_t1' },
      reason: 'Annual revenue and headcount suggest Enterprise tier',
      confidence: 0.81 + rand() * 0.15,
      status: 'pending',
    })
  })

  // New variable proposals
  proposals.push({
    id: 'prop_var_pet',
    kind: 'new_variable',
    createdAt: hoursAgo(3),
    objectKey: 'customer',
    suggestedKey: 'pet_name',
    suggestedName: 'Pet name',
    suggestedType: 'text',
    suggestedDescription:
      "The name of the customer's pet, if they mention one. A small personal touch that helps build rapport.",
    evidenceCount: 18,
    exampleQuotes: [
      '…my dog Biscuit was barking the whole time on the last call.',
      'Had to step away — Miso knocked over the plant again.',
      'Oh, that\'s just Theo, my cat. Don\'t mind him.',
    ],
    status: 'pending',
  })

  proposals.push({
    id: 'prop_var_industry',
    kind: 'new_variable',
    createdAt: hoursAgo(14),
    objectKey: 'customer',
    suggestedKey: 'industry',
    suggestedName: 'Industry',
    suggestedType: 'pick_list',
    suggestedDescription:
      'The industry the customer operates in. Infer from company name and conversation context.',
    evidenceCount: 47,
    exampleQuotes: [
      'We run a logistics platform for last-mile delivery.',
      '…in the restaurant space, margins are tight.',
      'Healthcare compliance is the trickiest part of our build.',
    ],
    status: 'pending',
  })

  proposals.push({
    id: 'prop_var_timezone',
    kind: 'new_variable',
    createdAt: hoursAgo(22),
    objectKey: 'customer',
    suggestedKey: 'timezone',
    suggestedName: 'Timezone',
    suggestedType: 'text',
    suggestedDescription:
      'The timezone the customer operates in. Useful for scheduling and message timing.',
    evidenceCount: 31,
    exampleQuotes: [
      "I'm on Pacific time — anything after 5 my time is too late.",
      'We operate out of London, so mornings are best for us.',
    ],
    status: 'pending',
  })

  return proposals.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

// ----- BUILD -----
const customers = genCustomers(120)
const customerIds = customers.map((c) => c.id)
const deals = genDeals(34, customerIds)
const properties = genProperties(42, customerIds)
const activities = genActivities(customers)
const proposals = genProposals(customers)

export const SEED = {
  records: [...customers, ...deals, ...properties],
  activities,
  proposals,
}
