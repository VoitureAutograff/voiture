
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface Vehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[] | null;
  location: string | null;
  mileage: number | null;
  fuel_type: string | null;
  premium: boolean;
}

export default function FeaturedVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('vehicle_listings')
        .select(`
          id,
          title,
          make,
          model,
          year,
          price,
          images,
          location,
          mileage,
          fuel_type,
          premium
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (fetchError) {
        throw fetchError;
      }

      setVehicles(data || []);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err.message);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Vehicles</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of premium vehicles
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-6 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Vehicles</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchVehicles}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-2"></i>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Vehicles</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium vehicles
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-car-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Vehicles Available</h3>
            <p className="text-gray-500 mb-6">There are currently no featured vehicles to display.</p>
            <Link
              to="/vehicles/post"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Post Your Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="relative h-64 overflow-hidden">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={vehicle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://readdy.ai/api/search-image?query=modern%20$%7Bvehicle.make%7D%20$%7Bvehicle.model%7D%20$%7Bvehicle.year%7D%20car%20elegant%20studio%20lighting%20professional%20photography%20clean%20background%20automotive&width=400&height=300&seq=${vehicle.id}&orientation=landscape`;
                      }}
                    />
                  ) : (
                    <img
                      src={`https://readdy.ai/api/search-image?query=modern%20$%7Bvehicle.make%7D%20$%7Bvehicle.model%7D%20$%7Bvehicle.year%7D%20car%20elegant%20studio%20lighting%20professional%20photography%20clean%20background%20automotive&width=400&height=300&seq=${vehicle.id}&orientation=landscape`}
                      alt={vehicle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {vehicle.premium && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                        <i className="ri-vip-crown-line mr-1"></i>
                        Premium
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {vehicle.title}
                    </h3>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(vehicle.price)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <i className="ri-calendar-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                      <span>{vehicle.year}</span>
                      {vehicle.mileage && (
                        <>
                          <span className="mx-2">•</span>
                          <i className="ri-dashboard-line mr-1 w-4 h-4 flex items-center justify-center"></i>
                          <span>{vehicle.mileage.toLocaleString()} km</span>
                        </>
                      )}
                    </div>
                    
                    {vehicle.fuel_type && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <i className="ri-gas-station-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                        <span className="capitalize">{vehicle.fuel_type}</span>
                      </div>
                    )}

                    {vehicle.location && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <i className="ri-map-pin-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                        <span>{vehicle.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500">View Details</span>
                    <i className="ri-arrow-right-line text-blue-600 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/vehicles"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            View All Vehicles
            <i className="ri-arrow-right-line ml-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
