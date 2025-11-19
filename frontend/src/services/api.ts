import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AuthTokens, LoginCredentials, User } from '../types'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh/', {
                refresh: refreshToken,
              })

              const { access } = response.data
              localStorage.setItem('access_token', access)

              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${access}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh token failed, logout user
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response: AxiosResponse<{ access: string; refresh: string }> = await this.client.post(
      '/auth/login/',
      credentials
    )

    const { access, refresh } = response.data

    // Get user info
    const userResponse: AxiosResponse<User> = await this.client.get('/auth/user/')
    const user = userResponse.data

    // Store tokens
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)

    return { user, tokens: { access, refresh } }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout/')
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.client.get('/auth/user/')
    return response.data
  }

  // Programs
  async getPrograms(): Promise<any[]> {
    const response = await this.client.get('/academics/programs/')
    return response.data
  }

  async getProgram(id: number): Promise<any> {
    const response = await this.client.get(`/academics/programs/${id}/`)
    return response.data
  }

  // Courses
  async getCourses(): Promise<any[]> {
    const response = await this.client.get('/academics/courses/')
    return response.data
  }

  async getCourse(id: number): Promise<any> {
    const response = await this.client.get(`/academics/courses/${id}/`)
    return response.data
  }

  async getMyCourses(): Promise<any[]> {
    const response = await this.client.get('/academics/my-courses/')
    return response.data
  }

  // Assignments
  async getAssignments(courseId?: number): Promise<any[]> {
    const url = courseId ? `/assessments/assignments/?course=${courseId}` : '/assessments/assignments/'
    const response = await this.client.get(url)
    return response.data
  }

  async getAssignment(id: number): Promise<any> {
    const response = await this.client.get(`/assessments/assignments/${id}/`)
    return response.data
  }

  // Submissions
  async getSubmissions(assignmentId?: number): Promise<any[]> {
    const url = assignmentId ? `/assessments/submissions/?assignment=${assignmentId}` : '/assessments/submissions/'
    const response = await this.client.get(url)
    return response.data
  }

  async getMySubmissions(): Promise<any[]> {
    const response = await this.client.get('/assessments/my-submissions/')
    return response.data
  }

  // Outcomes
  async getProgramOutcomes(programId?: number): Promise<any[]> {
    const url = programId ? `/academics/program-outcomes/?program=${programId}` : '/academics/program-outcomes/'
    const response = await this.client.get(url)
    return response.data
  }

  async getCourseOutcomes(courseId?: number): Promise<any[]> {
    const url = courseId ? `/academics/course-outcomes/?course=${courseId}` : '/academics/course-outcomes/'
    const response = await this.client.get(url)
    return response.data
  }

  // Analytics
  async getCourseAnalytics(courseId: number): Promise<any> {
    const response = await this.client.get(`/analytics/course/${courseId}/`)
    return response.data
  }

  async getStudentAnalytics(): Promise<any> {
    const response = await this.client.get('/analytics/student/')
    return response.data
  }

  async getProgramAnalytics(programId: number): Promise<any> {
    const response = await this.client.get(`/analytics/program/${programId}/`)
    return response.data
  }
}

export const apiService = new ApiService()
export default apiService
