
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/supabase';

type VehicleListing = Database['public']['Tables']['vehicle_listings']['Row'];

interface SimilarVehiclesProps {
  currentVehicleId: string;
  make?: string;
  vehicleType: 'car' | 'bike';
  priceRange?: [number, number];
}

export default function SimilarVehicles({ 
  currentVehicleId, 
  make, 
  vehicleType, 
  priceRange 
}: SimilarVehiclesProps) {
  const [vehicles, setVehicles] = useState<VehicleListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarVehicles();
  }, [currentVehicleId, make, vehicleType, priceRange]);

  const fetchSimilarVehicles = async () => {
    try {
      let query = supabase
        .from('vehicle_listings')
        .select('*')
        .eq('status', 'active')
        .eq('vehicle_type', vehicleType)
        .neq('id', currentVehicleId);

      // Add optional filters only if they exist
      if (make) {
        query = query.eq('make', make);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching similar vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    return `₹${price.toLocaleString()}`;
  };

  const defaultImage = (vehicle: VehicleListing) =>
    `https://readdy.ai/api/search-image?query=modern ${vehicle.vehicle_type === 'car' ? 'car' : 'motorcycle'} ${vehicle.make} ${vehicle.model} professional photography clean background automotive studio lighting high quality detailed&width=300&height=200&seq=${vehicle.id}&orientation=landscape`;

  if (loading) {
    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Similar Vehicles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Similar Vehicles</h3>
        <div className="text-center py-12 bg-white rounded-xl">
          <i className="ri-car-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No similar vehicles found</p>
          <Link
            to="/vehicles"
            className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Browse All Vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Similar Vehicles</h3>
        <Link
          to="/vehicles"
          className="text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vehicles.map((vehicle) => (
          <Link
            key={vehicle.id}
            to={`/vehicles/${vehicle.id}`}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
          >
            <div className="relative">
              <img
                src={vehicle.images?.[0] || defaultImage(vehicle)}
                alt={vehicle.title}
                className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              {vehicle.premium && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-5
                00 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  Featured
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs capitalize">
                {vehicle.vehicle_type}
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {vehicle.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {vehicle.make} {vehicle.model} • {vehicle.year}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(vehicle.price)}
                </span>
                {vehicle.location && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <i className="ri-map-pin-line mr-1"></i>
                    {vehicle.location.split(',')[0]}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
