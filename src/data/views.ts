import type { SavedView } from '@/lib/types'

// Seeded saved views. These replace the old Pipeline concept — a pipeline is
// just a Board-layout view grouped by a pick-list smart variable. Pinned views
// surface in the sidebar beneath their parent object.
export const SEED_VIEWS: SavedView[] = [
  {
    id: 'view_sales_pipeline',
    objectKey: 'deal',
    name: 'Sales Pipeline',
    layout: 'board',
    groupBy: 'stage',
    icon: 'GitBranch',
    color: '#10B981',
    pinned: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'view_customer_lifecycle',
    objectKey: 'customer',
    name: 'Customer Lifecycle',
    layout: 'board',
    groupBy: 'status',
    icon: 'Waypoints',
    color: '#5B5BF5',
    pinned: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'view_listings_by_status',
    objectKey: 'property',
    name: 'Listings by Status',
    layout: 'board',
    groupBy: 'listing_status',
    icon: 'Home',
    color: '#F59E0B',
    pinned: true,
    createdAt: new Date().toISOString(),
  },
]
