import axios from 'axios'
import {
  University,
  Department,
  Program,
  Course,
  Enrollment,
  LearningOutcomeScore,
  ProgramOutcomeScore,
  LoginCredentials,
  AuthTokens,
  User
} from '../types/index'

const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth services are now handled by Orval-generated hooks in useAuth.ts
// authService is deprecated - use useAuth hook instead
export const authService = {
  login: async (credentials: LoginCredentials) => {
    console.warn('authService.login is deprecated. Use useAuth hook instead.')
    const response = await api.post<AuthTokens>('/users/auth/login/', credentials)
    localStorage.setItem('access_token', response.data.access)
    localStorage.setItem('refresh_token', response.data.refresh)
    return response.data
  },
  logout: () => {
    console.warn('authService.logout is deprecated. Use useAuth hook instead.')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // Optional: Call backend logout endpoint if it exists
  },
  getCurrentUser: async () => {
    console.warn('authService.getCurrentUser is deprecated. Use useAuth hook instead.')
    const response = await api.get<User>('/users/auth/me/')
    return response.data
  }
}

export const coreService = {
  getUniversities: () => api.get<University[]>('/core/universities/'),
  getDepartments: (uniId?: number) => api.get<Department[]>('/core/departments/', { params: { university: uniId } }),
  getPrograms: (deptId?: number) => api.get<Program[]>('/core/programs/', { params: { department: deptId } }),
  getCourses: async (progId?: number, userId?: number) => {
    const response = await api.get('/core/courses/', { params: { program: progId, instructor: userId } })
    // Handle paginated response
    const data = response.data
    if (data && typeof data === 'object' && 'results' in data) {
      return { ...response, data: data.results }
    }
    return response
  },
  getCourse: (courseId: number) => api.get<Course>(`/core/courses/${courseId}/`),
  getCourseLearningOutcomes: (courseId: number) => api.get(`/core/courses/${courseId}/learning_outcomes/`),
  getStudentLOScores: async (studentId?: number, courseId?: number) => {
    const response = await api.get('/core/student-lo-scores/', { params: { student: studentId, course: courseId } })
    // Handle paginated response
    const data = response.data
    if (data && typeof data === 'object' && 'results' in data) {
      return { ...response, data: data.results }
    }
    return response
  },
  getStudentPOScores: (studentId?: number) => api.get<ProgramOutcomeScore[]>('/core/student-po-scores/', { params: { student: studentId } }),
}

export const evaluationService = {
  getEnrollments: (studentId?: number) => api.get<Enrollment[]>('/evaluation/enrollments/', { params: { student: studentId } }),
}

export const fileImportService = {
  // Assignment Scores (Turkish Excel format)
  uploadAssignmentScores: async (file: File, courseCode: string, termId: number) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(
      `/core/file-import/assignment-scores/upload/?course_code=${encodeURIComponent(courseCode)}&term_id=${termId}`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  validateAssignmentScores: async (file: File, courseCode: string, termId: number) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(
      `/core/file-import/assignment-scores/validate/?course_code=${encodeURIComponent(courseCode)}&term_id=${termId}`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  getAssignmentScoresUploadInfo: async () => {
    const response = await api.get('/core/file-import/assignment-scores/upload/')
    return response.data
  },

  // Legacy Assessment Scores
  uploadAssessmentScores: async (file: File, sheetName?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (sheetName) {
      formData.append('sheet_name', sheetName)
    }

    const response = await api.post('/core/file-import/assessment-scores/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  validateAssessmentScores: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/core/file-import/assessment-scores/validate/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getAssessmentScoresUploadInfo: async () => {
    const response = await api.get('/core/file-import/assessment-scores/upload/')
    return response.data
  },

  uploadLearningOutcomes: async (file: File, sheetName?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (sheetName) {
      formData.append('sheet_name', sheetName)
    }

    const response = await api.post('/core/file-import/learning-outcomes/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  validateLearningOutcomes: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/core/file-import/learning-outcomes/validate/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getLearningOutcomesUploadInfo: async () => {
    const response = await api.get('/core/file-import/learning-outcomes/upload/')
    return response.data
  },

  uploadProgramOutcomes: async (file: File, sheetName?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (sheetName) {
      formData.append('sheet_name', sheetName)
    }

    const response = await api.post('/core/file-import/program-outcomes/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  validateProgramOutcomes: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/core/file-import/program-outcomes/validate/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getProgramOutcomesUploadInfo: async () => {
    const response = await api.get('/core/file-import/program-outcomes/upload/')
    return response.data
  },
}

export default api
