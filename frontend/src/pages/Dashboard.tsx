import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

const Dashboard = () => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
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
