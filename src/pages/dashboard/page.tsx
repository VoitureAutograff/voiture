import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { useMatchingLogic } from '../../hooks/useMatchingLogic';
import MatchingPopup from '../../components/feature/MatchingPopup';

interface Vehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  created_at: string;
  images: string[] | null;
}

interface Requirement {
  id: string;
  vehicle_type: string;
  make: string;
  budget_min: number;
  budget_max: number;
  location: string;
  status: string;
  created_at: string;
}

interface HouseVehicle {
  id: string;
  vehicle_name: string;
  make: string;
  model: string;
  year: number;
  purchase_price: number;
  current_value: number;
  status: string;
  created_at: string;
  registration_number?: string;
}

interface Favorite {
  id: string;
  vehicle_id: string;
  created_at: string;
  vehicle_listings: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    images: string[] | null;
    status: string;
  };
}

export default function Dashboard() {
  const { user, initialized, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [houseVehicles, setHouseVehicles] = useState<HouseVehicle[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { matches, isLoading: matchingLoading, checkPartialMatches } = useMatchingLogic();
  const [showMatchingPopup, setShowMatchingPopup] = useState(false);
  const [vehicleMatchContext, setVehicleMatchContext] = useState<{
    make: string;
    model: string;
    year: number;
    vehicle_type: 'car' | 'bike';
  } | null>(null);

  // Change Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // House Vehicle Modal States
  const [showHouseVehicleModal, setShowHouseVehicleModal] = useState(false);
  const [houseVehicleData, setHouseVehicleData] = useState({
    vehicle_name: '',
    make: '',
    model: '',
    year: '',
    registration_number: ''
  });
  const [isSubmittingHouseVehicle, setIsSubmittingHouseVehicle] = useState(false);

  // Profile Picture States
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const [vehiclesResponse, requirementsResponse, houseVehiclesResponse, favoritesResponse] = await Promise.all([
        supabase
          .from('vehicle_listings')
          .select('*')
          .eq('posted_by', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('requirements')
          .select('*')
          .eq('posted_by', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('house_vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('favorites')
          .select(`
            *,
            vehicle_listings (
              id,
              title,
              make,
              model,
              year,
              price,
              images,
              status
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      setVehicles(vehiclesResponse.data || []);
      setRequirements(requirementsResponse.data || []);
      setHouseVehicles(houseVehiclesResponse.data || []);
      setFavorites(favoritesResponse.data || []);
      setProfilePicture((user as any)?.user_metadata?.profile_picture || null);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load dashboard data when user is available
  useEffect(() => {
    if (initialized && user) {
      loadDashboardData();
    } else if (initialized && !user) {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [initialized, user]);

  // Check for any pending vehicle matches saved after posting (run once per user)
  useEffect(() => {
    if (!initialized || !user) return;

    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      const raw = localStorage.getItem('pending-vehicle-match');
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as {
          make: string;
          model: string;
          year: number;
          vehicle_type: 'car' | 'bike';
        };

        if (!parsed.make || !parsed.model || !parsed.year || !parsed.vehicle_type) return;

        const matchKey = `vehicle-match-dismissed:${user.id}:${parsed.vehicle_type}:${parsed.make}:${parsed.model}:${parsed.year}`;
        const dismissed = localStorage.getItem(matchKey);
        if (dismissed === '1') {
          console.log('⚠️ Pending vehicle match was previously dismissed, clearing flag:', parsed);
          localStorage.removeItem('pending-vehicle-match');
          return;
        }

        (async () => {
          console.log('🔍 Dashboard: found pending vehicle match context, re-checking matches with:', parsed);
          setVehicleMatchContext(parsed);
          const found = await checkPartialMatches(parsed);
          if (found.length > 0) {
            console.log('✅ Dashboard: matches still found on re-check, showing popup. Count:', found.length);
            setShowMatchingPopup(true);
          } else {
            console.log('ℹ️ Dashboard: no matches found on re-check, clearing pending flag');
            localStorage.removeItem('pending-vehicle-match');
          }
        })();
      } catch {
        console.log('❌ Dashboard: failed to parse pending-vehicle-match, clearing');
        localStorage.removeItem('pending-vehicle-match');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [initialized, user?.id]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle listing?')) return;

    try {
      const { error } = await supabase
        .from('vehicle_listings')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const deleteRequirement = async (requirementId: string) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return;

    try {
      const { error } = await supabase
        .from('requirements')
        .delete()
        .eq('id', requirementId);

      if (error) throw error;

      setRequirements(requirements.filter(req => req.id !== requirementId));
    } catch (error) {
      console.error('Error deleting requirement:', error);
    }
  };

  const deleteHouseVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this house vehicle?')) return;

    try {
      const { error } = await supabase
        .from('house_vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      setHouseVehicles(houseVehicles.filter(vehicle => vehicle.id !== vehicleId));
    } catch (error) {
      console.error('Error deleting house vehicle:', error);
    }
  };

  const handleAddHouseVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmittingHouseVehicle(true);

    try {
      const { error } = await supabase
        .from('house_vehicles')
        .insert([{
          user_id: user.id,
          vehicle_name: `${houseVehicleData.make} ${houseVehicleData.model}`,
          make: houseVehicleData.make,
          model: houseVehicleData.model,
          year: parseInt(houseVehicleData.year),
          registration_number: houseVehicleData.registration_number.toUpperCase(),
          status: 'active',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Reset form
      setHouseVehicleData({
        vehicle_name: '',
        make: '',
        model: '',
        year: '',
        registration_number: ''
      });

      setShowHouseVehicleModal(false);
      await loadDashboardData();
      alert('House vehicle added successfully!');
    } catch (error: any) {
      console.error('Error adding house vehicle:', error);
      alert('Failed to add house vehicle: ' + error.message);
    } finally {
      setIsSubmittingHouseVehicle(false);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price && price !== 0) {
      return 'N/A';
    }
    if (typeof price !== 'number') return 'N/A';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'ri-dashboard-line' },
    { id: 'vehicles', name: 'My Vehicles', icon: 'ri-car-line' },
    { id: 'requirements', name: 'Requirements', icon: 'ri-file-list-line' },
    { id: 'favorites', name: 'Favorites', icon: 'ri-heart-line' },
    { id: 'house-vehicles', name: 'House Vehicles', icon: 'ri-home-4-line' },
    { id: 'settings', name: 'Settings', icon: 'ri-settings-3-line' },
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingProfile(true);

    try {
      // Upload to Supabase Storage (avatars bucket)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // No 'avatars/' prefix since we're uploading directly to the bucket

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with avatar URL using auth metadata (bypasses Storage RLS)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { profile_picture: publicUrl }
      });

      if (updateError) throw updateError;

      setProfilePicture(publicUrl);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture: ' + error.message);
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Show loading during auth check or initial data load
  if (!initialized || authLoading || (user && isLoading && !dataLoaded)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">
              {!initialized || authLoading ? 'Loading...' : 'Loading dashboard...'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Don't render if no user (prevents flash)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <i className="ri-user-line text-xl text-gray-400"></i>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
                  <p className="text-gray-600 text-sm sm:text-base">Welcome back, {user?.name}</p>
                </div>
              </div>
            </div>

            {/* Mobile Tab Selector */}
            <div className="sm:hidden mb-6">
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-3 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white"
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden sm:block mb-6 sm:mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <i className={tab.icon}></i>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                  <div 
                    onClick={() => setActiveTab('vehicles')}
                    className="bg-white p-4 sm:p-6 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <i className="ri-car-line text-2xl sm:text-3xl text-blue-600"></i>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Listed Vehicles</p>
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900">{vehicles.length}</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('requirements')}
                    className="bg-white p-4 sm:p-6 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <i className="ri-file-list-line text-2xl sm:text-3xl text-green-600"></i>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Requirements</p>
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900">{requirements.length}</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('favorites')}
                    className="bg-white p-4 sm:p-6 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <i className="ri-heart-line text-2xl sm:text-3xl text-red-600"></i>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Favorites</p>
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900">{favorites.length}</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('house-vehicles')}
                    className="bg-white p-4 sm:p-6 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <i className="ri-home-4-line text-2xl sm:text-3xl text-purple-600"></i>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">House Vehicles</p>
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900">{houseVehicles.length}</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('vehicles')}
                    className="bg-white p-4 sm:p-6 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <i className="ri-check-line text-2xl sm:text-3xl text-orange-600"></i>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Active Listings</p>
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                          {vehicles.filter(v => v.status === 'active').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'vehicles' && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Vehicles</h2>
                      <button
                        onClick={() => navigate('/vehicles/post')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base flex items-center justify-center"
                      >
                        <i className="ri-add-line mr-2"></i>
                        Post Vehicle
                      </button>
                    </div>
                  </div>
                  
                  {vehicles.length === 0 ? (
                    <div className="p-8 text-center">
                      <i className="ri-car-line text-4xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles listed yet</h3>
                      <p className="text-gray-500 mb-4">Start by posting your first vehicle for sale</p>
                      <button
                        onClick={() => navigate('/vehicles/post')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Post Your First Vehicle
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {vehicles.map((vehicle) => (
                            <tr key={vehicle.id} className="hover:bg-gray-50">
                              <td className="px-3 sm:px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                    <img
                                      className="h-8 w-8 sm:h-10 sm:w-10 rounded object-cover"
                                      src={vehicle.images?.[0] || `https://readdy.ai/api/search-image?query=$%7Bvehicle.make%7D%20$%7Bvehicle.model%7D&width=100&height=100&seq=${vehicle.id}&orientation=squarish`}
                                      alt={vehicle.title}
                                    />
                                  </div>
                                  <div className="ml-3 sm:ml-4 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{vehicle.title}</div>
                                    <div className="text-xs sm:text-sm text-gray-500">{vehicle.make} {vehicle.model} • {vehicle.year}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatPrice(vehicle.price)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                  {vehicle.status}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {new Date(vehicle.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                                  className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
                                  className="text-green-600 hover:text-green-900 mr-3 cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteVehicle(vehicle.id)}
                                  className="text-red-600 hover:text-red-900 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Requirements</h2>
                      <button
                        onClick={() => navigate('/requirements')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base flex items-center justify-center"
                      >
                        <i className="ri-add-line mr-2"></i>
                        Add Requirement
                      </button>
                    </div>
                  </div>
                  
                  {requirements.length === 0 ? (
                    <div className="p-8 text-center">
                      <i className="ri-file-list-line text-4xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements posted yet</h3>
                      <p className="text-gray-500 mb-4">Let dealers know what vehicle you're looking for</p>
                      <button
                        onClick={() => navigate('/requirements')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Post Your First Requirement
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {requirements.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                {req.vehicle_type}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {req.make}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatPrice(req.budget_min)} - {formatPrice(req.budget_max)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {req.location}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {new Date(req.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => deleteRequirement(req.id)}
                                  className="text-red-600 hover:text-red-900 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Favorite Vehicles</h2>
                      <button
                        onClick={() => navigate('/vehicles')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base flex items-center justify-center"
                      >
                        <i className="ri-heart-line mr-2"></i>
                        Browse Vehicles
                      </button>
                    </div>
                  </div>
                  
                  {favorites.length === 0 ? (
                    <div className="p-8 text-center">
                      <i className="ri-heart-line text-4xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No favorite vehicles yet</h3>
                      <p className="text-gray-500 mb-4">Browse vehicles and add them to your favorites</p>
                      <button
                        onClick={() => navigate('/vehicles')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Browse Vehicles
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {favorites.map((favorite) => (
                            <tr key={favorite.id} className="hover:bg-gray-50">
                              <td className="px-3 sm:px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                    <img
                                      className="h-8 w-8 sm:h-10 sm:w-10 rounded object-cover"
                                      src={favorite.vehicle_listings?.images?.[0] || `https://readdy.ai/api/search-image?query=$%7Bfavorite.vehicle_listings%3F.make%7D%20$%7Bfavorite.vehicle_listings%3F.model%7D&width=100&height=100&seq=${favorite.vehicle_id}&orientation=squarish`}
                                      alt={favorite.vehicle_listings?.title}
                                    />
                                  </div>
                                  <div className="ml-3 sm:ml-4 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{favorite.vehicle_listings?.title}</div>
                                    <div className="text-xs sm:text-sm text-gray-500">{favorite.vehicle_listings?.make} {favorite.vehicle_listings?.model} • {favorite.vehicle_listings?.year}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatPrice(favorite.vehicle_listings?.price as any)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(favorite.vehicle_listings?.status || 'unknown')}`}>
                                  {favorite.vehicle_listings?.status}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {new Date(favorite.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => navigate(`/vehicles/${favorite.vehicle_id}`)}
                                  className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => removeFavorite(favorite.id)}
                                  className="text-red-600 hover:text-red-900 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'house-vehicles' && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">House Vehicles</h2>
                      <button
                        onClick={() => setShowHouseVehicleModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base flex items-center justify-center"
                      >
                        <i className="ri-add-line mr-2"></i>
                        Add Vehicle
                      </button>
                    </div>
                  </div>
                  
                  {houseVehicles.length === 0 ? (
                    <div className="p-8 text-center">
                      <i className="ri-home-4-line text-4xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No house vehicles added yet</h3>
                      <p className="text-gray-500 mb-4">Keep track of vehicles you own for personal use</p>
                      <button
                        onClick={() => setShowHouseVehicleModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Add Your First Vehicle
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {houseVehicles.map((vehicle) => (
                            <tr key={vehicle.id} className="hover:bg-gray-50">
                              <td className="px-3 sm:px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{vehicle.vehicle_name}</div>
                                <div className="text-xs sm:text-sm text-gray-500">{vehicle.make} {vehicle.model} • {vehicle.year}</div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {vehicle.registration_number || 'N/A'}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatPrice(vehicle.purchase_price)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatPrice(vehicle.current_value)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                  {vehicle.status}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => deleteHouseVehicle(vehicle.id)}
                                  className="text-red-600 hover:text-red-900 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Account Settings</h2>
                  </div>
                  
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Profile Picture Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Profile Picture</h3>
                      <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">
                          {profilePicture ? (
                            <img
                              src={profilePicture}
                              alt="Profile"
                              className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                              <i className="ri-user-line text-2xl text-gray-400"></i>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="profile-picture-upload"
                            className="bg-white hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 cursor-pointer inline-flex items-center transition-colors"
                          >
                            {isUploadingProfile ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <i className="ri-upload-2-line mr-2"></i>
                                Upload New Picture
                              </>
                            )}
                          </label>
                          <input
                            id="profile-picture-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                            disabled={isUploadingProfile}
                          />
                          <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
                        </div>
                      </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Security</h3>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center"
                      >
                        <i className="ri-lock-password-line mr-2"></i>
                        Change Password
                      </button>
                    </div>

                    {/* Account Information */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Account Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Name</span>
                          <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Email</span>
                          <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Phone</span>
                          <span className="text-sm font-medium text-gray-900">{user?.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="text-sm text-gray-600">Member Since</span>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(user?.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add House Vehicle Modal */}
      {showHouseVehicleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowHouseVehicleModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add House Vehicle</h3>
                  <button
                    onClick={() => setShowHouseVehicleModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>

                <form onSubmit={handleAddHouseVehicle} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                      <input
                        type="text"
                        required
                        value={houseVehicleData.make}
                        onChange={(e) => setHouseVehicleData({ ...houseVehicleData, make: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="e.g., Honda"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                      <input
                        type="text"
                        required
                        value={houseVehicleData.model}
                        onChange={(e) => setHouseVehicleData({ ...houseVehicleData, model: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="e.g., City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                      <input
                        type="number"
                        required
                        value={houseVehicleData.year}
                        onChange={(e) => setHouseVehicleData({ ...houseVehicleData, year: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="e.g., 2020"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
                      <input
                        type="text"
                        required
                        value={houseVehicleData.registration_number}
                        onChange={(e) => setHouseVehicleData({ ...houseVehicleData, registration_number: e.target.value.toUpperCase() })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="e.g., MH01AB1234"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowHouseVehicleModal(false)}
                      disabled={isSubmittingHouseVehicle}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingHouseVehicle}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center"
                    >
                      {isSubmittingHouseVehicle ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <i className="ri-add-line mr-2"></i>
                          Add Vehicle
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowPasswordModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start">
                      <i className="ri-error-warning-line mr-2 mt-0.5"></i>
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm flex items-start">
                      <i className="ri-checkbox-circle-line mr-2 mt-0.5"></i>
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      disabled={isChangingPassword}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                      placeholder="Enter new password"
                      minLength={6}
                    />
                    <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      disabled={isChangingPassword}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      disabled={isChangingPassword}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {vehicleMatchContext && (
        <MatchingPopup
          isOpen={showMatchingPopup}
          onClose={() => setShowMatchingPopup(false)}
          onDontShowAgain={() => {
            if (typeof window !== 'undefined' && user && vehicleMatchContext) {
              const key = `vehicle-match-dismissed:${user.id}:${vehicleMatchContext.vehicle_type}:${vehicleMatchContext.make}:${vehicleMatchContext.model}:${vehicleMatchContext.year}`;
              localStorage.setItem(key, '1');
              localStorage.removeItem('pending-vehicle-match');
            }
            setShowMatchingPopup(false);
          }}
          type="vehicle-matches-requirement"
          vehicleData={vehicleMatchContext}
          matches={matches}
        />
      )}
    </div>
  );
}
