import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { seedData } from './db/seed'
import Login from './pages/Login'
import PatientList from './pages/PatientList'
import VisitForm from './pages/VisitForm'
import RiskAlert from './pages/RiskAlert'
import DueList from './pages/DueList'
import TabBar from './components/TabBar'

function App() {
  const location = useLocation();
  const hideTabBar = location.pathname === '/login' || location.pathname === '/alert';

  useEffect(() => {
    seedData().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col relative">
      <div className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/visit/new" element={<VisitForm />} />
          <Route path="/alert" element={<RiskAlert />} />
          <Route path="/due" element={<DueList />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
      {!hideTabBar && <TabBar />}
    </div>
  )
}

export default App
