import React, { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import FileUploadModal from '../components/FileUploadModal'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { coreService } from '../services/api'
import { Course, LearningOutcomeScore } from '../types/index'
import { useAuth } from '../hooks/useAuth'

interface CourseWithAnalytics extends Course {
  students?: number
  avgScore?: number
  studentsAtRisk?: number
  weight?: number
  loScores?: Array<{ lo: string; score: number }>
  gradeDistribution?: Array<{ grade: string; count: number; color: string }>
}

const InstructorDashboard = () => {
  const { user } = useAuth()
    const [coursesWithAnalytics, setCoursesWithAnalytics] = useState<CourseWithAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeChart, setActiveChart] = useState('radar')
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Helper functions to process API data
  const aggregateLOScores = (loScores: LearningOutcomeScore[]) => {
    const aggregated: Record<string, number[]> = {}

    loScores.forEach(score => {
      const loCode = score.learning_outcome.code
      if (!aggregated[loCode]) {
        aggregated[loCode] = []
      }
      aggregated[loCode].push(score.score)
    })

    return Object.entries(aggregated).map(([lo, scores]) => ({
      lo,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }))
  }

  const calculateGradeDistribution = (loScores: LearningOutcomeScore[]) => {
    // Group scores by student
    const studentScores: Record<number, number[]> = {}

    loScores.forEach(score => {
      const studentId = (score as any).student_id
      if (!studentScores[studentId]) {
        studentScores[studentId] = []
      }
      studentScores[studentId].push(score.score)
    })

    // Calculate average for each student
    const studentAverages = Object.values(studentScores).map(scores =>
      scores.reduce((a, b) => a + b, 0) / scores.length
    )

    // Grade distribution
    const distribution = {
      A: studentAverages.filter(s => s >= 90).length,
      B: studentAverages.filter(s => s >= 80 && s < 90).length,
      C: studentAverages.filter(s => s >= 70 && s < 80).length,
      D: studentAverages.filter(s => s >= 60 && s < 70).length,
      F: studentAverages.filter(s => s < 60).length
    }

    return [
      { grade: 'A', count: distribution.A, color: '#10b981' },
      { grade: 'B', count: distribution.B, color: '#22c55e' },
      { grade: 'C', count: distribution.C, color: '#eab308' },
      { grade: 'D', count: distribution.D, color: '#f97316' },
      { grade: 'F', count: distribution.F, color: '#ef4444' },
    ].filter(item => item.count > 0)
  }

  const calculateAverageScore = (loScores: LearningOutcomeScore[]) => {
    if (loScores.length === 0) return 0
    const total = loScores.reduce((sum, score) => sum + score.score, 0)
    return Math.round(total / loScores.length)
  }

  const identifyStudentsAtRisk = (loScores: LearningOutcomeScore[]) => {
    const studentScores: Record<number, number[]> = {}

    loScores.forEach(score => {
      const studentId = (score as any).student_id
      if (!studentScores[studentId]) {
        studentScores[studentId] = []
      }
      studentScores[studentId].push(score.score)
    })

    const studentAverages = Object.values(studentScores).map(scores =>
      scores.reduce((a, b) => a + b, 0) / scores.length
    )

    return studentAverages.filter(average => average < 60).length
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses filtered by instructor on the server side
        const coursesRes = await coreService.getCourses(undefined, user?.id)
        const instructorCourses = coursesRes.data

        // Fetch analytics for each course
        const coursesData = await Promise.all(
          instructorCourses.map(async (course: Course) => {
            try {
              const loScoresRes = await coreService.getStudentLOScores(undefined, course.id)

              const loScores = loScoresRes.data
              const aggregatedLOScores = aggregateLOScores(loScores)
              const gradeDistribution = calculateGradeDistribution(loScores)
              const avgScore = calculateAverageScore(loScores)
              const studentsAtRisk = identifyStudentsAtRisk(loScores)

              return {
                ...course,
                students: new Set(loScores.map((s: any) => s.student_id)).size,
                avgScore,
                studentsAtRisk,
                weight: course.credits || 1,
                loScores: aggregatedLOScores,
                gradeDistribution
              }
            } catch (error) {
              console.error(`Error fetching analytics for course ${course.id}:`, error)
              return {
                ...course,
                students: 0,
                avgScore: 0,
                studentsAtRisk: 0,
                weight: course.credits || 1,
                loScores: [],
                gradeDistribution: [
                  { grade: 'A', count: 0, color: '#10b981' },
                  { grade: 'B', count: 0, color: '#22c55e' },
                  { grade: 'C', count: 0, color: '#eab308' },
                  { grade: 'D', count: 0, color: '#f97316' },
                  { grade: 'F', count: 0, color: '#ef4444' },
                ]
              }
            }
          })
        )

        setCoursesWithAnalytics(coursesData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchData()
    }
  }, [user])

  const nextCourse = () => setCurrentIndex((prev) => (prev + 1) % coursesWithAnalytics.length)
  const prevCourse = () => setCurrentIndex((prev) => (prev - 1 + coursesWithAnalytics.length) % coursesWithAnalytics.length)

  const course = coursesWithAnalytics[currentIndex] || {
    code: 'No Course',
    name: 'No courses available',
    students: 0,
    avgScore: 0,
    studentsAtRisk: 0,
    weight: 0,
    loScores: [],
    gradeDistribution: []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Course Selector */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={prevCourse}
            disabled={coursesWithAnalytics.length <= 1}
            className="p-2 hover:bg-secondary-100 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6 text-secondary-600" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-secondary-900">{course.code}</h1>
            <p className="text-secondary-600 text-lg">{course.name}</p>
          </div>
          <button
            onClick={nextCourse}
            disabled={coursesWithAnalytics.length <= 1}
            className="p-2 hover:bg-secondary-100 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6 text-secondary-600" />
          </button>
        </div>

        {/* Course Overview Card */}
        <Card className="overflow-hidden mb-6">
          <div className="flex flex-col lg:flex-row">
            {/* Left: Charts */}
            <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-secondary-200">
              {/* Chart and Import Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveChart('radar')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      activeChart === 'radar'
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                  >
                    LO Scores
                  </button>
                  <button
                    onClick={() => setActiveChart('pie')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      activeChart === 'pie'
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                  >
                    Grade Distribution
                  </button>
                </div>
                <button
                  onClick={() => setIsFileUploadModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Data</span>
                </button>
              </div>

              {/* Chart Display */}
              <div className="h-80">
                {activeChart === 'radar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={course.loScores}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="lo" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.4}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        labelStyle={{ color: '#374151' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={course.gradeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="count"
                        label={(entry: any) => `${entry.grade}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#9ca3af' }}
                      >
                        {course.gradeDistribution?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value: any, _name: any, props: any) => [`${value} students`, props.payload?.grade || '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right: Stats */}
            <div className="w-full lg:w-64 p-6">
              <div className="space-y-6">
                <div>
                  <p className="text-secondary-500 text-sm mb-1">Students</p>
                  <p className="text-3xl font-bold text-secondary-900">{course.students}</p>
                </div>
                <div>
                  <p className="text-secondary-500 text-sm mb-1">Avg Score</p>
                  <p className="text-3xl font-bold text-secondary-900">
                    {course.avgScore}<span className="text-lg text-secondary-400">/100</span>
                  </p>
                </div>
                <div>
                  <p className="text-secondary-500 text-sm mb-1">Students at Risk</p>
                  <p className={`text-3xl font-bold ${
                    course.studentsAtRisk! > 10 ? 'text-red-500' :
                    course.studentsAtRisk! > 5 ? 'text-amber-500' :
                    'text-emerald-500'
                  }`}>
                    {course.studentsAtRisk}
                  </p>
                </div>
                <div>
                  <p className="text-secondary-500 text-sm mb-1">Credits</p>
                  <p className="text-3xl font-bold text-secondary-900">{course.credits}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Course indicator dots */}
        {coursesWithAnalytics.length > 1 && (
          <div className="flex justify-center gap-2 mb-8">
            {coursesWithAnalytics.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition ${
                  i === currentIndex ? 'bg-primary-500' : 'bg-secondary-300 hover:bg-secondary-400'
                }`}
              />
            ))}
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-emerald-800 mb-3">Import Completed Successfully!</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-emerald-700">Message:</span>
                <span className="ml-2 text-emerald-600">{uploadResult.message}</span>
              </div>
              {uploadResult.results && (
                <div>
                  <span className="font-medium text-emerald-700">Results:</span>
                  <div className="mt-2 space-y-1">
                    {Object.entries(uploadResult.results.created || {}).map(([entity, count]: [string, any]) => (
                      <div key={entity} className="text-sm text-emerald-600">
                        • Created {count} {entity}
                      </div>
                    ))}
                    {Object.entries(uploadResult.results.updated || {}).map(([entity, count]: [string, any]) => (
                      <div key={entity} className="text-sm text-emerald-600">
                        • Updated {count} {entity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload Errors */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Import Failed</h3>
            <div className="text-red-600">{uploadError}</div>
            <button
              onClick={() => setUploadError(null)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* FileUploadModal */}
        {course.id && (
          <FileUploadModal
            course={course.name}
            courseCode={course.code}
            termId={course.term?.id ?? 1}
            isOpen={isFileUploadModalOpen}
            type="assignment_scores"
            onClose={() => setIsFileUploadModalOpen(false)}
            onUploadComplete={(result: any) => {
              setUploadResult(result)
              setIsFileUploadModalOpen(false)
              // Refetch data to update the dashboard
              window.location.reload()
            }}
            onError={(error: any) => {
              setUploadError(error)
              setIsFileUploadModalOpen(false)
            }}
          />
        )}
    </main>
    </>
  )
}

export default InstructorDashboard