import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { coreCoursesRetrieve, coreLearningOutcomesList } from '../api/generated/core/core'
import FileUploadModal from '../components/FileUploadModal'
import { coreStudentLoScoresList } from '../api/generated/scores/scores'

interface BoxPlotData {
  code: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
}

interface HeatmapData {
  studentName: string
  studentId: number
  loScores: Record<string, number>
}

const CourseDetail = () => {
const { id: courseId } = useParams<{ id: string }>()
const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required')
      const courseResponse = await coreCoursesRetrieve(Number(courseId))
      const loResponse = await coreLearningOutcomesList({
        course: Number(courseId)
      })
      const loScoresResponse = await coreStudentLoScoresList({
        course: Number(courseId)
    })
      return { 
        course: courseResponse, 
        learningOutcomes: loResponse.results || [],
        loScores: loScoresResponse.results || [] 
      }
    }
  })

  const handleUploadComplete = (result: any) => {
    setNotification({
      type: 'success',
      message: `Successfully imported ${result.results?.created?.grades || 0 + result.results?.updated?.grades || 0} grades`
    })

    // Refresh data without page reload
    refetch()
  }

  const handleUploadError = (error: string) => {
    setNotification({
      type: 'error',
      message: error
    })
  }

  const getInstructorNames = () => {
    if (!data?.course?.instructors|| data.course.instructors.length === 0) {
      return 'Not assigned'
    }
    return data.course.instructors.map((instructor: any) =>
      `${instructor.first_name} ${instructor.last_name}`
    ).join(', ')
  }

  const getAverageScore = () => {
    if (!data?.loScores || data.loScores.length === 0) return 0
    const total = data.loScores.reduce((sum: any, score: any) => sum + score.score, 0)
    return Math.round((total / data.loScores.length) * 100) / 100
  }

  const getLOPerformance = (loCode: string) => {
    if (!data?.loScores) return 0
    const loScoresFiltered = data.loScores.filter((score: any) =>
      score.learning_outcome.code === loCode
    )
    if (loScoresFiltered.length === 0) return 0
    const total = loScoresFiltered.reduce((sum: any, score: any) => sum + score.score, 0)
    return Math.round((total / loScoresFiltered.length) * 100) / 100
  }

  // Calculate box plot data for each LO
  const boxPlotData = useMemo((): BoxPlotData[] => {
    if (!data?.learningOutcomes || !data?.loScores) return []

    return data.learningOutcomes.map((lo: any) => {
      const loScoresFiltered = data.loScores
        .filter((score: any) => score.learning_outcome.code === lo.code)
        .map((score: any) => score.score)
        .sort((a: number, b: number) => a - b)

      if (loScoresFiltered.length === 0) {
        return {
          code: lo.code,
          min: 0,
          q1: 0,
          median: 0,
          q3: 0,
          max: 0,
          mean: 0
        }
      }

      const n = loScoresFiltered.length
      const min = loScoresFiltered[0]
      const max = loScoresFiltered[n - 1]
      const mean = loScoresFiltered.reduce((sum, val) => sum + val, 0) / n

      // Calculate quartiles
      const getQuantile = (arr: number[], q: number): number => {
        const pos = (arr.length - 1) * q
        const base = Math.floor(pos)
        const rest = pos - base
        if (arr[base + 1] !== undefined) {
          return arr[base] + rest * (arr[base + 1] - arr[base])
        }
        return arr[base]
      }

      const q1 = getQuantile(loScoresFiltered, 0.25)
      const median = getQuantile(loScoresFiltered, 0.5)
      const q3 = getQuantile(loScoresFiltered, 0.75)

      return {
        code: lo.code,
        min: Math.round(min * 100) / 100,
        q1: Math.round(q1 * 100) / 100,
        median: Math.round(median * 100) / 100,
        q3: Math.round(q3 * 100) / 100,
        max: Math.round(max * 100) / 100,
        mean: Math.round(mean * 100) / 100
      }
    })
  }, [data?.learningOutcomes, data?.loScores])

  // Calculate heatmap data (students x LOs)
  const heatmapData = useMemo((): { loCodes: string[]; students: HeatmapData[] } => {
    if (!data?.learningOutcomes || !data?.loScores) return { loCodes: [], students: [] }

    const loCodes = data.learningOutcomes.map((lo: any) => lo.code)

    // Group scores by student
    const studentMap = new Map<number, HeatmapData>()

    data.loScores.forEach((score: any) => {
      const studentId = score.student
      // Handle student_detail being an array of user objects or similar structure
      let studentName = `Student ${studentId}`

      // First, check if student_detail is available and has proper data
      if (score.student_detail && score.student_detail.length > 0) {
        const detail = score.student_detail[0]
        // Check if detail is a string (username) or an object with first_name/last_name
        if (typeof detail === 'string') {
          studentName = detail
        } else if (detail.first_name || detail.last_name) {
          studentName = `${detail.first_name || ''} ${detail.last_name || ''}`.trim()
        } else if (detail.username) {
          studentName = detail.username
        }
      } else if (typeof score.student === 'string') {
        // Handle case where student is a string like "Yusuf Eren Arı (student)"
        // Remove the " (role)" suffix
        studentName = score.student.replace(/ \([^)]+\)$/, '')
      }
      const loCode = score.learning_outcome.code

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName,
          loScores: {}
        })
      }

      studentMap.get(studentId)!.loScores[loCode] = Math.round(score.score * 100) / 100
    })

    // Fill missing scores with 0 for all LOs
    const students = Array.from(studentMap.values()).map(student => ({
      ...student,
      loScores: loCodes.reduce((acc, code) => ({
        ...acc,
        [code]: student.loScores[code] ?? 0
      }), {} as Record<string, number>)
    }))

    // Sort by student name
    students.sort((a, b) => a.studentName.localeCompare(b.studentName))

    return { loCodes, students }
  }, [data?.learningOutcomes, data?.loScores])

  // Get color for heatmap cell - using a modern gradient from deep red to bright green
  const getHeatmapColor = (score: number): string => {
    if (score === 0) return 'rgb(249, 250, 251)' // gray-50

    const normalized = Math.max(0, Math.min(100, score)) / 100

    // Beautiful gradient: Deep Red (0) → Orange (25) → Yellow (50) → Lime (75) → Bright Green (100)
    if (normalized < 0.25) {
      // Deep red to orange
      const t = normalized / 0.25
      const r = 220 - Math.round(29 * t)  // 220 → 191
      const g = 38 + Math.round(64 * t)   // 38 → 102
      const b = 38 + Math.round(14 * t)   // 38 → 52
      return `rgb(${r}, ${g}, ${b})`
    } else if (normalized < 0.5) {
      // Orange to yellow
      const t = (normalized - 0.25) / 0.25
      const r = 191 + Math.round(64 * t)  // 191 → 255
      const g = 102 + Math.round(141 * t) // 102 → 243
      const b = 52 + Math.round(187 * t)  // 52 → 239
      return `rgb(${r}, ${g}, ${b})`
    } else if (normalized < 0.75) {
      // Yellow to lime
      const t = (normalized - 0.5) / 0.25
      const r = 255 - Math.round(109 * t) // 255 → 146
      const g = 243 + Math.round(12 * t)  // 243 → 255
      const b = 239 - Math.round(104 * t)  // 239 → 135
      return `rgb(${r}, ${g}, ${b})`
    } else {
      // Lime to bright green
      const t = (normalized - 0.75) / 0.25
      const r = 146 - Math.round(96 * t)   // 146 → 50
      const g = 255                        // 255
      const b = 135 - Math.round(73 * t)   // 135 → 62
      return `rgb(${r}, ${g}, ${b})`
    }
  }

  // Get text color based on background
  const getTextColor = (score: number): string => {
    if (score === 0) return 'rgb(107, 114, 128)' // gray-500
    if (score >= 60) return 'rgb(17, 24, 39)' // gray-900
    return 'rgb(255, 255, 255)' // white
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading course details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800">Error: {error instanceof Error ? error.message : 'An error occurred while loading course details'}</div>
      </div>
    )
  }

  if (!data?.course) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-yellow-800">Course not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {/* Course Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {data.course.code} - {data.course.name}
            </h1>
            {/*<p className="text-gray-600">
              {course.description || 'No description available'}
            </p>*/}
          </div>
          <button
            onClick={() => setIsFileUploadModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Import File</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Course Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Credits:</span>
                <span className="font-medium">{data.course.credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instructors:</span>
                <span className="font-medium text-sm">{getInstructorNames()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Learning Outcomes:</span>
                <span className="font-medium">{data.learningOutcomes?.length || 0}</span>
              </div>
              {data.course.term && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Term:</span>
                  <span className="font-medium">{data.course.term.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Score:</span>
                <span className={`font-medium ${getAverageScore() >= 80 ? 'text-green-600' : getAverageScore() >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {getAverageScore()}%
                </span>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Learning Outcomes Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Outcomes</h2>
          <div className="space-y-3">
            {data.learningOutcomes?.map((lo: any) => (
              <div key={lo.id} className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{lo.code}</h4>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${getLOPerformance(lo.code) >= 80 ? 'bg-emerald-100 text-emerald-700' : getLOPerformance(lo.code) >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {getLOPerformance(lo.code)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{lo.description}</p>
                  </div>
                </div>
              </div>
            ))}
            {!data.learningOutcomes || data.learningOutcomes.length === 0 && (
              <p className="text-gray-500 text-center py-4">No learning outcomes defined for this course</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Overview</h2>
          <div className="space-y-4">
            {boxPlotData.length > 0 ? (
              boxPlotData.map((box) => {
                const boxWidth = 300
                const scale = boxWidth / 100
                const xMin = box.min * scale
                const xQ1 = box.q1 * scale
                const xMedian = box.median * scale
                const xQ3 = box.q3 * scale
                const xMax = box.max * scale

                // Get color based on median
                const getBoxColor = (median: number) => {
                  if (median >= 80) return { main: '#32CD32', bg: 'rgba(50, 205, 50, 0.2)' } // Lime green
                  if (median >= 60) return { main: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' } // Amber
                  return { main: '#DC2626', bg: 'rgba(220, 38, 38, 0.2)' } // Red
                }
                const boxColor = getBoxColor(box.median)

                return (
                  <div key={box.code} className="flex items-center space-x-4">
                    <span className="text-sm font-semibold w-14 text-gray-700">{box.code}</span>
                    <div className="flex-1 flex items-center h-10">
                      <svg width={boxWidth + 40} height={45} className="overflow-visible">
                        {/* Background gradient */}
                        <defs>
                          <linearGradient id="gradientScale" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.15" />
                            <stop offset="25%" stopColor="#F97316" stopOpacity="0.15" />
                            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.15" />
                            <stop offset="75%" stopColor="#A3E635" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#32CD32" stopOpacity="0.15" />
                          </linearGradient>
                        </defs>
                        <rect x="0" y={5} width={boxWidth} height={30} fill="url(#gradientScale)" rx={4} />

                        {/* Scale line */}
                        <line
                          x1="0" y1={20} x2={boxWidth} y2={20}
                          stroke="#e5e7eb" strokeWidth={1}
                        />
                        {/* Scale markers */}
                        {[0, 25, 50, 75, 100].map((tick) => (
                          <g key={tick}>
                            <line
                              x1={tick * scale} y1={14} x2={tick * scale} y2={26}
                              stroke="#d1d5db" strokeWidth={1}
                            />
                            <text
                              x={tick * scale} y={41}
                              fontSize={9} textAnchor="middle" fill="#6b7280"
                            >
                              {tick}
                            </text>
                          </g>
                        ))}
                        {/* Whisker line */}
                        <line
                          x1={xMin} y1={20} x2={xMax} y2={20}
                          stroke="#374151" strokeWidth={2}
                        />
                        {/* Whisker caps */}
                        <line
                          x1={xMin} y1={10} x2={xMin} y2={30}
                          stroke="#374151" strokeWidth={2}
                        />
                        <line
                          x1={xMax} y1={10} x2={xMax} y2={30}
                          stroke="#374151" strokeWidth={2}
                        />
                        {/* Box (Q1 to Q3) */}
                        <rect
                          x={xQ1} y={6} width={xQ3 - xQ1} height={28}
                          fill={boxColor.bg}
                          stroke={boxColor.main}
                          strokeWidth={2.5}
                          rx={3}
                        />
                        {/* Median line */}
                        <line
                          x1={xMedian} y1={6} x2={xMedian} y2={34}
                          stroke="#1f2937" strokeWidth={3}
                        />
                        {/* Mean diamond */}
                        <polygon
                          points={`${box.mean * scale},${20} ${box.mean * scale + 4},${14} ${box.mean * scale + 8},${20} ${box.mean * scale + 4},${26}`}
                          fill="#4f46e5"
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      </svg>
                    </div>
                    {/* Stats */}
                    <div className="text-xs text-gray-600 flex space-x-2 min-w-[140px]">
                      <span className="font-semibold text-gray-700">Med: {box.median}</span>
                      <span>Q1: {box.q1}</span>
                      <span>Q3: {box.q3}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
          {/* Legend */}
          {boxPlotData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-3 border-2 border-indigo-500 bg-indigo-100 rounded"></div>
                  <span>Box (Q1-Q3)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-0.5 h-3 bg-gray-900"></div>
                  <span>Median</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-indigo-600 transform rotate-45"></div>
                  <span>Mean</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Performance Heatmap */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Student Performance Heatmap</h2>
        <p className="text-sm text-gray-600 mb-4">
          Learning outcome scores for each student. Colors range from deep red (low) to bright green (high).
        </p>
        {heatmapData.students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-r border-gray-300 z-10">
                    Student Name
                  </th>
                  {heatmapData.loCodes.map((loCode) => (
                    <th key={loCode} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b-2 border-gray-200 min-w-[80px]">
                      {loCode}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.students.map((student, idx) => (
                  <tr key={student.studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="sticky left-0 px-4 py-2 text-sm font-medium text-gray-900 border-b border-r border-gray-200" style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      {student.studentName}
                    </td>
                    {heatmapData.loCodes.map((loCode) => {
                      const score = student.loScores[loCode] ?? 0
                      const bgColor = getHeatmapColor(score)
                      const textColor = getTextColor(score)
                      return (
                        <td
                          key={loCode}
                          className="px-2 py-2 text-center text-sm font-medium border-b border-gray-200"
                          style={{ backgroundColor: bgColor, color: textColor }}
                        >
                          {score > 0 ? score.toFixed(1) : '-'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No student performance data available</p>
        )}
        {/* Color Scale Legend */}
        {heatmapData.students.length > 0 && (
          <div className="mt-6 flex items-center justify-center space-x-4">
            <span className="text-xs font-medium text-gray-700">0%</span>
            <div className="w-64 h-4 rounded" style={{
              background: 'linear-gradient(to right, #DC2626 0%, #F97316 25%, #FBBF24 50%, #A3E635 75%, #32CD32 100%)'
            }}></div>
            <span className="text-xs font-medium text-gray-700">100%</span>
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        course={data.course.name}
        courseCode={data.course.code}
        termId={data.course.term?.id ?? 0}
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
        type="assignment_scores"
        onUploadComplete={handleUploadComplete}
        onError={handleUploadError}
      />
    </div>
  )
}

export default CourseDetail
