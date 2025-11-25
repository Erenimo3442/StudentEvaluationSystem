import React, { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { ChartWidget } from '../components/ui/ChartWidget'
import {
  ArrowUpTrayIcon,
  DocumentChartBarIcon,
  AcademicCapIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { coreService } from '../services/api'
import { Course } from '../types/index'

const LecturerDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await coreService.getCourses()
        setCourses(coursesRes.data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Mock data for Grade Distribution (replace with real API call later)
  const gradeDistribution = {
    series: [{
      name: 'Students',
      data: [5, 12, 25, 15, 8, 3]
    }],
    options: {
      xaxis: {
        categories: ['A', 'B', 'C', 'D', 'E', 'F']
      },
      colors: ['#8b5cf6']
    }
  }

  // Mock data for Outcome Achievement (replace with real API call later)
  const outcomeAchievement = {
    series: [{
      name: 'Achievement Rate',
      data: [85, 78, 92, 65, 88]
    }],
    options: {
      xaxis: {
        categories: ['LO1', 'LO2', 'LO3', 'LO4', 'LO5']
      },
      colors: ['#2563eb']
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="flat" className="bg-white border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <UsersIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600 font-medium">Total Students</p>
              <p className="text-3xl font-bold text-secondary-900">145</p>
            </div>
          </div>
        </Card>
        <Card variant="flat" className="bg-white border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-violet-100 rounded-xl">
              <AcademicCapIcon className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600 font-medium">Active Courses</p>
              <p className="text-3xl font-bold text-secondary-900">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="flat" className="bg-white border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DocumentChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600 font-medium">Avg Performance</p>
              <p className="text-3xl font-bold text-secondary-900">78%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartWidget
          title="Grade Distribution"
          subtitle="Overall grade distribution across all courses"
          type="bar"
          series={gradeDistribution.series}
          options={gradeDistribution.options}
        />
        <ChartWidget
          title="Outcome Achievement"
          subtitle="Average achievement rate per Learning Outcome"
          type="bar"
          series={outcomeAchievement.series}
          options={outcomeAchievement.options}
        />
      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-2xl p-8 border border-secondary-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-secondary-900">Course Management</h2>
            <p className="text-secondary-500">Manage outcome weightings and course settings</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30">
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>Upload Weightings</span>
          </button>
        </div>

        {/* Course List */}
        <div className="space-y-4">
          {courses.map((course, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center font-bold text-secondary-700 shadow-sm">
                  {course.code}
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900">{course.name}</h4>
                  <p className="text-sm text-secondary-500">{course.credits} Credits</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-secondary-900">--%</p>
                <p className="text-xs text-secondary-500">Avg Score</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LecturerDashboard
