import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useActivityLogger } from '../../../hooks/useActivityLogger';
import { useMatchingLogic } from '../../../hooks/useMatchingLogic';
import MatchingPopup from '../../../components/feature/MatchingPopup';

interface RequirementFormProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RequirementForm({ isOpen: _isOpen, onClose, onSuccess }: RequirementFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const { matches, checkRequirementMatches } = useMatchingLogic();
  const [showMatchingPopup, setShowMatchingPopup] = useState(false);
  const [hasCheckedMatches, setHasCheckedMatches] = useState(false);

  const [formData, setFormData] = useState({
    vehicleType: 'car',
    make: '',
    model: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
    location: '',
    description: '',
    // Contact fields for admin visibility
    fullName: '',
    contactNumber: '',
    email: user?.email || '',
    urgency: 'moderate',
    paymentMethod: 'cash',
    inspectionLocation: '',
    additionalRequirements: '',
    budgetFlexibility: '10',
    timeframe: '1-month'
  });

  // Frontend-only data for makes and models
  const vehicleData = {
    car: {
      Toyota: ['Innova', 'Fortuner', 'Camry', 'Corolla', 'Prius', 'Etios', 'Yaris'],
      Honda: ['City', 'Civic', 'Accord', 'CR-V', 'Jazz', 'WR-V', 'Amaze'],
      Ford: ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Mustang', 'Freestyle'],
      BMW: ['3 Series', '5 Series', 'X3', 'X5', 'i3', 'Z4', '7 Series', 'X1'],
      Mercedes: ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class', 'S-Class'],
      Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'A8'],
      'Maruti Suzuki': ['Alto', 'Swift', 'Baleno', 'Dzire', 'Vitara Brezza', 'Ertiga', 'Ciaz'],
      Mahindra: ['Scorpio', 'XUV500', 'Bolero', 'Thar', 'KUV100', 'XUV300'],
      Tata: ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Tigor', 'Tiago'],
      Hyundai: ['i20', 'Creta', 'Verna', 'Venue', 'Tucson', 'Elantra'],
      Kia: ['Seltos', 'Sonet', 'Carnival', 'Rio'],
      Nissan: ['Magnite', 'Kicks', 'Terrano', 'Sunny'],
      Chevrolet: ['Beat', 'Spark', 'Cruze', 'Trailblazer'],
      Volkswagen: ['Polo', 'Vento', 'Tiguan', 'Passat'],
      Skoda: ['Rapid', 'Octavia', 'Superb', 'Kodiaq']
    },
    bike: {
      'Royal Enfield': ['Classic 350', 'Bullet 350', 'Himalayan', 'Interceptor 650', 'Continental GT', 'Meteor 350'],
      Bajaj: ['Pulsar', 'Avenger', 'Dominar', 'CT100', 'Platina', 'KTM Duke'],
      KTM: ['Duke 200', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 390'],
      Yamaha: ['FZ', 'R15', 'MT-15', 'Fascino', 'Ray ZR', 'FZ25'],
      Hero: ['Splendor', 'HF Deluxe', 'Passion Pro', 'Xtreme', 'Maestro', 'Destini'],
      TVS: ['Apache', 'Jupiter', 'XL100', 'Ntorq', 'Sport', 'Radeon'],
      Honda: ['Activa', 'CB Shine', 'Dio', 'CBR', 'Unicorn', 'Grazia'],
      Suzuki: ['Access', 'Gixxer', 'Burgman', 'Hayabusa', 'V-Strom'],
      Kawasaki: ['Ninja 300', 'Ninja 650', 'Z650', 'Versys 650'],
      'Harley Davidson': ['Iron 883', 'Street 750', 'Forty Eight', 'Street Bob'],
      BMW: ['G310R', 'G310GS', 'S1000RR', 'R1250GS'],
      Ducati: ['Panigale', 'Monster', 'Scrambler', 'Multistrada']
    }
  };

  const selectedCategory = vehicleData[formData.vehicleType as keyof typeof vehicleData] as Record<string, string[]>;
  const availableMakes = Object.keys(selectedCategory);
  const availableModels = formData.make
    ? (selectedCategory[formData.make] || [])
    : [];

  // Helpers that also reset matching flags when core fields change
  const updateFormField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (['vehicleType', 'make', 'model', 'yearFrom', 'yearTo'].includes(field)) {
      setHasCheckedMatches(false);
      setShowMatchingPopup(false);
    }
  };

  const handleMakeSelect = (make: string) => {
    updateFormField('make', make);
    updateFormField('model', '');
    setShowMakeDropdown(false);
  };

  const handleModelSelect = (model: string) => {
    updateFormField('model', model);
    setShowModelDropdown(false);
  };

  const filteredMakes = availableMakes.filter(make =>
    make.toLowerCase().includes(formData.make.toLowerCase())
  );

  const filteredModels = availableModels.filter((model: string) =>
    model.toLowerCase().includes(formData.model.toLowerCase())
  );

  const { logRequirementPosted } = useActivityLogger();

  // Helper to build a stable key for "don't show again" for this requirement
  const getRequirementMatchKey = () => {
    const uid = user?.id || 'guest';
    const fromYear = formData.yearFrom || '';
    const toYear = formData.yearTo || '';
    return `requirement-match-dismissed:${uid}:${formData.vehicleType}:${formData.make}:${formData.model}:${fromYear}:${toYear}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to post a requirement');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requirementData = {
        vehicle_type: formData.vehicleType,
        make: formData.make,
        model: formData.model || null,
        year_range_min: formData.yearFrom ? parseInt(formData.yearFrom) : null,
        year_range_max: formData.yearTo ? parseInt(formData.yearTo) : null,
        price_range_min: formData.priceFrom ? parseInt(formData.priceFrom) : null,
        price_range_max: formData.priceTo ? parseInt(formData.priceTo) : null,
        location: formData.location,
        description: formData.description,
        contact_number: formData.contactNumber,
        posted_by: user.id,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newRequirement, error: insertError } = await supabase
        .from('requirements')
        .insert([requirementData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Log requirement posting activity
      logRequirementPosted(newRequirement.id, requirementData);

      // After successful post, check for matching vehicles based on submitted data
      const matchesResult = await checkRequirementMatches({
        make: requirementData.make || undefined,
        model: requirementData.model || undefined,
        year_range_min: requirementData.year_range_min || undefined,
        year_range_max: requirementData.year_range_max || undefined,
        vehicle_type: requirementData.vehicle_type as 'car' | 'bike',
      });

      if (matchesResult.length > 0) {
        setShowMatchingPopup(true);
        setHasCheckedMatches(true);
        alert('Requirement posted successfully! We found some matching vehicles.');
        // Keep form open so user can interact with popup and then decide to close
      } else {
        alert('Requirement posted successfully! Dealers will contact you if they have matching vehicles.');
        onSuccess?.();
        onClose();

        // Reset form
        setFormData({
          vehicleType: 'car',
          make: '',
          model: '',
          yearFrom: '',
          yearTo: '',
          priceFrom: '',
          priceTo: '',
          location: '',
          description: '',
          fullName: '',
          contactNumber: '',
          email: user?.email || '',
          urgency: 'moderate',
          paymentMethod: 'cash',
          inspectionLocation: '',
          additionalRequirements: '',
          budgetFlexibility: '10',
          timeframe: '1-month'
        });
      }
    } catch (err: any) {
      console.error('Error posting requirement:', err);
      setError(err.message || 'Failed to post requirement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Post Your Requirement</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl w-6 h-6 flex items-center justify-center"></i>
          </button>
        </div>

        {!user && (
          <div className="p-4 sm:p-6 bg-blue-50 border-b">
            <div className="flex items-center space-x-3">
              <i className="ri-information-line text-blue-600 text-xl"></i>
              <div>
                <p className="text-blue-800 font-medium">Login Required</p>
                <p className="text-blue-600 text-sm">Please login to post your vehicle requirement</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 sm:p-6 bg-red-50 border-b">
            <div className="flex items-center space-x-3">
              <i className="ri-error-warning-line text-red-600 text-xl"></i>
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Personal Information - Admin Only */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <i className="ri-shield-user-line text-yellow-600 mr-2"></i>
              <h3 className="font-semibold text-yellow-800">Contact Information (Admin Only)</h3>
            </div>
            <p className="text-sm text-yellow-700 mb-4">
              This information is only visible to admin for contact purposes
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactNumber}
                  onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Your email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  value={formData.urgency}
                  onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="low">Low - Just browsing</option>
                  <option value="moderate">Moderate - Planning to buy</option>
                  <option value="high">High - Need urgently</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Vehicle Type *
            </label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => {
                  updateFormField('vehicleType', 'car');
                  updateFormField('make', '');
                  updateFormField('model', '');
                }}

                className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  formData.vehicleType === 'car'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className="ri-car-line mr-2"></i>
                Car
              </button>
              <button
                type="button"
                onClick={() => {
                  updateFormField('vehicleType', 'bike');
                  updateFormField('make', '');
                  updateFormField('model', '');
                }}

                className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  formData.vehicleType === 'bike'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className="ri-motorbike-line mr-2"></i>
                Bike
              </button>
            </div>
          </div>

          {/* Make & Model with Autocomplete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Make Field with Autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
              <input
                type="text"
                value={formData.make}
                onChange={e => {
                  updateFormField('make', e.target.value);
                  updateFormField('model', '');
                  setShowMakeDropdown(true);
                }}

                onFocus={() => setShowMakeDropdown(true)}
                onBlur={() => setTimeout(() => setShowMakeDropdown(false), 200)}
                placeholder="Type or select make"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />

              {/* Make Dropdown */}
              {showMakeDropdown && filteredMakes.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {filteredMakes.slice(0, 10).map((make, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMakeSelect(make)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {make}
                    </button>
                  ))}
                  {filteredMakes.length > 10 && (
                    <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                      ...and {filteredMakes.length - 10} more
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model Field with Autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={e => {
                  updateFormField('model', e.target.value);
                  setShowModelDropdown(true);
                }}

                onFocus={() => setShowModelDropdown(true)}
                onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                placeholder="Type or select model"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={!formData.make}
              />

              {/* Model Dropdown */}
              {showModelDropdown && filteredModels.length > 0 && formData.make && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {filteredModels.slice(0, 10).map((model: string, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleModelSelect(model)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {model}
                    </button>
                  ))}
                  {filteredModels.length > 10 && (
                    <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                      ...and {filteredModels.length - 10} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                value={formData.yearFrom}
                onChange={e => updateFormField('yearFrom', e.target.value)}

                placeholder="From year"
                min="1990"
                max="2024"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                value={formData.yearTo}
                onChange={e => updateFormField('yearTo', e.target.value)}

                placeholder="To year"
                min="1990"
                max="2024"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range (₹)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                value={formData.priceFrom}
                onChange={e => setFormData({ ...formData, priceFrom: e.target.value })}
                placeholder="From price"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                value={formData.priceTo}
                onChange={e => setFormData({ ...formData, priceTo: e.target.value })}
                placeholder="To price"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter city or area"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Requirements Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you're looking for..."
              rows={4}
              maxLength={500}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Website Posting</p>
                <p>Your requirement will be posted on the website for dealers to see and contact you.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                !formData.fullName.trim() ||
                !formData.contactNumber.trim() ||
                !formData.email.trim()
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Posting...
                </>
              ) : (
                <>
                  <i className="ri-add-line mr-2"></i>
                  Post Requirement
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Matching vehicles popup */}
      <MatchingPopup
        isOpen={showMatchingPopup}
        onClose={() => setShowMatchingPopup(false)}
        onDontShowAgain={() => {
          const key = getRequirementMatchKey();
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, '1');
          }
          setShowMatchingPopup(false);
        }}
        type="requirement-matches-vehicle"
        requirementData={{
          make: formData.make || undefined,
          model: formData.model || undefined,
          year_range_min: formData.yearFrom ? parseInt(formData.yearFrom) : undefined,
          year_range_max: formData.yearTo ? parseInt(formData.yearTo) : undefined,
          vehicle_type: formData.vehicleType as 'car' | 'bike',
        }}
        matches={matches}
      />
    </div>
  );
}
