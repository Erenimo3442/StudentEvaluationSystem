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

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthTokens>('/users/auth/login/', credentials)
    localStorage.setItem('access_token', response.data.access)
    localStorage.setItem('refresh_token', response.data.refresh)
    return response.data
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // Optional: Call backend logout endpoint if it exists
  },
  getCurrentUser: async () => {
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

  getStudentLOScores: (studentId?: number) => api.get<LearningOutcomeScore[]>('/core/student-lo-scores/', { params: { student: studentId } }),
  getStudentPOScores: (studentId?: number) => api.get<ProgramOutcomeScore[]>('/core/student-po-scores/', { params: { student: studentId } }),
}

export const evaluationService = {
  getEnrollments: (studentId?: number) => api.get<Enrollment[]>('/evaluation/enrollments/', { params: { student: studentId } }),
}

export const fileImportService = {
  uploadFile: async (file: File, course: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('course', course)

    const response = await api.post('/core/file-import/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  validateFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/core/file-import/validate/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getUploadInfo: async () => {
    const response = await api.get('/core/file-import/upload/')
    return response.data
  },

  getValidateInfo: async () => {
    const response = await api.get('/core/file-import/validate/')
    return response.data
  },
}

export default api
