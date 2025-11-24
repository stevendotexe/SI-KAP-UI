"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

export type UserRole = "student" | "mentor" | "admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  studentId?: string
  mentorId?: string
  department?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Mock authentication - in real app, call backend API
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Determine role based on email for demo purposes
      let role: UserRole = "student"
      if (email.includes("mentor")) role = "mentor"
      if (email.includes("admin")) role = "admin"

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: email.split("@")[0],
        email,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        studentId: role === "student" ? `STU-${Math.random().toString(36).substr(2, 5).toUpperCase()}` : undefined,
        mentorId: role === "mentor" ? `MEN-${Math.random().toString(36).substr(2, 5).toUpperCase()}` : undefined,
        department: "Information Technology",
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("user")
  }, [])

  // Restore user from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem("user")
      }
    }
  }, [])

  return <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
