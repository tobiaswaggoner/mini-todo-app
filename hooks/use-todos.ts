"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Todo } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'

const SCHEMA = 'mini_todo'

export function useTodos(selectedDate: string) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()
  // Track current date to detect changes
  const currentDateRef = useRef(selectedDate)

  // Fetch todos for the selected date
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
      .eq('date', selectedDate)
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setTodos(data.map(row => ({
        id: row.id,
        description: row.description,
        category: row.category,
        duration: row.duration,
        fixedTime: row.fixed_time ?? undefined,
        active: row.active,
        date: row.date,
      })))
    }
    setLoading(false)
  }, [user, supabase, selectedDate])

  // Refetch when date changes
  useEffect(() => {
    if (currentDateRef.current !== selectedDate) {
      currentDateRef.current = selectedDate
    }
    fetchTodos()
  }, [fetchTodos, selectedDate])

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
        date: todo.date,
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

  // Add a single todo (convenience method for creating new todos)
  const addTodo = useCallback(async (todo: Omit<Todo, 'id'>) => {
    if (!user) return

    const newTodo: Todo = {
      ...todo,
      id: crypto.randomUUID(),
    }

    // Get the next sort order
    const maxSortOrder = todos.length > 0 ? todos.length : 0

    const { error } = await supabase
      .schema(SCHEMA)
      .from('todos')
      .insert({
        id: newTodo.id,
        user_id: user.id,
        description: newTodo.description,
        category: newTodo.category,
        duration: newTodo.duration,
        fixed_time: newTodo.fixedTime ?? null,
        active: newTodo.active,
        date: newTodo.date,
        sort_order: maxSortOrder,
      })

    if (error) {
      console.error('Error adding todo:', error)
    } else {
      // Refetch to get the new todo in the list
      fetchTodos()
    }
  }, [user, todos.length, supabase, fetchTodos])

  // Move a todo to a different date
  const moveTodoToDate = useCallback(async (todoId: string, newDate: string) => {
    if (!user) return

    // Get the max sort_order for the target date
    const { data: targetTodos } = await supabase
      .schema(SCHEMA)
      .from('todos')
      .select('sort_order')
      .eq('date', newDate)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = targetTodos && targetTodos.length > 0
      ? targetTodos[0].sort_order + 1
      : 0

    const { error } = await supabase
      .schema(SCHEMA)
      .from('todos')
      .update({ date: newDate, sort_order: nextSortOrder })
      .eq('id', todoId)

    if (error) {
      console.error('Error moving todo:', error)
    } else {
      // Refetch current date's todos
      fetchTodos()
    }
  }, [user, supabase, fetchTodos])

  return {
    todos,
    loading,
    setTodos: setTodosWithSync,
    addTodo,
    moveTodoToDate,
    refetch: fetchTodos,
  }
}
