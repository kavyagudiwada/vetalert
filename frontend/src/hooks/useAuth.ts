import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/endpoints'
import toast from 'react-hot-toast'

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, setUser } =
    useAuthStore()
  const navigate = useNavigate()

  const signIn = useCallback(
    async (emailOrPhone: string, password: string) => {
      try {
        const response = await authApi.login({ emailOrPhone, password })
        login(response.data.user, response.data.token)
        toast.success('Logged in successfully')
        navigate('/')
        return response.data
      } catch (error) {
        toast.error('Invalid credentials')
        throw error
      }
    },
    [login, navigate],
  )

  const signInWithGoogle = useCallback(
    async (credential: string, role: string) => {
      try {
        const response = await authApi.google(credential, role)
        login(response.data.user, response.data.token)
        toast.success('Signed in with Google')
        navigate('/')
        return response.data
      } catch (error) {
        toast.error('Google sign-in failed')
        throw error
      }
    },
    [login, navigate],
  )

  const signUp = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        const response = await authApi.register(data)
        login(response.data.user, response.data.token)
        toast.success('Account created successfully')
        navigate('/')
        return response.data
      } catch (error) {
        toast.error('Registration failed')
        throw error
      }
    },
    [login, navigate],
  )

  const signOut = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  const refreshProfile = useCallback(async () => {
    try {
      const response = await authApi.profile()
      setUser(response.data)
    } catch {
      // Ignore profile refresh errors
    }
  }, [setUser])

  return {
    user,
    token,
    isAuthenticated,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    refreshProfile,
  }
}
