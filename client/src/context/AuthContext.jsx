import React, { createContext, useContext, useState } from 'react'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const AuthContext = createContext(null)
const TOKEN_KEY = 'quick-ai-token'
const USER_KEY = 'quick-ai-user'

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)

  const saveSession = (session) => {
    localStorage.setItem(TOKEN_KEY, session.token)
    localStorage.setItem(USER_KEY, JSON.stringify(session.user))
    setToken(session.token)
    setUser(session.user)
  }

  const login = async (credentials) => {
    const { data } = await axios.post('/api/auth/login', credentials)
    if (!data.success) throw new Error(data.message)
    saveSession(data)
  }

  const register = async (credentials) => {
    const { data } = await axios.post('/api/auth/register', credentials)
    if (!data.success) throw new Error(data.message)
    saveSession(data)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const getToken = async () => token

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const { user } = useAuth()
  return { user }
}
