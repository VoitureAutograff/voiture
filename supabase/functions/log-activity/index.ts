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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, target_type, target_id, details, user_type = 'user' } = await req.json()

    // Get user agent and IP from headers
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'Unknown'

    // Determine if this is an admin or regular user
    let isAdmin = false
    let adminData = null
    let userData = null

    if (user_type === 'admin') {
      // Check if user is admin
      const { data: admin } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'active')
        .single()
      
      if (admin) {
        isAdmin = true
        adminData = admin
      }
    } else {
      // Get regular user data
      const { data: regularUser } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single()
      
      if (regularUser) {
        userData = regularUser
      }
    }

    // Insert activity log
    const logEntry = {
      action,
      target_type: target_type || null,
      target_id: target_id || null,
      details: {
        ...details,
        user_name: isAdmin ? adminData?.name : userData?.name,
        user_email: user.email,
        timestamp: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress
      },
      user_type: isAdmin ? 'admin' : 'user',
      admin_id: isAdmin ? adminData?.id : null,
      user_id: !isAdmin ? userData?.id : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    }

    const { error: insertError } = await supabaseClient
      .from('activity_logs')
      .insert([logEntry])

    if (insertError) {
      console.error('Failed to insert activity log:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to log activity' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Activity logged successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Activity logging error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})