import axios from 'axios'
import { Profile } from '../types/profile'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to add the auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Add a response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await apiClient.post('/auth/refresh', { refreshToken })
        const { token } = response.data
        localStorage.setItem('authToken', token)
        originalRequest.headers['Authorization'] = `Bearer ${token}`
        return apiClient(originalRequest)
      } catch (error) {
        // Handle refresh token failure (e.g., redirect to login)
        console.error('Failed to refresh token:', error)
      }
    }
    return Promise.reject(error)
  }
)

export const profileService = {
  getProfile: () => apiClient.get<Profile>('/profile'),
  updateProfile: (data: Partial<Profile>) => apiClient.patch<Profile>('/profile', data),
}

export const authService = {
  login: (credentials: { email: string; password: string }) => 
    apiClient.post<{ token: string; refreshToken: string }>('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
}

export default apiClient

