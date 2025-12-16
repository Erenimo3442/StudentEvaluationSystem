import { useState } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { coreService } from '../services/api'
import FileUploadModal from '../components/FileUploadModal'

const CourseDetail = () => {
const { id: courseId } = useParams<{ id: string }>()
const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchCourseData = async () => {
      if (!courseId) return null
      
      const [courseRes, loRes, loScoresRes] = await Promise.all([
        coreService.getCourse(parseInt(courseId)),
        coreService.getCourseLearningOutcomes(parseInt(courseId)),
        coreService.getStudentLOScores(undefined, parseInt(courseId)),
      ])

      return {
        course: courseRes.data,
        learningOutcomes: loRes.data,
        loScores: loScoresRes.data,
      }
  }


  const { data, isLoading, error, refetch } = useQuery(['course', courseId], fetchCourseData)

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
    if (!data?.course?.instructors || data.course.instructors.length === 0) {
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
              <div className="flex justify-between">
                <span className="text-gray-600">Total Scores:</span>
                <span className="font-medium">{data.loScores?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Course Level:</span>
                <span className="font-medium capitalize">{data.course.level || 'undergraduate'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Learning Outcomes</h3>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {data.learningOutcomes?.slice(0, 3).map((lo: any) => (
                <div key={lo.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{lo.code}:</span>
                  <span className={`font-medium ${getLOPerformance(lo.code) >= 80 ? 'text-green-600' : getLOPerformance(lo.code) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {getLOPerformance(lo.code)}%
                  </span>
                </div>
              ))}
              {(data.learningOutcomes?.length || 0) > 3 && (
                <div className="text-xs text-gray-500">+{(data.learningOutcomes?.length || 0) - 3} more</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Outcomes Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Outcomes</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.learningOutcomes?.map((lo: any) => (
              <div key={lo.id} className="border-l-4 border-blue-400 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{lo.code}</h4>
                    <p className="text-sm text-gray-600 mt-1">{lo.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-semibold ${getLOPerformance(lo.code) >= 80 ? 'text-green-600' : getLOPerformance(lo.code) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {getLOPerformance(lo.code)}%
                    </div>
                    <div className="text-xs text-gray-500">Average</div>
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
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-center text-gray-600 mb-2">Performance Chart</p>
            <p className="text-center text-sm text-gray-500">Showing average performance across learning outcomes</p>
            <div className="mt-4 space-y-2">
              {data.learningOutcomes?.map((lo: any) => {
                const performance = getLOPerformance(lo.code)
                return (
                  <div key={lo.id} className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-16">{lo.code}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className={`h-6 rounded-full ${performance >= 80 ? 'bg-green-500' : performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(performance, 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {performance}%
                      </span>
                    </div>
                  </div>
                )
              })}
              {!data.learningOutcomes || data.learningOutcomes.length === 0 && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>
        </div>
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
