import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Select from 'react-select';
import { useState } from 'react';

interface VehicleFiltersProps {
  filters: {
    search?: string;
    vehicleType?: string;
    make?: string;
    model?: string;
    location?: string;
    priceRange?: string;
    priceMin?: number;
    priceMax?: number;
    yearFrom?: number;
    yearTo?: number;
    fuelType?: string;
    transmission?: string;
  };
  onFiltersChange: (filters: any) => void;
  onResetFilters?: () => void;
  initialFilters?: {
    vehicleType?: string;
    make?: string;
    priceRange?: string;
    search?: string;
  };
}

export default function VehicleFilters({ filters, onFiltersChange }: VehicleFiltersProps) {
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // Ensure filters has all required properties with defaults
  const safeFilters = {
    search: filters.search || '',
    vehicleType: filters.vehicleType || 'all',
    make: filters.make || '',
    model: filters.model || '',
    location: filters.location || 'all',
    priceMin: filters.priceMin || 100000,
    priceMax: filters.priceMax || 150000000,
    yearFrom: filters.yearFrom || 1990,
    yearTo: filters.yearTo || new Date().getFullYear(),
    fuelType: filters.fuelType || 'all',
    transmission: filters.transmission || 'all'
  };
  
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = {
      ...safeFilters,
      [key]: value === 'all' ? '' : value
    };
    
    // If make is changed, reset model
    if (key === 'make') {
      newFilters.model = '';
    }
    
    onFiltersChange(newFilters);
  };


  // Derived values and helpers for sliders
  const priceMin = typeof safeFilters.priceMin === 'number' ? safeFilters.priceMin : 100000; // ₹1L
  const priceMax = typeof safeFilters.priceMax === 'number' ? safeFilters.priceMax : 150000000; // ₹10Cr
  const currentYear = new Date().getFullYear();
  const yearFrom = typeof safeFilters.yearFrom === 'number' ? safeFilters.yearFrom : 1990;
  const yearTo = typeof safeFilters.yearTo === 'number' ? safeFilters.yearTo : currentYear;

  const formatINRShort = (n: number) => {
    if (n >= 10000000) {
      return `₹${(n / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
    }
    if (n >= 100000) {
      return `₹${(n / 100000).toFixed(2).replace(/\.00$/, '')}L`;
    }
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const onPriceRangeChange = (vals: number | number[]) => {
    if (Array.isArray(vals)) {
      const [min, max] = vals;
      const newMin = Math.min(min, max);
      const newMax = Math.max(min, max);
      onFiltersChange({ ...safeFilters, priceMin: newMin, priceMax: newMax, priceRange: undefined });
    }
  };

  const onYearRangeChange = (vals: number | number[]) => {
    if (Array.isArray(vals)) {
      const [from, to] = vals;
      const newFrom = Math.min(from, to);
      const newTo = Math.max(from, to);
      onFiltersChange({ ...safeFilters, yearFrom: newFrom, yearTo: newTo });
    }
  };

  // Vehicle data with models
  const vehicleData = {
    car: {
      'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'e-tron GT', 'RS6', 'RS7', 'A8', 'Q2', 'Q8 e-tron'],
      'BMW': ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'i4', 'i7', 'iX', 'X4', 'X6', 'M3', 'M5', 'X5 M'],
      'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'EQS', 'EQB', 'AMG GT', 'Maybach', 'G-Class'],
      'Rolls-Royce': ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Spectre'],
      'Bentley': ['Continental GT', 'Bentayga', 'Flying Spur', 'Mulsanne'],
      'Porsche': ['911', 'Taycan', 'Panamera', 'Cayenne', 'Macan', 'Cayman', 'Boxster'],
      'Jaguar': ['XE', 'XF', 'XJ', 'E-PACE', 'F-PACE', 'I-PACE', 'F-TYPE'],
      'Land Rover': ['Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque', 'Defender', 'Discovery', 'Discovery Sport'],
      'Volvo': ['S60', 'S90', 'XC40', 'XC60', 'XC90', 'C40', 'V90'],
      'Lexus': ['ES', 'LS', 'UX', 'NX', 'RX', 'GX', 'LX'],
      'Toyota': ['Camry', 'Corolla', 'Fortuner', 'Innova', 'Urban Cruiser', 'Glanza', 'Vellfire'],
      'Honda': ['City', 'Amaze', 'Jazz', 'WR-V', 'Elevate', 'CR-V', 'Civic'],
      'Hyundai': ['i10', 'i20', 'Aura', 'Verna', 'Venue', 'Creta', 'Alcazar', 'Tucson', 'Kona'],
      'Kia': ['Seltos', 'Sonet', 'Carens', 'Carnival', 'EV6'],
      'Volkswagen': ['Polo', 'Taigun', 'Virtus', 'Tiguan', 'T-Roc'],
      'Skoda': ['Kushaq', 'Slavia', 'Kodiaq', 'Superb'],
      'MG': ['Astor', 'Gloster', 'Hector', 'Hector Plus', 'ZS EV', 'Comet EV']
    },
    bike: {
      'BMW': ['G 310 R', 'G 310 GS', 'R 1250 GS', 'S 1000 RR', 'R 18', 'F 900 R'],
      'Ducati': ['Panigale V4', 'Monster', 'Multistrada', 'Diavel', 'XDiavel', 'Streetfighter'],
      'Harley-Davidson': ['Sportster S', 'Street Glide', 'Road Glide', 'Fat Boy', 'Heritage Classic', 'LiveWire'],
      'Kawasaki': ['Ninja ZX-10R', 'Ninja H2', 'Ninja 650', 'Z900', 'Vulcan S', 'Versys 650'],
      'KTM': ['Duke 200', 'Duke 390', 'RC 200', 'RC 390', '390 Adventure', 'Super Duke R'],
      'Royal Enfield': ['Classic 350', 'Meteor 350', 'Himalayan', 'Interceptor 650', 'Continental GT 650', 'Super Meteor 650'],
      'Triumph': ['Bonneville T120', 'Street Triple', 'Tiger 900', 'Rocket 3', 'Speed Twin'],
      'Yamaha': ['MT-15', 'MT-07', 'MT-09', 'YZF-R15', 'YZF-R7', 'FZ-X', 'FZ-S'],
      'Honda': ['Shine', 'Unicorn', 'Hornet', 'CB350', 'CBR650R', 'Africa Twin'],
      'Bajaj': ['Pulsar', 'Dominar', 'Avenger', 'Platina', 'CT100', 'Pulsar NS200'],
      'TVS': ['Apache', 'Jupiter', 'Ntorq', 'Raider', 'iQube'],
      'Suzuki': ['Gixxer', 'V-Strom', 'Hayabusa', 'Burgman', 'Access'],
      'Hero': ['Splendor', 'Passion', 'Xtreme', 'Karizma', 'Xoom'],
      'Jawa': ['Jawa', 'Jawa 42', 'Perak', '42 Bobber'],
      'Benelli': ['Imperiale 400', 'TNT 300', 'TRK 502', 'Leoncino 500']
    }
  };

  // Get available makes based on vehicle type
  const getMakesForVehicleType = () => {
    if (safeFilters.vehicleType === 'car') return Object.keys(vehicleData.car);
    if (safeFilters.vehicleType === 'bike') return Object.keys(vehicleData.bike);
    // Combine and deduplicate makes when no vehicle type is selected
    return Array.from(new Set([...Object.keys(vehicleData.car), ...Object.keys(vehicleData.bike)])).sort();
  };

  // Get available models for the selected make and vehicle type
  const getModelsForMake = () => {
    if (!safeFilters.make || safeFilters.make === 'all') return [];
    
    if (safeFilters.vehicleType === 'car') {
      return vehicleData.car[safeFilters.make as keyof typeof vehicleData.car] || [];
    } else if (safeFilters.vehicleType === 'bike') {
      return vehicleData.bike[safeFilters.make as keyof typeof vehicleData.bike] || [];
    }
    
    // If no vehicle type is selected, check both car and bike models
    return [
      ...(vehicleData.car[safeFilters.make as keyof typeof vehicleData.car] || []),
      ...(vehicleData.bike[safeFilters.make as keyof typeof vehicleData.bike] || [])
    ];
  };

  const availableMakes = getMakesForVehicleType();
  const availableModels = getModelsForMake();

  // Location options - All Indian states
  const locationOptions = [
    'All India',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
  ];

  return (
    <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Vehicle
        </label>
        <input
          type="text"
          value={safeFilters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Search by name, model"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          e.g., "benz" , "bmw" , "audi" , "mercedes" , "toyota" 
        </p>
      </div>

      {/* Vehicle Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Type
        </label>
        <select
          value={safeFilters.vehicleType || 'all'}
          onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
        >
          <option value="all">All Vehicles</option>
          <option value="car">Cars</option>
          <option value="bike">Bikes</option>
        </select>
      </div>

{/* Make/Brand */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Make/Brand
        </label>
        <input
          type="text"
          value={safeFilters.make || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            // Update the input value for typing
            onFiltersChange({
              ...safeFilters,
              make: newValue || ''
            });
            setShowMakeDropdown(true);
          }}
          onFocus={() => setShowMakeDropdown(true)}
          onBlur={() => setTimeout(() => setShowMakeDropdown(false), 200)}
          placeholder="Type or select make"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        
        {/* Make Dropdown */}
        {showMakeDropdown && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
            <button
              type="button"
              onClick={() => {
                onFiltersChange({
                  ...safeFilters,
                  make: '',
                  model: ''
                });
                setShowMakeDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100"
            >
              All Makes
            </button>
            {availableMakes
              .filter(make => 
                make.toLowerCase().includes((safeFilters.make || '').toLowerCase())
              )
              .map((make, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onFiltersChange({
                      ...safeFilters,
                      make: make,
                      model: '' // Reset model when make changes
                    });
                    setShowMakeDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                >
                  {make}
                </button>
              ))
            }
            {/* Show custom make option if typed value doesn't match any available makes */}
            {safeFilters.make && !availableMakes.some(make => 
              make.toLowerCase() === safeFilters.make!.toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => {
                  onFiltersChange({
                    ...safeFilters,
                    make: safeFilters.make,
                    model: '' // Reset model when make changes
                  });
                  setShowMakeDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 bg-blue-50 font-medium"
              >
                Search for "{safeFilters.make}"
              </button>
            )}
          </div>
        )}
      </div>

      {/* Model */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <input
          type="text"
          value={safeFilters.model || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            // Update the input value for typing
            onFiltersChange({
              ...safeFilters,
              model: newValue || ''
            });
            setShowModelDropdown(true);
          }}
          onFocus={() => setShowModelDropdown(true)}
          onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
          disabled={!safeFilters.make}
          placeholder={!safeFilters.make ? 'Select a make first' : 'Type or select model'}
          className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
            !safeFilters.make ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        
        {/* Model Dropdown */}
        {showModelDropdown && safeFilters.make && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
            <button
              type="button"
              onClick={() => {
                onFiltersChange({
                  ...safeFilters,
                  model: ''
                });
                setShowModelDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100"
            >
              All Models
            </button>
            {availableModels
              .filter(model => 
                model.toLowerCase().includes((safeFilters.model || '').toLowerCase())
              )
              .map((model, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onFiltersChange({
                      ...safeFilters,
                      model: model
                    });
                    setShowModelDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                >
                  {model}
                </button>
              ))
            }
            {/* Show custom model option if typed value doesn't match any available models */}
            {safeFilters.model && !availableModels.some(model => 
              model.toLowerCase() === safeFilters.model!.toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => {
                  onFiltersChange({
                    ...safeFilters,
                    model: safeFilters.model
                  });
                  setShowModelDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 bg-blue-50 font-medium"
              >
                Search for "{safeFilters.model}"
              </button>
            )}
          </div>
        )}
      </div>      
{/* Location */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          value={safeFilters.location === 'all' ? '' : safeFilters.location || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            // Update the input value for typing
            onFiltersChange({
              ...safeFilters,
              location: newValue || 'all'
            });
            setShowLocationDropdown(true);
          }}
          onFocus={() => setShowLocationDropdown(true)}
          onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
          placeholder="Type or select location"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        
        {/* Location Dropdown */}
        {showLocationDropdown && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
            <button
              type="button"
              onClick={() => {
                onFiltersChange({
                  ...safeFilters,
                  location: 'all'
                });
                setShowLocationDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100"
            >
              All India
            </button>
            {locationOptions
              .filter(location => 
                location.toLowerCase().includes((safeFilters.location === 'all' ? '' : safeFilters.location || '').toLowerCase())
              )
              .filter(location => location !== 'All India') // Remove "All India" from the filtered list since it's already shown above
              .map((location, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onFiltersChange({
                      ...safeFilters,
                      location: location.toLowerCase().replace(' ', '')
                    });
                    setShowLocationDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                >
                  {location}
                </button>
              ))
            }
            {/* Show custom location option if typed value doesn't match any available locations */}
            {safeFilters.location && safeFilters.location !== 'all' && !locationOptions.some(location => 
              location.toLowerCase() === (safeFilters.location === 'all' ? '' : safeFilters.location || '').toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => {
                  onFiltersChange({
                    ...safeFilters,
                    location: safeFilters.location
                  });
                  setShowLocationDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 bg-blue-50 font-medium"
              >
                Search for "{safeFilters.location}"
              </button>
            )}
          </div>
        )}
      </div>

{/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range
        </label>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>{formatINRShort(priceMin)}</span>
            <span>{formatINRShort(priceMax)}</span>
          </div>
          <Slider
            range
            min={100000}
            max={150000000}
            step={100000}
            value={[priceMin, priceMax]}
            onChange={onPriceRangeChange}
            allowCross={false}
          />
        </div>
      </div>

      {/* Year Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year Range
        </label>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>{yearFrom}</span>
            <span>{yearTo}</span>
          </div>
          <Slider
            range
            min={1990}
            max={currentYear}
            step={1}
            value={[yearFrom, yearTo]}
            onChange={onYearRangeChange}
            allowCross={false}
          />
        </div>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fuel Type
        </label>
        <select
          value={filters.fuelType || 'all'}
          onChange={(e) => handleFilterChange('fuelType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
        >
          <option value="all">All Fuel Types</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="cng">CNG</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {/* Transmission */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transmission
        </label>
        <select
          value={filters.transmission || 'all'}
          onChange={(e) => handleFilterChange('transmission', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
        >
          <option value="all">All Transmissions</option>
          <option value="manual">Manual</option>
          <option value="automatic">Automatic</option>
          <option value="cvt">CVT</option>
        </select>
      </div>
    </div>
  );
}
