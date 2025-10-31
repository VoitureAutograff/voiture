import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface VehicleFiltersProps {
  filters: {
    search?: string;
    vehicleType?: string;
    make?: string;
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
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };


  // Derived values and helpers for sliders
  const priceMin = typeof filters.priceMin === 'number' ? filters.priceMin : 100000; // ₹1L
  const priceMax = typeof filters.priceMax === 'number' ? filters.priceMax : 100000000; // ₹10Cr
  const currentYear = new Date().getFullYear();
  const yearFrom = typeof filters.yearFrom === 'number' ? filters.yearFrom : 1990;
  const yearTo = typeof filters.yearTo === 'number' ? filters.yearTo : currentYear;

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
      onFiltersChange({ ...filters, priceMin: newMin, priceMax: newMax, priceRange: undefined });
    }
  };

  const onYearRangeChange = (vals: number | number[]) => {
    if (Array.isArray(vals)) {
      const [from, to] = vals;
      const newFrom = Math.min(from, to);
      const newTo = Math.max(from, to);
      onFiltersChange({ ...filters, yearFrom: newFrom, yearTo: newTo });
    }
  };

  const carMakes = [
    'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Ford', 'Renault',
    'Nissan', 'Volkswagen', 'Skoda', 'Chevrolet', 'Kia', 'MG', 'Jeep', 'BMW', 'Mercedes-Benz',
    'Audi', 'Jaguar', 'Land Rover', 'Volvo', 'Mitsubishi', 'Isuzu', 'Force'
  ];

  const bikeMakes = [
    'Hero', 'Honda', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha', 'Suzuki', 'KTM',
    'Kawasaki', 'Harley-Davidson', 'Ducati', 'BMW', 'Triumph', 'Benelli', 'Jawa',
    'Mahindra', 'Aprilia', 'Vespa', 'Ather', 'Ola Electric', 'Revolt'
  ];

  const getMakesForVehicleType = () => {
    if (filters.vehicleType === 'car') return carMakes;
    if (filters.vehicleType === 'bike') return bikeMakes;
    return [...carMakes, ...bikeMakes].sort();
  };

  const availableMakes = getMakesForVehicleType();

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
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Search by name, model, features..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          e.g., "Swift Dzire", "automatic", "sunroof", "diesel"
        </p>
      </div>

      {/* Vehicle Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Type
        </label>
        <select
          value={filters.vehicleType || 'all'}
          onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
        >
          <option value="all">All Vehicles</option>
          <option value="car">Cars</option>
          <option value="bike">Bikes</option>
        </select>
      </div>

      {/* Make/Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Make/Brand
        </label>
        <select
          value={filters.make || 'all'}
          onChange={(e) => handleFilterChange('make', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-5

focus:border-transparent text-sm pr-8"
        >
          <option value="all">All Makes</option>
          {availableMakes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
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
            max={100000000}
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
