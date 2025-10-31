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

    const { vehicleData } = await req.json()

    console.log('🚗 Submitting vehicle via Edge Function:', vehicleData.title)
    console.log('📸 Processing images:', vehicleData.imageData?.length || 0)
    console.log('🏠 Home vehicles received:', vehicleData.home_vehicles?.length || 0)
    console.log('🏠 Home vehicles data:', JSON.stringify(vehicleData.home_vehicles, null, 2))

    // Validate required fields
    if (!vehicleData.posted_by || !vehicleData.title || !vehicleData.make || !vehicleData.model || !vehicleData.year || !vehicleData.price) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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
      .eq('id', vehicleData.posted_by)
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

    // Process images if provided
    let imageUrls: string[] = []
    
    if (vehicleData.imageData && Array.isArray(vehicleData.imageData) && vehicleData.imageData.length > 0) {
      console.log('📤 Uploading', vehicleData.imageData.length, 'images to storage...')
      
      for (let i = 0; i < vehicleData.imageData.length; i++) {
        const imageInfo = vehicleData.imageData[i]
        
        try {
          // Generate unique filename
          const timestamp = Date.now()
          const randomId = Math.random().toString(36).substring(2, 15)
          const fileExtension = imageInfo.type.split('/')[1] || 'jpg'
          const fileName = `vehicle-${vehicleData.posted_by}-${timestamp}-${randomId}.${fileExtension}`
          
          console.log(`📤 Uploading image ${i + 1}/${vehicleData.imageData.length}: ${fileName}`)
          
          // Convert base64 to Uint8Array
          const imageBuffer = Uint8Array.from(atob(imageInfo.data), c => c.charCodeAt(0))
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(`vehicles/${fileName}`, imageBuffer, {
              contentType: imageInfo.type,
              upsert: false
            })

          if (uploadError) {
            console.error(`❌ Upload failed for image ${i + 1}:`, uploadError)
            continue // Skip this image but continue with others
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(`vehicles/${fileName}`)

          if (urlData?.publicUrl) {
            imageUrls.push(urlData.publicUrl)
            console.log(`✅ Image ${i + 1} uploaded successfully:`, urlData.publicUrl)
          }

        } catch (imageError) {
          console.error(`❌ Error processing image ${i + 1}:`, imageError)
          continue // Skip this image but continue with others
        }
      }
      
      console.log(`✅ Successfully uploaded ${imageUrls.length}/${vehicleData.imageData.length} images`)
    }

    // Insert vehicle with service role permissions (bypasses RLS)
    const { data: insertedVehicle, error: insertError } = await supabase
      .from('vehicle_listings')
      .insert([{
        posted_by: vehicleData.posted_by,
        title: vehicleData.title.trim(),
        make: vehicleData.make.trim(),
        model: vehicleData.model.trim(),
        year: parseInt(vehicleData.year),
        price: parseInt(vehicleData.price),
        location: vehicleData.location?.trim() || null,
        vehicle_type: vehicleData.vehicle_type || 'car',
        description: vehicleData.description?.trim() || null,
        mileage: vehicleData.mileage ? parseInt(vehicleData.mileage) : null,
        fuel_type: vehicleData.fuel_type || null,
        transmission: vehicleData.transmission || null,
        body_type: vehicleData.body_type || null,
        color: vehicleData.color || null,
        engine_capacity: vehicleData.engine_capacity ? parseInt(vehicleData.engine_capacity) : null,
        registration_year: vehicleData.registration_year ? parseInt(vehicleData.registration_year) : null,
        ownership: vehicleData.ownership || '1',
        insurance_validity: vehicleData.insurance_validity || null,
        // Enhanced fields
        num_owners: vehicleData.num_owners || 1,
        insurance_expiry: vehicleData.insurance_expiry || null,
        accident_history: vehicleData.accident_history || 'none',
        claim_history: vehicleData.claim_history || 'none',
        seller_type: vehicleData.seller_type || 'owner',
        registration_state: vehicleData.registration_state || null,
        other_state_registered: vehicleData.other_state_registered || false,
        fitness_valid_until: vehicleData.fitness_valid_until || null,
        pollution_valid_until: vehicleData.pollution_valid_until || null,
        service_history: vehicleData.service_history || 'complete',
        tyres_condition: vehicleData.tyres_condition || 'good',
        exterior_condition: vehicleData.exterior_condition || 'good',
        interior_condition: vehicleData.interior_condition || 'good',
        engine_condition: vehicleData.engine_condition || 'good',
        parking_type: vehicleData.parking_type || 'covered',
        duplicate_key: vehicleData.duplicate_key || false,
        loan_available: vehicleData.loan_available || false,
        exchange_accepted: vehicleData.exchange_accepted || false,
        negotiable: vehicleData.negotiable !== undefined ? vehicleData.negotiable : true,
        test_drive_available: vehicleData.test_drive_available !== undefined ? vehicleData.test_drive_available : true,
        additional_notes: vehicleData.additional_notes?.trim() || null,
        contact_number: vehicleData.contact_number?.trim() || null,
        status: 'pending', // Always set to pending for admin approval
        premium: false,
        images: imageUrls, // Use the uploaded image URLs
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id, title, status')
      .single()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to submit vehicle listing',
          details: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Vehicle submitted successfully with ID:', insertedVehicle.id, 'Status:', insertedVehicle.status)
    console.log('📸 Images saved:', imageUrls.length, 'URLs')

    // Save home vehicles data if provided - ENHANCED VERSION WITH DETAILED LOGGING
    let homeVehiclesSaved = 0
    if (vehicleData.home_vehicles && Array.isArray(vehicleData.home_vehicles) && vehicleData.home_vehicles.length > 0) {
      console.log('🏠 Processing', vehicleData.home_vehicles.length, 'home vehicles...')
      console.log('🏠 Raw home vehicles data:', JSON.stringify(vehicleData.home_vehicles, null, 2))
      
      // Check table structure first
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('house_vehicles')
          .select('*')
          .limit(1)
        console.log('🏠 Table structure check - Data:', tableCheck, 'Error:', tableError)
      } catch (e) {
        console.log('🏠 Table check error:', e)
      }
      
      const homeVehiclesData = vehicleData.home_vehicles
        .filter((hv: any) => {
          const isValid = hv.make && hv.model && hv.year && hv.registration_number
          console.log(`🏠 Vehicle validation - Make: "${hv.make}", Model: "${hv.model}", Year: "${hv.year}", Reg: "${hv.registration_number}", Valid: ${isValid}`)
          return isValid
        })
        .map((hv: any, index: number) => {
          const mappedVehicle = {
            user_id: vehicleData.posted_by,
            vehicle_listing_id: insertedVehicle.id,
            vehicle_type: hv.vehicle_type || 'car',
            make: hv.make.trim(),
            model: hv.model.trim(),
            year: parseInt(hv.year),
            registration_number: hv.registration_number.trim().toUpperCase(),
            vehicle_name: `${hv.make.trim()} ${hv.model.trim()}`,
            status: 'active',
            purchase_price: null,
            current_value: null,
            created_at: new Date().toISOString()
          }
          console.log(`🏠 Mapped vehicle ${index + 1}:`, JSON.stringify(mappedVehicle, null, 2))
          return mappedVehicle
        })

      console.log(`🏠 Filtered and mapped ${homeVehiclesData.length} valid home vehicles`)

      if (homeVehiclesData.length > 0) {
        console.log('🏠 Inserting home vehicles into house_vehicles table...')
        console.log('🏠 Final data to insert:', JSON.stringify(homeVehiclesData, null, 2))
        
        try {
          const { data: insertedHomeVehicles, error: homeVehiclesError } = await supabase
            .from('house_vehicles')
            .insert(homeVehiclesData)
            .select('*')

          if (homeVehiclesError) {
            console.error('❌ Failed to save home vehicles:', homeVehiclesError)
            console.error('❌ Error details:', JSON.stringify(homeVehiclesError, null, 2))
            console.error('❌ Data that failed to insert:', JSON.stringify(homeVehiclesData, null, 2))
            
            // Try inserting one by one to identify problematic records
            console.log('🏠 Attempting individual inserts...')
            for (let i = 0; i < homeVehiclesData.length; i++) {
              try {
                const { data: singleInsert, error: singleError } = await supabase
                  .from('house_vehicles')
                  .insert([homeVehiclesData[i]])
                  .select('*')
                
                if (singleError) {
                  console.error(`❌ Failed to insert vehicle ${i + 1}:`, singleError)
                  console.error(`❌ Problematic data:`, JSON.stringify(homeVehiclesData[i], null, 2))
                } else {
                  console.log(`✅ Successfully inserted vehicle ${i + 1}:`, singleInsert)
                  homeVehiclesSaved++
                }
              } catch (singleInsertError) {
                console.error(`❌ Exception inserting vehicle ${i + 1}:`, singleInsertError)
              }
            }
          } else {
            console.log(`✅ Successfully saved ${homeVehiclesData.length} home vehicles to house_vehicles table`)
            console.log('✅ Inserted home vehicles details:', JSON.stringify(insertedHomeVehicles, null, 2))
            homeVehiclesSaved = homeVehiclesData.length
          }
        } catch (insertException) {
          console.error('❌ Exception during home vehicles insert:', insertException)
        }
      } else {
        console.log('⚠️ No valid home vehicles to save (missing required fields)')
        console.log('⚠️ Original data received:', JSON.stringify(vehicleData.home_vehicles, null, 2))
      }
    } else {
      console.log('ℹ️ No home vehicles provided in the request')
      console.log('ℹ️ vehicleData.home_vehicles value:', vehicleData.home_vehicles)
    }

    // Log the activity for admin tracking
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          action: `User ${user.name} submitted vehicle: ${vehicleData.title}`,
          user_id: vehicleData.posted_by,
          target_type: 'vehicle_listing',
          target_id: insertedVehicle.id,
          details: `Vehicle submission: ${vehicleData.make} ${vehicleData.model} (${vehicleData.year}) - ₹${vehicleData.price} with ${imageUrls.length} images and ${homeVehiclesSaved} home vehicles`,
          created_at: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError)
      // Don't fail the main operation for logging errors
    }

    // Send notification to user (optional)
    try {
      await supabase
        .from('notifications')
        .insert([{
          user_id: vehicleData.posted_by,
          message: `Your vehicle listing "${vehicleData.title}" has been submitted for admin review. You'll be notified once it's approved.`,
          related_id: insertedVehicle.id,
          related_type: 'vehicle_listing',
          status: 'unseen',
          created_at: new Date().toISOString()
        }])
    } catch (notifError) {
      console.warn('⚠️ Failed to send notification:', notifError)
      // Don't fail the main operation for notification errors
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        vehicleId: insertedVehicle.id,
        status: insertedVehicle.status,
        imagesUploaded: imageUrls.length,
        homeVehiclesSaved: homeVehiclesSaved,
        message: 'Vehicle listing submitted successfully for admin review. You will be notified once approved.'
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