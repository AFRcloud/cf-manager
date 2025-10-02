"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
}

interface CloudflareAccount {
  id: string
  name: string
  email: string
  apiKey: string
  apiType: "global" | "token" // Added apiType field
  accountId: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  cloudflareAccounts: CloudflareAccount[]
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  addCloudflareAccount: (account: Omit<CloudflareAccount, "id">) => Promise<void>
  removeCloudflareAccount: (id: string) => Promise<void>
  updateCloudflareAccount: (id: string, updates: Partial<CloudflareAccount>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [cloudflareAccounts, setCloudflareAccounts] = useState<CloudflareAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        // Simulate checking for existing session
        const savedUser = localStorage.getItem("user")
        const savedAccounts = localStorage.getItem("cloudflareAccounts")

        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }

        if (savedAccounts) {
          setCloudflareAccounts(JSON.parse(savedAccounts))
        }
      } catch (error) {
        console.error("[v0] Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const savedUsers = localStorage.getItem("registeredUsers")
      const registeredUsers = savedUsers ? JSON.parse(savedUsers) : []

      const existingUser = registeredUsers.find((u: any) => u.email === email && u.password === password)

      if (!existingUser) {
        throw new Error("Invalid credentials")
      }

      const mockUser: User = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))

      console.log("[v0] User logged in:", mockUser)
    } catch (error) {
      console.error("[v0] Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const savedUsers = localStorage.getItem("registeredUsers")
      const registeredUsers = savedUsers ? JSON.parse(savedUsers) : []

      const existingUser = registeredUsers.find((u: any) => u.email === email)
      if (existingUser) {
        throw new Error("User already exists")
      }

      const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password, // In real app, this would be hashed
      }

      const updatedUsers = [...registeredUsers, newUser]
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))

      const mockUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))

      console.log("[v0] User registered:", mockUser)
    } catch (error) {
      console.error("[v0] Registration failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setCloudflareAccounts([])
    localStorage.removeItem("user")
    localStorage.removeItem("cloudflareAccounts")
    console.log("[v0] User logged out")
  }

  const addCloudflareAccount = async (account: Omit<CloudflareAccount, "id">) => {
    try {
      const newAccount: CloudflareAccount = {
        ...account,
        id: Date.now().toString(),
      }

      const updatedAccounts = [...cloudflareAccounts, newAccount]
      setCloudflareAccounts(updatedAccounts)
      localStorage.setItem("cloudflareAccounts", JSON.stringify(updatedAccounts))

      console.log("[v0] Cloudflare account added:", newAccount)
    } catch (error) {
      console.error("[v0] Failed to add Cloudflare account:", error)
      throw error
    }
  }

  const removeCloudflareAccount = async (id: string) => {
    try {
      const updatedAccounts = cloudflareAccounts.filter((account) => account.id !== id)
      setCloudflareAccounts(updatedAccounts)
      localStorage.setItem("cloudflareAccounts", JSON.stringify(updatedAccounts))

      console.log("[v0] Cloudflare account removed:", id)
    } catch (error) {
      console.error("[v0] Failed to remove Cloudflare account:", error)
      throw error
    }
  }

  const updateCloudflareAccount = async (id: string, updates: Partial<CloudflareAccount>) => {
    try {
      const updatedAccounts = cloudflareAccounts.map((account) =>
        account.id === id ? { ...account, ...updates } : account,
      )
      setCloudflareAccounts(updatedAccounts)
      localStorage.setItem("cloudflareAccounts", JSON.stringify(updatedAccounts))

      console.log("[v0] Cloudflare account updated:", { id, updates })
    } catch (error) {
      console.error("[v0] Failed to update Cloudflare account:", error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    cloudflareAccounts,
    isLoading,
    login,
    register,
    logout,
    addCloudflareAccount,
    removeCloudflareAccount,
    updateCloudflareAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
