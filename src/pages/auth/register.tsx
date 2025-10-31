
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useActivityLogger } from '../../hooks/useActivityLogger';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { logUserRegistration } = useActivityLogger();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show loading while auth state is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is authenticated
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Starting registration process...');

      // Determine the correct redirect URL based on environment
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const redirectUrl = isLocalhost 
        ? 'http://localhost:5173/login?verified=true'
        : 'https://voiture.in/login?verified=true';

      console.log('📧 Email verification will redirect to:', redirectUrl);

      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: formData.name,
            phone: formData.phone || null,
            city: formData.city,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Registration failed');
        return;
      }

      // Log the registration activity
      if (authData.user) {
        await logUserRegistration(authData.user.id, formData.email);
      }

      setSuccess('Registration successful! Please check your email to verify your account before logging in.');
      setEmailSent(true);

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center items-center mb-4">
              <img 
                src="https://static.readdy.ai/image/02fae2dc1f09ff057a6d421cf0d8e42d/74c49d58028519ef85759f1bff88ebee.jfif" 
                alt="Voiture.in" 
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 text-sm sm:text-base">We've sent a verification link to your email</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <i className="ri-mail-check-line text-green-600 text-xl"></i>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Email Sent</h3>
              
              <p className="text-gray-600 text-sm mb-6">
                We've sent a verification link to <strong>{formData.email}</strong>. 
                Please check your email and click the link to verify your account.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-600 mt-0.5 mr-2"></i>
                  <div className="text-left">
                    <p className="text-blue-800 text-sm font-medium mb-1">Next Steps:</p>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Check your email inbox</li>
                      <li>• Look for an email from Voiture.in</li>
                      <li>• Click the verification link</li>
                      <li>• Return to login page</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link 
                  to="/login" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition duration-300 ease-in-out text-sm sm:text-base inline-block text-center"
                >
                  Go to Login
                </Link>
                
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setSuccess('');
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
                      confirmPassword: '',
                      city: ''
                    });
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 sm:py-3 px-4 rounded-lg transition duration-300 ease-in-out text-sm sm:text-base"
                >
                  Register Different Email
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or{' '}
            <button 
              onClick={() => setEmailSent(false)}
              className="font-medium text-blue-600 hover:text-blue-5"
            >
              try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="https://static.readdy.ai/image/02fae2dc1f09ff057a6d421cf0d8e42d/74c49d58028519ef85759f1bff88ebee.jfif" 
              alt="Voiture.in" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600 text-sm sm:text-base">Join our community of vehicle enthusiasts</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center">
                  <i className="ri-error-warning-line mr-2"></i>
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-3 sm:px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center">
                  <i className="ri-check-line mr-2"></i>
                  {success}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-7 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={loading}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-7 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={loading}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your email"
              />
              <p className="text-xs text-gray-500 mt-1">
                <i className="ri-information-line mr-1"></i>
                We'll send a verification link to this email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-7 mb-2">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={loading}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-7 mb-2">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={loading}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-7 mb-2">Confirm Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                disabled={loading}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-7 mb-2">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                disabled={loading}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your city"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition duration-300 ease-in-out text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
