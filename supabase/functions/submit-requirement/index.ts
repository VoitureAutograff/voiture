import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { requirementData } = await req.json()

    console.log('📝 Submitting requirement via Edge Function:', requirementData)

    // Validate required fields
    if (!requirementData.posted_by || !requirementData.vehicle_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: posted_by, vehicle_type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify user exists and is active
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, status')
      .eq('id', requirementData.posted_by)
      .eq('status', 'active')
      .single()

    if (userError || !user) {
      console.error('❌ User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive user' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Combine description and additional requirements
    let combinedDescription = requirementData.description?.trim() || '';
    if (requirementData.additional_requirements?.trim()) {
      combinedDescription += (combinedDescription ? '\n\nAdditional Requirements: ' : '') + requirementData.additional_requirements.trim();
    }

    // Insert requirement with service role permissions (bypasses RLS)
    const { data: insertedRequirement, error: insertError } = await supabase
      .from('requirements')
      .insert([{
        posted_by: requirementData.posted_by,
        vehicle_type: requirementData.vehicle_type,
        make: requirementData.make?.trim() || null,
        model: requirementData.model?.trim() || null,
        price_range_min: requirementData.price_range_min ? parseInt(requirementData.price_range_min) : null,
        price_range_max: requirementData.price_range_max ? parseInt(requirementData.price_range_max) : null,
        year_range_min: requirementData.year_range_min ? parseInt(requirementData.year_range_min) : null,
        year_range_max: requirementData.year_range_max ? parseInt(requirementData.year_range_max) : null,
        location: requirementData.location?.trim() || null,
        description: combinedDescription || null,
        // Contact information (admin-only fields)
        contact_name: requirementData.contact_name?.trim() || null,
        contact_number: requirementData.contact_number?.trim() || null,
        contact_email: requirementData.contact_email?.trim() || null,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id, vehicle_type, status')
      .single()

    if (insertError) {
      console.error('❌ Requirement insert error:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to submit requirement',
          details: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Requirement submitted successfully with ID:', insertedRequirement.id)

    // Log the activity for admin tracking
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          action: `User ${user.name} submitted requirement: ${requirementData.vehicle_type}`,
          user_id: requirementData.posted_by,
          target_type: 'requirement',
          target_id: insertedRequirement.id,
          details: `Requirement: ${requirementData.vehicle_type} - ${requirementData.make || 'Any'} ${requirementData.model || 'Any'}`,
          created_at: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError)
    }

    // Send notification to user (optional)
    try {
      await supabase
        .from('notifications')
        .insert([{
          user_id: requirementData.posted_by,
          message: `Your ${requirementData.vehicle_type} requirement has been posted successfully. Sellers can now contact you.`,
          related_id: insertedRequirement.id,
          related_type: 'requirement',
          status: 'unseen',
          created_at: new Date().toISOString()
        }])
    } catch (notifError) {
      console.warn('⚠️ Failed to send notification:', notifError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        requirementId: insertedRequirement.id,
        status: insertedRequirement.status,
        message: 'Requirement posted successfully! Sellers can now contact you.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})