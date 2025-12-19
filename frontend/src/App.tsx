import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import StudentLayout from './components/StudentLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CourseDetail from './pages/CourseDetail'
import StudentDashboard from './pages/StudentDashboard'
import StudentCourseDetail from './pages/StudentCourseDetail'
import InstructorDashboard from './pages/InstructorDashboard'
import HeadDashboard from './pages/HeadDashboard'
import StudentCourses from './pages/StudentCourses'
import InstructorCourses from './pages/InstructorCourses'
import HeadCourses from './pages/HeadCourses'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Student routes with custom layout */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="courses/:id" element={<StudentCourseDetail />} />
      </Route>
      
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
      </Route>

      {/* Instructor routes - consistent nested structure */}
      <Route path="/instructor" element={<Layout showOnlyCoreItems={true} />}>
        <Route index element={<InstructorDashboard />} />
        <Route path="courses" element={<InstructorCourses />} />
      </Route>
      <Route path="/instructor/course/:id" element={<Layout showOnlyCoreItems={false} />}>
        <Route index element={<CourseDetail />} />
      </Route>

      {/* Head routes - consistent nested structure */}
      <Route path="/head" element={<Layout showOnlyCoreItems={true} />}>
        <Route index element={<HeadDashboard />} />
        <Route path="courses" element={<HeadCourses />} />
      </Route>
      <Route path="/head/course/:id" element={<Layout showOnlyCoreItems={false} />}>
        <Route index element={<CourseDetail />} />
      </Route>

      {/* Legacy routes - redirect to role-specific routes */}
      <Route path="/lecturer" element={<Navigate to="/instructor" replace />} />
      <Route path="/course/:id" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
