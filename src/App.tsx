import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { ObjectPage } from '@/pages/ObjectPage'
import { RecordPage } from '@/pages/RecordPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/o/:objectKey" element={<ObjectPage />} />
        <Route path="/o/:objectKey/:recordId" element={<RecordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
