import { Outlet } from 'react-router-dom'
import { AppShellSidebar } from '@/components/AppShellSidebar'
import { ObjectTabs } from '@/components/ObjectTabs'

export function AppLayout() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Dummy "outer app" sidebar — the CRM lives inside a bigger product */}
      <AppShellSidebar />

      {/* CRM surface */}
      <main className="flex min-w-0 flex-1 flex-col">
        <ObjectTabs />
        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
