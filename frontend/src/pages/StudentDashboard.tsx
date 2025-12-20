import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/ui/Card'
import { LazyChartWidget as ChartWidget } from '../components/ui/LazyChartWidget'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { coreService, evaluationService } from '../services/api'
import { Enrollment, ProgramOutcomeScore } from '../types/index'

interface CourseScore {
  courseId: number
  weightedAverage: number | null
}

const StudentDashboard = () => {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [poScores, setPoScores] = useState<ProgramOutcomeScore[]>([])
  const [courseScores, setCourseScores] = useState<CourseScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [enrollmentsRes, poScoresRes, courseAveragesData] = await Promise.all([
          evaluationService.getEnrollments(user.id),
          coreService.getStudentPOScores(user.id),
          coreService.getLOBasedCourseAverages(user.id),
        ])

        // Handle paginated responses (data.results) or direct arrays
        const enrollmentsData =
          (enrollmentsRes.data as any).results || enrollmentsRes.data
        const poScoresData =
          (poScoresRes.data as any).results || poScoresRes.data

        const enrollmentsList = Array.isArray(enrollmentsData) ? enrollmentsData : []
        setEnrollments(enrollmentsList)
        setPoScores(Array.isArray(poScoresData) ? poScoresData : [])

        // Use the pre-calculated course averages from backend (learning outcome scores)
        const averages = Array.isArray(courseAveragesData) ? courseAveragesData : []
        setCourseScores(averages.map((avg: any) => ({
          courseId: avg.course_id,
          weightedAverage: avg.weighted_average
        })))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setEnrollments([])
        setPoScores([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const getCourseScore = (courseId: number): string => {
    const score = courseScores.find(s => s.courseId === courseId)
    if (score?.weightedAverage !== null && score?.weightedAverage !== undefined) {
      return Math.round(score.weightedAverage).toString()
    }
    return '-'
  }

  // Check if scores are already in percentage (0-100) or decimal (0-1) format
  const scoreMultiplier =
    poScores.length > 0 && poScores[0].score <= 1 ? 100 : 1

  // Program Outcomes Radar Chart
  const poRadarData = {
    series: [
      {
        name: 'Achievement',
        data: poScores.map((s) => Math.round(s.score * scoreMultiplier)),
      },
    ],
    options: {
      chart: {
        toolbar: { show: false },
        dropShadow: {
          enabled: true,
          blur: 8,
          left: 0,
          top: 0,
          opacity: 0.1,
        },
      },
      stroke: { width: 2 },
      fill: { opacity: 0.3 },
      markers: { size: 4 },
      xaxis: {
        categories: poScores.map((s) => s.program_outcome.code),
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 600,
          },
        },
      },
      yaxis: {
        show: true,
        min: 0,
        max: 100,
        tickAmount: 5,
      },
      colors: ['#0d9488'],
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number, { dataPointIndex }: { dataPointIndex: number }) => {
            const outcome = poScores[dataPointIndex]?.program_outcome
            return outcome ? `${val}% - ${outcome.description}` : `${val}%`
          },
        },
      },
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: '#e5e7eb',
            connectorColors: '#e5e7eb',
            fill: {
              colors: ['#f9fafb', '#fff'],
            },
          },
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Courses Overview Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Courses Overview
        </h2>

        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => (
              <Card
                key={enrollment.id}
                className="h-full"
              >
                <div className="flex flex-col h-full">
                  {/* Course Code & Name */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {enrollment.course.code}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {enrollment.course.name}
                    </p>
                  </div>

                  {/* Score & Credit */}
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Score
                        </p>
                        <p className="text-lg font-semibold text-primary-600">
                          {getCourseScore(enrollment.course.id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Credit
                        </p>
                        <p className="text-lg font-semibold text-gray-700">
                          {enrollment.course.credits} CR
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No courses enrolled
            </h3>
            <p className="text-gray-500">
              You haven't enrolled in any courses yet.
            </p>
          </Card>
        )}
      </section>

      {/* Program Outcome Radar Chart Section */}
      <section>
        {poScores.length > 0 ? (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Program Outcome Scores
            </h2>
            <ChartWidget
              title=""
              type="radar"
              series={poRadarData.series}
              options={poRadarData.options}
              height={500}
              className="border-0 shadow-none"
            />
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Program Outcome Scores
            </h2>
            <Card className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No program outcome data
              </h3>
              <p className="text-gray-500">
                Program outcome scores will appear here once available.
              </p>
            </Card>
          </div>
        )}
      </section>
    </div>
  )
}

export default StudentDashboard
