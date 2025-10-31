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
      throw new Error('Only super admins can delete admin users');
    }

    const { adminId } = await req.json();

    if (!adminId) {
      throw new Error('Admin ID is required');
    }

    // Prevent deleting yourself
    const { data: targetAdmin, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('auth_user_id, email')
      .eq('id', adminId)
      .single();

    if (fetchError || !targetAdmin) {
      throw new Error('Admin not found');
    }

    if (targetAdmin.auth_user_id === user.id) {
      throw new Error('Cannot delete your own admin account');
    }

    // Delete from Supabase Auth (will cascade delete from admin_users)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
      targetAdmin.auth_user_id
    );

    if (deleteAuthError) {
      throw new Error(`Failed to delete admin: ${deleteAuthError.message}`);
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'admin_deleted',
      details: `Deleted admin: ${targetAdmin.email}`,
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