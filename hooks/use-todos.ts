"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Todo } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'

const SCHEMA = 'mini_todo'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    if (!user) {
      setTodos([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('todos')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setTodos(data.map(row => ({
        id: row.id,
        description: row.description,
        category: row.category,
        duration: row.duration,
        fixedTime: row.fixed_time ?? undefined,
        active: row.active,
      })))
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // Update all todos (handles reordering and batch updates)
  const setTodosWithSync = useCallback(async (newTodos: Todo[]) => {
    if (!user) return

    // Optimistic update
    setTodos(newTodos)

    // Find todos to delete (in current state but not in new state)
    const newIds = new Set(newTodos.map(t => t.id))
    const currentIds = todos.map(t => t.id)
    const toDelete = currentIds.filter(id => !newIds.has(id))

    // Delete removed todos
    if (toDelete.length > 0) {
      await supabase.schema(SCHEMA).from('todos').delete().in('id', toDelete)
    }

    // Upsert all current todos
    if (newTodos.length > 0) {
      const updates = newTodos.map((todo, index) => ({
        id: todo.id,
        user_id: user.id,
        description: todo.description,
        category: todo.category,
        duration: todo.duration,
        fixed_time: todo.fixedTime ?? null,
        active: todo.active,
        sort_order: index,
      }))

      const { error } = await supabase
        .schema(SCHEMA)
        .from('todos')
        .upsert(updates, { onConflict: 'id' })

      if (error) {
        console.error('Error syncing todos:', error)
        fetchTodos() // Revert on error
      }
    }
  }, [user, todos, supabase, fetchTodos])

  return {
    todos,
    loading,
    setTodos: setTodosWithSync,
    refetch: fetchTodos,
  }
}
