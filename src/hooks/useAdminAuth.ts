
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useActivityLogger } from './useActivityLogger';

interface AdminUser {
  id: string
  email: string
  name: string
  is_super_admin: boolean
  status: string
  auth_user_id?: string
  role?: string
}

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        // Check Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get admin data from admin_users table
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .eq('status', 'active')
            .single()

          if (adminError || !adminData) {
            console.warn('No admin record found for authenticated user')
            await supabase.auth.signOut()
            localStorage.removeItem('admin_user')
          } else {
            setAdminUser(adminData)
            localStorage.setItem('admin_user', JSON.stringify(adminData))
          }
        } else {
          localStorage.removeItem('admin_user')
        }
      } catch (error) {
        console.warn('Admin session check failed:', error)
        localStorage.removeItem('admin_user')
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    checkAdminSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setAdminUser(null)
        localStorage.removeItem('admin_user')
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .eq('status', 'active')
          .single()

        if (adminData) {
          setAdminUser(adminData)
          localStorage.setItem('admin_user', JSON.stringify(adminData))
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const { logAdminLogin } = useActivityLogger();

  const adminSignIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const cleanEmail = email.trim().toLowerCase()
      const cleanPassword = password.trim()
      
      console.log('🔐 Admin login attempt for:', cleanEmail)
      
      // Sign in with Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (authError) {
        console.error('❌ Auth error:', authError)
        setError('Invalid admin credentials')
        return { data: null, error: authError }
      }

      if (!authData.user) {
        console.error('❌ No user data returned')
        setError('Invalid admin credentials')
        return { data: null, error: new Error('No user data') }
      }

      console.log('✅ Auth successful, checking admin status...')

      // Check if authenticated user is an admin
      const { data: adminData, error: queryError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', cleanEmail)
        .eq('status', 'active')
        .single()

      if (queryError || !adminData) {
        console.error('❌ Admin not found or inactive:', queryError)
        // Sign out the user since they're not an admin
        await supabase.auth.signOut()
        setError('Invalid admin credentials')
        return { data: null, error: new Error('Invalid admin credentials') }
      }

      console.log('✅ Admin login successful:', adminData.name)
      
      // Update last login time
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminData.id)

      // Log the admin login activity
      try {
        await logAdminLogin(adminData);
      } catch (logError) {
        console.warn('⚠️ Failed to log admin login activity:', logError);
      }

      // Store admin session data
      const adminSession = {
        id: adminData.id,
        name: adminData.name,
        email: adminData.email,
        is_super_admin: adminData.is_super_admin,
        status: adminData.status,
        last_login_at: new Date().toISOString()
      }

      setAdminUser(adminSession)
      localStorage.setItem('admin_session', JSON.stringify(adminSession))

      return { data: adminSession, error: null }
    } catch (error: any) {
      console.error('❌ Admin sign in error:', error)
      setError('Login failed. Please try again.')
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  const adminSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setAdminUser(null);
      window.REACT_APP_NAVIGATE('/admin-login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetUserPassword = async (userId: string, newPassword: string) => {
    if (!adminUser) throw new Error('Admin not authenticated')

    try {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPassword })
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logActivity = async (action: string, targetType?: string, targetId?: string, details?: any) => {
    if (!adminUser) return

    try {
      await supabase
        .from('activity_logs')
        .insert([{
          admin_id: adminUser.id,
          action,
          target_type: targetType || null,
          target_id: targetId || null,
          details: details || null,
          created_at: new Date().toISOString()
        }])
    } catch (error) {
      console.warn('Failed to log activity:', error)
    }
  }

  return {
    adminUser,
    isLoading,
    isInitialized,
    error,
    adminSignIn,
    adminSignOut,
    resetUserPassword,
    logActivity,
  }
}
