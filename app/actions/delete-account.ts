"use server"

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteAccount(): Promise<{ error?: string }> {
  try {
    // Get the current user's session
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    // Use admin client to delete the user
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      return { error: 'Failed to delete account' }
    }

    // All user data is automatically deleted via ON DELETE CASCADE
    return {}
  } catch (error) {
    console.error('Delete account error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
