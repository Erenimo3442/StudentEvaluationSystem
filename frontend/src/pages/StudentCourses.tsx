import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
  BookOpenIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { evaluationService } from '../services/api'
import { Enrollment } from '../types/index'

const StudentCourses = () => {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return
      
      try {
        const enrollmentsRes = await evaluationService.getEnrollments(user.id)
        // Handle paginated responses (data.results) or direct arrays
        const enrollmentsData = (enrollmentsRes.data as any).results || enrollmentsRes.data
        setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
      } catch (error) {
        console.error('Error fetching courses:', error)
        setEnrollments([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [user])

  const totalCredits = enrollments.reduce((sum, e) => sum + (e.course.credits || 0), 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 font-medium">Loading your courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">My Courses</h1>
          <p className="text-secondary-500 mt-1">Courses you are currently enrolled in</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-secondary-600">Total Credits</p>
            <p className="text-2xl font-bold text-primary-600">{totalCredits}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="flat" className="bg-primary-50 border-primary-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <BookOpenIcon className="h-8 w-8 text-primary-700" />
            </div>
            <div>
              <p className="text-sm text-secondary-600 font-medium">Active Courses</p>
              <p className="text-3xl font-bold text-primary-700">{enrollments.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="flat" className="bg-cyan-50 border-cyan-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <AcademicCapIcon className="h-8 w-8 text-cyan-700" />
            </div>
            <div>
              <p className="text-sm text-secondary-600 font-medium">Total Credits</p>
              <p className="text-3xl font-bold text-cyan-700">{totalCredits}</p>
            </div>
          </div>
        </Card>

        <Card variant="flat" className="bg-emerald-50 border-emerald-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <ChartBarIcon className="h-8 w-8 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm text-secondary-600 font-medium">Completed</p>
              <p className="text-3xl font-bold text-emerald-700">
                {enrollments.filter(e => e.grade).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Courses Grid */}
      {enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} variant="hover" className="group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {enrollment.course.code?.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                      {enrollment.course.code}
                    </h3>
                    <p className="text-xs text-secondary-500 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {enrollment.course.term?.name || 'Current Term'}
                    </p>
                  </div>
                </div>
                <Badge variant="primary" className="text-xs">
                  {enrollment.course.credits} CR
                </Badge>
              </div>
              
              <h4 className="font-medium text-secondary-900 mb-3 line-clamp-2">
                {enrollment.course.name}
              </h4>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-secondary-600">
                  <UserIcon className="h-4 w-4 mr-2" />
                  {enrollment.course.lecturer 
                    ? `${enrollment.course.lecturer.first_name} ${enrollment.course.lecturer.last_name}`
                    : 'Not assigned'
                  }
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {enrollment.course.credits} credits
                </div>
              </div>
              
              {enrollment.grade ? (
                <div className="mt-4 pt-4 border-t border-secondary-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Final Grade</span>
                    <Badge variant="success">{enrollment.grade}</Badge>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-secondary-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Status</span>
                    <Badge variant="info">In Progress</Badge>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <BookOpenIcon className="h-16 w-16 mx-auto mb-4 text-secondary-300" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No courses enrolled</h3>
          <p className="text-secondary-500">You haven't enrolled in any courses yet.</p>
        </Card>
      )}
    </div>
  )
}

export default StudentCourses
