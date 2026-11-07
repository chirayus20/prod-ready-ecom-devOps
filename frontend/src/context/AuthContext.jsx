import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sv_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { user: u, token } = res.data.data
    localStorage.setItem('sv_token', token)
    localStorage.setItem('sv_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const register = async (data) => {
    const res = await authAPI.register(data)
    const { user: u, token } = res.data.data
    localStorage.setItem('sv_token', token)
    localStorage.setItem('sv_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('sv_token')
    localStorage.removeItem('sv_user')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const res = await authAPI.getProfile()
      const u = res.data.data.user
      localStorage.setItem('sv_user', JSON.stringify(u))
      setUser(u)
    } catch {
      logout()
    }
  }

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, refreshUser,
      isAdmin, isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
