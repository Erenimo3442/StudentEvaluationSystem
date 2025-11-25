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
  getCourses: (progId?: number) => api.get<Course[]>('/core/courses/', { params: { program: progId } }),

  getStudentLOScores: (studentId?: number) => api.get<LearningOutcomeScore[]>('/core/student-lo-scores/', { params: { student: studentId } }),
  getStudentPOScores: (studentId?: number) => api.get<ProgramOutcomeScore[]>('/core/student-po-scores/', { params: { student: studentId } }),
}

export const evaluationService = {
  getEnrollments: (studentId?: number) => api.get<Enrollment[]>('/evaluation/enrollments/', { params: { student: studentId } }),
}

export default api
