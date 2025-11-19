import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CourseDetail from './pages/CourseDetail'
import StudentDashboard from './pages/StudentDashboard'
import LecturerDashboard from './pages/LecturerDashboard'
import HeadDashboard from './pages/HeadDashboard'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout><div></div></Layout>}>
        <Route index element={<Dashboard />} />
        <Route path="student" element={<StudentDashboard />} />
        <Route path="lecturer" element={<LecturerDashboard />} />
        <Route path="head" element={<HeadDashboard />} />
        <Route path="course/:id" element={<CourseDetail />} />
      </Route>
    </Routes>
  )
}

export default App
