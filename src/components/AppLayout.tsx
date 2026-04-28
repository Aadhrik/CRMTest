import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

export function AppLayout() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
