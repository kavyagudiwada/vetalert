import { Navigate, createBrowserRouter } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import type { ReactNode } from 'react'
import type { UserRole } from './types'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import FarmerDashboard from './pages/dashboards/FarmerDashboard'
import VetDashboard from './pages/dashboards/VetDashboard'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ReportSymptom from './pages/symptoms/ReportSymptom'
import ReportList from './pages/symptoms/ReportList'
import ReportDetail from './pages/symptoms/ReportDetail'
import AnimalList from './pages/animals/AnimalList'
import AnimalDetail from './pages/animals/AnimalDetail'
import RegisterAnimal from './pages/animals/RegisterAnimal'
import DiseaseList from './pages/diseases/DiseaseList'
import DiseaseDetail from './pages/diseases/DiseaseDetail'
import AlertList from './pages/alerts/AlertList'
import CreateAlert from './pages/alerts/CreateAlert'
import VaccinationSchedule from './pages/vaccinations/VaccinationSchedule'
import VaccinationRecords from './pages/vaccinations/VaccinationRecords'
import LabSamples from './pages/labs/LabSamples'
import OutbreakTracker from './pages/outbreaks/OutbreakTracker'
import WeatherRisk from './pages/weather/WeatherRisk'
import Settings from './pages/settings/Settings'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function RoleHome() {
  const role = useAuthStore((state) => state.user?.role) ?? 'farmer'

  if (role === 'farmer') return <FarmerDashboard />
  if (role === 'veterinarian') return <VetDashboard />
  return <Dashboard />
}

export function RoleRoute({
  children,
  roles,
}: {
  children: ReactNode
  roles: UserRole[]
}) {
  const role = useAuthStore((state) => state.user?.role)

  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const ALL_ROLES: UserRole[] = ['farmer', 'veterinarian', 'government_official', 'hospital_admin']
const VET_STAFF: UserRole[] = ['veterinarian', 'government_official', 'hospital_admin']
const OFFICIAL_ONLY: UserRole[] = ['government_official']

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleHome /> },
      { path: 'reports', element: <RoleRoute roles={ALL_ROLES}><ReportList /></RoleRoute> },
      { path: 'reports/new', element: <RoleRoute roles={ALL_ROLES}><ReportSymptom /></RoleRoute> },
      { path: 'reports/:id', element: <RoleRoute roles={ALL_ROLES}><ReportDetail /></RoleRoute> },
      { path: 'animals', element: <RoleRoute roles={ALL_ROLES}><AnimalList /></RoleRoute> },
      { path: 'animals/new', element: <RoleRoute roles={ALL_ROLES}><RegisterAnimal /></RoleRoute> },
      { path: 'animals/:id', element: <RoleRoute roles={ALL_ROLES}><AnimalDetail /></RoleRoute> },
      { path: 'diseases', element: <RoleRoute roles={ALL_ROLES}><DiseaseList /></RoleRoute> },
      { path: 'diseases/:id', element: <RoleRoute roles={ALL_ROLES}><DiseaseDetail /></RoleRoute> },
      { path: 'alerts', element: <RoleRoute roles={ALL_ROLES}><AlertList /></RoleRoute> },
      { path: 'alerts/new', element: <RoleRoute roles={OFFICIAL_ONLY}><CreateAlert /></RoleRoute> },
      { path: 'vaccinations', element: <RoleRoute roles={VET_STAFF}><VaccinationSchedule /></RoleRoute> },
      { path: 'vaccinations/records', element: <RoleRoute roles={VET_STAFF}><VaccinationRecords /></RoleRoute> },
      { path: 'labs', element: <RoleRoute roles={VET_STAFF}><LabSamples /></RoleRoute> },
      { path: 'outbreaks', element: <RoleRoute roles={VET_STAFF}><OutbreakTracker /></RoleRoute> },
      { path: 'weather', element: <RoleRoute roles={ALL_ROLES}><WeatherRisk /></RoleRoute> },
      { path: 'settings', element: <RoleRoute roles={ALL_ROLES}><Settings /></RoleRoute> },
    ],
  },
])

export default function App() {
  return null
}