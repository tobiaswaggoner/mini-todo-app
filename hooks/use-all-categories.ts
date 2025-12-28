"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'

const SCHEMA = 'mini_todo'

export function useAllCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Fetch all distinct categories from todos
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('todos')
      .select('category')

    if (!error && data) {
      const uniqueCategories = [...new Set(data.map(row => row.category))]
        .filter(Boolean)
        .sort()
      setCategories(uniqueCategories)
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    refetch: fetchCategories,
  }
}
