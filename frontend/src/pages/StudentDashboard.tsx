import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ChartWidget } from '../components/ui/ChartWidget'
import {
  BookOpenIcon,
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { coreService, evaluationService } from '../services/api'
import { Enrollment, LearningOutcomeScore, ProgramOutcomeScore } from '../types/index'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loScores, setLoScores] = useState<LearningOutcomeScore[]>([])
  const [poScores, setPoScores] = useState<ProgramOutcomeScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        const [enrollmentsRes, loScoresRes, poScoresRes] = await Promise.all([
          evaluationService.getEnrollments(user.id),
          coreService.getStudentLOScores(user.id),
          coreService.getStudentPOScores(user.id)
        ])
        
        // Handle paginated responses (data.results) or direct arrays
        const enrollmentsData = (enrollmentsRes.data as any).results || enrollmentsRes.data
        const loScoresData = (loScoresRes.data as any).results || loScoresRes.data
        const poScoresData = (poScoresRes.data as any).results || poScoresRes.data
        
        setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
        setLoScores(Array.isArray(loScoresData) ? loScoresData : [])
        setPoScores(Array.isArray(poScoresData) ? poScoresData : [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set empty arrays on error
        setEnrollments([])
        setLoScores([])
        setPoScores([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Calculate statistics
  const avgLoScore = loScores.length > 0 
    ? loScores.reduce((sum, s) => sum + s.score, 0) / loScores.length 
    : 0
  
  const avgPoScore = poScores.length > 0 
    ? poScores.reduce((sum, s) => sum + s.score, 0) / poScores.length 
    : 0

  const totalCredits = enrollments.reduce((sum, e) => sum + (e.course.credits || 0), 0)
  
  // Check if scores are already in percentage (0-100) or decimal (0-1) format
  const scoreMultiplier = avgLoScore > 1 || avgPoScore > 1 ? 1 : 100

  // Program Outcomes Radar Chart
  const poRadarData = {
    series: [{
      name: 'Your Achievement',
      data: poScores.slice(0, 8).map(s => Math.round(s.score * scoreMultiplier)),
    }],
    options: {
      chart: {
        toolbar: { show: false },
        dropShadow: { 
          enabled: true, 
          blur: 8, 
          left: 0, 
          top: 0,
          opacity: 0.1
        }
      },
      stroke: { width: 2 },
      fill: { opacity: 0.2 },
      markers: { size: 4 },
      xaxis: {
        categories: poScores.slice(0, 8).map(s => s.program_outcome.code),
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 600,
          }
        }
      },
      yaxis: {
        show: true,
        min: 0,
        max: 100,
        tickAmount: 5,
      },
      colors: ['#0d9488'],
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: '#e5e7eb',
            connectorColors: '#e5e7eb',
            fill: {
              colors: ['#f9fafb', '#fff']
            }
          }
        }
      }
    }
  }

  // Learning Outcomes Bar Chart (Top 10)
  const loBarData = {
    series: [{
      name: 'Score',
      data: loScores.slice(0, 10).map(s => Math.round(s.score * scoreMultiplier)),
    }],
    options: {
      chart: {
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          horizontal: true,
          distributed: true,
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}%`,
        style: {
          fontSize: '12px',
          fontWeight: 'bold',
        }
      },
      xaxis: {
        categories: loScores.slice(0, 10).map(s => 
          `${s.learning_outcome.course.code} - ${s.learning_outcome.code}`
        ),
        max: 100,
      },
      colors: ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4',
               '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'],
      legend: { show: false },
      grid: {
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-500 mt-1">Overview of your academic performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="flat" className="bg-primary-50 border-primary-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <AcademicCapIcon className="h-8 w-8 text-primary-700" />
            </div>
            <div>
              <p className="text-sm text-secondary-600 font-medium">Enrolled Courses</p>
              <p className="text-3xl font-bold text-primary-700">{enrollments.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="flat" className="bg-cyan-50 border-cyan-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <BookOpenIcon className="h-8 w-8 text-cyan-700" />
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
              <p className="text-sm text-secondary-600 font-medium">Avg LO Score</p>
              <p className="text-3xl font-bold text-emerald-700">{(avgLoScore * scoreMultiplier).toFixed(0)}%</p>
            </div>
          </div>
        </Card>

        <Card variant="flat" className="bg-amber-50 border-amber-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrophyIcon className="h-8 w-8 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-secondary-600 font-medium">Avg PO Score</p>
              <p className="text-3xl font-bold text-amber-700">{(avgPoScore * scoreMultiplier).toFixed(0)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Program Outcomes Radar */}
        {poScores.length > 0 ? (
          <ChartWidget
            title="Program Outcomes Achievement"
            subtitle="Your performance across program outcomes"
            type="radar"
            series={poRadarData.series}
            options={poRadarData.options}
            height={400}
          />
        ) : (
          <Card className="flex items-center justify-center h-96">
            <div className="text-center text-secondary-500">
              <ChartBarIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>No program outcome data available yet</p>
            </div>
          </Card>
        )}

        {/* Learning Outcomes Bar */}
        {loScores.length > 0 ? (
          <ChartWidget
            title="Learning Outcomes Performance"
            subtitle="Top 10 learning outcome scores"
            type="bar"
            series={loBarData.series}
            options={loBarData.options}
            height={400}
          />
        ) : (
          <Card className="flex items-center justify-center h-96">
            <div className="text-center text-secondary-500">
              <ChartBarIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>No learning outcome data available yet</p>
            </div>
          </Card>
        )}
      </div>

      {/* Enrolled Courses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">Your Courses</h2>
          <Badge variant="info">{enrollments.length} Active</Badge>
        </div>
        
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
                
                {enrollment.grade && (
                  <div className="mt-4 pt-4 border-t border-secondary-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">Grade</span>
                      <Badge variant="success">{enrollment.grade}</Badge>
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
    </div>
  )
}

export default StudentDashboard
