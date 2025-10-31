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
      throw new Error('Only super admins can update admin users');
    }

    const { adminId, name, email, isSuperAdmin, status } = await req.json();

    if (!adminId) {
      throw new Error('Admin ID is required');
    }

    // Get the admin to update
    const { data: targetAdmin, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('auth_user_id, email')
      .eq('id', adminId)
      .single();

    if (fetchError || !targetAdmin) {
      throw new Error('Admin not found');
    }

    // Update admin_users table
    const updateData: any = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (typeof isSuperAdmin === 'boolean') {
      updateData.is_super_admin = isSuperAdmin;
      updateData.role = isSuperAdmin ? 'super_admin' : 'admin';
    }
    if (status) updateData.status = status;

    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update(updateData)
      .eq('id', adminId);

    if (updateError) {
      throw new Error(`Failed to update admin: ${updateError.message}`);
    }

    // Update Supabase Auth user if email changed
    if (email && email !== targetAdmin.email) {
      await supabaseAdmin.auth.admin.updateUserById(targetAdmin.auth_user_id, {
        email,
        email_confirm: true
      });
    }

    // Update user metadata if role changed
    if (typeof isSuperAdmin === 'boolean') {
      await supabaseAdmin.auth.admin.updateUserById(targetAdmin.auth_user_id, {
        user_metadata: {
          role: isSuperAdmin ? 'super_admin' : 'admin'
        }
      });
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'admin_updated',
      details: `Updated admin: ${email || targetAdmin.email}`,
      created_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true }),
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