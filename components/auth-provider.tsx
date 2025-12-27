"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthResult {
  error?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>
  resetPasswordForEmail: (email: string) => Promise<AuthResult>
  updatePassword: (newPassword: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }

  const signInWithPassword = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }

  const resetPasswordForEmail = async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }

  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithGoogle,
      signInWithGitHub,
      signUp,
      signInWithPassword,
      resetPasswordForEmail,
      updatePassword,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
