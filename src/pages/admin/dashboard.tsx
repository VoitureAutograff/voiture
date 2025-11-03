
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useActivityLogger } from '../../hooks/useActivityLogger';
import ProfilePicture from '../../components/base/ProfilePicture';
import SearchBox from '../../components/base/SearchBox';
import AdminManagement from './components/AdminManagement';

interface Stats {
  totalUsers: number;
  totalVehicles: number;
  pendingVehicles: number;
  activeRequirements: number;
}

interface Vehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  location?: string;
  vehicle_type: string;
  description?: string;
  body_type?: string;
  color?: string;
  engine_capacity?: number;
  num_owners?: number;
  insurance_expiry?: string;
  accident_history?: string;
  claim_history?: string;
  seller_type?: string;
  registration_year?: number;
  registration_state?: string;
  fitness_valid_until?: string;
  pollution_valid_until?: string;
  service_history?: string;
  tyres_condition?: string;
  exterior_condition?: string;
  interior_condition?: string;
  engine_condition?: string;
  parking_type?: string;
  duplicate_key?: boolean;
  loan_available?: boolean;
  exchange_accepted?: boolean;
  negotiable?: boolean;
  test_drive_available?: boolean;
  additional_notes?: string;
  contact_number?: string;
  images?: string[];
  status: string;
  seller_name?: string;
  seller_email?: string;
  seller_phone?: string;
  created_at: string;
  km_driven?: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { adminUser, isLoading: authLoading } = useAdminAuth();
  const { logVehicleApproval, logVehicleEdit, logRequirementEdit, logDataDeletion } = useActivityLogger();

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [_showEditProfile, setShowEditProfile] = useState(false);
  const [_showChangePassword, setShowChangePassword] = useState(false);
  const [_isSubmitting, setIsSubmitting] = useState(false);

  // Edit vehicle modal states
  const [_showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  // View submission modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewingType, setViewingType] = useState<'vehicle' | 'requirement'>('vehicle');

  // Edit requirement modal states
  const [_showEditRequirementModal, setShowEditRequirementModal] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);
  const [editRequirementFormData, setEditRequirementFormData] = useState<any>(null);

  // Data states
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVehicles: 0,
    pendingVehicles: 0,
    activeRequirements: 0,
  });
  const [vehicleListings, setVehicleListings] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [houseVehicles, setHouseVehicles] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [pendingVehicles, setPendingVehicles] = useState<Vehicle[]>([]);

  // Alias for compatibility with new UI
  const vehicles = vehicleListings;
  const setVehicles = setVehicleListings;

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    vehicles: '',
    users: '',
    requirements: '',
    houseVehicles: '',
    admins: '',
    activity: '',
    pending: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!adminUser) {
        navigate('/admin-login');
      } else {
        fetchAllData();
      }
    }
  }, [adminUser, authLoading, navigate]);

  // Fetch vehicles with user details
  const _fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .select(`
          *,
          users!vehicle_listings_posted_by_fkey (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vehiclesWithUserDetails = data?.map(vehicle => ({
        ...vehicle,
        seller_name: vehicle.users?.name || 'Unknown',
        seller_email: vehicle.users?.email || 'N/A',
        seller_phone: vehicle.users?.phone || 'N/A',
      })) || [];

      setVehicles(vehiclesWithUserDetails);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  // Fetch requirements with user details
  const _fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          *,
          users!requirements_posted_by_fkey (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requirementsWithUserDetails = data?.map(req => ({
        ...req,
        user_name: req.users?.name || 'Unknown',
        user_email: req.users?.email || 'N/A',
        user_phone: req.users?.phone || 'N/A',
      })) || [];

      setRequirements(requirementsWithUserDetails);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    }
  };

  // Fetch house vehicles with user details
  const _fetchHouseVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('house_vehicles')
        .select(`
          *,
          users!house_vehicles_user_id_fkey (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const houseVehiclesWithUserDetails = data?.map(vehicle => ({
        ...vehicle,
        owner_name: vehicle.users?.name || 'Unknown',
        owner_email: vehicle.users?.email || 'N/A',
        owner_phone: vehicle.users?.phone || 'N/A',
      })) || [];

      setHouseVehicles(houseVehiclesWithUserDetails);
    } catch (error) {
      console.error('Error fetching house vehicles:', error);
    }
  };

  const fetchAllData = async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel WITH USER INFORMATION
      const [
        vehiclesRes,
        usersRes,
        requirementsRes,
        houseVehiclesRes,
        adminUsersRes,
        activityLogsRes,
      ] = await Promise.all([
        supabase
          .from('vehicle_listings')
          .select(`
            *,
            users!vehicle_listings_posted_by_fkey (
              id,
              name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase
          .from('requirements')
          .select(`
            *,
            users!requirements_posted_by_fkey (
              id,
              name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('house_vehicles')
          .select(`
            *,
            users!house_vehicles_user_id_fkey (
              id,
              name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('admin_users').select('*').order('created_at', { ascending: false }),
        supabase
          .from('activity_logs')
          .select(`
            *,
            admin_users!activity_logs_admin_id_fkey (
              id,
              name,
              email
            ),
            users!activity_logs_user_id_fkey (
              id,
              name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      // Map vehicle data with user information
      const vehiclesWithUsers = (vehiclesRes.data || []).map((vehicle) => ({
        ...vehicle,
        seller_name: vehicle.users?.name || 'Unknown User',
        seller_email: vehicle.users?.email || 'N/A',
        seller_phone: vehicle.users?.phone || 'N/A',
      }));

      // Map requirements data with user information
      const requirementsWithUsers = (requirementsRes.data || []).map((req) => ({
        ...req,
        user_name: req.users?.name || 'Unknown User',
        user_email: req.users?.email || 'N/A',
        user_phone: req.users?.phone || 'N/A',
      }));

      // Map house vehicles data with user information
      const houseVehiclesWithUsers = (houseVehiclesRes.data || []).map((vehicle) => ({
        ...vehicle,
        owner_name: vehicle.users?.name || 'Unknown User',
        owner_email: vehicle.users?.email || 'N/A',
        owner_phone: vehicle.users?.phone || 'N/A',
      }));

      // Map activity logs with user information
      const activityWithUsers = (activityLogsRes.data || []).map((log) => ({
        ...log,
        performer_name: log.admin_users?.name || log.users?.name || log.user_name || 'System',
        performer_email: log.admin_users?.email || log.users?.email || log.user_email || 'N/A',
        performer_type: log.admin_id ? 'Admin' : log.user_id ? 'User' : log.user_type || 'System',
      }));

      setVehicleListings(vehiclesWithUsers);
      if (usersRes.data) setUsers(usersRes.data);
      setRequirements(requirementsWithUsers);
      setHouseVehicles(houseVehiclesWithUsers);
      if (adminUsersRes.data) setAdminUsers(adminUsersRes.data);
      setActivityLogs(activityWithUsers);

      // Calculate stats
      const pending = vehiclesWithUsers.filter((v) => v.status === 'pending') || [];
      setPendingVehicles(pending);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalVehicles: vehiclesWithUsers.length,
        pendingVehicles: pending.length,
        activeRequirements: requirementsWithUsers.filter((r) => r.status === 'active').length || 0,
      });

      console.log('📊 Admin data loaded:', {
        vehicles: vehiclesWithUsers.length,
        pending: pending.length,
        users: usersRes.data?.length || 0,
        requirements: requirementsWithUsers.length,
        houseVehicles: houseVehiclesWithUsers.length,
        activities: activityWithUsers.length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (type: string, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [type]: value }));
  };

  const handleStatusUpdate = async (id: string, status: string, table: string) => {
    try {
      const { error } = await supabase.from(table).update({ status }).eq('id', id);
      if (error) throw error;
      await fetchAllData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string, table: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Wrapper functions for new UI actions
  const handleApproveVehicle = async (id: string) => {
    const vehicle = vehicleListings.find(v => v.id === id);
    if (vehicle) {
      await handleStatusUpdate(id, 'active', 'vehicle_listings');
      try {
        await logVehicleApproval(id, vehicle, true);
      } catch (logError) {
        console.warn('Failed to log vehicle approval activity:', logError);
      }
    }
  };

  const handleRejectVehicle = async (id: string) => {
    const vehicle = vehicleListings.find(v => v.id === id);
    if (vehicle) {
      await handleStatusUpdate(id, 'hidden', 'vehicle_listings');
      try {
        await logVehicleApproval(id, vehicle, false);
      } catch (logError) {
        console.warn('Failed to log vehicle rejection activity:', logError);
      }
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const vehicle = vehicleListings.find(v => v.id === id);
    if (vehicle) {
      await handleDelete(id, 'vehicle_listings');
      try {
        await logDataDeletion('vehicle_listing', id, vehicle);
      } catch (logError) {
        console.warn('Failed to log vehicle deletion activity:', logError);
      }
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    const requirement = requirements.find(r => r.id === id);
    if (requirement) {
      await handleDelete(id, 'requirements');
      try {
        await logDataDeletion('requirement', id, requirement);
      } catch (logError) {
        console.warn('Failed to log requirement deletion activity:', logError);
      }
    }
  };

  const handleDeleteHouseVehicle = async (id: string) => {
    const houseVehicle = houseVehicles.find(h => h.id === id);
    if (houseVehicle) {
      await handleDelete(id, 'house_vehicles');
      try {
        await logDataDeletion('house_vehicle', id, houseVehicle);
      } catch (logError) {
        console.warn('Failed to log house vehicle deletion activity:', logError);
      }
    }
  };

  const handleEdit = (item: any, table: string) => {
    if (table === 'vehicle_listings') {
      handleEditVehicle(item);
    } else if (table === 'requirements') {
      handleEditRequirement(item);
    } else {
      console.log('Edit:', item, table);
    }
  };

  // Add view submission function
  const handleViewSubmission = (item: any, type: 'vehicle' | 'requirement') => {
    setViewingItem(item);
    setViewingType(type);
    setShowViewModal(true);
  };

  // Add edit requirement function
  const handleEditRequirement = (requirement: any) => {
    setEditingRequirement(requirement);
    setEditRequirementFormData({
      vehicle_type: requirement.vehicle_type,
      make: requirement.make || '',
      model: requirement.model || '',
      year_min: requirement.year_min || '',
      year_max: requirement.year_max || '',
      price_range_min: requirement.price_range_min || '',
      price_range_max: requirement.price_range_max || '',
      fuel_type: requirement.fuel_type || '',
      transmission: requirement.transmission || '',
      location: requirement.location || '',
      description: requirement.description || '',
      contact_number: requirement.contact_number || '',
      status: requirement.status || 'active'
    });
    setShowEditRequirementModal(true);
  };

  // Add save requirement edit function
  const handleSaveRequirementEdit = async () => {
    if (!editingRequirement || !editRequirementFormData) return;

    try {
      setIsSubmitting(true);

      const updateData = {
        vehicle_type: editRequirementFormData.vehicle_type,
        make: editRequirementFormData.make || null,
        model: editRequirementFormData.model || null,
        year_min: editRequirementFormData.year_min ? Number(editRequirementFormData.year_min) : null,
        year_max: editRequirementFormData.year_max ? Number(editRequirementFormData.year_max) : null,
        price_range_min: editRequirementFormData.price_range_min ? Number(editRequirementFormData.price_range_min) : null,
        price_range_max: editRequirementFormData.price_range_max ? Number(editRequirementFormData.price_range_max) : null,
        fuel_type: editRequirementFormData.fuel_type || null,
        transmission: editRequirementFormData.transmission || null,
        location: editRequirementFormData.location || null,
        description: editRequirementFormData.description || null,
        contact_number: editRequirementFormData.contact_number || null,
        status: editRequirementFormData.status
      };

      const { data, error } = await supabase
        .from('requirements')
        .update(updateData)
        .eq('id', editingRequirement.id)
        .select()
        .single();

      if (error) throw error;

      // Log the requirement edit activity
      try {
        await logRequirementEdit(editingRequirement.id, editingRequirement, updateData);
      } catch (logError) {
        console.warn('Failed to log requirement edit activity:', logError);
      }

      // Update local state
      setRequirements(prev => prev.map(r => r.id === editingRequirement.id ? { ...r, ...data } : r));

      setShowEditRequirementModal(false);
      setEditingRequirement(null);
      setEditRequirementFormData(null);

      alert('Requirement updated successfully!');
      await fetchAllData();
    } catch (error: any) {
      console.error('Error updating requirement:', error);
      alert('Failed to update requirement: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced save vehicle edit with activity logging
  const _handleSaveVehicleEdit = async () => {
    if (!editingVehicle || !editFormData) return;

    try {
      setIsSubmitting(true);

      // Keep existing images that weren't removed
      const keptImages = existingImages.filter(img => !removedImages.includes(img));

      // Upload new images to Supabase Storage
      const uploadedImageUrls: string[] = [];

      for (const image of editImages) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `vehicle-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(filePath, image);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      // Combine kept images and newly uploaded images
      const allImages = [...keptImages, ...uploadedImageUrls];

      const updateData = {
        title: editFormData.title,
        make: editFormData.make,
        model: editFormData.model,
        year: Number(editFormData.year),
        price: Number(editFormData.price),
        mileage: editFormData.mileage ? Number(editFormData.mileage) : null,
        fuel_type: editFormData.fuel_type || null,
        transmission: editFormData.transmission || null,
        location: editFormData.location || null,
        vehicle_type: editFormData.vehicle_type,
        description: editFormData.description || null,
        body_type: editFormData.body_type || null,
        color: editFormData.color || null,
        engine_capacity: editFormData.engine_capacity ? Number(editFormData.engine_capacity) : null,
        num_owners: Number(editFormData.num_owners),
        insurance_expiry: editFormData.insurance_expiry || null,
        accident_history: editFormData.accident_history || null,
        claim_history: editFormData.claim_history || null,
        seller_type: editFormData.seller_type || null,
        registration_year: editFormData.registration_year ? Number(editFormData.registration_year) : null,
        registration_state: editFormData.registration_state || null,
        fitness_valid_until: editFormData.fitness_valid_until || null,
        pollution_valid_until: editFormData.pollution_valid_until || null,
        service_history: editFormData.service_history || null,
        tyres_condition: editFormData.tyres_condition || null,
        exterior_condition: editFormData.exterior_condition || null,
        interior_condition: editFormData.interior_condition || null,
        engine_condition: editFormData.engine_condition || null,
        parking_type: editFormData.parking_type || null,
        duplicate_key: editFormData.duplicate_key,
        loan_available: editFormData.loan_available,
        exchange_accepted: editFormData.exchange_accepted,
        negotiable: editFormData.negotiable,
        test_drive_available: editFormData.test_drive_available,
        additional_notes: editFormData.additional_notes || null,
        contact_number: editFormData.contact_number || null,
        images: allImages,
      };

      const { data, error } = await supabase
        .from('vehicle_listings')
        .update(updateData)
        .eq('id', editingVehicle.id)
        .select()
        .single();

      if (error) throw error;

      // Log the vehicle edit activity
      try {
        await logVehicleEdit(editingVehicle.id, editingVehicle, updateData);
      } catch (logError) {
        console.warn('Failed to log vehicle edit activity:', logError);
      }

      // Update local state
      setVehicleListings(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...data } : v));

      setShowEditModal(false);
      setEditingVehicle(null);
      setEditFormData(null);
      setEditImages([]);
      setExistingImages([]);
      setRemovedImages([]);

      alert('Vehicle updated successfully!');
      await fetchAllData();
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      alert('Failed to update vehicle: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = async (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setExistingImages(vehicle.images || []);
    setEditImages([]);
    setRemovedImages([]);
    setEditFormData({
      title: vehicle.title,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      mileage: vehicle.mileage || '',
      fuel_type: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '',
      location: vehicle.location || '',
      vehicle_type: vehicle.vehicle_type,
      description: vehicle.description || '',
      body_type: vehicle.body_type || '',
      color: vehicle.color || '',
      engine_capacity: vehicle.engine_capacity || '',
      num_owners: vehicle.num_owners || 1,
      insurance_expiry: vehicle.insurance_expiry || '',
      accident_history: vehicle.accident_history || 'none',
      claim_history: vehicle.claim_history || 'none',
      seller_type: vehicle.seller_type || 'owner',
      registration_year: vehicle.registration_year || '',
      registration_state: vehicle.registration_state || '',
      fitness_valid_until: vehicle.fitness_valid_until || '',
      pollution_valid_until: vehicle.pollution_valid_until || '',
      service_history: vehicle.service_history || 'complete',
      tyres_condition: vehicle.tyres_condition || 'good',
      exterior_condition: vehicle.exterior_condition || 'good',
      interior_condition: vehicle.interior_condition || 'good',
      engine_condition: vehicle.engine_condition || 'good',
      parking_type: vehicle.parking_type || 'covered',
      duplicate_key: vehicle.duplicate_key || false,
      loan_available: vehicle.loan_available || false,
      exchange_accepted: vehicle.exchange_accepted || false,
      negotiable: vehicle.negotiable !== undefined ? vehicle.negotiable : true,
      test_drive_available: vehicle.test_drive_available !== undefined ? vehicle.test_drive_available : true,
      additional_notes: vehicle.additional_notes || '',
      contact_number: vehicle.contact_number || '',
    });
    setShowEditModal(true);
  };

  const _handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length - removedImages.length + editImages.length + files.length;
    
    if (totalImages > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    setEditImages(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const _removeExistingImage = (imageUrl: string) => {
    setRemovedImages(prev => [...prev, imageUrl]);
  };

  const _removeNewImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'hidden':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter functions
  const _getFilteredVehicles = () => {
    return vehicleListings.filter((v) =>
      v.title?.toLowerCase().includes(searchFilters.vehicles.toLowerCase()) ||
      v.make?.toLowerCase().includes(searchFilters.vehicles.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchFilters.vehicles.toLowerCase())
    );
  };

  const getFilteredUsers = () => {
    return users.filter((u) =>
      u.name?.toLowerCase().includes(searchFilters.users.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchFilters.users.toLowerCase())
    );
  };

  const _getFilteredRequirements = () => {
    return requirements.filter((r) =>
      r.vehicle_type?.toLowerCase().includes(searchFilters.requirements.toLowerCase()) ||
      r.location?.toLowerCase().includes(searchFilters.requirements.toLowerCase())
    );
  };

  const _getFilteredHouseVehicles = () => {
    return houseVehicles.filter((h) =>
      h.vehicle_name?.toLowerCase().includes(searchFilters.houseVehicles.toLowerCase()) ||
      h.registration_number?.toLowerCase().includes(searchFilters.houseVehicles.toLowerCase())
    );
  };

  const _getFilteredAdmins = () => {
    return adminUsers.filter((a) =>
      a.name?.toLowerCase().includes(searchFilters.admins.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchFilters.admins.toLowerCase())
    );
  };

  const getFilteredActivity = () => {
    return activityLogs.filter((a) =>
      a.action?.toLowerCase().includes(searchFilters.activity.toLowerCase()) ||
      a.performer_name?.toLowerCase().includes(searchFilters.activity.toLowerCase()) ||
      a.performer_email?.toLowerCase().includes(searchFilters.activity.toLowerCase())
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {adminUser?.name}</span>
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <i className="ri-home-line text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Submission Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {viewingType === 'vehicle' ? 'Vehicle Submission Details' : 'Requirement Details'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {viewingItem.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingItem(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <i className="ri-close-line text-2xl text-gray-600"></i>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {viewingType === 'vehicle' ? (
                  <div className="space-y-6">
                    {/* Vehicle Images */}
                    {viewingItem.images && viewingItem.images.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Images</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {viewingItem.images.map((imageUrl: string, index: number) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                              <img
                                src={imageUrl}
                                alt={`Vehicle ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vehicle Details */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <p className="text-gray-900">{viewingItem.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                          <p className="text-gray-900 capitalize">{viewingItem.vehicle_type}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                          <p className="text-gray-900">{viewingItem.make}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                          <p className="text-gray-900">{viewingItem.model}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                          <p className="text-gray-900">{viewingItem.year}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <p className="text-gray-900 font-semibold">{formatPrice(viewingItem.price)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                          <p className="text-gray-900">{viewingItem.mileage || 'N/A'} km</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <p className="text-gray-900">{viewingItem.location || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                          <p className="text-gray-900">{viewingItem.fuel_type || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                          <p className="text-gray-900">{viewingItem.transmission || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                          <p className="text-gray-900">{viewingItem.contact_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusColor(viewingItem.status)}`}>
                            {viewingItem.status}
                          </span>
                        </div>
                      </div>

                      {viewingItem.description && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-900">{viewingItem.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Seller Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-gray-900">{viewingItem.seller_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900">{viewingItem.seller_email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <p className="text-gray-900">{viewingItem.seller_phone}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                          <p className="text-gray-900">{new Date(viewingItem.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Requirement Details */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Requirement Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                          <p className="text-gray-900 capitalize">{viewingItem.vehicle_type}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                          <p className="text-gray-900">{viewingItem.make || 'Any'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                          <p className="text-gray-900">{viewingItem.model || 'Any'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Year Range</label>
                          <p className="text-gray-900">
                            {viewingItem.year_min || 'Any'} - {viewingItem.year_max || 'Any'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                          <p className="text-gray-900 font-semibold">
                            ₹{viewingItem.price_range_min?.toLocaleString() || '0'} - ₹{viewingItem.price_range_max?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <p className="text-gray-900">{viewingItem.location || 'Any'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                          <p className="text-gray-900">{viewingItem.fuel_type || 'Any'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                          <p className="text-gray-900">{viewingItem.transmission || 'Any'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                          <p className="text-gray-900">{viewingItem.contact_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusColor(viewingItem.status)}`}>
                            {viewingItem.status}
                          </span>
                        </div>
                      </div>

                      {viewingItem.description && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-900">{viewingItem.description}</p>
                        </div>
                      )}
                    </div>

                    {/* User Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">User Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-gray-900">{viewingItem.user_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900">{viewingItem.user_email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <p className="text-gray-900">{viewingItem.user_phone}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                          <p className="text-gray-900">{new Date(viewingItem.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                <div className="flex justify-between">
                  <div className="flex space-x-3">
                    {viewingType === 'vehicle' && viewingItem.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleApproveVehicle(viewingItem.id);
                            setShowViewModal(false);
                          }}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-check-line mr-2"></i>
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            handleRejectVehicle(viewingItem.id);
                            setShowViewModal(false);
                          }}
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-close-line mr-2"></i>
                          Reject
                        </button>
                      </>
                    )}
                    {viewingType === 'vehicle' && (
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handleEditVehicle(viewingItem);
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-edit-line mr-2"></i>
                        Edit
                      </button>
                    )}
                    {viewingType === 'requirement' && (
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handleEditRequirement(viewingItem);
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-edit-line mr-2"></i>
                        Edit
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingItem(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-dashboard-line mr-2"></i>
                Overview
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-time-line mr-2"></i>
                Pending Approvals
                {pendingVehicles.length > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {pendingVehicles.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'vehicles'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-car-line mr-2"></i>
                Vehicles
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-user-line mr-2"></i>
                Users
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'requirements'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-file-list-line mr-2"></i>
                Requirements
              </button>
              <button
                onClick={() => setActiveTab('house-vehicles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'house-vehicles'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-home-line mr-2"></i>
                House Vehicles
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'admins'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-admin-line mr-2"></i>
                Admins
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'activity'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-history-line mr-2"></i>
                Activity Logs
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-settings-3-line mr-2"></i>
                Settings
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <i className="ri-car-line text-2xl text-blue-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Vehicles</p>
                    <p className="text-2xl font-bold text-gray-900">{vehicleListings.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <i className="ri-user-line text-2xl text-green-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <i className="ri-file-list-line text-2xl text-purple-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Requirements</p>
                    <p className="text-2xl font-bold text-gray-900">{requirements.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <i className="ri-home-line text-2xl text-orange-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">House Vehicles</p>
                    <p className="text-2xl font-bold text-gray-900">{houseVehicles.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 cursor-pointer" onClick={() => setActiveTab('pending')}>
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <i className="ri-time-line text-2xl text-yellow-600"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingVehicles.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Approvals Preview */}
            {pendingVehicles.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Urgent: Pending Approvals</h3>
                  <button onClick={() => setActiveTab('pending')} className="text-red-600 hover:text-red-700 font-medium cursor-pointer">
                    View All ({pendingVehicles.length})
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pendingVehicles.slice(0, 4).map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="w-12 h-12 bg-yellow-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <i className="ri-car-line text-yellow-600"></i>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 truncate">{vehicle.title}</h5>
                        <p className="text-sm text-gray-600">{formatPrice(vehicle.price)}</p>
                        <p className="text-xs text-gray-500">By: {vehicle.seller_name}</p>
                        <p className="text-xs text-gray-500">{new Date(vehicle.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveVehicle(vehicle.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 whitespace-nowrap"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectVehicle(vehicle.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 whitespace-nowrap"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingVehicles.filter(v => v.status === 'pending').length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No pending approvals
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Overview */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">System Overview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Recent Vehicle Listings</h4>
                  <div className="space-y-4">
                    {vehicleListings.slice(0, 5).map((vehicle) => (
                      <div key={vehicle.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <i className="ri-car-line text-gray-500"></i>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 truncate">{vehicle.title}</h5>
                          <p className="text-sm text-gray-600">{formatPrice(vehicle.price)}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusColor(vehicle.status)}`}>
                            {vehicle.status}
                          </span>
                        </div>
                      </div>
                    ))}

                    {vehicleListings.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No vehicle listings yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Recent Users</h4>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <ProfilePicture src={user.profile_picture} name={user.name} size="sm" />
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{user.name}</h5>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}

                    {users.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No users registered yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pending Vehicle Approvals</h2>
              <p className="text-sm text-gray-600 mt-1">Review and approve vehicle listings</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.filter(v => v.status === 'pending').map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {vehicle.images && vehicle.images.length > 0 && (
                            <img
                              src={vehicle.images[0]}
                              alt={vehicle.title}
                              className="w-16 h-16 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{vehicle.title}</div>
                            <div className="text-sm text-gray-500">{vehicle.make} {vehicle.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{vehicle.seller_name}</div>
                        <div className="text-sm text-gray-500">{vehicle.seller_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{vehicle.seller_phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{vehicle.price?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(vehicle.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewSubmission(vehicle, 'vehicle')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleApproveVehicle(vehicle.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectVehicle(vehicle.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vehicles.filter(v => v.status === 'pending').length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No pending approvals
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Vehicles</h2>
              <p className="text-sm text-gray-600 mt-1">Manage all vehicle listings</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {vehicle.images && vehicle.images.length > 0 && (
                            <img
                              src={vehicle.images[0]}
                              alt={vehicle.title}
                              className="w-16 h-16 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{vehicle.title}</div>
                            <div className="text-sm text-gray-500">{vehicle.make} {vehicle.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{vehicle.seller_name}</div>
                        <div className="text-sm text-gray-500">{vehicle.seller_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{vehicle.seller_phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{vehicle.price?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewSubmission(vehicle, 'vehicle')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditVehicle(vehicle)}
                            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 whitespace-nowrap"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No vehicles found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <div className="flex items-center space-x-3">
                  <SearchBox
                    placeholder="Search users..."
                    value={searchFilters.users}
                    onChange={(value) => handleSearch('users', value)}
                  />
                  <span className="text-sm text-gray-600">
                    Showing {getFilteredUsers().length} of {users.length} users
                  </span>
                  <button onClick={fetchAllData} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                    <i className="ri-refresh-line"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredUsers().map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ProfilePicture src={user.profile_picture} name={user.name} size="sm" />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.city || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(user, 'users')}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, 'users')}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {getFilteredUsers().length === 0 && users.length > 0 && (
                  <div className="text-center py-12">
                    <i className="ri-search-line text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No matching users</h3>
                    <p className="text-gray-500">Try adjusting your search terms</p>
                  </div>
                )}

                {users.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-user-line text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No users registered yet</h3>
                    <p className="text-gray-500">User accounts will appear here once people start registering</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Requirements</h2>
              <p className="text-sm text-gray-600 mt-1">View all user requirements</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requirements.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{req.user_name}</div>
                          <div className="text-sm text-gray-500">{req.user_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{req.user_phone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{req.vehicle_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ₹{req.price_range_min?.toLocaleString()} - ₹{req.price_range_max?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewSubmission(req, 'requirement')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditRequirement(req)}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 whitespace-nowrap"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRequirement(req.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 whitespace-nowrap"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {requirements.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No requirements found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* House Vehicles Tab */}
        {activeTab === 'house-vehicles' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">House Vehicles</h2>
              <p className="text-sm text-gray-600 mt-1">View all house vehicle registrations</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {houseVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{vehicle.owner_name}</div>
                          <div className="text-sm text-gray-500">{vehicle.owner_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{vehicle.owner_phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{vehicle.make} {vehicle.model}</div>
                          <div className="text-sm text-gray-500">{vehicle.year}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{vehicle.registration_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(vehicle.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteHouseVehicle(vehicle.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {houseVehicles.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No house vehicles found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === 'admins' && (
          <AdminManagement 
            adminUsers={adminUsers}
            currentAdmin={adminUser!}
            onRefresh={fetchAllData}
            searchFilter={searchFilters.admins}
          />
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
                <div className="flex items-center space-x-3">
                  <SearchBox
                    placeholder="Search activities..."
                    value={searchFilters.activity}
                    onChange={(value) => handleSearch('activity', value)}
                  />
                  <span className="text-sm text-gray-600">
                    Showing {getFilteredActivity().length} of {activityLogs.length} activities
                  </span>
                  <button onClick={fetchAllData} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                    <i className="ri-refresh-line"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {getFilteredActivity().map((log) => (
                  <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.performer_type === 'Admin' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <i className={`${
                        log.performer_type === 'Admin' ? 'ri-admin-line text-red-600' : 'ri-user-line text-blue-600'
                      }`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.performer_type === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.performer_type}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{log.performer_name}</span>
                        <span className="text-sm text-gray-500">({log.performer_email})</span>
                      </div>

                      <div className="text-sm font-medium text-gray-900 mb-1">{log.action}</div>

                      {log.target_type && (
                        <div className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">Target:</span> {log.target_type}
                          {log.target_id && <span className="ml-1">({log.target_id.slice(0, 8)}...)</span>}
                        </div>
                      )}

                      {log.details && typeof log.details === 'object' && (
                        <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-600 space-y-1">
                            {Object.entries(log.details).map(([key, value]) => {
                              if (['timestamp', 'admin_name', 'user_name'].includes(key)) return null;
                              return (
                                <div key={key} className="flex">
                                  <span className="font-medium capitalize w-24 flex-shrink-0">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="text-gray-800 break-words">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                        {log.details?.ip_address && (
                          <div className="text-xs text-gray-400">
                            IP: {log.details.ip_address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {getFilteredActivity().length === 0 && activityLogs.length > 0 && (
                  <div className="text-center py-12">
                    <i className="ri-search-line text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No matching activities</h3>
                    <p className="text-gray-500">Try adjusting your search terms</p>
                    <button
                      onClick={() => handleSearch('activity', '')}
                      className="mt-4 text-red-600 hover:text-red-700 font-medium cursor-pointer"
                    >
                      Clear search
                    </button>
                  </div>
                )}

                {activityLogs.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-history-line text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Logs Found</h3>
                    <p className="text-gray-500 mb-4">No activities have been recorded yet</p>
                    <button
                      onClick={fetchAllData}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-refresh-line mr-2"></i>
                      Refresh Data
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Settings</h2>

              {/* Profile Information */}
              <div className="border-b pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-edit-line mr-2"></i>
                    Edit Profile
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Name:</span>
                    <span className="font-medium text-gray-900">{adminUser?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Email:</span>
                    <span className="font-medium text-gray-900">{adminUser?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Role:</span>
                    <span className="font-medium text-gray-900">
                      {adminUser?.is_super_admin ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      adminUser?.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {adminUser?.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="border-b pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Password</h3>
                    <p className="text-sm text-gray-600 mt-1">Update your password to keep your account secure</p>
                  </div>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-lock-password-line mr-2"></i>
                    Change Password
                  </button>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Users</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Vehicles</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Pending Approvals</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.pendingVehicles}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Active Requirements</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.activeRequirements}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
