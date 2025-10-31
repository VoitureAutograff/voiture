
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useActivityLogger } from '../../hooks/useActivityLogger';

// Frontend data for makes and models - no backend dependency
const CAR_MAKES_MODELS = {
  Toyota: [
    'Camry',
    'Corolla',
    'RAV4',
    'Highlander',
    'Prius',
    'Innova',
    'Fortuner',
    'Glanza',
    'Urban Cruiser',
  ],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'City', 'Amaze', 'WR-V', 'BR-V', 'Jazz'],
  Ford: ['Mustang', 'F-150', 'Explorer', 'Escape', 'Focus', 'EcoSport', 'Endeavour', 'Figo', 'Aspire'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5', 'i3', 'i8', 'Z4', '7 Series', 'X1'],
  Mercedes: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'A-Class', 'CLA', 'GLA', 'GLS'],
  Audi: ['A3', 'A4', 'A6', 'Q5', 'Q7', 'A8', 'Q3', 'TT', 'R8'],
  Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Leaf', 'Kicks', 'Magnite', 'GT-R'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'i10', 'i20', 'Creta', 'Venue', 'Verna'],
  Chevrolet: ['Malibu', 'Equinox', 'Traverse', 'Silverado', 'Camaro', 'Beat', 'Cruze', 'Trailblazer'],
  Volkswagen: ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'Polo', 'Vento', 'T-Roc', 'Taigun'],
  'Maruti Suzuki': [
    'Swift',
    'Baleno',
    'Dzire',
    'Vitara Brezza',
    'Ertiga',
    'Ciaz',
    'Alto',
    'WagonR',
    'Celerio',
  ],
  Mahindra: ['XUV500', 'Scorpio', 'Thar', 'Bolero', 'KUV100', 'XUV300', 'Marazzo', 'Alturas G4'],
  Tata: ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Tigor', 'Tiago', 'Hexa', 'Zest', 'Punch'],
  Kia: ['Optima', 'Sorento', 'Sportate', 'Rio', 'Seltos', 'Carnival', 'Sonet', 'Stinger'],
  Skoda: ['Octavia', 'Superb', 'Kodiaq', 'Karoq', 'Rapid', 'Kushaq', 'Slavia', 'Fabia'],
};

const BIKE_MAKES_MODELS = {
  'Royal Enfield': [
    'Classic 350',
    'Bullet 350',
    'Himalayan',
    'Interceptor 650',
    'Continental GT 650',
    'Meteor 350',
    'Hunter 350',
  ],
  Bajaj: ['Pulsar 150', 'Pulsar 220F', 'Avenger 220', 'Dominar 400', 'CT 100', 'Platina', 'Chetak Electric'],
  KTM: ['Duke 200', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 390', '790 Duke', '890 Duke'],
  Yamaha: ['R15 V4', 'MT-15', 'FZ-S', 'R3', 'MT-03', 'YZF-R1', 'Fascino', 'Ray ZR'],
  Hero: ['Splendor Plus', 'HF Deluxe', 'Passion Pro', 'Glamour', 'Xtreme 160R', 'Xpulse 200', 'Maestro Edge'],
  TVS: ['Apache RTR 160', 'Apache RTR 200', 'Jupiter', 'XL100', 'Ntorq 125', 'Radeon', 'Star City Plus'],
  Honda: ['CB Shine', 'Unicorn', 'CB Hornet 160R', 'X-Blade', 'Activa 6G', 'Dio', 'Grazia', 'CB350RS'],
  Suzuki: ['Gixxer 155', 'Gixxer SF', 'Intruder 150', 'Access 125', 'Burgman Street', 'V-Strom 650', 'Hayabusa'],
  Kawasaki: ['Ninja 300', 'Ninja 650', 'Z650', 'Versys 650', 'Z900', 'Ninja ZX-10R', 'W800'],
  'Harley Davidson': ['Iron 883', 'Forty-Eight', 'Street 750', 'Fat Boy', 'Road King', 'Sportster S'],
  BMW: ['G 310 R', 'G 310 GS', 'F 750 GS', 'R 1250 GS', 'S 1000 RR', 'R nineT'],
  Ducati: ['Panigale V2', 'Monster 821', 'Scrambler Icon', 'Multistrada V4', 'Diavel 1260', 'SuperSport'],
};

interface HomeVehicle {
  id?: string;
  vehicle_type: 'car' | 'bike';
  make: string;
  model: string;
  year: number | '';
  registration_number: string;
}

interface VehicleFormData {
  title: string;
  make: string;
  model: string;
  year: number | '';
  mileage: number | '';
  fuel_type: string;
  transmission: string;
  location: string;
  price: number | '';
  vehicle_type: 'car' | 'bike';
  description: string;
  images: File[];
  contact_number: string;
  body_type: string;
  color: string;
  engine_capacity: number | '';
  num_owners: number | '';
  insurance_expiry: string;
  accident_history: 'none' | 'minor' | 'major';
  claim_history: 'none' | 'yes';
  seller_type: 'owner' | 'dealer';
  registration_year: number | '';
  registration_state: string;
  other_state_registered: boolean;
  fitness_valid_until: string;
  pollution_valid_until: string;
  service_history: 'complete' | 'partial' | 'none';
  tyres_condition: 'excellent' | 'good' | 'average' | 'needs_replacement';
  exterior_condition: 'excellent' | 'good' | 'average' | 'poor';
  interior_condition: 'excellent' | 'good' | 'average' | 'poor';
  engine_condition: 'excellent' | 'good' | 'average' | 'poor';
  parking_type: 'garage' | 'covered' | 'open' | 'street';
  duplicate_key: boolean;
  loan_available: boolean;
  exchange_accepted: boolean;
  negotiable: boolean;
  test_drive_available: boolean;
  additional_notes?: string;
  home_vehicles: HomeVehicle[];
}

export default function PostVehicle() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { logVehiclePosted } = useActivityLogger();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showHomeMakeDropdown, setShowHomeMakeDropdown] = useState<number | null>(null);
  const [showHomeModelDropdown, setShowHomeModelDropdown] = useState<number | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    title: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    fuel_type: '',
    transmission: '',
    location: '',
    price: '',
    vehicle_type: 'car',
    description: '',
    images: [],
    contact_number: '',
    body_type: '',
    color: '',
    engine_capacity: '',
    num_owners: 1,
    insurance_expiry: '',
    accident_history: 'none',
    claim_history: 'none',
    seller_type: 'owner',
    registration_year: '',
    registration_state: '',
    other_state_registered: false,
    fitness_valid_until: '',
    pollution_valid_until: '',
    service_history: 'complete',
    tyres_condition: 'good',
    exterior_condition: 'good',
    interior_condition: 'good',
    engine_condition: 'good',
    parking_type: 'covered',
    duplicate_key: false,
    loan_available: false,
    exchange_accepted: false,
    negotiable: true,
    test_drive_available: true,
    additional_notes: '',
    home_vehicles: [],
  });

  // Force page load check and navigation
  useEffect(() => {
    console.log('🔧 PostVehicle component mounted');
    console.log('Current path:', window.location.pathname);
    console.log('User loaded:', !!user);
    console.log('Loading state:', loading);
    
    // Prevent redirect loops
    if (!loading && !user && window.location.pathname === '/vehicles/post') {
      console.log('🔄 Redirecting to login...');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  // Auto-generate title when make and model change
  useEffect(() => {
    if (formData.make && formData.model) {
      const autoTitle = `${formData.year || ''} ${formData.make} ${formData.model}`.trim();
      if (formData.title === '' || formData.title === autoTitle) {
        setFormData(prev => ({ ...prev, title: autoTitle }));
      }
    }
  }, [formData.make, formData.model, formData.year]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vehicle posting form...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-login-box-line text-2xl text-blue-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to post a vehicle listing.</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get available makes and models from frontend data
  const getAvailableMakes = () => {
    return formData.vehicle_type === 'car' ? Object.keys(CAR_MAKES_MODELS).sort() : Object.keys(BIKE_MAKES_MODELS).sort();
  };

  const getAvailableModels = () => {
    if (!formData.make) return [];
    const makesData = formData.vehicle_type === 'car' ? CAR_MAKES_MODELS : BIKE_MAKES_MODELS;
    return makesData[formData.make as keyof typeof makesData] || [];
  };

  const fuelTypes = formData.vehicle_type === 'car'
    ? ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG']
    : ['Petrol', 'Electric', 'Kick Start', 'Self Start'];

  const transmissions = formData.vehicle_type === 'car'
    ? ['Manual', 'Automatic', 'CVT', 'DCT']
    : ['Manual', 'Automatic', 'CVT'];

  const bodyTypes = formData.vehicle_type === 'car'
    ? ['Sedan', 'Hatchback', 'SUV', 'Crossover', 'Coupe', 'Convertible', 'Wagon', 'Pickup', 'Van', 'Luxury']
    : ['Sport', 'Cruiser', 'Touring', 'Standard', 'Scooter', 'Adventure', 'Dirt', 'Racing'];

  const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Gold', 'Maroon', 'Other'];

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry',
  ];

  const availableMakes = getAvailableMakes();
  const availableModels = getAvailableModels();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');

    // Reset model when make changes
    if (field === 'make') {
      setFormData(prev => ({ ...prev, model: '' }));
    }
  };

  const handleMakeSelect = (make: string) => {
    handleInputChange('make', make);
    setShowMakeDropdown(false);
  };

  const handleModelSelect = (model: string) => {
    handleInputChange('model', model);
    setShowModelDropdown(false);
  };

  const filteredMakes = availableMakes.filter(make =>
    make.toLowerCase().includes(formData.make.toLowerCase())
  );

  const filteredModels = availableModels.filter(model =>
    model.toLowerCase().includes(formData.model.toLowerCase())
  );

  const validateImage = (file: File): string | null => {
    if (file.size > 5 * 1024 * 1024) {
      return 'Image size must be less than 5MB';
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG and WebP images are allowed';
    }

    return null;
  };

  // Header
  <div className="bg-white shadow-sm border-b">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="https://static.readdy.ai/image/02fae2dc1f09ff057a6d421cf0d8e42d/74c49d58028519ef85759f1bff88ebee.jfif" 
            alt="Voiture.in" 
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </Link>
        <nav className="flex items-center space-x-6 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link to="/vehicles" className="text-gray-600 hover:text-blue-600 transition-colors">
            Browse
          </Link>
          <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
        </nav>
      </div>
    </div>
  </div>;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + formData.images.length > 10) {
      setErrorMessage('Maximum 10 images allowed');
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateImage(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setErrorMessage('Some images were not added: ' + errors.join(', '));
      // Clear error after 5 seconds
      setTimeout(() => {
        if (validFiles.length > 0) {
          setErrorMessage('');
        }
      }, 3000);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
      console.log(`✅ Added ${validFiles.length} valid images. Total: ${formData.images.length + validFiles.length}`);
    }

    // Always clear the input to allow re-selecting the same files
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const removedImage = formData.images[index];
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    console.log(`🗑️ Removed image: ${removedImage.name}. Remaining: ${formData.images.length - 1}`);
  };

  const handleFinalSubmit = async () => {
    if (!user?.id) {
      setErrorMessage('Authentication error. Please login again.');
      navigate('/login');
      return;
    }

    // Enhanced validation
    if (
      !formData.title ||
      !formData.price ||
      !formData.make ||
      !formData.model ||
      !formData.year ||
      !formData.contact_number
    ) {
      setErrorMessage('Please fill in all required fields including contact number');
      return;
    }

    // Validate contact number (Indian mobile number pattern)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.contact_number)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Submission already in progress, ignoring click');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('🚗 Submitting vehicle via Edge Function for user:', user.id);
      console.log('📸 Processing', formData.images.length, 'images for upload');

      // Convert images to base64 for Edge Function upload
      const imageData: Array<{ name: string; data: string; type: string }> = [];

      if (formData.images.length > 0) {
        console.log('📸 Converting', formData.images.length, 'images to base64...');

        for (let i = 0; i < formData.images.length; i++) {
          const image = formData.images[i];
          
          try {
            console.log(`📤 Converting image ${i + 1}/${formData.images.length}: ${image.name} (${(image.size / 1024 / 1024).toFixed(2)}MB)`);

            // Convert to base64
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix to get just the base64 data
                const base64 = result.split(',')[1];
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(image);
            });

            imageData.push({
              name: image.name,
              data: base64Data,
              type: image.type
            });

            console.log(`✅ Image ${i + 1} converted successfully`);
            setSuccessMessage(`Converting images... ${i + 1}/${formData.images.length} completed`);

          } catch (imageError: any) {
            console.error('❌ Failed to convert image', i + 1, ':', imageError);
            setErrorMessage(`Failed to process image ${i + 1}: ${image.name}. Please try again.`);
            setIsSubmitting(false);
            return;
          }
        }

        console.log('✅ All images converted successfully. Total images:', imageData.length);
        setSuccessMessage('Images processed successfully. Submitting vehicle listing...');
      }

      // Prepare data with all fields that exist in the database schema
      const submitData = {
        posted_by: user.id,
        title: formData.title.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: Number(formData.year),
        price: Number(formData.price),
        location: formData.location.trim() || null,
        vehicle_type: formData.vehicle_type,
        description: formData.description.trim() || null,
        mileage: formData.mileage ? Number(formData.mileage) : null,
        fuel_type: formData.fuel_type || null,
        transmission: formData.transmission || null,
        body_type: formData.body_type || null,
        color: formData.color || null,
        engine_capacity: formData.engine_capacity ? Number(formData.engine_capacity) : null,
        registration_year: formData.registration_year ? Number(formData.registration_year) : null,
        ownership: formData.num_owners ? formData.num_owners.toString() : '1',
        insurance_validity: formData.insurance_expiry || null,
        // New detailed fields
        num_owners: formData.num_owners || 1,
        insurance_expiry: formData.insurance_expiry || null,
        accident_history: formData.accident_history || 'none',
        claim_history: formData.claim_history || 'none',
        seller_type: formData.seller_type || 'owner',
        registration_state: formData.registration_state || null,
        fitness_valid_until: formData.fitness_valid_until || null,
        pollution_valid_until: formData.pollution_valid_until || null,
        service_history: formData.service_history || 'complete',
        tyres_condition: formData.tyres_condition || 'good',
        exterior_condition: formData.exterior_condition || 'good',
        interior_condition: formData.interior_condition || 'good',
        engine_condition: formData.engine_condition || 'good',
        parking_type: formData.parking_type || 'covered',
        duplicate_key: formData.duplicate_key || false,
        loan_available: formData.loan_available || false,
        exchange_accepted: formData.exchange_accepted || false,
        negotiable: formData.negotiable !== undefined ? formData.negotiable : true,
        test_drive_available: formData.test_drive_available !== undefined ? formData.test_drive_available : true,
        additional_notes: formData.additional_notes?.trim() || null,
        contact_number: formData.contact_number.trim(),
        imageData: imageData, // Send base64 image data instead of URLs
        // Add home vehicles data with proper structure
        home_vehicles: formData.home_vehicles.filter(hv => 
          hv.make && hv.model && hv.year && hv.registration_number
        ).map(hv => ({
          vehicle_type: hv.vehicle_type || 'car',
          make: hv.make.trim(),
          model: hv.model.trim(),
          year: Number(hv.year),
          registration_number: hv.registration_number.trim().toUpperCase()
        }))
      };

      console.log('📤 Submitting vehicle data via Edge Function with', imageData.length, 'images');
      console.log('🏠 Submitting', submitData.home_vehicles.length, 'home vehicles:', submitData.home_vehicles);

      // Submit vehicle data via Edge Function (bypasses RLS)
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/submit-vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ vehicleData: submitData })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Edge Function error:', result);
        setErrorMessage(result.error || 'Failed to submit vehicle listing');
        return;
      }

      console.log('✅ Vehicle submitted successfully via Edge Function:', result.vehicleId);

      // Log activity
      logVehiclePosted(result.vehicleId, submitData);

      // Show success message and redirect
      setSuccessMessage('Vehicle submitted successfully! Redirecting to dashboard...');

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error posting vehicle:', error);
      setErrorMessage('Failed to post vehicle. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.vehicle_type && formData.make && formData.model && formData.year;
      case 2:
        return formData.title && formData.price && formData.location && formData.contact_number;
      case 3:
        return formData.seller_type && formData.num_owners;
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Home vehicle functions
  const addHomeVehicle = () => {
    const newVehicle: HomeVehicle = {
      id: Date.now().toString(),
      vehicle_type: 'car',
      make: '',
      model: '',
      year: '',
      registration_number: ''
    };
    setFormData(prev => ({
      ...prev,
      home_vehicles: [...prev.home_vehicles, newVehicle]
    }));
  };

  const removeHomeVehicle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      home_vehicles: prev.home_vehicles.filter((_, i) => i !== index)
    }));
  };

  const updateHomeVehicle = (index: number, field: keyof HomeVehicle, value: any) => {
    setFormData(prev => ({
      ...prev,
      home_vehicles: prev.home_vehicles.map((vehicle, i) => 
        i === index ? { ...vehicle, [field]: value } : vehicle
      )
    }));

    // Reset model when make changes for home vehicles
    if (field === 'make') {
      setFormData(prev => ({
        ...prev,
        home_vehicles: prev.home_vehicles.map((vehicle, i) => 
          i === index ? { ...vehicle, model: '' } : vehicle
        )
      }));
    }
  };

  const getHomeVehicleModels = (homeVehicle: HomeVehicle) => {
    if (!homeVehicle.make) return [];
    const makesData = homeVehicle.vehicle_type === 'car' ? CAR_MAKES_MODELS : BIKE_MAKES_MODELS;
    return makesData[homeVehicle.make as keyof typeof makesData] || [];
  };

  // Helper to get models for home vehicle already defined above

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Header already inserted above */}

      {/* Heading */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Post Your Vehicle</h1>
          <p className="text-gray-600 mt-2">List your vehicle for sale on our platform</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center space-x-4 sm:space-x-8 mb-8">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              <div className="ml-3 text-sm">
                <div
                  className={`font-medium ${currentStep >= step ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  {step === 1 && 'Vehicle Details'}
                  {step === 2 && 'Listing Info'}
                  {step === 3 && 'Condition & History'}
                  {step === 4 && 'Photos & Review'}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-0.5 ml-6 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`}
                  ></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line mr-2"></i>
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <i className="ri-check-line mr-2"></i>
                {successMessage}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <form onSubmit={e => e.preventDefault()}>
            {/* Step 1: Vehicle Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Vehicle Details
                </h2>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type *
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleInputChange('vehicle_type', 'car')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          formData.vehicle_type === 'car'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <i className="ri-car-line mr-2"></i>
                        Car
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('vehicle_type', 'bike')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          formData.vehicle_type === 'bike'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <i className="ri-motorbike-line mr-2"></i>
                        Bike
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Make Field with Autocomplete */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Make *
                      </label>
                      <input
                        type="text"
                        value={formData.make}
                        onChange={e => {
                          handleInputChange('make', e.target.value);
                          setShowMakeDropdown(true);
                        }}
                        onFocus={() => setShowMakeDropdown(true)}
                        onBlur={() => setTimeout(() => setShowMakeDropdown(false), 200)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type or select make"
                        required
                      />
                      {showMakeDropdown && filteredMakes.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                          {filteredMakes.slice(0, 10).map((make, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleMakeSelect(make)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {make}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Model Field with Autocomplete */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model *
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={e => {
                          handleInputChange('model', e.target.value);
                          setShowModelDropdown(true);
                        }}
                        onFocus={() => setShowModelDropdown(true)}
                        onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type or select model"
                        required
                      />
                      {showModelDropdown && filteredModels.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                          {filteredModels.slice(0, 10).map((model, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleModelSelect(model)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year *
                      </label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={e => handleInputChange('year', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter year"
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Year
                      </label>
                      <input
                        type="number"
                        value={formData.registration_year}
                        onChange={e => handleInputChange('registration_year', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Registration year"
                        min="1990"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        KM Driven
                      </label>
                      <input
                        type="number"
                        value={formData.mileage}
                        onChange={e => handleInputChange('mileage', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter kilometers driven"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registered from Other State?
                      </label>
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => handleInputChange('other_state_registered', false)}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            !formData.other_state_registered
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('other_state_registered', true)}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            formData.other_state_registered
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Yes
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuel Type
                      </label>
                      <select
                        value={formData.fuel_type}
                        onChange={e => handleInputChange('fuel_type', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      >
                        <option value="">Select Fuel Type</option>
                        {fuelTypes.map(fuel => (
                          <option key={fuel} value={fuel.toLowerCase()}>
                            {fuel}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transmission
                      </label>
                      <select
                        value={formData.transmission}
                        onChange={e => handleInputChange('transmission', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      >
                        <option value="">Select Transmission</option>
                        {transmissions.map(trans => (
                          <option key={trans} value={trans.toLowerCase()}>
                            {trans}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Body Type
                      </label>
                      <select
                        value={formData.body_type}
                        onChange={e => handleInputChange('body_type', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      >
                        <option value="">Select Body Type</option>
                        {bodyTypes.map(type => (
                          <option key={type} value={type.toLowerCase()}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <select
                        value={formData.color}
                        onChange={e => handleInputChange('color', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      >
                        <option value="">Select Color</option>
                        {colors.map(color => (
                          <option key={color} value={color.toLowerCase()}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Engine Capacity (CC)
                      </label>
                      <input
                        type="number"
                        value={formData.engine_capacity}
                        onChange={e => handleInputChange('engine_capacity', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Engine capacity in CC"
                        min="50"
                        max="8000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Listing Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Listing Information
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title * <span className="text-sm text-gray-500">(Auto-generated, can be edited)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2020 Toyota Camry - Excellent Condition"
                    required
                  />
                </div>

                {/* ... existing Step 2 content ... */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => handleInputChange('price', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter price"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => handleInputChange('location', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, State"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_number}
                      onChange={e => handleInputChange('contact_number', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 10-digit mobile number"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seller Type *
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleInputChange('seller_type', 'owner')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          formData.seller_type === 'owner'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <i className="ri-user-line mr-2"></i>
                        Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('seller_type', 'dealer')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          formData.seller_type === 'dealer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <i className="ri-store-line mr-2"></i>
                        Dealer
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your vehicle's condition, features, service history, etc."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Features & Benefits
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.duplicate_key}
                        onChange={e => handleInputChange('duplicate_key', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Duplicate Key Available</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.loan_available}
                        onChange={e => handleInputChange('loan_available', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Loan Available</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.exchange_accepted}
                        onChange={e => handleInputChange('exchange_accepted', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Exchange Accepted</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.negotiable}
                        onChange={e => handleInputChange('negotiable', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Price Negotiable</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.test_drive_available}
                        onChange={e => handleInputChange('test_drive_available', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Test Drive Available</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Vehicle Condition & History */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Vehicle Condition & History
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Owners *
                    </label>
                    <select
                      value={formData.num_owners}
                      onChange={e => handleInputChange('num_owners', parseInt(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      required
                    >
                      <option value={1}>1st Owner</option>
                      <option value={2}>2nd Owner</option>
                      <option value={3}>3rd Owner</option>
                      <option value={4}>4th Owner</option>
                      <option value={5}>5+ Owners</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accident History
                    </label>
                    <select
                      value={formData.accident_history}
                      onChange={e => handleInputChange('accident_history', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    >
                      <option value="none">No Accident</option>
                      <option value="minor">Minor Accident</option>
                      <option value="major">Major Accident</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Claim History
                    </label>
                    <select
                      value={formData.claim_history}
                      onChange={e => handleInputChange('claim_history', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    >
                      <option value="none">No Claims</option>
                      <option value="yes">Previous Claims</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Year
                    </label>
                    <input
                      type="number"
                      value={formData.registration_year}
                      onChange={e => handleInputChange('registration_year', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Registration year"
                      min="1990"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration State
                    </label>
                    <select
                      value={formData.registration_state}
                      onChange={e => handleInputChange('registration_state', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    >
                      <option value="">Select Registration State</option>
                      {states.map(state => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.insurance_expiry}
                      onChange={e => handleInputChange('insurance_expiry', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fitness Certificate Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.fitness_valid_until}
                      onChange={e => handleInputChange('fitness_valid_until', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-5
                      focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pollution Certificate Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.pollution_valid_until}
                      onChange={e => handleInputChange('pollution_valid_until', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                      focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Condition Assessment */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Condition Assessment</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service History
                      </label>
                      <select
                        value={formData.service_history}
                        onChange={e => handleInputChange('service_history', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                        focus:border-transparent pr-8"
                      >
                        <option value="complete">Complete Service History</option>
                        <option value="partial">Partial Service History</option>
                        <option value="none">No Service History</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tyres Condition
                      </label>
                      <select
                        value={formData.tyres_condition}
                        onChange={e => handleInputChange('tyres_condition', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                        focus:border-transparent pr-8"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="average">Average</option>
                        <option value="needs_replacement">Needs Replacement</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exterior Condition
                      </label>
                      <select
                        value={formData.exterior_condition}
                        onChange={e => handleInputChange('exterior_condition', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                        focus:border-transparent pr-8"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="average">Average</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interior Condition
                      </label>
                      <select
                        value={formData.interior_condition}
                        onChange={e => handleInputChange('interior_condition', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                        focus:border-transparent pr-8"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="average">Average</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Engine Condition
                      </label>
                      <select
                        value={formData.engine_condition}
                        onChange={e => handleInputChange('engine_condition', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                        focus:border-transparent pr-8"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="average">Average</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parking Type
                      </label>
                      <select
                        value={formData.parking_type}
                        onChange={e => handleInputChange('parking_type', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                        focus:border-transparent pr-8"
                      >
                        <option value="garage">Garage Parked</option>
                        <option value="covered">Covered Parking</option>
                        <option value="open">Open Parking</option>
                        <option value="street">Street Parked</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.additional_notes}
                    onChange={e => handleInputChange('additional_notes', e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                    focus:border-transparent"
                    placeholder="Any additional information about the vehicle condition, modifications, recent repairs, etc."
                  ></textarea>
                </div>
              </div>
            )}

            {/* Step 4: Photos & Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Photos & Review
                </h2>

                {/* Home/Garage Vehicles Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="ri-home-4-line mr-2 text-blue-600"></i>
                    Other Vehicles in Your Home/Garage
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please provide information about any other vehicles you own. This information is only visible to you and administrators, not to the public.
                  </p>

                  {formData.home_vehicles.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="ri-car-line text-4xl text-gray-400 mb-4"></i>
                      <p className="text-gray-600 mb-4">No vehicles added yet</p>
                      <button
                        type="button"
                        onClick={addHomeVehicle}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-add-line mr-2"></i>
                        Add Vehicle
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.home_vehicles.map((vehicle, index) => (
                        <div key={vehicle.id || index} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">Vehicle {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeHomeVehicle(index)}
                              className="text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type *
                              </label>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => updateHomeVehicle(index, 'vehicle_type', 'car')}
                                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                    vehicle.vehicle_type === 'car'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Car
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateHomeVehicle(index, 'vehicle_type', 'bike')}
                                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                    vehicle.vehicle_type === 'bike'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Bike
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Make *
                              </label>
                              <input
                                type="text"
                                value={vehicle.make}
                                onChange={e => {
                                  updateHomeVehicle(index, 'make', e.target.value);
                                  setShowHomeMakeDropdown(index);
                                }}
                                onFocus={() => setShowHomeMakeDropdown(index)}
                                onBlur={() => setTimeout(() => setShowHomeMakeDropdown(null), 200)}
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Type or select make"
                                required
                              />
                              {showHomeMakeDropdown === index && (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                                  {(vehicle.vehicle_type === 'car' ? Object.keys(CAR_MAKES_MODELS) : Object.keys(BIKE_MAKES_MODELS))
                                    .filter(make => make.toLowerCase().includes(vehicle.make.toLowerCase()))
                                    .slice(0, 8)
                                    .map((make, makeIndex) => (
                                    <button
                                      key={makeIndex}
                                      type="button"
                                      onClick={() => {
                                        updateHomeVehicle(index, 'make', make);
                                        setShowHomeMakeDropdown(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                                    >
                                      {make}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="relative">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Model *
                              </label>
                              <input
                                type="text"
                                value={vehicle.model}
                                onChange={e => {
                                  updateHomeVehicle(index, 'model', e.target.value);
                                  setShowHomeModelDropdown(index);
                                }}
                                onFocus={() => setShowHomeModelDropdown(index)}
                                onBlur={() => setTimeout(() => setShowHomeModelDropdown(null), 200)}
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Type or select model"
                                required
                              />
                              {showHomeModelDropdown === index && (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                                  {getHomeVehicleModels(vehicle)
                                    .filter(model => model.toLowerCase().includes(vehicle.model.toLowerCase()))
                                    .slice(0, 8)
                                    .map((model, modelIndex) => (
                                    <button
                                      key={modelIndex}
                                      type="button"
                                      onClick={() => {
                                        updateHomeVehicle(index, 'model', model);
                                        setShowHomeModelDropdown(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                                    >
                                      {model}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Year *
                              </label>
                              <input
                                type="number"
                                value={vehicle.year}
                                onChange={e => updateHomeVehicle(index, 'year', e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Year"
                                min="1990"
                                max={new Date().getFullYear() + 1}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Registration Number *
                              </label>
                              <input
                                type="text"
                                value={vehicle.registration_number}
                                onChange={e => updateHomeVehicle(index, 'registration_number', e.target.value.toUpperCase())}
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., MH01AB1234"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={addHomeVehicle}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-add-line mr-2"></i>
                          Add Another Vehicle
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Photos Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Photos
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`cursor-pointer inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <i className="ri-upload-2-line mr-2"></i>
                      {formData.images.length === 0 ? 'Upload Photos' : 'Add More Photos'}
                    </label>
                    <p className="text-sm text-gray-600 mt-2">
                      Upload up to 10 high-quality photos (JPEG, PNG, WebP). Max 5MB each.
                    </p>
                  </div>

                  {/* Image Preview */}
                  {formData.images.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-4">
                        Selected Photos ({formData.images.length}/10)
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
                          <div
                            key={index}
                            className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                          >
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                                Main Photo
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              disabled={isSubmitting}
                            >
                              <i className="ri-close-line text-sm"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Review Your Listing</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className="font-medium">
                          {formData.year} {formData.make} {formData.model}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{formData.vehicle_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">
                          ₹{formData.price ? Number(formData.price).toLocaleString() : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{formData.location}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Seller Type:</span>
                        <span className="font-medium capitalize">{formData.seller_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Owners:</span>
                        <span className="font-medium">
                          {formData.num_owners} Owner{Number(formData.num_owners) > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Photos:</span>
                        <span className="font-medium">{formData.images.length} uploaded</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium">{formData.contact_number}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </form>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 pt-8 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep) || isSubmitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Next Step
                <i className="ri-arrow-right-line ml-2"></i>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={
                  isSubmitting ||
                  !formData.title ||
                  !formData.price ||
                  !formData.make ||
                  !formData.model ||
                  !formData.year ||
                  !formData.contact_number
                }
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line mr-2"></i>
                    Submit for Approval
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
