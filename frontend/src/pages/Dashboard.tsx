import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import GuestDashboard from './GuestDashboard'

const Dashboard = () => {
  const { user } = useAuth()

  if (!user) {
    return <GuestDashboard />
  }

  const getRoleBasedDashboard = () => {
    switch (user.role) {
      case 'student':
        return <Navigate to="/student" replace />
      case 'lecturer':
        return <Navigate to="/lecturer" replace />
      case 'head':
        return <Navigate to="/head" replace />
      default:
        return <Navigate to="/login" replace />
    }
  }

  return (
    <div>
      {getRoleBasedDashboard()}
    </div>
  )
}

export default Dashboard
