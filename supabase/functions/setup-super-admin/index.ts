import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { email, password, name } = await req.json()

    console.log('🔧 Setting up super admin:', email)

    // Validate input
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if super admin already exists
    const { data: existingSuperAdmin } = await supabase
      .from('admin_users')
      .select('id, email, name')
      .eq('is_super_admin', true)
      .maybeSingle()

    if (existingSuperAdmin) {
      return new Response(
        JSON.stringify({ 
          error: 'A super admin already exists',
          details: `Super admin "${existingSuperAdmin.name}" (${existingSuperAdmin.email}) is already set up. Please delete them first if you want to create a new one.`,
          existingAdmin: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email already exists in auth
    console.log('🔍 Checking if email exists in auth...')
    const { data: existingAuthUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check existing users',
          details: listError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailExists = existingAuthUsers.users.some(u => u.email === email)

    if (emailExists) {
      return new Response(
        JSON.stringify({ 
          error: 'Email already exists',
          details: `An account with email "${email}" already exists in authentication. Please use a different email or delete the existing account first.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth user with Supabase Auth (password will be hashed automatically)
    console.log('🔧 Creating auth user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'super_admin'
      }
    })

    if (authError) {
      console.error('❌ Auth user creation failed:', authError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create authentication account',
          details: authError.message,
          code: authError.code,
          status: authError.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authUser.user) {
      console.error('❌ No user returned from auth creation')
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create authentication account',
          details: 'No user object returned from Supabase Auth'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Auth user created:', authUser.user.id)

    // Create admin record in admin_users table
    console.log('🔧 Creating admin record...')
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert([{
        auth_user_id: authUser.user.id,
        email: email,
        name: name,
        is_super_admin: true,
        role: 'super_admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (adminError) {
      console.error('❌ Admin user creation failed:', adminError)
      
      // Rollback: Delete the auth user if admin creation fails
      console.log('🔄 Rolling back auth user...')
      await supabase.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create admin record',
          details: adminError.message,
          hint: adminError.hint,
          code: adminError.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Super admin created successfully:', adminUser.id)

    // Log the activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          action: `Super admin account created: ${name} (${email})`,
          user_id: authUser.user.id,
          target_type: 'admin_user',
          target_id: adminUser.id,
          details: 'Initial super admin setup via setup function',
          created_at: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Super admin created successfully! You can now login at /admin-login',
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Setup super admin error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})