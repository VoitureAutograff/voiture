
import { useState } from 'react';
import VehicleCard from './VehicleCard';

interface Vehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number | null;
  location: string | null;
  images: string[] | null;
  fuel_type: string | null;
  transmission: string | null;
  vehicle_type: 'car' | 'bike';
  created_at: string;
}

interface VehicleGridProps {
  vehicles: Vehicle[];
  loading: boolean;
  onResetFilters?: () => void;
}

export default function VehicleGrid({ vehicles, loading, onResetFilters }: VehicleGridProps) {
  const [sortBy, setSortBy] = useState('newest');

  const sortedVehicles = [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'year-new':
        return b.year - a.year;
      case 'year-old':
        return a.year - b.year;
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-4 sm:h-6 bg-gray-200 rounded w-32 sm:w-48 animate-pulse"></div>
          <div className="h-8 sm:h-10 bg-gray-200 rounded w-24 sm:w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 lg:py-16">
        <div className="bg-white rounded-lg border p-6 sm:p-8 lg:p-12 max-w-md mx-auto">
          <i className="ri-car-line text-4xl sm:text-5xl lg:text-6xl text-gray-400 mb-4"></i>
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base">
            Try adjusting your filters or search criteria to find more vehicles.
          </p>
          <button
            onClick={onResetFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-xs sm:text-sm lg:text-base"
          >
            Reset Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
          {vehicles.length} Vehicle{vehicles.length !== 1 ? 's' : ''} Found
        </h2>
        
        <div className="flex items-center space-x-2">
          <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 sm:px-3 py-1 sm:py-2 pr-6 sm:pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm appearance-none bg-white min-w-0"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year-new">Year: Newest First</option>
              <option value="year-old">Year: Oldest First</option>
            </select>
            <i className="ri-arrow-down-s-line absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs sm:text-sm"></i>
          </div>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {sortedVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {/* Load More Button (if needed) */}
      {vehicles.length > 0 && vehicles.length % 12 === 0 && (
        <div className="text-center pt-4 sm:pt-6 lg:pt-8">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-xs sm:text-sm lg:text-base">
            Load More Vehicles
          </button>
        </div>
      )}
    </div>
  );
}
