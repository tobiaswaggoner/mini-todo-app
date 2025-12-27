"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CategoryColorMapping } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'

const SCHEMA = 'mini_todo'

export function useCategoryColors() {
  const [categoryColorMappings, setCategoryColorMappings] = useState<CategoryColorMapping[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch category colors
  const fetchCategoryColors = useCallback(async () => {
    if (!user) {
      setCategoryColorMappings([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('category_colors')
      .select('*')

    if (!error && data) {
      setCategoryColorMappings(data.map(row => ({
        category: row.category,
        colorIndex: row.color_index,
      })))
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchCategoryColors()
  }, [fetchCategoryColors])

  // Update all category colors
  const setCategoryColorMappingsWithSync = useCallback(async (
    newMappings: CategoryColorMapping[]
  ) => {
    if (!user) return

    // Optimistic update
    setCategoryColorMappings(newMappings)

    // Delete all existing and insert new
    await supabase.schema(SCHEMA).from('category_colors').delete().eq('user_id', user.id)

    if (newMappings.length > 0) {
      const { error } = await supabase.schema(SCHEMA).from('category_colors').insert(
        newMappings.map(m => ({
          user_id: user.id,
          category: m.category,
          color_index: m.colorIndex,
        }))
      )

      if (error) {
        console.error('Error syncing category colors:', error)
        fetchCategoryColors()
      }
    }
  }, [user, supabase, fetchCategoryColors])

  return {
    categoryColorMappings,
    loading,
    setCategoryColorMappings: setCategoryColorMappingsWithSync,
  }
}
