
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'dealer' | 'admin';
  profile_picture?: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // Check Supabase auth session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && session.user.email_confirmed_at) {
          // User is authenticated and email is verified
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .eq('status', 'active')
            .single();

          if (userData && isMounted) {
            setUser(userData);
          }
        } else {
          // Check localStorage fallback
          const userData = localStorage.getItem('user_data');
          if (userData && isMounted) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.warn('Session check failed:', error);
        localStorage.removeItem('user_data');
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user.email_confirmed_at) {
        // User signed in and email is verified
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .eq('status', 'active')
          .single();

        if (userData) {
          localStorage.setItem('user_data', JSON.stringify(userData));
          setUser(userData);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user_data');
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Use Supabase Auth - NO FALLBACK
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (authError) {
        return { data: null, error: authError };
      }

      if (!authData.user) {
        return { data: null, error: new Error('Invalid credentials') };
      }

      if (!authData.user.email_confirmed_at) {
        return { data: null, error: new Error('Please verify your email before signing in') };
      }

      // Get user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('status', 'active')
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        return { data: null, error: new Error('User account not found or inactive') };
      }

      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);

      return { data: userData, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { name: string; phone: string },
    emailRedirectTo?: string
  ) => {
    try {
      setLoading(true);
      
      if (!metadata) {
        return { data: null, error: new Error('User metadata is required') };
      }
      
      // Use provided redirect URL or default
      const redirectUrl = emailRedirectTo || 
        (window.location.hostname === 'localhost'
          ? 'http://localhost:5173/login?verified=true'
          : 'https://voiter.in/login?verified=true');
      
      // Use Supabase Auth for email verification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: metadata.name,
            phone: metadata.phone
          }
        }
      });

      if (authError) {
        return { data: null, error: authError };
      }

      // Create user in our users table with pending status
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          auth_id: authData.user?.id,
          name: metadata.name.trim(),
          email: email.trim().toLowerCase(),
          phone: metadata.phone?.trim() || null,
          role: 'buyer',
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        return { data: null, error: insertError };
      }

      return { data: { user: newUser, session: authData.session }, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem('user_data');
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    try {
      setLoading(true);
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { data: updatedUser, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (_currentPassword: string, newPassword: string) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    try {
      setLoading(true);

      // Use Supabase Auth to change password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { data: null, error };
      }

      return { data: { success: true }, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    try {
      setLoading(true);

      if (!file.type.startsWith('image/')) {
        return { data: null, error: new Error('Please select an image file') };
      }

      if (file.size > 5 * 1024 * 1024) {
        return { data: null, error: new Error('Image size must be less than 5MB') };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      const updateResult = await updateProfile({ profile_picture: publicUrl });
      
      if (updateResult.error) {
        return { data: null, error: updateResult.error };
      }

      return { data: { url: publicUrl }, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    uploadProfilePicture,
  };
}
