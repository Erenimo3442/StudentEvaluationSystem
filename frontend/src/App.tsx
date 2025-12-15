import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CourseDetail from './pages/CourseDetail'
import StudentDashboard from './pages/StudentDashboard'
import InstructorDashboard from './pages/InstructorDashboard'
import HeadDashboard from './pages/HeadDashboard'
import StudentCourses from './pages/StudentCourses'
import InstructorCourses from './pages/InstructorCourses'
import HeadCourses from './pages/HeadCourses'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        
        {/* Student routes */}
        <Route path="student" element={<StudentDashboard />} />
        <Route path="student/courses" element={<StudentCourses />} />
        <Route path="student/course/:id" element={<CourseDetail />} />
        
        {/* Instructor routes */}
        <Route path="instructor" element={<InstructorDashboard />} />
        <Route path="instructor/courses" element={<InstructorCourses />} />
        <Route path="instructor/course/:id" element={<CourseDetail />} />
        
        {/* Head routes */}
        <Route path="head" element={<HeadDashboard />} />
        <Route path="head/courses" element={<HeadCourses />} />
        <Route path="head/course/:id" element={<CourseDetail />} />
        
        {/* Legacy routes - redirect to role-specific routes */}
        <Route path="lecturer" element={<Navigate to="/instructor" replace />} />
        <Route path="course/:id" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
