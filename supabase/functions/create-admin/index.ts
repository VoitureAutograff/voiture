import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the requesting user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if requesting user is super admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('is_super_admin, role')
      .eq('auth_user_id', user.id)
      .single();

    if (adminError || !adminData || (!adminData.is_super_admin && adminData.role !== 'super_admin')) {
      throw new Error('Only super admins can create admin users');
    }

    const { email, password, name, isSuperAdmin } = await req.json();

    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: isSuperAdmin ? 'super_admin' : 'admin'
      }
    });

    if (createError) {
      throw new Error(`Failed to create auth user: ${createError.message}`);
    }

    // Create admin record in admin_users table
    const { data: adminUser, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        auth_user_id: newUser.user.id,
        email,
        name,
        is_super_admin: isSuperAdmin || false,
        role: isSuperAdmin ? 'super_admin' : 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: delete the auth user if admin_users insert fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to create admin record: ${insertError.message}`);
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'admin_created',
      details: `Created new ${isSuperAdmin ? 'super admin' : 'admin'}: ${email}`,
      created_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          is_super_admin: adminUser.is_super_admin
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});