
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Supabase Configuration:')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables')
  throw new Error('Missing Supabase configuration')
}

// Simple Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// Test connection without timeouts
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vehicle_listings')
      .select('id')
      .limit(1);
    
    return !error
  } catch (err: any) {
    console.warn('Connection test failed:', err.message)
    return false
  }
}

// Simple file upload
export const uploadFile = async (
  bucketName: string,
  filePath: string,
  file: File
): Promise<{ data: any; error: any; publicUrl?: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { data: null, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { data, error: null, publicUrl };

  } catch (error: any) {
    return { 
      data: null, 
      error: { 
        message: error.message || 'Upload failed',
        code: 'UPLOAD_ERROR'
      }
    };
  }
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          role: 'buyer' | 'seller' | 'dealer' | 'admin'
          profile_picture: string | null
          status: 'active' | 'suspended' | 'pending'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          role?: 'buyer' | 'seller' | 'dealer' | 'admin'
          profile_picture?: string | null
          status?: 'active' | 'suspended' | 'pending'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      admin_users: {
        Row: {
          id: string
          email: string
          name: string
          password_hash: string
          is_super_admin: boolean
          status: 'active' | 'suspended'
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          password_hash: string
          is_super_admin?: boolean
          status?: 'active' | 'suspended'
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>
      }
      vehicle_listings: {
        Row: {
          id: string
          posted_by: string
          title: string
          make: string
          model: string
          year: number
          mileage: number | null
          fuel_type: string | null
          transmission: string | null
          location: string | null
          price: number
          images: string[] | null
          description: string | null
          status: 'pending' | 'active' | 'sold' | 'hidden'
          vehicle_type: 'car' | 'bike'
          premium: boolean
          created_at: string
          updated_at: string
          body_type: string | null
          color: string | null
          engine_capacity: number | null
          registration_year: number | null
          ownership: string | null
          insurance_validity: string | null
        }
        Insert: {
          id?: string
          posted_by: string
          title: string
          make: string
          model: string
          year: number
          mileage?: number | null
          fuel_type?: string | null
          transmission?: string | null
          location?: string | null
          price: number
          images?: string[] | null
          description?: string | null
          status?: 'pending' | 'active' | 'sold' | 'hidden'
          vehicle_type: 'car' | 'bike'
          premium?: boolean
          created_at?: string
          updated_at?: string
          body_type?: string | null
          color?: string | null
          engine_capacity?: number | null
          registration_year?: number | null
          ownership?: string | null
          insurance_validity?: string | null
        }
        Update: Partial<Database['public']['Tables']['vehicle_listings']['Insert']>
      }
      requirements: {
        Row: {
          id: string
          posted_by: string
          vehicle_type: 'car' | 'bike'
          make: string | null
          model: string | null
          year_range_min: number | null
          year_range_max: number | null
          price_range_min: number | null
          price_range_max: number | null
          location: string | null
          description: string | null
          status: 'pending' | 'open' | 'matched' | 'closed'
          created_at: string
        }
        Insert: {
          id?: string
          posted_by: string
          vehicle_type: 'car' | 'bike'
          make?: string | null
          model?: string | null
          year_range_min?: number | null
          year_range_max?: number | null
          price_range_min?: number | null
          price_range_max?: number | null
          location?: string | null
          description?: string | null
          status?: 'pending' | 'open' | 'matched' | 'closed'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['requirements']['Insert']>
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          related_id: string | null
          related_type: string | null
          status: 'seen' | 'unseen'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          related_id?: string | null
          related_type?: string | null
          status?: 'seen' | 'unseen'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      dealership_profiles: {
        Row: {
          id: string
          dealer_id: string
          shop_name: string
          logo: string | null
          address: string | null
          location: string | null
          description: string | null
          contact_info: any | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dealer_id: string
          shop_name: string
          logo?: string | null
          address?: string | null
          location?: string | null
          description?: string | null
          contact_info?: any | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['dealership_profiles']['Insert']>
      }
      activity_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string | null
          target_id: string | null
          details: any | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          details?: any | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>
      }
    }
  }
}
