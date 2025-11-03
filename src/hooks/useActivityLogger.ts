
import { supabase } from '../lib/supabase';

interface ActivityLogData {
  action: string;
  target_type?: string;
  target_id?: string | null;
  details?: any;
  user_type?: 'admin' | 'user';
}

export function useActivityLogger() {
  const logActivity = async (data: ActivityLogData) => {
    try {
      console.log('🔄 Starting activity log:', data.action);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('❌ No session found for activity logging');
        return;
      }

      // Get current user information
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('❌ No user found for activity logging');
        return;
      }

      console.log('👤 User found for logging:', user.email);

      // Check if user is admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'active')
        .single();

      // Check if user is regular user
      const { data: regularUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      const isAdmin = !!adminUser && !adminError;
      const currentUser = isAdmin ? adminUser : regularUser;

      console.log('🔍 User type determined:', {
        isAdmin,
        hasAdminUser: !!adminUser,
        hasRegularUser: !!regularUser,
        adminError: adminError?.message,
        userError: userError?.message
      });

      if (!currentUser) {
        console.warn('❌ User not found in database for activity logging');
        return;
      }

      // Get additional context
      const userAgent = navigator.userAgent || 'Unknown';
      const timestamp = new Date().toISOString();

      // Prepare log entry
      const logEntry = {
        action: data.action,
        target_type: data.target_type || null,
        target_id: data.target_id || null,
        details: {
          ...data.details,
          user_name: currentUser.name,
          user_email: currentUser.email,
          timestamp,
          user_agent: userAgent,
          action_context: data.user_type || (isAdmin ? 'admin' : 'user')
        },
        user_type: isAdmin ? 'admin' : 'user',
        admin_id: isAdmin ? currentUser.id : null,
        user_id: !isAdmin ? currentUser.id : null,
        user_name: currentUser.name,
        user_email: currentUser.email,
        ip_address: null, // Will be set by edge function if available
        user_agent: userAgent,
        created_at: timestamp
      };

      console.log('📝 Prepared log entry:', {
        action: logEntry.action,
        user_type: logEntry.user_type,
        user_name: logEntry.user_name,
        target_type: logEntry.target_type
      });

      // Try direct database insert first
      const { data: insertData, error: insertError } = await supabase
        .from('activity_logs')
        .insert([logEntry])
        .select()
        .single();

      if (insertError) {
        console.warn('⚠️ Direct insert failed, trying edge function:', insertError.message);
        
        // Fallback: try using the edge function
        try {
          const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/log-activity`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              ...data,
              user_type: isAdmin ? 'admin' : 'user'
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.warn('❌ Edge function also failed:', errorText);
          } else {
            const result = await response.json();
            console.log('✅ Activity logged via edge function:', result);
          }
        } catch (edgeFunctionError) {
          console.warn('❌ Edge function error:', edgeFunctionError);
        }
      } else {
        console.log('✅ Activity logged successfully via direct insert:', insertData);
      }
    } catch (error) {
      console.warn('❌ Activity logging error:', error);
    }
  };

  // Enhanced logging functions with better error handling
  const logAdminAction = (action: string, targetType?: string, targetId?: string, details?: any) => {
    logActivity({
      action,
      target_type: targetType,
      target_id: targetId,
      details: {
        ...details,
        action_type: 'admin_action',
        timestamp: new Date().toISOString()
      },
      user_type: 'admin'
    });
  };

  const logVehicleApproval = (vehicleId: string, vehicleDetails: any, approved: boolean) => {
    logAdminAction(
      `Vehicle ${approved ? 'approved' : 'rejected'}: ${vehicleDetails.title}`,
      'vehicle_listing',
      vehicleId,
      {
        action_type: approved ? 'vehicle_approval' : 'vehicle_rejection',
        vehicle_title: vehicleDetails.title,
        vehicle_make: vehicleDetails.make,
        vehicle_model: vehicleDetails.model,
        vehicle_price: vehicleDetails.price,
        seller_name: vehicleDetails.seller_name,
        seller_email: vehicleDetails.seller_email
      }
    );
  };

  const logVehicleEdit = (vehicleId: string, vehicleDetails: any, changes: any) => {
    logAdminAction(
      `Vehicle edited: ${vehicleDetails.title}`,
      'vehicle_listing',
      vehicleId,
      {
        action_type: 'vehicle_edit',
        vehicle_title: vehicleDetails.title,
        changes: changes,
        edited_by_admin: true
      }
    );
  };

  const logRequirementEdit = (requirementId: string, requirementDetails: any, changes: any) => {
    logAdminAction(
      `Requirement edited: ${requirementDetails.vehicle_type} - ${requirementDetails.make || 'Any'}`,
      'requirement',
      requirementId,
      {
        action_type: 'requirement_edit',
        vehicle_type: requirementDetails.vehicle_type,
        make: requirementDetails.make,
        changes: changes,
        edited_by_admin: true
      }
    );
  };

  const logAdminLogin = (adminDetails: any) => {
    logAdminAction(
      `Admin logged in: ${adminDetails.name}`,
      'admin_user',
      adminDetails.id,
      {
        action_type: 'admin_login',
        admin_name: adminDetails.name,
        admin_email: adminDetails.email,
        is_super_admin: adminDetails.is_super_admin
      }
    );
  };

  const logDataDeletion = (itemType: string, itemId: string, itemDetails: any) => {
    logAdminAction(
      `${itemType} deleted: ${itemDetails.title || itemDetails.name || itemId}`,
      itemType,
      itemId,
      {
        action_type: 'data_deletion',
        deleted_item_type: itemType,
        deleted_item_details: itemDetails
      }
    );
  };

  // Specific logging functions for common actions
  const logUserRegistration = (userId: string, userDetails: any) => {
    logActivity({
      action: `New user registered: ${userDetails.name}`,
      target_type: 'user',
      target_id: userId,
      details: {
        action_type: 'registration',
        user_name: userDetails.name,
        user_email: userDetails.email,
        user_phone: userDetails.phone,
        user_city: userDetails.city
      },
      user_type: 'user'
    });
  };

  const logUserLogin = (userDetails: any) => {
    logActivity({
      action: `User logged in: ${userDetails.name}`,
      target_type: 'user',
      target_id: userDetails.id,
      details: {
        action_type: 'login',
        user_name: userDetails.name,
        user_email: userDetails.email
      },
      user_type: 'user'
    });
  };

  const logVehiclePosted = (vehicleId: string, vehicleDetails: any) => {
    logActivity({
      action: `Vehicle posted: ${vehicleDetails.title}`,
      target_type: 'vehicle_listing',
      target_id: vehicleId,
      details: {
        action_type: 'vehicle_post',
        vehicle_title: vehicleDetails.title,
        vehicle_make: vehicleDetails.make,
        vehicle_model: vehicleDetails.model,
        vehicle_price: vehicleDetails.price,
        vehicle_year: vehicleDetails.year,
        location: vehicleDetails.location
      },
      user_type: 'user'
    });
  };

  const logVehicleUpdated = (vehicleId: string, vehicleDetails: any, changes: any) => {
    logActivity({
      action: `Vehicle updated: ${vehicleDetails.title}`,
      target_type: 'vehicle_listing',
      target_id: vehicleId,
      details: {
        action_type: 'vehicle_update',
        vehicle_title: vehicleDetails.title,
        changes: changes
      },
      user_type: 'user'
    });
  };

  const logVehicleDeleted = (vehicleId: string, vehicleDetails: any) => {
    logActivity({
      action: `Vehicle deleted: ${vehicleDetails.title}`,
      target_type: 'vehicle_listing',
      target_id: vehicleId,
      details: {
        action_type: 'vehicle_delete',
        vehicle_title: vehicleDetails.title,
        vehicle_make: vehicleDetails.make,
        vehicle_model: vehicleDetails.model
      },
      user_type: 'user'
    });
  };

  const logRequirementPosted = (requirementId: string, requirementDetails: any) => {
    logActivity({
      action: `Requirement posted: ${requirementDetails.vehicle_type} - ${requirementDetails.make}`,
      target_type: 'requirement',
      target_id: requirementId,
      details: {
        action_type: 'requirement_post',
        vehicle_type: requirementDetails.vehicle_type,
        make: requirementDetails.make,
        location: requirementDetails.location,
        price_range_min: requirementDetails.price_range_min,
        price_range_max: requirementDetails.price_range_max
      },
      user_type: 'user'
    });
  };

  const logRequirementUpdated = (requirementId: string, requirementDetails: any) => {
    logActivity({
      action: `Requirement updated: ${requirementDetails.vehicle_type} - ${requirementDetails.make}`,
      target_type: 'requirement',
      target_id: requirementId,
      details: {
        action_type: 'requirement_update',
        vehicle_type: requirementDetails.vehicle_type,
        make: requirementDetails.make,
        location: requirementDetails.location
      },
      user_type: 'user'
    });
  };

  const logFavoriteAdded = (vehicleId: string, vehicleDetails: any) => {
    logActivity({
      action: `Vehicle added to favorites: ${vehicleDetails.title}`,
      target_type: 'favorite',
      target_id: vehicleId,
      details: {
        action_type: 'favorite_add',
        vehicle_title: vehicleDetails.title,
        vehicle_make: vehicleDetails.make,
        vehicle_model: vehicleDetails.model
      },
      user_type: 'user'
    });
  };

  const logFavoriteRemoved = (vehicleId: string, vehicleDetails: any) => {
    logActivity({
      action: `Vehicle removed from favorites: ${vehicleDetails.title}`,
      target_type: 'favorite',
      target_id: vehicleId,
      details: {
        action_type: 'favorite_remove',
        vehicle_title: vehicleDetails.title,
        vehicle_make: vehicleDetails.make,
        vehicle_model: vehicleDetails.model
      },
      user_type: 'user'
    });
  };

  const logPasswordChange = (userId: string) => {
    logActivity({
      action: 'User changed password',
      target_type: 'user',
      target_id: userId,
      details: {
        action_type: 'password_change'
      },
      user_type: 'user'
    });
  };

  const logProfileUpdate = (userId: string, userDetails: any, changes: any) => {
    logActivity({
      action: `Profile updated: ${userDetails.name}`,
      target_type: 'user',
      target_id: userId,
      details: {
        action_type: 'profile_update',
        user_name: userDetails.name,
        changes: changes
      },
      user_type: 'user'
    });
  };

  const logContactFormSubmission = (formType: string, details: any) => {
    logActivity({
      action: `Contact form submitted: ${formType}`,
      target_type: 'contact_form',
      target_id: null,
      details: {
        action_type: 'contact_form_submit',
        form_type: formType,
        ...details
      },
      user_type: 'user'
    });
  };

  const logPageView = (pageName: string, pageUrl: string) => {
    logActivity({
      action: `Page viewed: ${pageName}`,
      target_type: 'page_view',
      target_id: null,
      details: {
        action_type: 'page_view',
        page_name: pageName,
        page_url: pageUrl
      },
      user_type: 'user'
    });
  };

  return {
    logActivity,
    logAdminAction,
    logVehicleApproval,
    logVehicleEdit,
    logRequirementEdit,
    logAdminLogin,
    logDataDeletion,
    logUserRegistration,
    logUserLogin,
    logVehiclePosted,
    logVehicleUpdated,
    logVehicleDeleted,
    logRequirementPosted,
    logRequirementUpdated,
    logFavoriteAdded,
    logFavoriteRemoved,
    logPasswordChange,
    logProfileUpdate,
    logContactFormSubmission,
    logPageView
  };
}
